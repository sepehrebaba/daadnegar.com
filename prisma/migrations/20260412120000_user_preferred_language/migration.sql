-- User UI language preference
ALTER TABLE `User` ADD COLUMN `preferredLanguage` VARCHAR(191) NOT NULL DEFAULT 'fa';
