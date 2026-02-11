-- 08_global_settlement_schema.sql
-- Schema for Global Expense Settlement Engine (Double-Entry Ledger)

-- 1. Metadata Tables
CREATE TABLE IF NOT EXISTS Users (
    user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Groups (
    group_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_by BIGINT NOT NULL,
    is_frozen BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES Users(user_id)
);

-- 2. Expense Header (The "Event")
CREATE TABLE IF NOT EXISTS Expenses (
    expense_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    group_id BIGINT NOT NULL,
    created_by BIGINT NOT NULL,
    description VARCHAR(255) NOT NULL,
    total_amount DECIMAL(19, 4) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES Groups(group_id),
    FOREIGN KEY (created_by) REFERENCES Users(user_id)
);

-- 3. The Debt Ledger (Core Logic)
-- Records every atomic "I owe you" transaction.
-- A single expense of 100 paid by A for A, B split equally results in:
--   - B owes A: 50
CREATE TABLE IF NOT EXISTS DebtLedger (
    ledger_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    expense_id BIGINT,      -- Nullable for direct settlements
    group_id BIGINT,        -- Context of the debt
    payer_id BIGINT NOT NULL, -- The one who OWES (Debtor - B)
    payee_id BIGINT NOT NULL, -- The one who IS OWED (Creditor - A)
    amount DECIMAL(19, 4) NOT NULL CHECK (amount > 0),
    is_settled BOOLEAN DEFAULT FALSE,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (expense_id) REFERENCES Expenses(expense_id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES Groups(group_id) ON DELETE CASCADE,
    FOREIGN KEY (payer_id) REFERENCES Users(user_id),
    FOREIGN KEY (payee_id) REFERENCES Users(user_id),
    
    -- Constraint: You can't owe yourself in the ledger
    CHECK (payer_id <> payee_id)
);

-- 4. Settlements (Physical Transactions)
CREATE TABLE IF NOT EXISTS Settlements (
    settlement_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    payer_id BIGINT NOT NULL, -- The one PAYING (clearing debt)
    payee_id BIGINT NOT NULL, -- The one RECEIVING
    amount DECIMAL(19, 4) NOT NULL CHECK (amount > 0),
    group_id BIGINT,          -- Optional: If settling specific group debt
    reference_id VARCHAR(100), -- Transaction ID (UPI/Bank)
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (payer_id) REFERENCES Users(user_id),
    FOREIGN KEY (payee_id) REFERENCES Users(user_id),
    FOREIGN KEY (group_id) REFERENCES Groups(group_id)
);

-- Indexes for high-performance querying
CREATE INDEX idx_ledger_payer ON DebtLedger(payer_id);
CREATE INDEX idx_ledger_payee ON DebtLedger(payee_id);
CREATE INDEX idx_ledger_group ON DebtLedger(group_id);
CREATE INDEX idx_ledger_composite ON DebtLedger(group_id, payer_id, is_settled);
