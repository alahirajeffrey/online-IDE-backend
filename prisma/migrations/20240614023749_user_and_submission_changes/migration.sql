/*
  Warnings:

  - You are about to drop the column `status` on the `Submission` table. All the data in the column will be lost.
  - Made the column `result` on table `Submission` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `Submission` DROP COLUMN `status`,
    ADD COLUMN `submissionToken` VARCHAR(191) NOT NULL DEFAULT '',
    MODIFY `result` ENUM('PASSED', 'FAILED') NOT NULL;

-- AlterTable
ALTER TABLE `User` MODIFY `profileImage` VARCHAR(191) NULL;
