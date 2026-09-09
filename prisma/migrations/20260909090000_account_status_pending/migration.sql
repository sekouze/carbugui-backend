-- Adds PENDING to accounts.status so a self-registered STATION account can
-- sit read-only until an admin approves it. Existing rows are unaffected
-- (the column default stays 'ACTIVE').
ALTER TABLE `accounts` MODIFY `status` ENUM('PENDING', 'ACTIVE', 'SUSPENDED', 'DELETED') NOT NULL DEFAULT 'ACTIVE';
