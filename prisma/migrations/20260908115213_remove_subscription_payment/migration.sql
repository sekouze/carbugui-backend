-- DropForeignKey (payments references accounts/subscriptions/plans)
ALTER TABLE `payments` DROP FOREIGN KEY `payments_accountId_fkey`;
ALTER TABLE `payments` DROP FOREIGN KEY `payments_subscriptionId_fkey`;
ALTER TABLE `payments` DROP FOREIGN KEY `payments_planId_fkey`;

-- DropForeignKey (subscriptions references accounts/plans)
ALTER TABLE `subscriptions` DROP FOREIGN KEY `subscriptions_accountId_fkey`;
ALTER TABLE `subscriptions` DROP FOREIGN KEY `subscriptions_planId_fkey`;

-- DropTable
DROP TABLE `payments`;

-- DropTable
DROP TABLE `subscriptions`;

-- DropTable
DROP TABLE `plans`;

-- DropTable
DROP TABLE `webhook_events`;
