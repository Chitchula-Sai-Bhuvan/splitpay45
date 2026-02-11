-- 04_triggers.sql

DELIMITER //

-- Audit Trigger for New Expenses
DROP TRIGGER IF EXISTS trg_audit_expense_insert //
CREATE TRIGGER trg_audit_expense_insert
AFTER INSERT ON Expense
FOR EACH ROW
BEGIN
    INSERT INTO AuditLog (tableName, recordId, action, changedBy, changeDetails)
    VALUES (
        'Expense', 
        NEW.id, 
        'INSERT', 
        NEW.payerId, 
        CONCAT('Expense added to Group ', NEW.groupId, ': ', NEW.description, ' (', NEW.amount, ')')
    );
END //

-- Audit Trigger for Settlements
DROP TRIGGER IF EXISTS trg_audit_settlement //
CREATE TRIGGER trg_audit_settlement
AFTER INSERT ON Settlement
FOR EACH ROW
BEGIN
    INSERT INTO AuditLog (tableName, recordId, action, changedBy, changeDetails)
    VALUES (
        'Settlement', 
        NEW.id, 
        'INSERT', 
        NEW.payerId, 
        CONCAT('Settlement paid to User ', NEW.payeeId, ': ', NEW.amount)
    );
END //

-- Prevent Modifying Closed/Old Expenses (Example Logic)
-- For now, just a placeholder or specific rule if needed.
-- Let's add a trigger to prevent deleting a Group if it has expenses
DROP TRIGGER IF EXISTS trg_prevent_group_delete_if_expenses //
CREATE TRIGGER trg_prevent_group_delete_if_expenses
BEFORE DELETE ON `Group`
FOR EACH ROW
BEGIN
    DECLARE expense_count INT;
    SELECT COUNT(*) INTO expense_count FROM Expense WHERE groupId = OLD.id;
    
    IF expense_count > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot delete group with existing expenses';
    END IF;
END //

DELIMITER ;
