-- Rename invite column
ALTER TABLE `invite_code` CHANGE `invitedEmail` `invitedUsername` VARCHAR(191) NULL;

-- Old personal invites stored an email; keep as username-like local part
UPDATE `invite_code`
SET `invitedUsername` = LOWER(REPLACE(SUBSTRING_INDEX(`invitedUsername`, '@', 1), '.', '_'))
WHERE `invitedUsername` LIKE '%@%';

-- Add username (nullable first for backfill)
ALTER TABLE `User` ADD COLUMN `username` VARCHAR(191) NULL;

-- Users tied to invite_session + invite_code → dn_<lowercase code>
UPDATE `User` u
INNER JOIN `invite_session` s ON s.userId = u.id
INNER JOIN `invite_code` c ON c.id = s.inviteCodeId
SET u.username = CONCAT('dn_', LOWER(c.code))
WHERE u.username IS NULL AND u.email LIKE '%@daadnegar.local';

-- Remaining @daadnegar.local (no session join)
UPDATE `User`
SET `username` = CONCAT('u_', REPLACE(SUBSTRING(`id`, 1, 18), '-', ''))
WHERE `username` IS NULL AND `email` LIKE '%@daadnegar.local';

-- Internal domain users: local part is the username
UPDATE `User`
SET `username` = LOWER(SUBSTRING_INDEX(`email`, '@', 1))
WHERE `username` IS NULL AND `email` LIKE '%@u.daadnegar.internal';

-- Everyone else: local part of email, dots → underscores
UPDATE `User`
SET `username` = LOWER(REPLACE(SUBSTRING_INDEX(`email`, '@', 1), '.', '_'))
WHERE `username` IS NULL;

-- Resolve duplicate usernames (keep oldest row per username)
UPDATE `User` u
INNER JOIN (
  SELECT `id`, `username`,
    ROW_NUMBER() OVER (PARTITION BY `username` ORDER BY `createdAt`) AS rn
  FROM `User`
) x ON u.id = x.id
SET u.username = CONCAT(x.username, '_', SUBSTRING(u.id, 1, 8))
WHERE x.rn > 1;

ALTER TABLE `User` ADD UNIQUE INDEX `User_username_key`(`username`);
