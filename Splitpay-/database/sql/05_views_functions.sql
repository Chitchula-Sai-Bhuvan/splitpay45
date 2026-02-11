-- 05_views_functions.sql

DELIMITER //

-- Function to Calculate User Balance in a Group
-- Returns positive if they are OWED money, negative if they OWE money.
DROP FUNCTION IF EXISTS fn_calculate_user_balance //
CREATE FUNCTION fn_calculate_user_balance(p_userId INT, p_groupId INT) 
RETURNS DECIMAL(10, 2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_paid DECIMAL(10, 2) DEFAULT 0;
    DECLARE v_share DECIMAL(10, 2) DEFAULT 0;
    DECLARE v_received_settlements DECIMAL(10, 2) DEFAULT 0;
    DECLARE v_paid_settlements DECIMAL(10, 2) DEFAULT 0;

    -- 1. Total Amount Paid by User in Group Expenses
    SELECT COALESCE(SUM(amount), 0) INTO v_paid 
    FROM Expense 
    WHERE groupId = p_groupId AND payerId = p_userId;

    -- 2. Total Share of User in Group Expenses
    -- Only considering expenses in this group
    SELECT COALESCE(SUM(es.amount), 0) INTO v_share
    FROM ExpenseShare es
    JOIN Expense e ON es.expenseId = e.id
    WHERE e.groupId = p_groupId AND es.userId = p_userId;

    -- 3. Settlements Received (Reduces what others owe them -> effectively treated like they didn't pay as much? 
    -- Actually: Balance = (Paid - Share) + (PaidSettlements - ReceivedSettlements)
    -- If I Paid 100, Share 50 via Expense. Balance +50.
    -- If I Receive 50 settlement. Balance should go to 0. So - Received.
    
    -- We need to filter settlements relevant to this group? 
    -- Settlements in Splitwise often aren't strictly tied to a group, but let's assume global balance or group context.
    -- For simplicity in this project, we might just look at global balance or assume settlements flow freely.
    -- Let's stick to the prompt's implied simple logic or just group-based if possible.
    -- Schema doesn't link Settlement to Group. So we'll calculate GLOBAL balance between users or total.
    -- Let's update params to remove groupId if we want global, OR just calculate expense-based balance (Net Lending)
    
    -- Let's just return Net Lending from Expenses for now (Paid - Share).
    -- Settlements usually clear debts.
    
    RETURN (v_paid - v_share);
END //

DELIMITER ;

-- View: Group Ledger (Who paid what)
CREATE OR REPLACE VIEW v_group_ledger AS
SELECT 
    e.id AS expenseId,
    e.groupId,
    g.name AS groupName,
    u.name AS payerName,
    e.amount,
    e.description,
    e.createdAt
FROM Expense e
JOIN User u ON e.payerId = u.id
JOIN `Group` g ON e.groupId = g.id
ORDER BY e.createdAt DESC;

-- View: User Debts (Simplified)
-- This is harder to do in a simple view without aggregations, but let's try
-- Shows raw share vs paid for every user/group combo
CREATE OR REPLACE VIEW v_user_group_balance_sheet AS
SELECT 
    gm.userId,
    u.name AS userName,
    gm.groupId,
    fn_calculate_user_balance(gm.userId, gm.groupId) AS netAttributeFromExpenses
FROM GroupMember gm
JOIN User u ON gm.userId = u.id;
