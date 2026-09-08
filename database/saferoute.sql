CREATE DATABASE IF NOT EXISTS saferoute;

USE saferoute;

-- =========================================================
-- 1. USERS
-- =========================================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;


-- =========================================================
-- 2. USER PROFILES
-- =========================================================
CREATE TABLE IF NOT EXISTS user_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    age INT,
    gender VARCHAR(30),
    address VARCHAR(255),
    profile_photo VARCHAR(255),
    safety_preferences TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_profile_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;


-- =========================================================
-- 3. EMERGENCY CONTACTS
-- =========================================================
CREATE TABLE IF NOT EXISTS emergency_contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    contact_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    relationship VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_contact_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;


-- =========================================================
-- 4. INCIDENTS
-- =========================================================
CREATE TABLE IF NOT EXISTS incidents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category VARCHAR(100) NOT NULL,
    severity ENUM('low', 'medium', 'high') NOT NULL,
    description TEXT NOT NULL,
    latitude DECIMAL(10,7) NOT NULL,
    longitude DECIMAL(10,7) NOT NULL,
    address VARCHAR(255),
    image_path VARCHAR(255),
    status ENUM('pending', 'verified', 'rejected')
        NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_incident_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    INDEX idx_incident_location (latitude, longitude),
    INDEX idx_incident_status (status),
    INDEX idx_incident_severity (severity)
) ENGINE=InnoDB;


-- =========================================================
-- 5. EMERGENCY SERVICES
-- =========================================================
CREATE TABLE IF NOT EXISTS emergency_services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    type ENUM('police', 'hospital', 'fire_station') NOT NULL,
    phone VARCHAR(20),
    latitude DECIMAL(10,7) NOT NULL,
    longitude DECIMAL(10,7) NOT NULL,
    address VARCHAR(255),
    availability ENUM('available', 'unavailable')
        NOT NULL DEFAULT 'available',

    INDEX idx_service_location (latitude, longitude),
    INDEX idx_service_type (type)
) ENGINE=InnoDB;


-- =========================================================
-- 6. SOS REQUESTS
-- =========================================================
CREATE TABLE IF NOT EXISTS sos_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    emergency_type VARCHAR(100) NOT NULL,
    message TEXT,
    latitude DECIMAL(10,7) NOT NULL,
    longitude DECIMAL(10,7) NOT NULL,
    status ENUM(
        'pending',
        'responding',
        'resolved',
        'cancelled'
    ) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,

    CONSTRAINT fk_sos_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    INDEX idx_sos_status (status),
    INDEX idx_sos_location (latitude, longitude)
) ENGINE=InnoDB;


-- =========================================================
-- 7. RISK ZONES
-- =========================================================
CREATE TABLE IF NOT EXISTS risk_zones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    area_name VARCHAR(150) NOT NULL,
    latitude DECIMAL(10,7) NOT NULL,
    longitude DECIMAL(10,7) NOT NULL,
    radius INT NOT NULL,
    risk_level ENUM('low', 'medium', 'high') NOT NULL,
    safety_score INT NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT chk_safety_score
        CHECK (safety_score BETWEEN 0 AND 100),

    INDEX idx_risk_location (latitude, longitude),
    INDEX idx_risk_level (risk_level)
) ENGINE=InnoDB;


-- =========================================================
-- SAMPLE EMERGENCY SERVICES
-- =========================================================
INSERT INTO emergency_services
(name, type, phone, latitude, longitude, address, availability)
VALUES
('Central Police Station', 'police', '100',
 19.0760, 72.8777, 'Central Mumbai', 'available'),

('City General Hospital', 'hospital', '108',
 19.0820, 72.8890, 'Mumbai Central', 'available'),

('Central Fire Station', 'fire_station', '101',
 19.0650, 72.8820, 'South Mumbai', 'available');


-- =========================================================
-- SAMPLE RISK ZONES
-- =========================================================
INSERT INTO risk_zones
(area_name, latitude, longitude, radius, risk_level, safety_score)
VALUES
('Zone A', 19.0780, 72.8790, 500, 'low', 88),

('Zone B', 19.0850, 72.8920, 700, 'medium', 67),

('Zone C', 19.0700, 72.9000, 600, 'high', 42);
