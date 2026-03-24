-- AlterTable
ALTER TABLE `report` ADD COLUMN `assignedAt` DATETIME(3) NULL;

-- Backfill: treat last update as assignment time when already assigned
UPDATE `report` SET `assignedAt` = `updatedAt` WHERE `assignedTo` IS NOT NULL AND `assignedAt` IS NULL;

-- CreateTable
CREATE TABLE `report_validator_assignment` (
    `id` VARCHAR(191) NOT NULL,
    `reportId` VARCHAR(191) NOT NULL,
    `validatorId` VARCHAR(191) NOT NULL,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reason` VARCHAR(191) NOT NULL DEFAULT 'initial',

    INDEX `report_validator_assignment_reportId_idx`(`reportId`),
    INDEX `report_validator_assignment_validatorId_idx`(`validatorId`),
    INDEX `report_validator_assignment_assignedAt_idx`(`assignedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `report_validator_assignment` ADD CONSTRAINT `report_validator_assignment_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `report`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_validator_assignment` ADD CONSTRAINT `report_validator_assignment_validatorId_fkey` FOREIGN KEY (`validatorId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill history rows for existing assignments (one synthetic id per report)
INSERT INTO `report_validator_assignment` (`id`, `reportId`, `validatorId`, `assignedAt`, `reason`)
SELECT CONCAT('rvah_', `id`), `id`, `assignedTo`, COALESCE(`assignedAt`, `updatedAt`), 'initial'
FROM `report`
WHERE `assignedTo` IS NOT NULL;
