-- Add min_approved_reports_for_approval setting (number of approved reports needed to become validator)
INSERT INTO `setting` (`id`, `key`, `value`, `updatedAt`) VALUES
  (CONCAT('cl', SUBSTRING(MD5(RAND()), 1, 22)), 'min_approved_reports_for_approval', '5', NOW(3))
ON DUPLICATE KEY UPDATE `value` = '5', `updatedAt` = NOW(3);
