-- Seed data for the clinic front desk system
USE clinic_system;

-- Insert default front desk user (password: admin123)
-- In production, use proper password hashing
INSERT INTO users (username, password_hash, role) VALUES 
('frontdesk', '$2b$10$rQZ8kHWKQYXHZYKQYXHZYKQYXHZYKQYXHZYKQYXHZYKQYXHZYKQYXH', 'front_desk'),
('admin', '$2b$10$rQZ8kHWKQYXHZYKQYXHZYKQYXHZYKQYXHZYKQYXHZYKQYXHZYKQYXH', 'admin');

-- Insert sample doctors
INSERT INTO doctors (name, specialization, gender, location, phone, email, status) VALUES 
('Dr. John Smith', 'General Medicine', 'male', 'Room 101', '+1234567894', 'dr.smith@clinic.com', 'available'),
('Dr. Sarah Johnson', 'Cardiology', 'female', 'Room 102', '+1234567895', 'dr.johnson@clinic.com', 'busy'),
('Dr. Emily Brown', 'Pediatrics', 'female', 'Room 103', '+1234567896', 'dr.brown@clinic.com', 'available'),
('Dr. Michael Davis', 'Dermatology', 'male', 'Room 104', '+1234567897', 'dr.davis@clinic.com', 'available'),
('Dr. Lisa Wilson', 'Orthopedics', 'female', 'Room 105', '+1234567898', 'dr.wilson@clinic.com', 'offline');

-- Insert doctor availability (Monday to Friday, 9 AM to 5 PM)
INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time) VALUES 
-- Dr. Smith availability
(1, 'monday', '09:00:00', '17:00:00'),
(1, 'tuesday', '09:00:00', '17:00:00'),
(1, 'wednesday', '09:00:00', '17:00:00'),
(1, 'thursday', '09:00:00', '17:00:00'),
(1, 'friday', '09:00:00', '17:00:00'),

-- Dr. Johnson availability
(2, 'monday', '10:00:00', '16:00:00'),
(2, 'tuesday', '10:00:00', '16:00:00'),
(2, 'wednesday', '10:00:00', '16:00:00'),
(2, 'thursday', '10:00:00', '16:00:00'),
(2, 'friday', '10:00:00', '16:00:00'),

-- Dr. Brown availability
(3, 'monday', '08:00:00', '16:00:00'),
(3, 'tuesday', '08:00:00', '16:00:00'),
(3, 'wednesday', '08:00:00', '16:00:00'),
(3, 'thursday', '08:00:00', '16:00:00'),
(3, 'friday', '08:00:00', '16:00:00');

-- Insert sample patients
INSERT INTO patients (name, phone, email, date_of_birth, gender, address) VALUES 
('Alice Johnson', '+1234567892', 'alice@email.com', '1985-03-15', 'female', '123 Main St, City, State'),
('Bob Wilson', '+1234567893', 'bob@email.com', '1978-07-22', 'male', '456 Oak Ave, City, State'),
('Carol Davis', '+1234567899', 'carol@email.com', '1992-11-08', 'female', '789 Pine Rd, City, State');

-- Insert sample queue entries
INSERT INTO queue (queue_number, patient_name, patient_phone, priority, status, estimated_wait_time) VALUES 
('Q001', 'John Doe', '+1234567890', 'normal', 'waiting', 15),
('Q002', 'Jane Smith', '+1234567891', 'urgent', 'with_doctor', 5),
('Q003', 'Mike Brown', '+1234567900', 'normal', 'waiting', 30);

-- Insert sample appointments for today
INSERT INTO appointments (patient_id, patient_name, patient_phone, doctor_id, appointment_date, appointment_time, status, notes) VALUES 
(1, 'Alice Johnson', '+1234567892', 1, CURDATE(), '09:00:00', 'booked', 'Regular checkup'),
(2, 'Bob Wilson', '+1234567893', 2, CURDATE(), '10:00:00', 'completed', 'Follow-up visit'),
(3, 'Carol Davis', '+1234567899', 3, CURDATE(), '14:00:00', 'booked', 'Vaccination'),
(1, 'Alice Johnson', '+1234567892', 1, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '11:00:00', 'booked', 'Lab results review');
