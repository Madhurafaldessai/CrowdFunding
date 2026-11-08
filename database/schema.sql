-- ============================================================================
-- CROWDFUNDING PLATFORM DATABASE SCHEMA (MySQL 8.4.x)
-- Engine: InnoDB
-- Normal Form: 3NF
-- Timezone Policy: All TIMESTAMP and DATETIME fields are stored in UTC.
-- Currency Policy: All monetary amounts are stored as DECIMAL(12, 2).
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `crowdfunding_platform`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `crowdfunding_platform`;

-- ----------------------------------------------------------------------------
-- Table: users
-- Roles: 'user', 'admin'. Normal users act as both creators and backers.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  `status` ENUM('active', 'suspended') NOT NULL DEFAULT 'active',
  `avatar_url` VARCHAR(500) DEFAULT NULL,
  `bio` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table: categories
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `slug` VARCHAR(100) NOT NULL UNIQUE,
  `description` VARCHAR(255) DEFAULT NULL,
  `icon` VARCHAR(50) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table: campaigns
-- All-or-nothing crowdfunding campaigns.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `campaigns` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `creator_id` INT NOT NULL,
  `category_id` INT NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `description` VARCHAR(500) NOT NULL,
  `story` LONGTEXT NOT NULL,
  `image_url` VARCHAR(500) DEFAULT NULL,
  `goal_amount` DECIMAL(12, 2) NOT NULL,
  `current_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `backer_count` INT NOT NULL DEFAULT 0,
  `status` ENUM('draft', 'pending_approval', 'active', 'successful', 'failed', 'cancelled') NOT NULL DEFAULT 'draft',
  `start_date` TIMESTAMP NULL DEFAULT NULL,
  `deadline` TIMESTAMP NOT NULL,
  `rejection_reason` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `chk_campaign_goal` CHECK (`goal_amount` > 0),
  CONSTRAINT `chk_campaign_current` CHECK (`current_amount` >= 0),
  CONSTRAINT `chk_campaign_dates` CHECK (`start_date` IS NULL OR `deadline` > `start_date`),
  CONSTRAINT `fk_campaigns_creator` FOREIGN KEY (`creator_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_campaigns_category` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE RESTRICT,
  INDEX `idx_campaigns_status_deadline` (`status`, `deadline`),
  INDEX `idx_campaigns_category_id` (`category_id`),
  INDEX `idx_campaigns_creator_id` (`creator_id`),
  FULLTEXT INDEX `ft_campaign_search` (`title`, `description`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table: reward_tiers
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `reward_tiers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `campaign_id` INT NOT NULL,
  `title` VARCHAR(150) NOT NULL,
  `description` TEXT NOT NULL,
  `min_amount` DECIMAL(12, 2) NOT NULL,
  `quantity` INT DEFAULT NULL, -- NULL indicates unlimited stock
  `claimed_quantity` INT NOT NULL DEFAULT 0,
  `estimated_delivery` VARCHAR(100) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `chk_tier_min_amount` CHECK (`min_amount` > 0),
  CONSTRAINT `chk_tier_quantity` CHECK (`quantity` IS NULL OR (`quantity` > 0 AND `claimed_quantity` <= `quantity`)),
  CONSTRAINT `chk_tier_claimed` CHECK (`claimed_quantity` >= 0),
  CONSTRAINT `fk_reward_tiers_campaign` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON DELETE CASCADE,
  INDEX `idx_reward_tiers_campaign_id` (`campaign_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table: pledges
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `pledges` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `backer_id` INT NOT NULL,
  `campaign_id` INT NOT NULL,
  `tier_id` INT DEFAULT NULL,
  `amount` DECIMAL(12, 2) NOT NULL,
  `status` ENUM('confirmed', 'cancelled', 'refunded') NOT NULL DEFAULT 'confirmed',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `chk_pledge_amount` CHECK (`amount` > 0),
  CONSTRAINT `fk_pledges_backer` FOREIGN KEY (`backer_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_pledges_campaign` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_pledges_tier` FOREIGN KEY (`tier_id`) REFERENCES `reward_tiers`(`id`) ON DELETE SET NULL,
  INDEX `idx_pledges_campaign_id` (`campaign_id`),
  INDEX `idx_pledges_backer_id` (`backer_id`),
  INDEX `idx_pledges_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table: payments
-- Simulated payment records for pledges.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `payments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `pledge_id` INT NOT NULL,
  `amount` DECIMAL(12, 2) NOT NULL,
  `status` ENUM('successful', 'failed') NOT NULL,
  `transaction_ref` VARCHAR(100) NOT NULL UNIQUE,
  `gateway_response` JSON DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `chk_payment_amount` CHECK (`amount` > 0),
  CONSTRAINT `fk_payments_pledge` FOREIGN KEY (`pledge_id`) REFERENCES `pledges`(`id`) ON DELETE CASCADE,
  INDEX `idx_payments_pledge_id` (`pledge_id`),
  INDEX `idx_payments_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table: refunds
-- Idempotent refund records. Unique constraint on pledge_id prevents duplicates.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `refunds` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `pledge_id` INT NOT NULL UNIQUE,
  `amount` DECIMAL(12, 2) NOT NULL,
  `status` ENUM('processed', 'failed') NOT NULL DEFAULT 'processed',
  `refund_ref` VARCHAR(100) NOT NULL UNIQUE,
  `gateway_response` JSON DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `chk_refund_amount` CHECK (`amount` > 0),
  CONSTRAINT `fk_refunds_pledge` FOREIGN KEY (`pledge_id`) REFERENCES `pledges`(`id`) ON DELETE CASCADE,
  INDEX `idx_refunds_pledge_id` (`pledge_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table: campaign_updates
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `campaign_updates` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `campaign_id` INT NOT NULL,
  `creator_id` INT NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `content` LONGTEXT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_updates_campaign` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_updates_creator` FOREIGN KEY (`creator_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
  INDEX `idx_updates_campaign_id` (`campaign_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table: comments
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `comments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `campaign_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `comment` TEXT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_comments_campaign` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_comments_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
  INDEX `idx_comments_campaign_id` (`campaign_id`),
  INDEX `idx_comments_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table: audit_log
-- Audit log for status changes and critical state transitions.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `audit_log` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `table_name` VARCHAR(50) NOT NULL,
  `record_id` INT NOT NULL,
  `action` VARCHAR(50) NOT NULL,
  `old_status` VARCHAR(50) DEFAULT NULL,
  `new_status` VARCHAR(50) DEFAULT NULL,
  `changed_by` INT DEFAULT NULL,
  `metadata` JSON DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_audit_table_record` (`table_name`, `record_id`),
  INDEX `idx_audit_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

