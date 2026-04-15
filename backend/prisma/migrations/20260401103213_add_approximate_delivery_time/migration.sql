/*
  Warnings:

  - You are about to drop the column `actionButton` on the `notificationtemplate` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `notificationtemplate` table. All the data in the column will be lost.
  - You are about to drop the column `lastUsed` on the `notificationtemplate` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `notificationtemplate` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `NotificationTemplate` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `delivery` ADD COLUMN `approximateDeliveryTime` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `notificationtemplate` DROP COLUMN `actionButton`,
    DROP COLUMN `category`,
    DROP COLUMN `lastUsed`,
    DROP COLUMN `title`,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `subject` VARCHAR(191) NULL,
    ADD COLUMN `type` VARCHAR(191) NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- CreateTable
CREATE TABLE `EmailLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orderId` INTEGER NULL,
    `email` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `error` TEXT NULL,
    `sentAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
