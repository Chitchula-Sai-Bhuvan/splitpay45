-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Group` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `createdById` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `isFrozen` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GroupMember` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `groupId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `role` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `GroupMember_groupId_userId_key`(`groupId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Expense` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `groupId` INTEGER NOT NULL,
    `payerId` INTEGER NOT NULL,
    `amount` DECIMAL(65, 30) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExpenseShare` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `expenseId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `amount` DECIMAL(65, 30) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Settlement` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `payerId` INTEGER NOT NULL,
    `payeeId` INTEGER NOT NULL,
    `amount` DECIMAL(65, 30) NOT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DebtLedger` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `expenseId` INTEGER NULL,
    `groupId` INTEGER NOT NULL,
    `payerId` INTEGER NOT NULL,
    `payeeId` INTEGER NOT NULL,
    `amount` DECIMAL(65, 30) NOT NULL,
    `isSettled` BOOLEAN NOT NULL DEFAULT false,
    `transactionDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `DebtLedger_payerId_idx`(`payerId`),
    INDEX `DebtLedger_payeeId_idx`(`payeeId`),
    INDEX `DebtLedger_groupId_idx`(`groupId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Group` ADD CONSTRAINT `Group_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GroupMember` ADD CONSTRAINT `GroupMember_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `Group`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GroupMember` ADD CONSTRAINT `GroupMember_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Expense` ADD CONSTRAINT `Expense_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `Group`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Expense` ADD CONSTRAINT `Expense_payerId_fkey` FOREIGN KEY (`payerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExpenseShare` ADD CONSTRAINT `ExpenseShare_expenseId_fkey` FOREIGN KEY (`expenseId`) REFERENCES `Expense`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExpenseShare` ADD CONSTRAINT `ExpenseShare_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Settlement` ADD CONSTRAINT `Settlement_payerId_fkey` FOREIGN KEY (`payerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Settlement` ADD CONSTRAINT `Settlement_payeeId_fkey` FOREIGN KEY (`payeeId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DebtLedger` ADD CONSTRAINT `DebtLedger_expenseId_fkey` FOREIGN KEY (`expenseId`) REFERENCES `Expense`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DebtLedger` ADD CONSTRAINT `DebtLedger_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `Group`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DebtLedger` ADD CONSTRAINT `DebtLedger_payerId_fkey` FOREIGN KEY (`payerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DebtLedger` ADD CONSTRAINT `DebtLedger_payeeId_fkey` FOREIGN KEY (`payeeId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
