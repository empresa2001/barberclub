-- ============================================================
-- Migracion Fase 2 - Anti-doble-reserva + disponibilidad publica
-- Ejecutar en: Supabase Dashboard > SQL Editor. Idempotente.
-- ============================================================

-- Necesario para constraints de exclusion con = y &&
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ------------------------------------------------------------
-- 1. Columna de rango [inicio, fin) del turno.
--    Columna NORMAL mantenida por trigger (no GENERATED), asi
--    evitamos la restriccion de inmutabilidad de timestamptz+interval.
-- ------------------------------------------------------------
ALTER TABLE public.appointments
    ADD COLUMN IF NOT EXISTS time_range tstzrange;

CREATE OR REPLACE FUNCTION public.set_appointment_range()
RETURNS TRIGGER AS $$
BEGIN
    NEW.time_range := tstzrange(
        NEW.date,
        NEW.date + make_interval(mins => NEW.duration_min),
        '[)'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_appointment_range ON public.appointments;
CREATE TRIGGER trg_set_appointment_range
    BEFORE INSERT OR UPDATE OF date, duration_min ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION public.set_appointment_range();

-- Backfill de filas existentes
UPDATE public.appointments
SET time_range = tstzrange(date, date + make_interval(mins => duration_min), '[)')
WHERE time_range IS NULL;

-- ------------------------------------------------------------
-- 2. Constraint de exclusion: dos turnos NO cancelados del mismo
--    barbero no pueden solaparse. El INSERT conflictivo falla con 23P01.
-- ------------------------------------------------------------
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS no_overlap_per_barber;
ALTER TABLE public.appointments
    ADD CONSTRAINT no_overlap_per_barber
    EXCLUDE USING gist (barber_id WITH =, time_range WITH &&)
    WHERE (status_id <> 3);

-- ------------------------------------------------------------
-- 3. RPC publica: rangos ocupados de un barbero en un periodo.
--    SECURITY DEFINER -> lee appointments sin exponer datos del cliente.
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

-- ============================================================
-- FIN
-- ============================================================
