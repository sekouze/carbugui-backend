-- CreateTable
CREATE TABLE `accounts` (
    `id` VARCHAR(191) NOT NULL,
    `role` ENUM('DRIVER', 'STATION', 'ADMIN') NOT NULL DEFAULT 'DRIVER',
    `status` ENUM('ACTIVE', 'SUSPENDED', 'DELETED') NOT NULL DEFAULT 'ACTIVE',
    `phoneNumber` VARCHAR(191) NULL,
    `fullName` VARCHAR(191) NULL,
    `locale` VARCHAR(191) NOT NULL DEFAULT 'fr',
    `defaultAreaId` VARCHAR(191) NULL,
    `loginCode` VARCHAR(191) NULL,
    `passwordHash` VARCHAR(191) NULL,
    `lastSeenAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `accounts_phoneNumber_key`(`phoneNumber`),
    UNIQUE INDEX `accounts_loginCode_key`(`loginCode`),
    INDEX `accounts_role_status_idx`(`role`, `status`),
    INDEX `accounts_defaultAreaId_idx`(`defaultAreaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sessions` (
    `id` VARCHAR(191) NOT NULL,
    `accountId` VARCHAR(191) NOT NULL,
    `refreshTokenHash` VARCHAR(191) NOT NULL,
    `deviceId` VARCHAR(191) NULL,
    `deviceName` VARCHAR(191) NULL,
    `platform` ENUM('IOS', 'ANDROID', 'WEB') NULL,
    `ipAddress` VARCHAR(191) NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `revokedAt` DATETIME(3) NULL,
    `lastUsedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `sessions_refreshTokenHash_key`(`refreshTokenHash`),
    INDEX `sessions_accountId_revokedAt_idx`(`accountId`, `revokedAt`),
    INDEX `sessions_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `otp_challenges` (
    `id` VARCHAR(191) NOT NULL,
    `phoneNumber` VARCHAR(191) NOT NULL,
    `purpose` ENUM('SIGN_IN', 'PHONE_CHANGE') NOT NULL DEFAULT 'SIGN_IN',
    `codeHash` VARCHAR(191) NOT NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `maxAttempts` INTEGER NOT NULL DEFAULT 3,
    `expiresAt` DATETIME(3) NOT NULL,
    `consumedAt` DATETIME(3) NULL,
    `ipAddress` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `otp_challenges_phoneNumber_createdAt_idx`(`phoneNumber`, `createdAt`),
    INDEX `otp_challenges_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `push_tokens` (
    `id` VARCHAR(191) NOT NULL,
    `accountId` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `platform` ENUM('IOS', 'ANDROID', 'WEB') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastSeenAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `push_tokens_token_key`(`token`),
    INDEX `push_tokens_accountId_idx`(`accountId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `areas` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `latitude` DOUBLE NOT NULL,
    `longitude` DOUBLE NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `areas_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `brands` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `logoUrl` VARCHAR(191) NULL,

    UNIQUE INDEX `brands_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stations` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `brandId` VARCHAR(191) NULL,
    `areaId` VARCHAR(191) NULL,
    `neighborhood` VARCHAR(191) NULL,
    `city` VARCHAR(191) NOT NULL DEFAULT 'Conakry',
    `address` VARCHAR(191) NULL,
    `phoneNumber` VARCHAR(191) NULL,
    `latitude` DOUBLE NOT NULL,
    `longitude` DOUBLE NOT NULL,
    `googlePlaceId` VARCHAR(191) NULL,
    `isOpen` BOOLEAN NOT NULL DEFAULT true,
    `isPublished` BOOLEAN NOT NULL DEFAULT true,
    `verifiedAt` DATETIME(3) NULL,
    `openingHours` JSON NULL,
    `statusUpdatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `stations_slug_key`(`slug`),
    UNIQUE INDEX `stations_googlePlaceId_key`(`googlePlaceId`),
    INDEX `stations_latitude_longitude_idx`(`latitude`, `longitude`),
    INDEX `stations_isPublished_statusUpdatedAt_idx`(`isPublished`, `statusUpdatedAt`),
    INDEX `stations_areaId_idx`(`areaId`),
    INDEX `stations_brandId_idx`(`brandId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `station_memberships` (
    `id` VARCHAR(191) NOT NULL,
    `accountId` VARCHAR(191) NOT NULL,
    `stationId` VARCHAR(191) NOT NULL,
    `role` ENUM('OWNER', 'STAFF') NOT NULL DEFAULT 'STAFF',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `station_memberships_stationId_idx`(`stationId`),
    UNIQUE INDEX `station_memberships_accountId_stationId_key`(`accountId`, `stationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `station_products` (
    `id` VARCHAR(191) NOT NULL,
    `stationId` VARCHAR(191) NOT NULL,
    `product` ENUM('ESSENCE', 'GASOIL', 'GAZ') NOT NULL,
    `availability` ENUM('AVAILABLE', 'EMPTY') NOT NULL DEFAULT 'EMPTY',
    `priceGnf` INTEGER NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `updatedById` VARCHAR(191) NULL,

    INDEX `station_products_product_availability_idx`(`product`, `availability`),
    UNIQUE INDEX `station_products_stationId_product_key`(`stationId`, `product`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `station_activities` (
    `id` VARCHAR(191) NOT NULL,
    `stationId` VARCHAR(191) NOT NULL,
    `accountId` VARCHAR(191) NULL,
    `kind` ENUM('AVAILABILITY', 'OPEN_STATE', 'PRICE', 'VERIFICATION') NOT NULL,
    `tone` ENUM('AVAILABLE', 'EMPTY', 'OPEN', 'CLOSED') NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `detail` VARCHAR(191) NOT NULL,
    `product` ENUM('ESSENCE', 'GASOIL', 'GAZ') NULL,
    `availability` ENUM('AVAILABLE', 'EMPTY') NULL,
    `isOpen` BOOLEAN NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `station_activities_stationId_createdAt_idx`(`stationId`, `createdAt`),
    INDEX `station_activities_accountId_createdAt_idx`(`accountId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `station_reports` (
    `id` VARCHAR(191) NOT NULL,
    `stationId` VARCHAR(191) NOT NULL,
    `accountId` VARCHAR(191) NULL,
    `kind` ENUM('WRONG_AVAILABILITY', 'WRONG_OPEN_STATE', 'WRONG_LOCATION', 'CLOSED_PERMANENTLY', 'OTHER') NOT NULL,
    `product` ENUM('ESSENCE', 'GASOIL', 'GAZ') NULL,
    `comment` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `resolvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `station_reports_stationId_createdAt_idx`(`stationId`, `createdAt`),
    INDEX `station_reports_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `plans` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `priceGnf` INTEGER NOT NULL,
    `periodDays` INTEGER NOT NULL DEFAULT 30,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `plans_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subscriptions` (
    `id` VARCHAR(191) NOT NULL,
    `accountId` VARCHAR(191) NOT NULL,
    `planId` VARCHAR(191) NOT NULL,
    `status` ENUM('ACTIVE', 'EXPIRED', 'CANCELED') NOT NULL DEFAULT 'ACTIVE',
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `currentPeriodEnd` DATETIME(3) NOT NULL,
    `autoRenew` BOOLEAN NOT NULL DEFAULT true,
    `lastMethod` ENUM('ORANGE_MONEY', 'MTN_MOMO') NULL,
    `canceledAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `subscriptions_accountId_key`(`accountId`),
    INDEX `subscriptions_status_currentPeriodEnd_idx`(`status`, `currentPeriodEnd`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `id` VARCHAR(191) NOT NULL,
    `accountId` VARCHAR(191) NOT NULL,
    `subscriptionId` VARCHAR(191) NULL,
    `planId` VARCHAR(191) NULL,
    `amountGnf` INTEGER NOT NULL,
    `method` ENUM('ORANGE_MONEY', 'MTN_MOMO') NOT NULL,
    `status` ENUM('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    `payerPhone` VARCHAR(191) NULL,
    `providerRef` VARCHAR(191) NULL,
    `failureReason` VARCHAR(191) NULL,
    `periodStart` DATETIME(3) NULL,
    `periodEnd` DATETIME(3) NULL,
    `paidAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `payments_providerRef_key`(`providerRef`),
    INDEX `payments_accountId_createdAt_idx`(`accountId`, `createdAt`),
    INDEX `payments_status_createdAt_idx`(`status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `webhook_events` (
    `id` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `externalId` VARCHAR(191) NOT NULL,
    `payload` JSON NOT NULL,
    `receivedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `processedAt` DATETIME(3) NULL,
    `error` VARCHAR(191) NULL,

    INDEX `webhook_events_processedAt_idx`(`processedAt`),
    UNIQUE INDEX `webhook_events_provider_externalId_key`(`provider`, `externalId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chat_threads` (
    `id` VARCHAR(191) NOT NULL,
    `accountId` VARCHAR(191) NOT NULL,
    `status` ENUM('OPEN', 'ESCALATED', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    `escalatedAt` DATETIME(3) NULL,
    `closedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `chat_threads_accountId_updatedAt_idx`(`accountId`, `updatedAt`),
    INDEX `chat_threads_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chat_messages` (
    `id` VARCHAR(191) NOT NULL,
    `threadId` VARCHAR(191) NOT NULL,
    `role` ENUM('USER', 'BOT', 'AGENT') NOT NULL,
    `text` VARCHAR(191) NOT NULL,
    `intentId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `chat_messages_threadId_createdAt_idx`(`threadId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `search_events` (
    `id` VARCHAR(191) NOT NULL,
    `accountId` VARCHAR(191) NULL,
    `areaId` VARCHAR(191) NULL,
    `product` ENUM('ESSENCE', 'GASOIL', 'GAZ') NOT NULL,
    `latitude` DOUBLE NOT NULL,
    `longitude` DOUBLE NOT NULL,
    `radiusKm` DOUBLE NOT NULL DEFAULT 5,
    `resultCount` INTEGER NOT NULL DEFAULT 0,
    `availableCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `search_events_createdAt_idx`(`createdAt`),
    INDEX `search_events_accountId_createdAt_idx`(`accountId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_defaultAreaId_fkey` FOREIGN KEY (`defaultAreaId`) REFERENCES `areas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `accounts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `push_tokens` ADD CONSTRAINT `push_tokens_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `accounts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stations` ADD CONSTRAINT `stations_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stations` ADD CONSTRAINT `stations_areaId_fkey` FOREIGN KEY (`areaId`) REFERENCES `areas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `station_memberships` ADD CONSTRAINT `station_memberships_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `accounts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `station_memberships` ADD CONSTRAINT `station_memberships_stationId_fkey` FOREIGN KEY (`stationId`) REFERENCES `stations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `station_products` ADD CONSTRAINT `station_products_stationId_fkey` FOREIGN KEY (`stationId`) REFERENCES `stations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `station_activities` ADD CONSTRAINT `station_activities_stationId_fkey` FOREIGN KEY (`stationId`) REFERENCES `stations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `station_activities` ADD CONSTRAINT `station_activities_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `accounts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `station_reports` ADD CONSTRAINT `station_reports_stationId_fkey` FOREIGN KEY (`stationId`) REFERENCES `stations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `station_reports` ADD CONSTRAINT `station_reports_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `accounts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `accounts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `plans`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `accounts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_subscriptionId_fkey` FOREIGN KEY (`subscriptionId`) REFERENCES `subscriptions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `plans`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chat_threads` ADD CONSTRAINT `chat_threads_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `accounts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chat_messages` ADD CONSTRAINT `chat_messages_threadId_fkey` FOREIGN KEY (`threadId`) REFERENCES `chat_threads`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `search_events` ADD CONSTRAINT `search_events_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `accounts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `search_events` ADD CONSTRAINT `search_events_areaId_fkey` FOREIGN KEY (`areaId`) REFERENCES `areas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
