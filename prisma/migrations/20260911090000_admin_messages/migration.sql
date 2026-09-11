-- Lets an admin send a custom SMS to a hand-picked list of DRIVER/STATION
-- accounts, with per-recipient delivery tracking (a batch send can partially
-- fail without hiding the recipients that did go through).
CREATE TABLE `admin_messages` (
    `id` VARCHAR(191) NOT NULL,
    `senderId` VARCHAR(191) NOT NULL,
    `body` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `admin_messages_senderId_createdAt_idx`(`senderId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `admin_message_recipients` (
    `id` VARCHAR(191) NOT NULL,
    `messageId` VARCHAR(191) NOT NULL,
    `accountId` VARCHAR(191) NOT NULL,
    `phoneNumber` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'SENT', 'FAILED', 'SKIPPED') NOT NULL DEFAULT 'PENDING',
    `error` VARCHAR(191) NULL,
    `sentAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `admin_message_recipients_messageId_idx`(`messageId`),
    INDEX `admin_message_recipients_accountId_status_idx`(`accountId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `admin_messages` ADD CONSTRAINT `admin_messages_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `accounts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `admin_message_recipients` ADD CONSTRAINT `admin_message_recipients_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `admin_messages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `admin_message_recipients` ADD CONSTRAINT `admin_message_recipients_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `accounts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
