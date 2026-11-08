-- ============================================================================
-- CROWDFUNDING PLATFORM SCHEDULED EVENTS
-- ============================================================================

USE `crowdfunding_platform`;

DROP EVENT IF EXISTS `evt_process_expired_campaigns`;

DELIMITER $$

CREATE EVENT `evt_process_expired_campaigns`
ON SCHEDULE EVERY 5 MINUTE
STARTS CURRENT_TIMESTAMP
DO
BEGIN
  CALL `process_expired_campaigns`();
END$$

DELIMITER ;
