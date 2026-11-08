-- ============================================================================
-- CROWDFUNDING PLATFORM DATABASE VIEWS
-- ============================================================================

USE `crowdfunding_platform`;

-- ----------------------------------------------------------------------------
-- View: v_campaign_progress
-- Computes real-time progress, percentage funded, and days remaining.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW `v_campaign_progress` AS
SELECT
  c.`id`,
  c.`title`,
  c.`description`,
  c.`image_url`,
  c.`status`,
  c.`goal_amount`,
  c.`current_amount`,
  c.`backer_count`,
  c.`start_date`,
  c.`deadline`,
  c.`creator_id`,
  u.`name` AS `creator_name`,
  u.`avatar_url` AS `creator_avatar`,
  c.`category_id`,
  cat.`name` AS `category_name`,
  cat.`slug` AS `category_slug`,
  ROUND((c.`current_amount` / c.`goal_amount`) * 100, 2) AS `percent_funded`,
  GREATEST(0, TIMESTAMPDIFF(DAY, UTC_TIMESTAMP(), c.`deadline`)) AS `days_remaining`,
  GREATEST(0, TIMESTAMPDIFF(HOUR, UTC_TIMESTAMP(), c.`deadline`)) AS `hours_remaining`,
  c.`created_at`,
  c.`updated_at`
FROM `campaigns` c
JOIN `users` u ON c.`creator_id` = u.`id`
JOIN `categories` cat ON c.`category_id` = cat.`id`;

-- ----------------------------------------------------------------------------
-- View: v_creator_dashboard
-- Provides creators with aggregated statistics for each campaign.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW `v_creator_dashboard` AS
SELECT
  c.`id` AS `campaign_id`,
  c.`creator_id`,
  c.`title`,
  c.`status`,
  c.`goal_amount`,
  c.`current_amount`,
  c.`backer_count`,
  ROUND((c.`current_amount` / c.`goal_amount`) * 100, 2) AS `percent_funded`,
  c.`deadline`,
  GREATEST(0, TIMESTAMPDIFF(DAY, UTC_TIMESTAMP(), c.`deadline`)) AS `days_remaining`,
  (SELECT COUNT(*) FROM `reward_tiers` rt WHERE rt.`campaign_id` = c.`id`) AS `total_tiers`,
  (SELECT COUNT(*) FROM `campaign_updates` cu WHERE cu.`campaign_id` = c.`id`) AS `total_updates`,
  (SELECT COUNT(*) FROM `comments` com WHERE com.`campaign_id` = c.`id`) AS `total_comments`,
  c.`created_at`
FROM `campaigns` c;

-- ----------------------------------------------------------------------------
-- View: v_backer_history
-- Detailed backer pledge history with eligibility for cancellation.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW `v_backer_history` AS
SELECT
  p.`id` AS `pledge_id`,
  p.`backer_id`,
  p.`campaign_id`,
  c.`title` AS `campaign_title`,
  c.`image_url` AS `campaign_image`,
  c.`status` AS `campaign_status`,
  c.`deadline` AS `campaign_deadline`,
  p.`tier_id`,
  rt.`title` AS `tier_title`,
  p.`amount`,
  p.`status` AS `pledge_status`,
  p.`created_at` AS `pledged_at`,
  pay.`transaction_ref`,
  ref.`refund_ref`,
  -- Eligible to cancel only if pledge is confirmed, campaign is active, and deadline is in the future
  (p.`status` = 'confirmed' AND c.`status` = 'active' AND UTC_TIMESTAMP() <= c.`deadline`) AS `is_cancellable`
FROM `pledges` p
JOIN `campaigns` c ON p.`campaign_id` = c.`id`
LEFT JOIN `reward_tiers` rt ON p.`tier_id` = rt.`id`
LEFT JOIN `payments` pay ON pay.`pledge_id` = p.`id`
LEFT JOIN `refunds` ref ON ref.`pledge_id` = p.`id`;

-- ----------------------------------------------------------------------------
-- View: v_top_campaigns
-- Top campaigns ranked by funding amount using MySQL 8 window function RANK().
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW `v_top_campaigns` AS
SELECT
  c.`id`,
  c.`title`,
  c.`current_amount`,
  c.`goal_amount`,
  ROUND((c.`current_amount` / c.`goal_amount`) * 100, 2) AS `percent_funded`,
  c.`backer_count`,
  c.`status`,
  cat.`name` AS `category_name`,
  RANK() OVER (ORDER BY c.`current_amount` DESC) AS `funding_rank`
FROM `campaigns` c
JOIN `categories` cat ON c.`category_id` = cat.`id`;

