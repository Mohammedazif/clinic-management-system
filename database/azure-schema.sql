-- Clinic Management System Database Schema for Azure MySQL
-- Run this after connecting to your Azure MySQL database

USE clinic_db;

-- Users table (for authentication)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'front_desk', 'doctor') NOT NULL DEFAULT 'front_desk',
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Doctors table
CREATE TABLE IF NOT EXISTS doctors (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    gender ENUM('male', 'female', 'other') NOT NULL,
    location VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    experience_years INT DEFAULT 0,
    consultation_duration INT DEFAULT 30,
    consultation_fee DECIMAL(10,2) DEFAULT 0.00,
    working_days JSON, -- ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    availability JSON, -- ['09:00', '10:00', '11:00', '14:00', '15:00']
    status ENUM('available', 'busy', 'offline') DEFAULT 'offline',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    date_of_birth DATE,
    gender ENUM('male', 'female', 'other'),
    address TEXT,
    emergency_contact VARCHAR(20),
    medical_history TEXT,
    allergies TEXT,
    current_medications TEXT,
    insurance_provider VARCHAR(100),
    insurance_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    patient_id VARCHAR(36),
    doctor_id VARCHAR(36),
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration INT DEFAULT 30,
    status ENUM('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show') DEFAULT 'scheduled',
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    symptoms TEXT,
    notes TEXT,
    diagnosis TEXT,
    treatment TEXT,
    prescription TEXT,
    follow_up_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL
);

-- Queue table
CREATE TABLE IF NOT EXISTS queue (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    queue_number VARCHAR(10) NOT NULL,
    patient_name VARCHAR(100) NOT NULL,
    patient_phone VARCHAR(20),
    doctor_id VARCHAR(36),
    status ENUM('waiting', 'with_doctor', 'completed', 'cancelled') DEFAULT 'waiting',
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    estimated_wait_time INT DEFAULT 15,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    called_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    notes TEXT,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL
);

-- Insert default admin user (password: password123)
INSERT INTO users (username, email, password, role, first_name, last_name) 
VALUES (
    'admin', 
    'admin@clinic.com', 
    '$2b$10$8K1p/a0dclxKoNqIfrHb2eRxmNb2OvS02Y4WksADHUpuXkKtP6LE6', -- password123
    'admin', 
    'System', 
    'Administrator'
) ON DUPLICATE KEY UPDATE username=username;

-- Insert default front desk user (password: password123)
INSERT INTO users (username, email, password, role, first_name, last_name) 
VALUES (
    'frontdesk1', 
    'frontdesk@clinic.com', 
    '$2b$10$8K1p/a0dclxKoNqIfrHb2eRxmNb2OvS02Y4WksADHUpuXkKtP6LE6', -- password123
    'front_desk', 
    'Front', 
    'Desk'
) ON DUPLICATE KEY UPDATE username=username;

-- Insert sample doctors
INSERT INTO doctors (name, specialization, gender, location, phone, email, experience_years, working_days, availability, status) 
VALUES 
(
    'Dr. John Smith', 
    'General Medicine', 
    'male', 
    'Room 101', 
    '+1234567894', 
    'dr.smith@clinic.com', 
    10,
    '["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]',
    '["09:00", "10:00", "11:00", "14:00", "15:00"]',
    'available'
),
(
    'Dr. Sarah Johnson', 
    'Cardiology', 
    'female', 
    'Room 102', 
    '+1234567895', 
    'dr.johnson@clinic.com', 
    8,
    '["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]',
    '["10:00", "11:00", "14:00", "15:00", "16:00"]',
    'available'
),
(
    'Dr. Emily Brown', 
    'Pediatrics', 
    'female', 
    'Room 103', 
    '+1234567896', 
    'dr.brown@clinic.com', 
    12,
    '["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]',
    '["09:00", "10:00", "14:00", "15:00"]',
    'available'
) ON DUPLICATE KEY UPDATE name=name;

-- Insert sample patients
INSERT INTO patients (name, phone, email, gender, address) 
VALUES 
(
    'John Doe', 
    '+1234567890', 
    'john.doe@email.com', 
    'male', 
    '123 Main St, City, State'
),
(
    'Jane Smith', 
    '+1234567891', 
    'jane.smith@email.com', 
    'female', 
    '456 Oak Ave, City, State'
),
(
    'Bob Wilson', 
    '+1234567892', 
    'bob.wilson@email.com', 
    'male', 
    '789 Pine Rd, City, State'
) ON DUPLICATE KEY UPDATE name=name;

-- Create indexes for better performance
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_queue_status ON queue(status);
CREATE INDEX idx_queue_date ON queue(added_at);
CREATE INDEX idx_doctors_status ON doctors(status);
CREATE INDEX idx_users_username ON users(username);

-- Show tables created
SHOW TABLES;

-- Display sample data
SELECT 'Users created:' as Info;
SELECT username, role, first_name, last_name FROM users;

SELECT 'Doctors created:' as Info;
SELECT name, specialization, status, location FROM doctors;

SELECT 'Patients created:' as Info;
SELECT name, phone, email FROM patients LIMIT 5;

SELECT 'Database setup completed successfully!' as Status;
