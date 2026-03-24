-- AlterTable
ALTER TABLE `invite_code` ADD COLUMN `assignedRole` VARCHAR(191) NOT NULL DEFAULT 'user';
