-- ============================================================
-- BarberClub - Setup completo para una cuenta NUEVA de Supabase
-- Ejecutar todo este archivo en: Supabase Dashboard > SQL Editor
-- El orden de creación respeta las dependencias de Foreign Keys.
-- ============================================================

-- ------------------------------------------------------------
-- 0. Limpieza (para re-ejecutar desde cero sin conflictos)
--    Borra el schema previo. NO toca auth.users (usuarios de Auth).
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP VIEW IF EXISTS barber_details CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS schedule_exceptions CASCADE;
DROP TABLE IF EXISTS schedules CASCADE;
DROP TABLE IF EXISTS barbers CASCADE;
DROP TABLE IF EXISTS barbershops CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS appointment_status CASCADE;
DROP TABLE IF EXISTS barbershop_status CASCADE;
DROP TABLE IF EXISTS user_types CASCADE;

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- para crypt()/gen_salt() del seed
CREATE EXTENSION IF NOT EXISTS btree_gist; -- para el constraint anti-doble-reserva

-- ------------------------------------------------------------
-- 1. Tablas de lookup (sin dependencias)
-- ------------------------------------------------------------
CREATE TABLE user_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);
INSERT INTO user_types (name) VALUES
    ('superadmin'),
    ('barbershop_admin'),
    ('barber');

CREATE TABLE barbershop_status (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);
INSERT INTO barbershop_status (name) VALUES
    ('pending'),
    ('active'),
    ('inactive');

CREATE TABLE appointment_status (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);
INSERT INTO appointment_status (name) VALUES
    ('pending'),
    ('confirmed'),
    ('cancelled'),
    ('completed');

-- ------------------------------------------------------------
-- 2. users (barber_id FK se agrega despues de crear barbers)
-- ------------------------------------------------------------
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255), -- nullable: la contraseña real vive en auth.users
    name VARCHAR(255) NOT NULL,
    user_type_id INTEGER NOT NULL REFERENCES user_types(id),
    barber_id UUID UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 3. barbershops (depende de users y barbershop_status)
-- ------------------------------------------------------------
CREATE TABLE barbershops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status_id INTEGER NOT NULL DEFAULT 1 REFERENCES barbershop_status(id),
    description TEXT DEFAULT '',
    location VARCHAR(500) NOT NULL,
    email VARCHAR(255) DEFAULT '',
    phone VARCHAR(50) DEFAULT '',
    image_url VARCHAR(500) DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 4. barbers (depende de users y barbershops)
-- ------------------------------------------------------------
CREATE TABLE barbers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    barbershop_id UUID NOT NULL REFERENCES barbershops(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ahora si: FK de users.barber_id -> barbers.id
ALTER TABLE users ADD CONSTRAINT fk_users_barber
    FOREIGN KEY (barber_id) REFERENCES barbers(id) ON DELETE SET NULL;

-- ------------------------------------------------------------
-- 5. schedules / services / appointments
-- ------------------------------------------------------------
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    from_time VARCHAR(8) NOT NULL,
    to_time VARCHAR(8) NOT NULL,
    barber_id UUID NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Excepciones de agenda: vacaciones / bloqueos puntuales por barbero.
-- from_time/to_time NULL = bloqueo del dia completo.
CREATE TABLE schedule_exceptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barber_id UUID NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    from_time VARCHAR(8),
    to_time VARCHAR(8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    price DECIMAL(10, 2) NOT NULL,
    duration_min INTEGER NOT NULL,
    barbershop_id UUID NOT NULL REFERENCES barbershops(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_min INTEGER NOT NULL,
    status_id INTEGER NOT NULL DEFAULT 1 REFERENCES appointment_status(id),
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    barber_id UUID NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Rango [inicio, fin) del turno, mantenido por trigger (ver mas abajo).
    time_range tstzrange
);

-- Trigger que calcula time_range en cada insert/update.
-- (columna normal + trigger, no GENERATED, porque timestamptz+interval es STABLE)
CREATE OR REPLACE FUNCTION public.set_appointment_range()
RETURNS TRIGGER AS $$
BEGIN
    NEW.time_range := tstzrange(
        NEW.date, NEW.date + make_interval(mins => NEW.duration_min), '[)'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_appointment_range
    BEFORE INSERT OR UPDATE OF date, duration_min ON appointments
    FOR EACH ROW EXECUTE FUNCTION public.set_appointment_range();

-- Anti-doble-reserva: dos turnos no cancelados del mismo barbero no se solapan.
ALTER TABLE appointments
    ADD CONSTRAINT no_overlap_per_barber
    EXCLUDE USING gist (barber_id WITH =, time_range WITH &&)
    WHERE (status_id <> 3);

-- ------------------------------------------------------------
-- 6. Indices
-- ------------------------------------------------------------
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_type ON users(user_type_id);
CREATE INDEX idx_users_barber ON users(barber_id);
CREATE INDEX idx_barbershops_owner ON barbershops(owner_id);
CREATE INDEX idx_barbershops_status ON barbershops(status_id);
CREATE INDEX idx_barbers_user ON barbers(user_id);
CREATE INDEX idx_barbers_barbershop ON barbers(barbershop_id);
CREATE INDEX idx_schedules_barber ON schedules(barber_id);
CREATE INDEX idx_schedules_day ON schedules(day_of_week);
CREATE INDEX idx_schedule_exceptions_barber ON schedule_exceptions(barber_id);
CREATE INDEX idx_schedule_exceptions_date ON schedule_exceptions(date);
CREATE INDEX idx_services_barbershop ON services(barbershop_id);
CREATE INDEX idx_appointments_barber ON appointments(barber_id);
CREATE INDEX idx_appointments_service ON appointments(service_id);
CREATE INDEX idx_appointments_status ON appointments(status_id);
CREATE INDEX idx_appointments_date ON appointments(date);

-- ------------------------------------------------------------
-- 7. Trigger updated_at
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_barbershops_updated_at BEFORE UPDATE ON barbershops
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_barbers_updated_at BEFORE UPDATE ON barbers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_schedule_exceptions_updated_at BEFORE UPDATE ON schedule_exceptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------
-- 7b. Trigger: crear fila en public.users al registrarse en auth.users
--     El campo metadata 'role' define el user_type (owner -> barbershop_admin)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_type_id INTEGER;
BEGIN
    SELECT id INTO v_type_id FROM public.user_types
    WHERE name = CASE
        WHEN NEW.raw_user_meta_data->>'role' = 'owner' THEN 'barbershop_admin'
        WHEN NEW.raw_user_meta_data->>'role' = 'barber' THEN 'barber'
        WHEN NEW.raw_user_meta_data->>'role' = 'superadmin' THEN 'superadmin'
        ELSE 'barbershop_admin'
    END;

    INSERT INTO public.users (id, email, name, user_type_id)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        v_type_id
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------
-- 8. Row Level Security
-- ------------------------------------------------------------
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbershops ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Helper: detecta superadmin leyendo el rol desde el JWT (user_metadata.role).
-- NO consulta la tabla users -> evita recursion infinita en las policies.
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE((auth.jwt() -> 'user_metadata' ->> 'role') = 'superadmin', false)
$$;

-- ¿El usuario actual es dueño de esta barberia? (SECURITY DEFINER -> sin recursion)
CREATE OR REPLACE FUNCTION public.owns_barbershop(shop_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM barbershops WHERE id = shop_id AND owner_id = auth.uid())
$$;

-- ¿El usuario actual puede gestionar a este barbero? (dueño de la barberia O el propio barbero)
CREATE OR REPLACE FUNCTION public.can_manage_barber(b_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM barbers bb JOIN barbershops bs ON bb.barbershop_id = bs.id
    WHERE bb.id = b_id AND (bs.owner_id = auth.uid() OR bb.user_id = auth.uid())
  )
$$;

-- users
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Superadmins can view all users" ON users
    FOR SELECT USING (public.is_superadmin());
CREATE POLICY "Enable insert for authenticated users" ON users
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE USING (auth.uid()::text = id::text OR public.is_superadmin());
CREATE POLICY "Superadmins can delete users" ON users
    FOR DELETE USING (public.is_superadmin());

-- barbershops
CREATE POLICY "Anyone can view active barbershops" ON barbershops
    FOR SELECT USING (status_id = 2);
CREATE POLICY "Owners can view their barbershops" ON barbershops
    FOR SELECT USING (owner_id::text = auth.uid()::text);
CREATE POLICY "Superadmins manage all barbershops" ON barbershops
    FOR ALL USING (public.is_superadmin());
CREATE POLICY "Enable insert for authenticated users" ON barbershops
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Owners can update their barbershops" ON barbershops
    FOR UPDATE USING (owner_id::text = auth.uid()::text OR public.is_superadmin());
CREATE POLICY "Owners can delete their barbershops" ON barbershops
    FOR DELETE USING (owner_id::text = auth.uid()::text OR public.is_superadmin());

-- barbers
CREATE POLICY "Anyone can view barbers of active barbershops" ON barbers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM barbershops b
            WHERE b.id = barbers.barbershop_id AND b.status_id = 2
        )
    );
CREATE POLICY "Owners can view their barbers" ON barbers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM barbershops b
            WHERE b.id = barbers.barbershop_id AND b.owner_id::text = auth.uid()::text
        )
    );
CREATE POLICY "Owners can add barbers" ON barbers
    FOR INSERT WITH CHECK (public.owns_barbershop(barbershop_id) OR public.is_superadmin());
CREATE POLICY "Owners can update their barbers" ON barbers
    FOR UPDATE USING (public.owns_barbershop(barbershop_id) OR public.is_superadmin());
CREATE POLICY "Owners can delete their barbers" ON barbers
    FOR DELETE USING (public.owns_barbershop(barbershop_id) OR public.is_superadmin());

-- services (lectura publica para booking)
CREATE POLICY "Anyone can view services" ON services
    FOR SELECT USING (true);
CREATE POLICY "Owners can add services" ON services
    FOR INSERT WITH CHECK (public.owns_barbershop(barbershop_id) OR public.is_superadmin());
CREATE POLICY "Owners can update their services" ON services
    FOR UPDATE USING (public.owns_barbershop(barbershop_id) OR public.is_superadmin());
CREATE POLICY "Owners can delete their services" ON services
    FOR DELETE USING (public.owns_barbershop(barbershop_id) OR public.is_superadmin());

-- schedules (lectura publica para booking)
CREATE POLICY "Anyone can view schedules" ON schedules
    FOR SELECT USING (true);
CREATE POLICY "Manage schedules of own barbers" ON schedules
    FOR INSERT WITH CHECK (public.can_manage_barber(barber_id) OR public.is_superadmin());
CREATE POLICY "Update schedules of own barbers" ON schedules
    FOR UPDATE USING (public.can_manage_barber(barber_id) OR public.is_superadmin());
CREATE POLICY "Delete schedules of own barbers" ON schedules
    FOR DELETE USING (public.can_manage_barber(barber_id) OR public.is_superadmin());

-- schedule_exceptions (lectura publica para booking)
CREATE POLICY "Anyone can view schedule_exceptions" ON schedule_exceptions
    FOR SELECT USING (true);
CREATE POLICY "Manage exceptions of own barbers" ON schedule_exceptions
    FOR INSERT WITH CHECK (public.can_manage_barber(barber_id) OR public.is_superadmin());
CREATE POLICY "Update exceptions of own barbers" ON schedule_exceptions
    FOR UPDATE USING (public.can_manage_barber(barber_id) OR public.is_superadmin());
CREATE POLICY "Delete exceptions of own barbers" ON schedule_exceptions
    FOR DELETE USING (public.can_manage_barber(barber_id) OR public.is_superadmin());

-- appointments (cualquiera puede crear un turno; gestion para dueños/barberos)
CREATE POLICY "Anyone can create appointments" ON appointments
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Barbers and owners can view appointments" ON appointments
    FOR SELECT USING (public.can_manage_barber(barber_id) OR public.is_superadmin());
CREATE POLICY "Manage appointments of own barbers" ON appointments
    FOR UPDATE USING (public.can_manage_barber(barber_id) OR public.is_superadmin());
CREATE POLICY "Delete appointments of own barbers" ON appointments
    FOR DELETE USING (public.can_manage_barber(barber_id) OR public.is_superadmin());

-- ------------------------------------------------------------
-- 8b. RPC publica: rangos ocupados de un barbero (sin datos del cliente).
--     Permite que el booking anonimo calcule disponibilidad sin exponer PII.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_busy_slots(
    p_barber_id uuid,
    p_from timestamptz,
    p_to timestamptz
)
RETURNS TABLE(date timestamptz, duration_min int)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT a.date, a.duration_min
    FROM appointments a
    WHERE a.barber_id = p_barber_id
      AND a.status_id <> 3
      AND a.date >= p_from
      AND a.date <= p_to
$$;

GRANT EXECUTE ON FUNCTION public.get_busy_slots(uuid, timestamptz, timestamptz)
    TO anon, authenticated;

-- ------------------------------------------------------------
-- 9. Vista de detalle de barberos
-- ------------------------------------------------------------
CREATE VIEW barber_details AS
SELECT
    b.id AS barber_id,
    u.name,
    u.email,
    b.barbershop_id,
    bs.name AS barbershop_name,
    u.created_at,
    u.updated_at
FROM barbers b
JOIN users u ON b.user_id = u.id
JOIN barbershops bs ON b.barbershop_id = bs.id
WHERE bs.status_id = (SELECT id FROM barbershop_status WHERE name = 'active');

-- ------------------------------------------------------------
-- 10. Superadmin
--     NO insertar manualmente en auth.users (rompe GoTrue: provoca
--     "Database error querying schema" por columnas NULL inesperadas).
--
--     Metodo correcto para crear el superadmin:
--       a) Dashboard > Authentication > Add user (email + password),
--          con User Metadata: { "role": "superadmin", "name": "..." }
--       o
--       b) Admin API (server-side, con la SERVICE_ROLE_KEY):
--          POST https://<project>.supabase.co/auth/v1/admin/users
--          body: { "email": "...", "password": "...", "email_confirm": true,
--                  "user_metadata": { "role": "superadmin", "name": "..." } }
--
--     El trigger handle_new_user crea la fila en public.users.
--     Si el rol no quedo como superadmin, forzarlo (reemplazar el email):
--
--       UPDATE public.users
--       SET user_type_id = (SELECT id FROM public.user_types WHERE name = 'superadmin')
--       WHERE email = 'TU_EMAIL_DE_SUPERADMIN';
-- ------------------------------------------------------------

-- ============================================================
-- FIN.
-- ============================================================
