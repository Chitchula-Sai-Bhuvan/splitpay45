-- 06_settlement_logic.sql

DELIMITER //

-- Procedure to Generate Simplified Debt Settlement Plan
-- Uses Cursors to match debtors and creditors
DROP PROCEDURE IF EXISTS sp_generate_settlement_plan //
CREATE PROCEDURE sp_generate_settlement_plan(IN p_groupId INT)
BEGIN
    -- Temp tables for calculation
    DROP TEMPORARY TABLE IF EXISTS TempBalances;
    CREATE TEMPORARY TABLE TempBalances (
        userId INT,
        balance DECIMAL(10, 2)
    );

    DROP TEMPORARY TABLE IF EXISTS SuggestedSettlements;
    CREATE TEMPORARY TABLE SuggestedSettlements (
        payerId INT,
        payeeId INT,
        amount DECIMAL(10, 2)
    );

    -- Calculate Balances for all members
    INSERT INTO TempBalances (userId, balance)
    SELECT 
        gm.userId,
        fn_calculate_user_balance(gm.userId, p_groupId)
    FROM GroupMember gm
    WHERE gm.groupId = p_groupId;

    -- Block to handle the matching logic using Cursors
    BEGIN
        DECLARE done INT DEFAULT 0;
        
        -- Debtors: People with negative balance (They OWE)
        DECLARE v_debtor_id INT;
        DECLARE v_debt_amount DECIMAL(10, 2);
        
        -- Creditors: People with positive balance (They are OWED)
        DECLARE v_creditor_id INT;
        DECLARE v_credit_amount DECIMAL(10, 2);
        
        -- Cursors
        DECLARE cur_debtors CURSOR FOR 
            SELECT userId, ABS(balance) FROM TempBalances WHERE balance < 0 ORDER BY balance ASC;
            
        DECLARE cur_creditors CURSOR FOR 
            SELECT userId, balance FROM TempBalances WHERE balance > 0 ORDER BY balance DESC;
            
        DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

        OPEN cur_debtors;
        OPEN cur_creditors;

        -- Fetch first debtor and creditor
        FETCH cur_debtors INTO v_debtor_id, v_debt_amount;
        FETCH cur_creditors INTO v_creditor_id, v_credit_amount;

        settle_loop: LOOP
            IF done THEN 
                LEAVE settle_loop;
            END IF;
            
            -- If we ran out of debtors or creditors (should balance to 0 ideally, but safety check)
            IF v_debtor_id IS NULL OR v_creditor_id IS NULL THEN
                LEAVE settle_loop;
            END IF;

            -- Match them
            IF v_debt_amount <= v_credit_amount THEN
                -- Debtor pays off full debt to this creditor
                INSERT INTO SuggestedSettlements VALUES (v_debtor_id, v_creditor_id, v_debt_amount);
                
                -- Update creditor remaining
                SET v_credit_amount = v_credit_amount - v_debt_amount;
                SET v_debt_amount = 0; -- Fully paid
                
                -- Move to next debtor
                FETCH cur_debtors INTO v_debtor_id, v_debt_amount;
            ELSE
                -- Debtor pays partial debt (exhausts this creditor)
                INSERT INTO SuggestedSettlements VALUES (v_debtor_id, v_creditor_id, v_credit_amount);
                
                -- Update debtor remaining
                SET v_debt_amount = v_debt_amount - v_credit_amount;
                SET v_credit_amount = 0; -- Fully paid
                
                -- Move to next creditor
                FETCH cur_creditors INTO v_creditor_id, v_credit_amount;
            END IF;
            
        END LOOP;

        CLOSE cur_debtors;
        CLOSE cur_creditors;
    END;

    -- Return the plan
    SELECT * FROM SuggestedSettlements;
END //

DELIMITER ;
