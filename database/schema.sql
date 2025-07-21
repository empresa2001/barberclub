-- BarberClub Database Schema for MySQL
-- This file contains the complete database structure for the BarberClub application

-- Create the database
CREATE DATABASE IF NOT EXISTS barberclub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE barberclub;

-- Table: users (for authentication and user management)
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('superadmin', 'barbershop_admin', 'barber') NOT NULL,
    barbershop_id VARCHAR(36) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_barbershop_id (barbershop_id)
);

-- Table: barbershops
CREATE TABLE barbershops (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    status ENUM('active', 'pending', 'suspended') DEFAULT 'pending',
    admin_name VARCHAR(255) NOT NULL,
    admin_email VARCHAR(255) NOT NULL,
    logo_url VARCHAR(500) NULL,
    description TEXT NULL,
    opening_hours JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_status (status),
    INDEX idx_email (email),
    INDEX idx_admin_email (admin_email)
);

-- Table: barbers
CREATE TABLE barbers (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50) NOT NULL,
    barbershop_id VARCHAR(36) NOT NULL,
    specialties JSON NULL, -- Array of specialties
    avatar_url VARCHAR(500) NULL,
    bio TEXT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (barbershop_id) REFERENCES barbershops(id) ON DELETE CASCADE,
    INDEX idx_barbershop_id (barbershop_id),
    INDEX idx_email (email),
    INDEX idx_active (is_active)
);

-- Table: services
CREATE TABLE services (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    price DECIMAL(10, 2) NOT NULL,
    duration INT NOT NULL, -- Duration in minutes
    barbershop_id VARCHAR(36) NOT NULL,
    category VARCHAR(100) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (barbershop_id) REFERENCES barbershops(id) ON DELETE CASCADE,
    INDEX idx_barbershop_id (barbershop_id),
    INDEX idx_category (category),
    INDEX idx_active (is_active)
);

-- Table: appointments
CREATE TABLE appointments (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    customer_email VARCHAR(255) NULL,
    barbershop_id VARCHAR(36) NOT NULL,
    barber_id VARCHAR(36) NOT NULL,
    service_id VARCHAR(36) NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status ENUM('pending', 'confirmed', 'completed', 'cancelled', 'no_show') DEFAULT 'pending',
    notes TEXT NULL,
    total_price DECIMAL(10, 2) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (barbershop_id) REFERENCES barbershops(id) ON DELETE CASCADE,
    FOREIGN KEY (barber_id) REFERENCES barbers(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    
    INDEX idx_barbershop_id (barbershop_id),
    INDEX idx_barber_id (barber_id),
    INDEX idx_appointment_date (appointment_date),
    INDEX idx_status (status),
    INDEX idx_customer_phone (customer_phone),
    
    -- Unique constraint to prevent double booking
    UNIQUE KEY unique_appointment (barber_id, appointment_date, appointment_time)
);

-- Table: notifications (for WhatsApp and other notifications)
CREATE TABLE notifications (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    barbershop_id VARCHAR(36) NOT NULL,
    appointment_id VARCHAR(36) NULL,
    type ENUM('whatsapp', 'email', 'sms') NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('pending', 'sent', 'delivered', 'failed') DEFAULT 'pending',
    sent_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    error_message TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (barbershop_id) REFERENCES barbershops(id) ON DELETE CASCADE,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
    
    INDEX idx_barbershop_id (barbershop_id),
    INDEX idx_appointment_id (appointment_id),
    INDEX idx_type (type),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- Table: working_hours (barber availability)
CREATE TABLE working_hours (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    barber_id VARCHAR(36) NOT NULL,
    day_of_week TINYINT NOT NULL, -- 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (barber_id) REFERENCES barbers(id) ON DELETE CASCADE,
    
    INDEX idx_barber_id (barber_id),
    INDEX idx_day_of_week (day_of_week),
    
    -- Unique constraint to prevent overlapping schedules
    UNIQUE KEY unique_barber_day (barber_id, day_of_week, start_time, end_time)
);

-- Table: blocked_times (for barber unavailability)
CREATE TABLE blocked_times (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    barber_id VARCHAR(36) NOT NULL,
    start_datetime DATETIME NOT NULL,
    end_datetime DATETIME NOT NULL,
    reason VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (barber_id) REFERENCES barbers(id) ON DELETE CASCADE,
    
    INDEX idx_barber_id (barber_id),
    INDEX idx_start_datetime (start_datetime),
    INDEX idx_end_datetime (end_datetime)
);

-- Add foreign key constraint for users.barbershop_id
ALTER TABLE users ADD CONSTRAINT fk_users_barbershop_id 
    FOREIGN KEY (barbershop_id) REFERENCES barbershops(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX idx_appointments_datetime ON appointments(appointment_date, appointment_time);
CREATE INDEX idx_appointments_customer ON appointments(customer_phone, customer_email);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Create views for common queries
CREATE VIEW active_barbershops AS
SELECT 
    b.*,
    (SELECT COUNT(*) FROM barbers WHERE barbershop_id = b.id AND is_active = TRUE) as total_barbers,
    (SELECT COUNT(*) FROM appointments WHERE barbershop_id = b.id) as total_appointments,
    (SELECT COALESCE(SUM(total_price), 0) FROM appointments 
     WHERE barbershop_id = b.id 
     AND status = 'completed' 
     AND appointment_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)) as monthly_revenue
FROM barbershops b
WHERE b.status = 'active';

-- Create view for barber schedules
CREATE VIEW barber_schedules AS
SELECT 
    b.id as barber_id,
    b.name as barber_name,
    b.barbershop_id,
    wh.day_of_week,
    wh.start_time,
    wh.end_time,
    wh.is_active
FROM barbers b
LEFT JOIN working_hours wh ON b.id = wh.barber_id
WHERE b.is_active = TRUE;

-- Insert default superadmin user (password should be hashed in the application)
-- Default password will be 'admin123' (should be changed immediately)
INSERT INTO users (email, password_hash, role) VALUES 
('admin@barberclub.com', '$2b$12$placeholder_hash_change_in_app', 'superadmin');

-- Insert sample data for development (optional)
-- This can be removed in production

-- Sample barbershop
INSERT INTO barbershops (name, email, phone, address, status, admin_name, admin_email) VALUES 
('Barbería Clásica Premium', 'info@barberiaclasica.com', '+54 11 4567-8901', 'Av. Corrientes 1234, CABA', 'active', 'Carlos Martínez', 'carlos@barberiaclasica.com');

-- Get the barbershop ID for sample data
SET @barbershop_id = (SELECT id FROM barbershops WHERE email = 'info@barberiaclasica.com');

-- Sample barbershop admin user
INSERT INTO users (email, password_hash, role, barbershop_id) VALUES 
('carlos@barberiaclasica.com', '$2b$12$placeholder_hash_change_in_app', 'barbershop_admin', @barbershop_id);

-- Sample barber
INSERT INTO barbers (name, email, phone, barbershop_id, specialties) VALUES 
('Juan Pérez', 'juan@barberiaclasica.com', '+54 11 1234-5678', @barbershop_id, '["Corte clásico", "Barba", "Bigote"]');

-- Get the barber ID for sample data
SET @barber_id = (SELECT id FROM barbers WHERE email = 'juan@barberiaclasica.com');

-- Sample barber user
INSERT INTO users (email, password_hash, role, barbershop_id) VALUES 
('juan@barberiaclasica.com', '$2b$12$placeholder_hash_change_in_app', 'barber', @barbershop_id);

-- Sample services
INSERT INTO services (name, description, price, duration, barbershop_id) VALUES 
('Corte Clásico', 'Corte de cabello tradicional con tijera y máquina', 3500.00, 30, @barbershop_id),
('Corte + Barba', 'Corte de cabello completo con arreglo de barba', 5500.00, 45, @barbershop_id),
('Afeitado Clásico', 'Afeitado tradicional con navaja y toalla caliente', 4000.00, 25, @barbershop_id);

-- Sample working hours (Monday to Friday, 9 AM to 6 PM)
INSERT INTO working_hours (barber_id, day_of_week, start_time, end_time) VALUES 
(@barber_id, 1, '09:00:00', '18:00:00'), -- Monday
(@barber_id, 2, '09:00:00', '18:00:00'), -- Tuesday
(@barber_id, 3, '09:00:00', '18:00:00'), -- Wednesday
(@barber_id, 4, '09:00:00', '18:00:00'), -- Thursday
(@barber_id, 5, '09:00:00', '18:00:00'), -- Friday
(@barber_id, 6, '09:00:00', '15:00:00'); -- Saturday

-- Sample appointment
INSERT INTO appointments (customer_name, customer_phone, barbershop_id, barber_id, service_id, appointment_date, appointment_time, status, total_price)
SELECT 
    'Cliente Ejemplo',
    '+54 11 9876-5432',
    @barbershop_id,
    @barber_id,
    s.id,
    CURDATE() + INTERVAL 1 DAY,
    '10:00:00',
    'confirmed',
    s.price
FROM services s 
WHERE s.barbershop_id = @barbershop_id 
AND s.name = 'Corte Clásico'
LIMIT 1;
