-- ============================================================
-- Codigos de reserva generados por la base de datos
-- Ejecutar en Supabase Dashboard > SQL Editor.
-- Idempotente y compatible con turnos existentes.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS booking_code text;

CREATE OR REPLACE FUNCTION public.generate_booking_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  code text;
BEGIN
  LOOP
    code := 'BC-' || upper(substr(encode(gen_random_bytes(5), 'hex'), 1, 8));
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.appointments WHERE booking_code = code
    );
  END LOOP;

  RETURN code;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_booking_code()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.booking_code IS NULL OR btrim(NEW.booking_code) = '' THEN
    NEW.booking_code := public.generate_booking_code();
  ELSE
    NEW.booking_code := upper(btrim(NEW.booking_code));
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_booking_code ON public.appointments;
CREATE TRIGGER trg_set_booking_code
  BEFORE INSERT ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.set_booking_code();

UPDATE public.appointments
SET booking_code = public.generate_booking_code()
WHERE booking_code IS NULL OR btrim(booking_code) = '';

ALTER TABLE public.appointments
  ALTER COLUMN booking_code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS appointments_booking_code_key
  ON public.appointments (booking_code);

CREATE INDEX IF NOT EXISTS idx_appointments_booking_code
  ON public.appointments (booking_code);

-- ============================================================
-- FIN
-- ============================================================
