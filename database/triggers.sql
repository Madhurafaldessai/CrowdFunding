-- ============================================================================
-- CROWDFUNDING PLATFORM TRIGGERS
-- ============================================================================

USE `crowdfunding_platform`;

DROP TRIGGER IF EXISTS `trg_pledges_before_insert`;
DROP TRIGGER IF EXISTS `trg_pledges_after_insert`;
DROP TRIGGER IF EXISTS `trg_pledges_after_update`;
DROP TRIGGER IF EXISTS `trg_campaigns_after_update`;

DELIMITER $$

-- ----------------------------------------------------------------------------
-- Trigger: trg_pledges_before_insert
-- Enforces:
-- 1. Campaign must be in 'active' status.
-- 2. Campaign deadline must not have passed (UTC).
-- 3. Backer cannot be the campaign creator (prevent self-pledging).
-- 4. If reward tier selected, validate campaign match, minimum amount, and stock.
-- ----------------------------------------------------------------------------
CREATE TRIGGER `trg_pledges_before_insert`
BEFORE INSERT ON `pledges`
FOR EACH ROW
BEGIN
  DECLARE v_creator_id INT;
  DECLARE v_status VARCHAR(50);
  DECLARE v_deadline TIMESTAMP;
  DECLARE v_tier_campaign_id INT;
  DECLARE v_min_amount DECIMAL(12, 2);
  DECLARE v_quantity INT;
  DECLARE v_claimed_quantity INT;

  -- Fetch campaign details
  SELECT `creator_id`, `status`, `deadline`
    INTO v_creator_id, v_status, v_deadline
    FROM `campaigns`
   WHERE `id` = NEW.campaign_id;

  IF v_status IS NULL THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Campaign does not exist.';
  END IF;

  -- Rule: Campaign must be active
  IF v_status <> 'active' THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Pledges are only accepted for active campaigns.';
  END IF;

  -- Rule: Campaign deadline must not have passed
  IF UTC_TIMESTAMP() > v_deadline THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Campaign funding deadline has passed.';
  END IF;

  -- Rule: Self-pledging is strictly forbidden
  IF v_creator_id = NEW.backer_id THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Creators cannot pledge to their own campaigns.';
  END IF;

  -- Rule: Validate reward tier if specified
  IF NEW.tier_id IS NOT NULL THEN
    SELECT `campaign_id`, `min_amount`, `quantity`, `claimed_quantity`
      INTO v_tier_campaign_id, v_min_amount, v_quantity, v_claimed_quantity
      FROM `reward_tiers`
     WHERE `id` = NEW.tier_id;

    IF v_tier_campaign_id IS NULL THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Selected reward tier does not exist.';
    END IF;

    IF v_tier_campaign_id <> NEW.campaign_id THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Selected reward tier does not belong to this campaign.';
    END IF;

    IF NEW.amount < v_min_amount THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Pledge amount must meet or exceed the reward tier minimum.';
    END IF;

    IF v_quantity IS NOT NULL AND v_claimed_quantity >= v_quantity THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'This reward tier is sold out.';
    END IF;
  END IF;
END$$

-- ----------------------------------------------------------------------------
-- Trigger: trg_pledges_after_insert
-- Maintains campaign current_amount, backer_count, and tier claimed_quantity.
-- ----------------------------------------------------------------------------
CREATE TRIGGER `trg_pledges_after_insert`
AFTER INSERT ON `pledges`
FOR EACH ROW
BEGIN
  IF NEW.status = 'confirmed' THEN
    -- Update campaign current_amount and backer_count
    UPDATE `campaigns`
       SET `current_amount` = `current_amount` + NEW.amount,
           `backer_count` = (
             SELECT COUNT(DISTINCT `backer_id`)
               FROM `pledges`
              WHERE `campaign_id` = NEW.campaign_id
                AND `status` = 'confirmed'
           )
     WHERE `id` = NEW.campaign_id;

    -- Update tier claimed quantity if applicable
    IF NEW.tier_id IS NOT NULL THEN
      UPDATE `reward_tiers`
         SET `claimed_quantity` = `claimed_quantity` + 1
       WHERE `id` = NEW.tier_id;
    END IF;
  END IF;
END$$

-- ----------------------------------------------------------------------------
-- Trigger: trg_pledges_after_update
-- Handles pledge status transitions:
-- confirmed -> cancelled: decreases amount, adjusts backer_count and restores stock.
-- confirmed -> refunded: decreases amount, adjusts backer_count and restores stock.
-- ----------------------------------------------------------------------------
CREATE TRIGGER `trg_pledges_after_update`
AFTER UPDATE ON `pledges`
FOR EACH ROW
BEGIN
  -- Handle cancellation or refund of previously confirmed pledge
  IF OLD.status = 'confirmed' AND NEW.status IN ('cancelled', 'refunded') THEN
    UPDATE `campaigns`
       SET `current_amount` = GREATEST(0.00, `current_amount` - OLD.amount),
           `backer_count` = (
             SELECT COUNT(DISTINCT `backer_id`)
               FROM `pledges`
              WHERE `campaign_id` = NEW.campaign_id
                AND `status` = 'confirmed'
           )
     WHERE `id` = NEW.campaign_id;

    -- Restore reward tier claimed quantity
    IF OLD.tier_id IS NOT NULL THEN
      UPDATE `reward_tiers`
         SET `claimed_quantity` = GREATEST(0, `claimed_quantity` - 1)
       WHERE `id` = OLD.tier_id;
    END IF;
  END IF;
END$$

-- ----------------------------------------------------------------------------
-- Trigger: trg_campaigns_after_update
-- Records campaign status changes in audit_log.
-- ----------------------------------------------------------------------------
CREATE TRIGGER `trg_campaigns_after_update`
AFTER UPDATE ON `campaigns`
FOR EACH ROW
BEGIN
  IF OLD.status <> NEW.status THEN
    INSERT INTO `audit_log` (
      `table_name`,
      `record_id`,
      `action`,
      `old_status`,
      `new_status`,
      `changed_by`,
      `metadata`
    ) VALUES (
      'campaigns',
      NEW.id,
      'STATUS_CHANGE',
      OLD.status,
      NEW.status,
      NULL,
      JSON_OBJECT(
        'current_amount', NEW.current_amount,
        'backer_count', NEW.backer_count,
        'goal_amount', NEW.goal_amount,
        'deadline', NEW.deadline
      )
    );
  END IF;
END$$

DELIMITER ;

