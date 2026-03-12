-- Extend invite_code with inviterId and invitedEmail (for user-created invites)
ALTER TABLE `invite_code` ADD COLUMN `inviterId` VARCHAR(191) NULL;
ALTER TABLE `invite_code` ADD COLUMN `invitedEmail` VARCHAR(191) NULL;
ALTER TABLE `invite_code` ADD INDEX `invite_code_inviterId_idx`(`inviterId`);
ALTER TABLE `invite_code` ADD CONSTRAINT `invite_code_inviterId_fkey` FOREIGN KEY (`inviterId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Drop AppInvitation (replaced by InviteCode-based flow)
DROP TABLE IF EXISTS `appInvitation`;
