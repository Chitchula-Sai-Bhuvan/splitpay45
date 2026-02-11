-- 02_user_group_procedures.sql

DELIMITER //

-- Procedure to Create a New User
DROP PROCEDURE IF EXISTS sp_create_user //
CREATE PROCEDURE sp_create_user(
    IN p_email VARCHAR(255),
    IN p_name VARCHAR(255),
    IN p_passwordHash VARCHAR(255),
    OUT p_userId INT
)
BEGIN
    DECLARE email_exists INT DEFAULT 0;
    
    -- basic validation
    IF p_email IS NULL OR p_email = '' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Email cannot be empty';
    END IF;

    -- Check if email already exists
    SELECT COUNT(*) INTO email_exists FROM User WHERE email = p_email;
    IF email_exists > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Email already registered';
    END IF;

    -- Insert User
    INSERT INTO User (email, name, passwordHash) VALUES (p_email, p_name, p_passwordHash);
    
    -- Return the new ID
    SET p_userId = LAST_INSERT_ID();
END //

-- Procedure to Create a Group
DROP PROCEDURE IF EXISTS sp_create_group //
CREATE PROCEDURE sp_create_group(
    IN p_name VARCHAR(255),
    IN p_createdById INT,
    OUT p_groupId INT
)
BEGIN
    DECLARE user_exists INT DEFAULT 0;

    -- Validate user exists
    SELECT COUNT(*) INTO user_exists FROM User WHERE id = p_createdById;
    IF user_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Creator User ID does not exist';
    END IF;

    -- Start Transaction
    START TRANSACTION;

    -- Insert Group
    INSERT INTO `Group` (name, createdById) VALUES (p_name, p_createdById);
    SET p_groupId = LAST_INSERT_ID();

    -- Add Creator as ADMIN member (Automatic)
    INSERT INTO GroupMember (groupId, userId, role) VALUES (p_groupId, p_createdById, 'ADMIN');

    COMMIT;
END //

-- Procedure to Add Member to Group
DROP PROCEDURE IF EXISTS sp_add_group_member //
CREATE PROCEDURE sp_add_group_member(
    IN p_groupId INT,
    IN p_email VARCHAR(255), -- We add by email often
    IN p_role VARCHAR(50)
)
BEGIN
    DECLARE v_userId INT;
    DECLARE already_member INT DEFAULT 0;

    -- Find User ID from Email
    SELECT id INTO v_userId FROM User WHERE email = p_email;
    
    IF v_userId IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'User with this email not found';
    END IF;

    -- Check if already member
    SELECT COUNT(*) INTO already_member FROM GroupMember WHERE groupId = p_groupId AND userId = v_userId;
    
    IF already_member > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'User is already a member of this group';
    END IF;

    -- Insert
    INSERT INTO GroupMember (groupId, userId, role) VALUES (p_groupId, v_userId, IFNULL(p_role, 'MEMBER'));
    
END //

DELIMITER ;
