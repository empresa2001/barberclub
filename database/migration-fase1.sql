-- ============================================================
-- Migracion Fase 1 (P0) sobre la BD YA existente.
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- Es idempotente: se puede correr mas de una vez sin romper.
-- ============================================================

-- 1. Columna is_active en users (si no la corriste antes)
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 2. Columna customer_phone en appointments
ALTER TABLE public.appointments
    ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50);

-- 3. Tabla schedule_exceptions (vacaciones / bloqueos por barbero)
CREATE TABLE IF NOT EXISTS public.schedule_exceptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barber_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    from_time VARCHAR(8),
    to_time VARCHAR(8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_schedule_exceptions_barber ON public.schedule_exceptions(barber_id);
CREATE INDEX IF NOT EXISTS idx_schedule_exceptions_date ON public.schedule_exceptions(date);

-- Trigger updated_at (la funcion ya existe en la base)
DROP TRIGGER IF EXISTS update_schedule_exceptions_updated_at ON public.schedule_exceptions;
CREATE TRIGGER update_schedule_exceptions_updated_at BEFORE UPDATE ON public.schedule_exceptions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.schedule_exceptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view schedule_exceptions" ON public.schedule_exceptions;
CREATE POLICY "Anyone can view schedule_exceptions" ON public.schedule_exceptions
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.schedule_exceptions;
CREATE POLICY "Enable insert for authenticated users" ON public.schedule_exceptions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- FIN Fase 1
-- ============================================================
