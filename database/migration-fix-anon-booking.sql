-- ============================================================
-- FIX: permitir que clientes ANONIMOS creen turnos (booking publico)
-- En la BD viva la policy de INSERT quedo restringida a 'authenticated'.
-- Ejecutar en: Supabase Dashboard > SQL Editor. Idempotente.
-- ============================================================

-- Reemplazar la policy de INSERT para que aplique a anon + authenticated
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.appointments;
DROP POLICY IF EXISTS "Anyone can create appointments" ON public.appointments;

CREATE POLICY "Anyone can create appointments" ON public.appointments
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

-- Asegurar el privilegio de tabla para anon (Supabase suele otorgarlo,
-- pero lo forzamos por si la tabla se creo sin el grant).
GRANT INSERT ON public.appointments TO anon;

-- ============================================================
-- FIN
-- ============================================================
