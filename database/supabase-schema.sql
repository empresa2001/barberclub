-- BarberClub Database Schema for Supabase (PostgreSQL)
-- This file contains the complete database structure based on the provided Prisma schema

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_types table
CREATE TABLE user_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- Insert default user types
INSERT INTO user_types (name) VALUES 
    ('superadmin'),
    ('barbershop_admin'), 
    ('barber');

-- Create barbershop_status table
CREATE TABLE barbershop_status (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- Insert default barbershop statuses
INSERT INTO barbershop_status (name) VALUES 
    ('pending'),
    ('active'),
    ('inactive');

-- Create appointment_status table
CREATE TABLE appointment_status (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- Insert default appointment statuses
INSERT INTO appointment_status (name) VALUES 
    ('pending'),
    ('confirmed'),
    ('cancelled'),
    ('completed');

-- Create barbershops table
CREATE TABLE barbershops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    owner_id UUID,
    status_id INTEGER NOT NULL DEFAULT 1,
    description TEXT DEFAULT '',
    location VARCHAR(500) NOT NULL,
    phone VARCHAR(50) DEFAULT '',
    image_url VARCHAR(500) DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (status_id) REFERENCES barbershop_status(id),
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    user_type_id INTEGER NOT NULL,
    barber_id UUID UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_type_id) REFERENCES user_types(id),
    FOREIGN KEY (barber_id) REFERENCES barbers(id) ON DELETE SET NULL
);

-- Create barbers table
CREATE TABLE barbers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL,
    barbershop_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (barbershop_id) REFERENCES barbershops(id) ON DELETE CASCADE
);

-- Create schedules table
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    from_time VARCHAR(8) NOT NULL, -- Format: "HH:MM:SS"
    to_time VARCHAR(8) NOT NULL,   -- Format: "HH:MM:SS"
    barber_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (barber_id) REFERENCES barbers(id) ON DELETE CASCADE
);

-- Create services table
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    price DECIMAL(10, 2) NOT NULL,
    duration_min INTEGER NOT NULL,
    barbershop_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (barbershop_id) REFERENCES barbershops(id) ON DELETE CASCADE
);

-- Create appointments table
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_min INTEGER NOT NULL,
    status_id INTEGER NOT NULL DEFAULT 1,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    barber_id UUID NOT NULL,
    service_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (barber_id) REFERENCES barbers(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    FOREIGN KEY (status_id) REFERENCES appointment_status(id)
);

-- Add foreign key constraints that reference users table (after users table exists)
ALTER TABLE barbershops ADD CONSTRAINT fk_barbershops_owner 
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_type ON users(user_type_id);
CREATE INDEX idx_users_barber ON users(barber_id);

CREATE INDEX idx_barbershops_owner ON barbershops(owner_id);
CREATE INDEX idx_barbershops_status ON barbershops(status_id);

CREATE INDEX idx_barbers_user ON barbers(user_id);
CREATE INDEX idx_barbers_barbershop ON barbers(barbershop_id);

CREATE INDEX idx_schedules_barber ON schedules(barber_id);
CREATE INDEX idx_schedules_day ON schedules(day_of_week);

CREATE INDEX idx_services_barbershop ON services(barbershop_id);

CREATE INDEX idx_appointments_barber ON appointments(barber_id);
CREATE INDEX idx_appointments_service ON appointments(service_id);
CREATE INDEX idx_appointments_status ON appointments(status_id);
CREATE INDEX idx_appointments_date ON appointments(date);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_barbershops_updated_at BEFORE UPDATE ON barbershops 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_barbers_updated_at BEFORE UPDATE ON barbers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbershops ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Superadmins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND user_type_id = (SELECT id FROM user_types WHERE name = 'superadmin')
        )
    );

-- Barbershops table policies
CREATE POLICY "Barbershop owners can view their barbershop" ON barbershops
    FOR SELECT USING (owner_id::text = auth.uid()::text);

CREATE POLICY "Barbers can view their barbershop" ON barbershops
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM barbers b
            JOIN users u ON b.user_id = u.id
            WHERE u.id::text = auth.uid()::text 
            AND b.barbershop_id = barbershops.id
        )
    );

CREATE POLICY "Superadmins can view all barbershops" ON barbershops
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND user_type_id = (SELECT id FROM user_types WHERE name = 'superadmin')
        )
    );

-- Barbers table policies
CREATE POLICY "Barbers can view themselves" ON barbers
    FOR SELECT USING (user_id::text = auth.uid()::text);

CREATE POLICY "Barbershop owners can view their barbers" ON barbers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM barbershops 
            WHERE id = barbers.barbershop_id 
            AND owner_id::text = auth.uid()::text
        )
    );

-- Similar policies for other tables...
-- (Additional policies would be added based on specific business requirements)

-- Create views for common queries
CREATE VIEW barber_details AS
SELECT 
    b.id as barber_id,
    u.name,
    u.email,
    b.barbershop_id,
    bs.name as barbershop_name,
    u.created_at,
    u.updated_at
FROM barbers b
JOIN users u ON b.user_id = u.id
JOIN barbershops bs ON b.barbershop_id = bs.id
WHERE bs.status_id = (SELECT id FROM barbershop_status WHERE name = 'active');

-- Sample data for development (optional)
-- Insert a superadmin user (password should be hashed in the application)
INSERT INTO users (email, password, name, user_type_id) VALUES 
    ('admin@barberclub.com', '$2b$12$placeholder_hash_change_in_app', 'Super Admin', 1);

-- Insert a sample barbershop
INSERT INTO barbershops (name, description, location, phone, owner_id) VALUES 
    ('Barbería Ejemplo', 'Una barbería de ejemplo', 'Av. Ejemplo 123, CABA', '+54 11 1234-5678', 
     (SELECT id FROM users WHERE email = 'admin@barberclub.com'));

-- Insert sample services
INSERT INTO services (name, description, price, duration_min, barbershop_id) VALUES 
    ('Corte Clásico', 'Corte tradicional con tijera y máquina', 3500.00, 30, 
     (SELECT id FROM barbershops WHERE name = 'Barbería Ejemplo')),
    ('Corte + Barba', 'Corte completo con arreglo de barba', 5500.00, 45, 
     (SELECT id FROM barbershops WHERE name = 'Barbería Ejemplo'));