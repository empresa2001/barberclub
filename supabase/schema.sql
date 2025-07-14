-- BarberClub Database Schema
-- Progressive Web App for Barbershops

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE user_role AS ENUM ('superadmin', 'barbershop_admin', 'barber');
CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');
CREATE TYPE day_of_week AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');
CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'delivered', 'failed');

-- Users table (for authenticated users only: superadmin, barbershop_admin, barber)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'barber',
    barbershop_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Barbershops table
CREATE TABLE barbershops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    logo_url TEXT,
    admin_user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    -- Business settings
    opening_hours JSONB, -- {"monday": {"open": "09:00", "close": "18:00"}, ...}
    timezone TEXT DEFAULT 'America/Argentina/Buenos_Aires'
);

-- Services table
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barbershop_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Barbers table
CREATE TABLE barbers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    barbershop_id UUID NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    photo_url TEXT,
    bio TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Barber availability table
CREATE TABLE availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barber_id UUID NOT NULL,
    day_of_week day_of_week NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(barber_id, day_of_week, start_time, end_time)
);

-- Appointments table
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barber_id UUID NOT NULL,
    barbershop_id UUID NOT NULL,
    service_id UUID NOT NULL,
    -- Customer info (no account required)
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    -- Appointment details
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    status appointment_status DEFAULT 'pending',
    notes TEXT,
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT
);

-- Notifications table (WhatsApp message history)
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL,
    recipient_phone TEXT NOT NULL,
    message_type TEXT NOT NULL, -- 'confirmation', 'reminder', 'cancellation', etc.
    message_body TEXT NOT NULL,
    status notification_status DEFAULT 'pending',
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Barbershop settings table
CREATE TABLE barbershop_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barbershop_id UUID NOT NULL UNIQUE,
    -- WhatsApp settings
    whatsapp_enabled BOOLEAN DEFAULT FALSE,
    whatsapp_api_key TEXT,
    whatsapp_phone_number TEXT,
    -- Appointment settings
    booking_advance_days INTEGER DEFAULT 30,
    booking_advance_hours INTEGER DEFAULT 2,
    auto_confirm_appointments BOOLEAN DEFAULT FALSE,
    -- Notification settings
    send_confirmation_sms BOOLEAN DEFAULT TRUE,
    send_reminder_sms BOOLEAN DEFAULT TRUE,
    reminder_hours_before INTEGER DEFAULT 24,
    -- Business settings
    currency TEXT DEFAULT 'ARS',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Foreign Key Constraints
ALTER TABLE users ADD CONSTRAINT fk_users_barbershop FOREIGN KEY (barbershop_id) REFERENCES barbershops(id);
ALTER TABLE barbershops ADD CONSTRAINT fk_barbershops_admin FOREIGN KEY (admin_user_id) REFERENCES users(id);
ALTER TABLE services ADD CONSTRAINT fk_services_barbershop FOREIGN KEY (barbershop_id) REFERENCES barbershops(id);
ALTER TABLE barbers ADD CONSTRAINT fk_barbers_user FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE barbers ADD CONSTRAINT fk_barbers_barbershop FOREIGN KEY (barbershop_id) REFERENCES barbershops(id);
ALTER TABLE availability ADD CONSTRAINT fk_availability_barber FOREIGN KEY (barber_id) REFERENCES barbers(id);
ALTER TABLE appointments ADD CONSTRAINT fk_appointments_barber FOREIGN KEY (barber_id) REFERENCES barbers(id);
ALTER TABLE appointments ADD CONSTRAINT fk_appointments_barbershop FOREIGN KEY (barbershop_id) REFERENCES barbershops(id);
ALTER TABLE appointments ADD CONSTRAINT fk_appointments_service FOREIGN KEY (service_id) REFERENCES services(id);
ALTER TABLE notifications ADD CONSTRAINT fk_notifications_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(id);
ALTER TABLE barbershop_settings ADD CONSTRAINT fk_settings_barbershop FOREIGN KEY (barbershop_id) REFERENCES barbershops(id);

-- Indexes for performance
CREATE INDEX idx_users_barbershop ON users(barbershop_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_barbershops_admin ON barbershops(admin_user_id);
CREATE INDEX idx_services_barbershop ON services(barbershop_id);
CREATE INDEX idx_barbers_barbershop ON barbers(barbershop_id);
CREATE INDEX idx_barbers_user ON barbers(user_id);
CREATE INDEX idx_availability_barber ON availability(barber_id);
CREATE INDEX idx_appointments_barber ON appointments(barber_id);
CREATE INDEX idx_appointments_barbershop ON appointments(barbershop_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_notifications_appointment ON notifications(appointment_id);
CREATE INDEX idx_notifications_status ON notifications(status);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_barbershops_updated_at BEFORE UPDATE ON barbershops FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_barbers_updated_at BEFORE UPDATE ON barbers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_availability_updated_at BEFORE UPDATE ON availability FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_barbershop_settings_updated_at BEFORE UPDATE ON barbershop_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for development
INSERT INTO users (id, email, role) VALUES 
    ('00000000-0000-0000-0000-000000000001', 'superadmin@barberclub.com', 'superadmin'),
    ('00000000-0000-0000-0000-000000000002', 'admin@barbershop1.com', 'barbershop_admin'),
    ('00000000-0000-0000-0000-000000000003', 'barber@barbershop1.com', 'barber');

INSERT INTO barbershops (id, name, description, address, phone, admin_user_id) VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Barbería Clásica', 'Barbería tradicional con más de 20 años de experiencia', 'Av. Corrientes 1234, Buenos Aires', '+54 11 1234-5678', '00000000-0000-0000-0000-000000000002');

UPDATE users SET barbershop_id = '00000000-0000-0000-0000-000000000001' WHERE id IN ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003');

INSERT INTO services (barbershop_id, name, description, price, duration_minutes) VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Corte Clásico', 'Corte de cabello tradicional', 2500.00, 30),
    ('00000000-0000-0000-0000-000000000001', 'Corte + Barba', 'Corte de cabello y arreglo de barba', 3500.00, 45),
    ('00000000-0000-0000-0000-000000000001', 'Afeitado Clásico', 'Afeitado con navaja y toalla caliente', 2000.00, 30);

INSERT INTO barbers (user_id, barbershop_id, name, phone) VALUES 
    ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Carlos Mendoza', '+54 11 9876-5432');

INSERT INTO availability (barber_id, day_of_week, start_time, end_time) VALUES 
    ((SELECT id FROM barbers WHERE user_id = '00000000-0000-0000-0000-000000000003'), 'monday', '09:00', '18:00'),
    ((SELECT id FROM barbers WHERE user_id = '00000000-0000-0000-0000-000000000003'), 'tuesday', '09:00', '18:00'),
    ((SELECT id FROM barbers WHERE user_id = '00000000-0000-0000-0000-000000000003'), 'wednesday', '09:00', '18:00'),
    ((SELECT id FROM barbers WHERE user_id = '00000000-0000-0000-0000-000000000003'), 'thursday', '09:00', '18:00'),
    ((SELECT id FROM barbers WHERE user_id = '00000000-0000-0000-0000-000000000003'), 'friday', '09:00', '18:00'),
    ((SELECT id FROM barbers WHERE user_id = '00000000-0000-0000-0000-000000000003'), 'saturday', '09:00', '15:00');

INSERT INTO barbershop_settings (barbershop_id) VALUES 
    ('00000000-0000-0000-0000-000000000001');
