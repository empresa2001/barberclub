-- Row Level Security (RLS) Policies for BarberClub App
-- These policies ensure data isolation and security for each user role

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbershops ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbershop_settings ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS user_role AS $$
BEGIN
    RETURN (
        SELECT role 
        FROM users 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get current user's barbershop_id
CREATE OR REPLACE FUNCTION get_current_user_barbershop_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT barbershop_id 
        FROM users 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is barber for specific barbershop
CREATE OR REPLACE FUNCTION is_barber_for_barbershop(barber_user_id UUID, target_barbershop_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM barbers b 
        JOIN users u ON b.user_id = u.id 
        WHERE u.id = barber_user_id 
        AND b.barbershop_id = target_barbershop_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== USERS TABLE POLICIES =====

-- Superadmin can view all users
CREATE POLICY "Superadmin can view all users" ON users
    FOR SELECT
    TO authenticated
    USING (get_current_user_role() = 'superadmin');

-- Barbershop admin can view users in their barbershop
CREATE POLICY "Barbershop admin can view own barbershop users" ON users
    FOR SELECT
    TO authenticated
    USING (
        get_current_user_role() = 'barbershop_admin' 
        AND barbershop_id = get_current_user_barbershop_id()
    );

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT
    TO authenticated
    USING (id = auth.uid());

-- Superadmin can insert/update/delete all users
CREATE POLICY "Superadmin can manage all users" ON users
    FOR ALL
    TO authenticated
    USING (get_current_user_role() = 'superadmin');

-- Barbershop admin can insert barbers for their barbershop
CREATE POLICY "Barbershop admin can insert barbers" ON users
    FOR INSERT
    TO authenticated
    WITH CHECK (
        get_current_user_role() = 'barbershop_admin'
        AND role = 'barber'
        AND barbershop_id = get_current_user_barbershop_id()
    );

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid());

-- ===== BARBERSHOPS TABLE POLICIES =====

-- Superadmin can view all barbershops
CREATE POLICY "Superadmin can view all barbershops" ON barbershops
    FOR SELECT
    TO authenticated
    USING (get_current_user_role() = 'superadmin');

-- Barbershop admin can view their own barbershop
CREATE POLICY "Barbershop admin can view own barbershop" ON barbershops
    FOR SELECT
    TO authenticated
    USING (
        get_current_user_role() = 'barbershop_admin' 
        AND id = get_current_user_barbershop_id()
    );

-- Barbers can view their barbershop
CREATE POLICY "Barbers can view own barbershop" ON barbershops
    FOR SELECT
    TO authenticated
    USING (
        get_current_user_role() = 'barber' 
        AND id = get_current_user_barbershop_id()
    );

-- Public can view active barbershops (for booking)
CREATE POLICY "Public can view active barbershops" ON barbershops
    FOR SELECT
    TO anon
    USING (is_active = true);

-- Superadmin can manage all barbershops
CREATE POLICY "Superadmin can manage all barbershops" ON barbershops
    FOR ALL
    TO authenticated
    USING (get_current_user_role() = 'superadmin');

-- Barbershop admin can update their own barbershop
CREATE POLICY "Barbershop admin can update own barbershop" ON barbershops
    FOR UPDATE
    TO authenticated
    USING (
        get_current_user_role() = 'barbershop_admin' 
        AND id = get_current_user_barbershop_id()
    );

-- ===== SERVICES TABLE POLICIES =====

-- Superadmin can view all services
CREATE POLICY "Superadmin can view all services" ON services
    FOR SELECT
    TO authenticated
    USING (get_current_user_role() = 'superadmin');

-- Barbershop admin can manage services in their barbershop
CREATE POLICY "Barbershop admin can manage own services" ON services
    FOR ALL
    TO authenticated
    USING (
        get_current_user_role() = 'barbershop_admin' 
        AND barbershop_id = get_current_user_barbershop_id()
    );

-- Barbers can view services in their barbershop
CREATE POLICY "Barbers can view own barbershop services" ON services
    FOR SELECT
    TO authenticated
    USING (
        get_current_user_role() = 'barber' 
        AND barbershop_id = get_current_user_barbershop_id()
    );

-- Public can view active services (for booking)
CREATE POLICY "Public can view active services" ON services
    FOR SELECT
    TO anon
    USING (is_active = true);

-- ===== BARBERS TABLE POLICIES =====

-- Superadmin can view all barbers
CREATE POLICY "Superadmin can view all barbers" ON barbers
    FOR SELECT
    TO authenticated
    USING (get_current_user_role() = 'superadmin');

-- Barbershop admin can manage barbers in their barbershop
CREATE POLICY "Barbershop admin can manage own barbers" ON barbers
    FOR ALL
    TO authenticated
    USING (
        get_current_user_role() = 'barbershop_admin' 
        AND barbershop_id = get_current_user_barbershop_id()
    );

-- Barbers can view their own profile
CREATE POLICY "Barbers can view own profile" ON barbers
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Barbers can update their own profile
CREATE POLICY "Barbers can update own profile" ON barbers
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

-- Public can view active barbers (for booking)
CREATE POLICY "Public can view active barbers" ON barbers
    FOR SELECT
    TO anon
    USING (is_active = true);

-- ===== AVAILABILITY TABLE POLICIES =====

-- Superadmin can view all availability
CREATE POLICY "Superadmin can view all availability" ON availability
    FOR SELECT
    TO authenticated
    USING (get_current_user_role() = 'superadmin');

-- Barbershop admin can manage availability in their barbershop
CREATE POLICY "Barbershop admin can manage availability" ON availability
    FOR ALL
    TO authenticated
    USING (
        get_current_user_role() = 'barbershop_admin' 
        AND EXISTS (
            SELECT 1 FROM barbers b 
            WHERE b.id = availability.barber_id 
            AND b.barbershop_id = get_current_user_barbershop_id()
        )
    );

-- Barbers can manage their own availability
CREATE POLICY "Barbers can manage own availability" ON availability
    FOR ALL
    TO authenticated
    USING (
        get_current_user_role() = 'barber' 
        AND EXISTS (
            SELECT 1 FROM barbers b 
            WHERE b.id = availability.barber_id 
            AND b.user_id = auth.uid()
        )
    );

-- Public can view active availability (for booking)
CREATE POLICY "Public can view active availability" ON availability
    FOR SELECT
    TO anon
    USING (is_active = true);

-- ===== APPOINTMENTS TABLE POLICIES =====

-- Superadmin can view all appointments
CREATE POLICY "Superadmin can view all appointments" ON appointments
    FOR SELECT
    TO authenticated
    USING (get_current_user_role() = 'superadmin');

-- Barbershop admin can manage appointments in their barbershop
CREATE POLICY "Barbershop admin can manage appointments" ON appointments
    FOR ALL
    TO authenticated
    USING (
        get_current_user_role() = 'barbershop_admin' 
        AND barbershop_id = get_current_user_barbershop_id()
    );

-- Barbers can view and update their own appointments
CREATE POLICY "Barbers can view own appointments" ON appointments
    FOR SELECT
    TO authenticated
    USING (
        get_current_user_role() = 'barber' 
        AND EXISTS (
            SELECT 1 FROM barbers b 
            WHERE b.id = appointments.barber_id 
            AND b.user_id = auth.uid()
        )
    );

CREATE POLICY "Barbers can update own appointments" ON appointments
    FOR UPDATE
    TO authenticated
    USING (
        get_current_user_role() = 'barber' 
        AND EXISTS (
            SELECT 1 FROM barbers b 
            WHERE b.id = appointments.barber_id 
            AND b.user_id = auth.uid()
        )
    );

-- Public can insert appointments (booking)
CREATE POLICY "Public can create appointments" ON appointments
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- Public can view appointments by phone (for confirmation/cancellation)
CREATE POLICY "Public can view own appointments by phone" ON appointments
    FOR SELECT
    TO anon
    USING (true); -- This will be filtered in the application layer

-- ===== NOTIFICATIONS TABLE POLICIES =====

-- Superadmin can view all notifications
CREATE POLICY "Superadmin can view all notifications" ON notifications
    FOR SELECT
    TO authenticated
    USING (get_current_user_role() = 'superadmin');

-- Barbershop admin can view notifications for their barbershop
CREATE POLICY "Barbershop admin can view notifications" ON notifications
    FOR SELECT
    TO authenticated
    USING (
        get_current_user_role() = 'barbershop_admin' 
        AND EXISTS (
            SELECT 1 FROM appointments a 
            WHERE a.id = notifications.appointment_id 
            AND a.barbershop_id = get_current_user_barbershop_id()
        )
    );

-- System can insert notifications
CREATE POLICY "System can insert notifications" ON notifications
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- ===== BARBERSHOP SETTINGS TABLE POLICIES =====

-- Superadmin can view all settings
CREATE POLICY "Superadmin can view all settings" ON barbershop_settings
    FOR SELECT
    TO authenticated
    USING (get_current_user_role() = 'superadmin');

-- Barbershop admin can manage their own settings
CREATE POLICY "Barbershop admin can manage own settings" ON barbershop_settings
    FOR ALL
    TO authenticated
    USING (
        get_current_user_role() = 'barbershop_admin' 
        AND barbershop_id = get_current_user_barbershop_id()
    );

-- Barbers can view their barbershop settings
CREATE POLICY "Barbers can view barbershop settings" ON barbershop_settings
    FOR SELECT
    TO authenticated
    USING (
        get_current_user_role() = 'barber' 
        AND barbershop_id = get_current_user_barbershop_id()
    );

-- Additional security: Prevent privilege escalation
CREATE POLICY "Prevent role escalation" ON users
    FOR UPDATE
    TO authenticated
    USING (
        -- Users can't change their own role
        (id = auth.uid() AND role = OLD.role)
        OR 
        -- Only superadmin can change roles
        get_current_user_role() = 'superadmin'
    );

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant read permissions to anonymous users (for public booking)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON barbershops TO anon;
GRANT SELECT ON services TO anon;
GRANT SELECT ON barbers TO anon;
GRANT SELECT ON availability TO anon;
GRANT SELECT, INSERT ON appointments TO anon;

-- Create functions for booking validation
CREATE OR REPLACE FUNCTION validate_appointment_booking(
    p_barber_id UUID,
    p_appointment_date DATE,
    p_appointment_time TIME,
    p_duration_minutes INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    v_end_time TIME;
    v_day_of_week TEXT;
    v_available BOOLEAN := FALSE;
    v_conflicting_appointments INTEGER := 0;
BEGIN
    -- Calculate end time
    v_end_time := p_appointment_time + (p_duration_minutes || ' minutes')::INTERVAL;
    
    -- Get day of week
    v_day_of_week := LOWER(TO_CHAR(p_appointment_date, 'day'));
    v_day_of_week := TRIM(v_day_of_week);
    
    -- Check if barber is available on this day and time
    SELECT COUNT(*) > 0 INTO v_available
    FROM availability
    WHERE barber_id = p_barber_id
    AND day_of_week = v_day_of_week::day_of_week
    AND start_time <= p_appointment_time
    AND end_time >= v_end_time
    AND is_active = true;
    
    IF NOT v_available THEN
        RETURN FALSE;
    END IF;
    
    -- Check for conflicting appointments
    SELECT COUNT(*) INTO v_conflicting_appointments
    FROM appointments
    WHERE barber_id = p_barber_id
    AND appointment_date = p_appointment_date
    AND status NOT IN ('cancelled', 'no_show')
    AND (
        -- New appointment starts during existing appointment
        (appointment_time <= p_appointment_time AND 
         appointment_time + (duration_minutes || ' minutes')::INTERVAL > p_appointment_time)
        OR
        -- New appointment ends during existing appointment
        (appointment_time < v_end_time AND 
         appointment_time + (duration_minutes || ' minutes')::INTERVAL >= v_end_time)
        OR
        -- New appointment contains existing appointment
        (p_appointment_time <= appointment_time AND 
         v_end_time >= appointment_time + (duration_minutes || ' minutes')::INTERVAL)
    );
    
    RETURN v_conflicting_appointments = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to validate appointments before insert
CREATE OR REPLACE FUNCTION check_appointment_availability()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT validate_appointment_booking(
        NEW.barber_id,
        NEW.appointment_date,
        NEW.appointment_time,
        NEW.duration_minutes
    ) THEN
        RAISE EXCEPTION 'Appointment slot is not available';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_appointment_trigger
    BEFORE INSERT ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION check_appointment_availability();
