-- 03_expense_procedures.sql

DELIMITER //

-- Procedure to Add Expense with Shares (JSON input)
-- Format of p_shares_json: '[{"userId": 1, "amount": 50.00}, {"userId": 2, "amount": 50.00}]'
DROP PROCEDURE IF EXISTS sp_add_expense //
CREATE PROCEDURE sp_add_expense(
    IN p_payerId INT,
    IN p_groupId INT,
    IN p_amount DECIMAL(10, 2),
    IN p_description VARCHAR(255),
    IN p_shares_json JSON,
    OUT p_expenseId INT
)
BEGIN
    DECLARE v_total_shares DECIMAL(10, 2);
    DECLARE v_share_count INT;
    DECLARE i INT DEFAULT 0;
    DECLARE v_user_id INT;
    DECLARE v_share_amount DECIMAL(10, 2);
    
    -- Error Handler for SQLEXCEPTION
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error adding expense: Transaction Rolled Back';
    END;

    -- Validate Payer is in Group
    IF (SELECT COUNT(*) FROM GroupMember WHERE groupId = p_groupId AND userId = p_payerId) = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Payer is not a member of this group';
    END IF;

    -- Validate Total Shares matches Amount
    -- JSON_TABLE is available in MySQL 8.0
    SELECT SUM(amount) INTO v_total_shares
    FROM JSON_TABLE(
        p_shares_json,
        "$[*]" COLUMNS(
            amount DECIMAL(10, 2) PATH "$.amount"
        )
    ) AS jt;

    IF ABS(v_total_shares - p_amount) > 0.01 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Sum of shares must match the total amount';
    END IF;

    START TRANSACTION;

    -- Insert Expense
    INSERT INTO Expense (groupId, payerId, amount, description) 
    VALUES (p_groupId, p_payerId, p_amount, p_description);
    
    SET p_expenseId = LAST_INSERT_ID();

    -- Insert Shares using JSON_TABLE or Loop
    -- Doing Loop to be safe or JSON_TABLE insert select
    INSERT INTO ExpenseShare (expenseId, userId, amount)
    SELECT p_expenseId, userId, amount
    FROM JSON_TABLE(
        p_shares_json,
        "$[*]" COLUMNS(
            userId INT PATH "$.userId",
            amount DECIMAL(10, 2) PATH "$.amount"
        )
    ) AS jt;

    COMMIT;
END //

-- Procedure to Record Settlement
DROP PROCEDURE IF EXISTS sp_settle_expense //
CREATE PROCEDURE sp_settle_expense(
    IN p_payerId INT,
    IN p_payeeId INT,
    IN p_amount DECIMAL(10, 2)
)
BEGIN
    IF p_amount <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Settlement amount must be positive';
    END IF;
    
    INSERT INTO Settlement (payerId, payeeId, amount) 
    VALUES (p_payerId, p_payeeId, p_amount);
END //

DELIMITER ;
