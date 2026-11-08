-- ============================================================================
-- CROWDFUNDING PLATFORM STORED PROCEDURES
-- ============================================================================

USE `crowdfunding_platform`;

DROP PROCEDURE IF EXISTS `make_pledge`;
DROP PROCEDURE IF EXISTS `cancel_pledge`;
DROP PROCEDURE IF EXISTS `approve_campaign`;
DROP PROCEDURE IF EXISTS `reject_campaign`;
DROP PROCEDURE IF EXISTS `process_expired_campaigns`;

DELIMITER $$

-- ----------------------------------------------------------------------------
-- Procedure: make_pledge
-- Atomic pledge creation with pessimistic locking, stock management,
-- and simulated payment gateway execution.
-- ----------------------------------------------------------------------------
CREATE PROCEDURE `make_pledge`(
  IN  p_backer_id                INT,
  IN  p_campaign_id              INT,
  IN  p_tier_id                  INT,
  IN  p_amount                   DECIMAL(12, 2),
  IN  p_forced_payment_outcome   VARCHAR(10), -- 'SUCCESS' or 'FAILURE' or NULL/'DEFAULT'
  OUT p_pledge_id                INT,
  OUT p_status                   VARCHAR(50),
  OUT p_message                  VARCHAR(255)
)
proc_label: BEGIN
  DECLARE v_creator_id INT;
  DECLARE v_camp_status VARCHAR(50);
  DECLARE v_deadline TIMESTAMP;
  DECLARE v_tier_camp_id INT;
  DECLARE v_min_amount DECIMAL(12, 2);
  DECLARE v_quantity INT;
  DECLARE v_claimed_quantity INT;
  DECLARE v_txn_ref VARCHAR(100);

  -- Exception Handler
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    SET p_pledge_id = NULL;
    SET p_status = 'ERROR';
    SET p_message = 'An unexpected database error occurred during pledge transaction.';
  END;

  IF p_amount <= 0 THEN
    SET p_status = 'INVALID_AMOUNT';
    SET p_message = 'Pledge amount must be greater than zero.';
    LEAVE proc_label;
  END IF;

  START TRANSACTION;

  -- 1. Pessimistic lock on the campaign row
  SELECT `creator_id`, `status`, `deadline`
    INTO v_creator_id, v_camp_status, v_deadline
    FROM `campaigns`
   WHERE `id` = p_campaign_id
     FOR UPDATE;

  IF v_camp_status IS NULL THEN
    ROLLBACK;
    SET p_status = 'CAMPAIGN_NOT_FOUND';
    SET p_message = 'Target campaign does not exist.';
    LEAVE proc_label;
  END IF;

  IF v_camp_status <> 'active' THEN
    ROLLBACK;
    SET p_status = 'CAMPAIGN_NOT_ACTIVE';
    SET p_message = 'Pledges are only accepted for active campaigns.';
    LEAVE proc_label;
  END IF;

  IF UTC_TIMESTAMP() > v_deadline THEN
    ROLLBACK;
    SET p_status = 'CAMPAIGN_EXPIRED';
    SET p_message = 'Campaign deadline has passed.';
    LEAVE proc_label;
  END IF;

  IF v_creator_id = p_backer_id THEN
    ROLLBACK;
    SET p_status = 'SELF_PLEDGE_FORBIDDEN';
    SET p_message = 'Creators cannot pledge to their own campaigns.';
    LEAVE proc_label;
  END IF;

  -- 2. Pessimistic lock on the reward tier row if requested
  IF p_tier_id IS NOT NULL THEN
    SELECT `campaign_id`, `min_amount`, `quantity`, `claimed_quantity`
      INTO v_tier_camp_id, v_min_amount, v_quantity, v_claimed_quantity
      FROM `reward_tiers`
     WHERE `id` = p_tier_id
       FOR UPDATE;

    IF v_tier_camp_id IS NULL THEN
      ROLLBACK;
      SET p_status = 'TIER_NOT_FOUND';
      SET p_message = 'Selected reward tier does not exist.';
      LEAVE proc_label;
    END IF;

    IF v_tier_camp_id <> p_campaign_id THEN
      ROLLBACK;
      SET p_status = 'TIER_MISMATCH';
      SET p_message = 'Selected reward tier does not belong to this campaign.';
      LEAVE proc_label;
    END IF;

    IF p_amount < v_min_amount THEN
      ROLLBACK;
      SET p_status = 'AMOUNT_BELOW_TIER_MIN';
      SET p_message = CONCAT('Pledge amount must be at least $', v_min_amount, ' for this tier.');
      LEAVE proc_label;
    END IF;

    -- Concurrency check: Ensure reward stock is not exhausted
    IF v_quantity IS NOT NULL AND v_claimed_quantity >= v_quantity THEN
      ROLLBACK;
      SET p_status = 'TIER_SOLD_OUT';
      SET p_message = 'Selected reward tier is sold out.';
      LEAVE proc_label;
    END IF;
  END IF;

  -- 3. Simulate payment gateway
  IF p_forced_payment_outcome IS NOT NULL AND UPPER(p_forced_payment_outcome) = 'FAILURE' THEN
    ROLLBACK;
    SET p_pledge_id = NULL;
    SET p_status = 'PAYMENT_FAILED';
    SET p_message = 'Mock payment gateway declined transaction.';
    LEAVE proc_label;
  END IF;

  -- 4. Insert confirmed pledge
  -- (Trigger trg_pledges_after_insert updates campaigns and reward_tiers atomically)
  INSERT INTO `pledges` (
    `backer_id`,
    `campaign_id`,
    `tier_id`,
    `amount`,
    `status`
  ) VALUES (
    p_backer_id,
    p_campaign_id,
    p_tier_id,
    p_amount,
    'confirmed'
  );

  SET p_pledge_id = LAST_INSERT_ID();
  SET v_txn_ref = CONCAT('txn_mock_', UNIX_TIMESTAMP(), '_', p_pledge_id);

  -- 5. Record successful payment
  INSERT INTO `payments` (
    `pledge_id`,
    `amount`,
    `status`,
    `transaction_ref`,
    `gateway_response`
  ) VALUES (
    p_pledge_id,
    p_amount,
    'successful',
    v_txn_ref,
    JSON_OBJECT(
      'provider', 'MockPaymentService',
      'authorization_code', UUID(),
      'status', 'APPROVED',
      'amount', p_amount,
      'currency', 'USD',
      'timestamp', UTC_TIMESTAMP()
    )
  );

  COMMIT;

  SET p_status = 'SUCCESS';
  SET p_message = 'Pledge processed successfully.';
END$$

-- ----------------------------------------------------------------------------
-- Procedure: cancel_pledge
-- Cancels an eligible pledge before the campaign deadline, restores reward stock,
-- and issues an idempotent refund.
-- ----------------------------------------------------------------------------
CREATE PROCEDURE `cancel_pledge`(
  IN  p_pledge_id INT,
  IN  p_backer_id INT,
  OUT p_status    VARCHAR(50),
  OUT p_message   VARCHAR(255)
)
proc_label: BEGIN
  DECLARE v_camp_id INT;
  DECLARE v_backer_id INT;
  DECLARE v_amount DECIMAL(12, 2);
  DECLARE v_pledge_status VARCHAR(50);
  DECLARE v_camp_status VARCHAR(50);
  DECLARE v_deadline TIMESTAMP;
  DECLARE v_ref_ref VARCHAR(100);

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    SET p_status = 'ERROR';
    SET p_message = 'An error occurred while cancelling the pledge.';
  END;

  START TRANSACTION;

  -- 1. Lock pledge
  SELECT `campaign_id`, `backer_id`, `amount`, `status`
    INTO v_camp_id, v_backer_id, v_amount, v_pledge_status
    FROM `pledges`
   WHERE `id` = p_pledge_id
     FOR UPDATE;

  IF v_pledge_status IS NULL THEN
    ROLLBACK;
    SET p_status = 'PLEDGE_NOT_FOUND';
    SET p_message = 'Pledge not found.';
    LEAVE proc_label;
  END IF;

  IF v_backer_id <> p_backer_id THEN
    ROLLBACK;
    SET p_status = 'UNAUTHORIZED';
    SET p_message = 'You can only cancel your own pledges.';
    LEAVE proc_label;
  END IF;

  IF v_pledge_status <> 'confirmed' THEN
    ROLLBACK;
    SET p_status = 'INVALID_STATE';
    SET p_message = CONCAT('Cannot cancel pledge with status: ', v_pledge_status);
    LEAVE proc_label;
  END IF;

  -- 2. Lock campaign to check active state & deadline
  SELECT `status`, `deadline`
    INTO v_camp_status, v_deadline
    FROM `campaigns`
   WHERE `id` = v_camp_id
     FOR UPDATE;

  IF v_camp_status <> 'active' THEN
    ROLLBACK;
    SET p_status = 'CAMPAIGN_NOT_ACTIVE';
    SET p_message = 'Pledges can only be cancelled while campaign is active.';
    LEAVE proc_label;
  END IF;

  IF UTC_TIMESTAMP() > v_deadline THEN
    ROLLBACK;
    SET p_status = 'CAMPAIGN_EXPIRED';
    SET p_message = 'Cannot cancel pledge after campaign deadline.';
    LEAVE proc_label;
  END IF;

  -- 3. Update pledge status (trigger trg_pledges_after_update restores tier claimed stock and campaign current_amount)
  UPDATE `pledges`
     SET `status` = 'cancelled'
   WHERE `id` = p_pledge_id;

  -- 4. Record refund idempotently
  SET v_ref_ref = CONCAT('ref_cancel_', UNIX_TIMESTAMP(), '_', p_pledge_id);

  INSERT INTO `refunds` (
    `pledge_id`,
    `amount`,
    `status`,
    `refund_ref`,
    `gateway_response`
  ) VALUES (
    p_pledge_id,
    v_amount,
    'processed',
    v_ref_ref,
    JSON_OBJECT(
      'provider', 'MockPaymentService',
      'reason', 'backer_cancellation',
      'refund_id', UUID(),
      'timestamp', UTC_TIMESTAMP()
    )
  );

  COMMIT;

  SET p_status = 'SUCCESS';
  SET p_message = 'Pledge cancelled and refund recorded successfully.';
END$$

-- ----------------------------------------------------------------------------
-- Procedure: approve_campaign
-- Admins approve pending campaigns and activate them.
-- ----------------------------------------------------------------------------
CREATE PROCEDURE `approve_campaign`(
  IN  p_campaign_id INT,
  IN  p_admin_id    INT,
  OUT p_status      VARCHAR(50),
  OUT p_message     VARCHAR(255)
)
proc_label: BEGIN
  DECLARE v_admin_role VARCHAR(50);
  DECLARE v_current_status VARCHAR(50);

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    SET p_status = 'ERROR';
    SET p_message = 'Database error during campaign approval.';
  END;

  START TRANSACTION;

  SELECT `role` INTO v_admin_role FROM `users` WHERE `id` = p_admin_id;
  IF v_admin_role IS NULL OR v_admin_role <> 'admin' THEN
    ROLLBACK;
    SET p_status = 'UNAUTHORIZED';
    SET p_message = 'Only administrators can approve campaigns.';
    LEAVE proc_label;
  END IF;

  SELECT `status` INTO v_current_status
    FROM `campaigns`
   WHERE `id` = p_campaign_id
     FOR UPDATE;

  IF v_current_status IS NULL THEN
    ROLLBACK;
    SET p_status = 'CAMPAIGN_NOT_FOUND';
    SET p_message = 'Campaign not found.';
    LEAVE proc_label;
  END IF;

  IF v_current_status <> 'pending_approval' THEN
    ROLLBACK;
    SET p_status = 'INVALID_STATE';
    SET p_message = CONCAT('Campaign cannot be approved from status: ', v_current_status);
    LEAVE proc_label;
  END IF;

  UPDATE `campaigns`
     SET `status` = 'active',
         `start_date` = IF(`start_date` IS NULL OR `start_date` < UTC_TIMESTAMP(), UTC_TIMESTAMP(), `start_date`),
         `rejection_reason` = NULL
   WHERE `id` = p_campaign_id;

  INSERT INTO `audit_log` (
    `table_name`, `record_id`, `action`, `old_status`, `new_status`, `changed_by`, `metadata`
  ) VALUES (
    'campaigns', p_campaign_id, 'CAMPAIGN_APPROVED', 'pending_approval', 'active', p_admin_id,
    JSON_OBJECT('approved_by_admin', p_admin_id, 'approved_at', UTC_TIMESTAMP())
  );

  COMMIT;

  SET p_status = 'SUCCESS';
  SET p_message = 'Campaign approved and activated successfully.';
END$$

-- ----------------------------------------------------------------------------
-- Procedure: reject_campaign
-- Admins reject a pending campaign with reason.
-- ----------------------------------------------------------------------------
CREATE PROCEDURE `reject_campaign`(
  IN  p_campaign_id INT,
  IN  p_admin_id    INT,
  IN  p_reason      TEXT,
  OUT p_status      VARCHAR(50),
  OUT p_message     VARCHAR(255)
)
proc_label: BEGIN
  DECLARE v_admin_role VARCHAR(50);
  DECLARE v_current_status VARCHAR(50);

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    SET p_status = 'ERROR';
    SET p_message = 'Database error during campaign rejection.';
  END;

  START TRANSACTION;

  SELECT `role` INTO v_admin_role FROM `users` WHERE `id` = p_admin_id;
  IF v_admin_role IS NULL OR v_admin_role <> 'admin' THEN
    ROLLBACK;
    SET p_status = 'UNAUTHORIZED';
    SET p_message = 'Only administrators can reject campaigns.';
    LEAVE proc_label;
  END IF;

  SELECT `status` INTO v_current_status
    FROM `campaigns`
   WHERE `id` = p_campaign_id
     FOR UPDATE;

  IF v_current_status IS NULL THEN
    ROLLBACK;
    SET p_status = 'CAMPAIGN_NOT_FOUND';
    SET p_message = 'Campaign not found.';
    LEAVE proc_label;
  END IF;

  IF v_current_status <> 'pending_approval' THEN
    ROLLBACK;
    SET p_status = 'INVALID_STATE';
    SET p_message = CONCAT('Only pending campaigns can be rejected. Current status: ', v_current_status);
    LEAVE proc_label;
  END IF;

  UPDATE `campaigns`
     SET `status` = 'draft',
         `rejection_reason` = p_reason
   WHERE `id` = p_campaign_id;

  INSERT INTO `audit_log` (
    `table_name`, `record_id`, `action`, `old_status`, `new_status`, `changed_by`, `metadata`
  ) VALUES (
    'campaigns', p_campaign_id, 'CAMPAIGN_REJECTED', 'pending_approval', 'draft', p_admin_id,
    JSON_OBJECT('rejected_by_admin', p_admin_id, 'reason', p_reason, 'rejected_at', UTC_TIMESTAMP())
  );

  COMMIT;

  SET p_status = 'SUCCESS';
  SET p_message = 'Campaign rejected and returned to draft.';
END$$

-- ----------------------------------------------------------------------------
-- Procedure: process_expired_campaigns
-- Evaluates all active campaigns whose deadline has passed:
-- - If goal reached: mark 'successful'
-- - If goal not reached: mark 'failed' and issue idempotent refunds for all confirmed pledges.
-- ----------------------------------------------------------------------------
CREATE PROCEDURE `process_expired_campaigns`()
BEGIN
  DECLARE v_done INT DEFAULT FALSE;
  DECLARE v_camp_id INT;
  DECLARE v_goal DECIMAL(12, 2);
  DECLARE v_current DECIMAL(12, 2);

  -- Cursor for expired active campaigns
  DECLARE cur_campaigns CURSOR FOR
    SELECT `id`, `goal_amount`, `current_amount`
      FROM `campaigns`
     WHERE `status` = 'active'
       AND `deadline` <= UTC_TIMESTAMP();

  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;

  OPEN cur_campaigns;

  campaign_loop: LOOP
    FETCH cur_campaigns INTO v_camp_id, v_goal, v_current;
    IF v_done THEN
      LEAVE campaign_loop;
    END IF;

    -- Process campaign in individual transaction
    START TRANSACTION;

    IF v_current >= v_goal THEN
      -- Success! Goal reached
      UPDATE `campaigns`
         SET `status` = 'successful'
       WHERE `id` = v_camp_id;

      INSERT INTO `audit_log` (
        `table_name`, `record_id`, `action`, `old_status`, `new_status`, `metadata`
      ) VALUES (
        'campaigns', v_camp_id, 'CAMPAIGN_RESOLVED', 'active', 'successful',
        JSON_OBJECT('current_amount', v_current, 'goal_amount', v_goal, 'resolved_at', UTC_TIMESTAMP())
      );
    ELSE
      -- Failure! Goal not reached. Refund all confirmed pledges.
      UPDATE `campaigns`
         SET `status` = 'failed'
       WHERE `id` = v_camp_id;

      INSERT INTO `audit_log` (
        `table_name`, `record_id`, `action`, `old_status`, `new_status`, `metadata`
      ) VALUES (
        'campaigns', v_camp_id, 'CAMPAIGN_RESOLVED', 'active', 'failed',
        JSON_OBJECT('current_amount', v_current, 'goal_amount', v_goal, 'resolved_at', UTC_TIMESTAMP())
      );

      -- Update pledges to refunded and insert refunds idempotently
      INSERT IGNORE INTO `refunds` (`pledge_id`, `amount`, `status`, `refund_ref`, `gateway_response`)
      SELECT p.`id`,
             p.`amount`,
             'processed',
             CONCAT('ref_fail_', UNIX_TIMESTAMP(), '_', p.`id`),
             JSON_OBJECT(
               'reason', 'campaign_goal_not_reached',
               'campaign_id', v_camp_id,
               'processed_at', UTC_TIMESTAMP()
             )
        FROM `pledges` p
       WHERE p.`campaign_id` = v_camp_id
         AND p.`status` = 'confirmed';

      UPDATE `pledges`
         SET `status` = 'refunded'
       WHERE `campaign_id` = v_camp_id
         AND `status` = 'confirmed';

    END IF;

    COMMIT;
  END LOOP;

  CLOSE cur_campaigns;
END$$

DELIMITER ;
