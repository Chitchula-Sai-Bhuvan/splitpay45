-- 07_seed_data.sql

-- Call Procedures to Seed Data
-- Note: In a real script, we might need variables, but here we can just chain calls or use Hardcoded IDs if we reset auto-inc

-- 1. Create Users
CALL sp_create_user('alice@example.com', 'Alice', 'hash123', @aliceId);
CALL sp_create_user('bob@example.com', 'Bob', 'hash456', @bobId);
CALL sp_create_user('charlie@example.com', 'Charlie', 'hash789', @charlieId);
CALL sp_create_user('david@example.com', 'David', 'hash000', @davidId);

-- 2. Create Group (Alice creates 'Trip to Vegas')
CALL sp_create_group('Trip to Vegas', @aliceId, @groupId);

-- 3. Add Members
CALL sp_add_group_member(@groupId, 'bob@example.com', 'MEMBER');
CALL sp_add_group_member(@groupId, 'charlie@example.com', 'MEMBER');

-- 4. Add Expense (Alice pays 300, split equally 3 ways: 100 each)
-- JSON needs to be accurate
SET @shares = '[{"userId": 1, "amount": 100.00}, {"userId": 2, "amount": 100.00}, {"userId": 3, "amount": 100.00}]';
-- Note: In this script we assume IDs 1, 2, 3 for Alice, Bob, Charlie based on empty DB. 
-- If needed, we would use select to build JSON, but hardcoding for seed is fine if we reset DB.

CALL sp_add_expense(
    @aliceId, 
    @groupId, 
    300.00, 
    'Hotel Booking', 
    @shares, 
    @expenseId
);

-- 5. Add Expense (Bob pays 60 for Lunch, Alice and Bob split 30 each)
SET @shares2 = '[{"userId": 1, "amount": 30.00}, {"userId": 2, "amount": 30.00}]';
CALL sp_add_expense(
    @bobId, 
    @groupId, 
    60.00, 
    'Lunch', 
    @shares2, 
    @expenseId2
);

-- Check Balances (Expected)
-- Alice Paid: 300. Share: 100 (Trip) + 30 (Lunch) = 130. Balance: +170
-- Bob Paid: 60. Share: 100 (Trip) + 30 (Lunch) = 130. Balance: -70
-- Charlie Paid: 0. Share: 100 (Trip). Balance: -100

-- Total: +170 - 70 - 100 = 0. Correct.

-- Generate Settlement Plan
CALL sp_generate_settlement_plan(@groupId);
-- Implementation should show:
-- Bob pays Alice 70
-- Charlie pays Alice 100
