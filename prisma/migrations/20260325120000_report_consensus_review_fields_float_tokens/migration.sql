-- AlterTable
ALTER TABLE `report` ADD COLUMN `rejectionCode` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `report_review` ADD COLUMN `rejectionTier` VARCHAR(191) NULL,
    ADD COLUMN `rejectionCode` VARCHAR(191) NULL,
    ADD COLUMN `reviewerComment` TEXT NULL;

-- AlterTable (اعشار برای پاداش ۱.۵ توکن)
ALTER TABLE `User` MODIFY `tokenBalance` DOUBLE NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `token_transaction` MODIFY `amount` DOUBLE NOT NULL;
