-- Lets an admin schedule a custom SMS for a future date instead of sending
-- it immediately. scheduledAt defaults to "now" so an immediate send and a
-- future one share the same dispatch query (status SCHEDULED, scheduledAt
-- <= now) in utils/adminMessaging.js.
ALTER TABLE `admin_messages`
  ADD COLUMN `status` ENUM('SCHEDULED', 'SENT', 'CANCELED') NOT NULL DEFAULT 'SCHEDULED',
  ADD COLUMN `scheduledAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  ADD COLUMN `dispatchedAt` DATETIME(3) NULL;

CREATE INDEX `admin_messages_status_scheduledAt_idx` ON `admin_messages`(`status`, `scheduledAt`);
