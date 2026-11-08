-- ============================================================================
-- CROWDFUNDING PLATFORM USERS AND GRANTS
-- Restricted Application User & Dedicated Administrative User
-- Note: Real passwords are injected dynamically during initialization
-- from environment variables. Do not hardcode secrets here.
-- ============================================================================

-- Application User: Restricted DML & EXECUTE permissions only
CREATE USER IF NOT EXISTS 'crowd_app'@'localhost' IDENTIFIED BY 'APP_USER_PASSWORD_PLACEHOLDER';
CREATE USER IF NOT EXISTS 'crowd_app'@'127.0.0.1' IDENTIFIED BY 'APP_USER_PASSWORD_PLACEHOLDER';

GRANT SELECT, INSERT, UPDATE, DELETE, EXECUTE ON `crowdfunding_platform`.* TO 'crowd_app'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE, EXECUTE ON `crowdfunding_platform`.* TO 'crowd_app'@'127.0.0.1';

-- Admin User: DDL & DML permissions scoped strictly to crowdfunding_platform
CREATE USER IF NOT EXISTS 'crowd_admin'@'localhost' IDENTIFIED BY 'ADMIN_USER_PASSWORD_PLACEHOLDER';
CREATE USER IF NOT EXISTS 'crowd_admin'@'127.0.0.1' IDENTIFIED BY 'ADMIN_USER_PASSWORD_PLACEHOLDER';

GRANT ALL PRIVILEGES ON `crowdfunding_platform`.* TO 'crowd_admin'@'localhost';
GRANT ALL PRIVILEGES ON `crowdfunding_platform`.* TO 'crowd_admin'@'127.0.0.1';

FLUSH PRIVILEGES;

