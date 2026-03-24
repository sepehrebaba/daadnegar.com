-- AlterTable: active slots have replacedAt NULL
ALTER TABLE `report_validator_assignment` ADD COLUMN `replacedAt` DATETIME(3) NULL;

CREATE INDEX `report_validator_assignment_reportId_replacedAt_idx` ON `report_validator_assignment`(`reportId`, `replacedAt`);
