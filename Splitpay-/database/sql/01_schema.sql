-- 01_schema.sql
-- Schema Definition for SplitPay+

DROP TABLE IF EXISTS Settlement;
DROP TABLE IF EXISTS ExpenseShare;
DROP TABLE IF EXISTS Expense;
DROP TABLE IF EXISTS GroupMember;
DROP TABLE IF EXISTS `Group`; -- Group is a reserved keyword
DROP TABLE IF EXISTS User;
DROP TABLE IF EXISTS AuditLog;

-- Users Table
CREATE TABLE User (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255),
    passwordHash VARCHAR(255) NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Groups Table
CREATE TABLE `Group` (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    createdById INT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (createdById) REFERENCES User(id) ON DELETE CASCADE
);

-- Group Members Table - Many-to-Many relationship
CREATE TABLE GroupMember (
    id INT AUTO_INCREMENT PRIMARY KEY,
    groupId INT NOT NULL,
    userId INT NOT NULL,
    role VARCHAR(50) DEFAULT 'MEMBER', -- 'ADMIN', 'MEMBER'
    joinedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (groupId) REFERENCES `Group`(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
    UNIQUE(groupId, userId) -- Prevent duplicate membership
);

-- Expenses Table
CREATE TABLE Expense (
    id INT AUTO_INCREMENT PRIMARY KEY,
    groupId INT NOT NULL,
    payerId INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    description VARCHAR(255) NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (groupId) REFERENCES `Group`(id) ON DELETE CASCADE,
    FOREIGN KEY (payerId) REFERENCES User(id) ON DELETE CASCADE
);

-- Expense Shares Table - individual split details
CREATE TABLE ExpenseShare (
    id INT AUTO_INCREMENT PRIMARY KEY,
    expenseId INT NOT NULL,
    userId INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    FOREIGN KEY (expenseId) REFERENCES Expense(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
);

-- Settlements Table - Recording payments between users
CREATE TABLE Settlement (
    id INT AUTO_INCREMENT PRIMARY KEY,
    payerId INT NOT NULL,
    payeeId INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payerId) REFERENCES User(id) ON DELETE CASCADE,
    FOREIGN KEY (payeeId) REFERENCES User(id) ON DELETE CASCADE
);

-- Audit Log Table - For triggers
CREATE TABLE AuditLog (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tableName VARCHAR(50),
    recordId INT,
    action VARCHAR(50), -- INSERT, UPDATE, DELETE
    changedBy INT, -- Optional, if we can track who made the change
    changeDetails TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Performance
CREATE INDEX idx_user_email ON User(email);
CREATE INDEX idx_group_creator ON `Group`(createdById);
CREATE INDEX idx_expense_group ON Expense(groupId);
CREATE INDEX idx_settlement_payer ON Settlement(payerId);
