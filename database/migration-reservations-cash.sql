-- ============================================================
-- Reservas gestionables + auditoria + arqueo de caja
-- Ejecutar en Supabase Dashboard > SQL Editor.
-- Idempotente y compatible con datos existentes.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ------------------------------------------------------------
-- 1. Metadata de reservas
-- ------------------------------------------------------------
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS booking_code text,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rescheduled_from timestamptz,
  ADD COLUMN IF NOT EXISTS notes text;

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

UPDATE public.appointments
SET booking_code = public.generate_booking_code()
WHERE booking_code IS NULL;

ALTER TABLE public.appointments
  ALTER COLUMN booking_code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS appointments_booking_code_key
  ON public.appointments (booking_code);

CREATE INDEX IF NOT EXISTS idx_appointments_barber_date_status
  ON public.appointments (barber_id, date, status_id);

CREATE INDEX IF NOT EXISTS idx_appointments_customer_lookup
  ON public.appointments (booking_code, customer_email, customer_phone);

CREATE OR REPLACE FUNCTION public.set_booking_code()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.booking_code IS NULL OR btrim(NEW.booking_code) = '' THEN
    NEW.booking_code := public.generate_booking_code();
  ELSE
    NEW.booking_code := upper(NEW.booking_code);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_booking_code ON public.appointments;
CREATE TRIGGER trg_set_booking_code
  BEFORE INSERT ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.set_booking_code();

-- ------------------------------------------------------------
-- 2. Auditoria de turnos
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.appointment_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('created', 'updated', 'rescheduled', 'cancelled', 'status_changed')),
  actor_type text NOT NULL DEFAULT 'system' CHECK (actor_type IN ('customer', 'admin', 'barber', 'system')),
  actor_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointment_audit_appointment
  ON public.appointment_audit_log (appointment_id, created_at DESC);

ALTER TABLE public.appointment_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Manage audit of own appointments" ON public.appointment_audit_log;
CREATE POLICY "Manage audit of own appointments" ON public.appointment_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.appointments a
      WHERE a.id = appointment_audit_log.appointment_id
        AND (public.can_manage_barber(a.barber_id) OR public.is_superadmin())
    )
  );

CREATE OR REPLACE FUNCTION public.audit_appointment_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  audit_action text := 'updated';
BEGIN
  IF OLD.date IS DISTINCT FROM NEW.date THEN
    audit_action := 'rescheduled';
  ELSIF OLD.status_id IS DISTINCT FROM NEW.status_id AND NEW.status_id = 3 THEN
    audit_action := 'cancelled';
  ELSIF OLD.status_id IS DISTINCT FROM NEW.status_id THEN
    audit_action := 'status_changed';
  END IF;

  IF OLD.date IS DISTINCT FROM NEW.date
    OR OLD.status_id IS DISTINCT FROM NEW.status_id
    OR OLD.customer_name IS DISTINCT FROM NEW.customer_name
    OR OLD.customer_email IS DISTINCT FROM NEW.customer_email
    OR OLD.customer_phone IS DISTINCT FROM NEW.customer_phone
  THEN
    INSERT INTO public.appointment_audit_log (
      appointment_id,
      action,
      actor_type,
      actor_user_id,
      old_values,
      new_values
    ) VALUES (
      NEW.id,
      audit_action,
      CASE WHEN NEW.updated_by IS NULL THEN 'customer' ELSE 'admin' END,
      NEW.updated_by,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_appointment_changes ON public.appointments;
CREATE TRIGGER trg_audit_appointment_changes
  AFTER UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.audit_appointment_changes();

-- ------------------------------------------------------------
-- 3. Caja diaria
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cash_registers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  business_date date NOT NULL DEFAULT CURRENT_DATE,
  opened_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  closed_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  opening_amount numeric(12,2) NOT NULL DEFAULT 0,
  counted_amount numeric(12,2),
  notes text,
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS cash_register_one_open_per_shop_day
  ON public.cash_registers (barbershop_id, business_date)
  WHERE status = 'open';

CREATE INDEX IF NOT EXISTS idx_cash_registers_shop_date
  ON public.cash_registers (barbershop_id, business_date DESC);

CREATE TABLE IF NOT EXISTS public.cash_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cash_register_id uuid NOT NULL REFERENCES public.cash_registers(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('appointment_income', 'manual_income', 'manual_expense')),
  concept text NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cash_movements_register
  ON public.cash_movements (cash_register_id, created_at DESC);

ALTER TABLE public.cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can manage cash registers" ON public.cash_registers;
CREATE POLICY "Owners can manage cash registers" ON public.cash_registers
  FOR ALL USING (
    public.is_superadmin() OR EXISTS (
      SELECT 1 FROM public.barbershops b
      WHERE b.id = cash_registers.barbershop_id
        AND b.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_superadmin() OR EXISTS (
      SELECT 1 FROM public.barbershops b
      WHERE b.id = cash_registers.barbershop_id
        AND b.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners can manage cash movements" ON public.cash_movements;
CREATE POLICY "Owners can manage cash movements" ON public.cash_movements
  FOR ALL USING (
    public.is_superadmin() OR EXISTS (
      SELECT 1
      FROM public.cash_registers cr
      JOIN public.barbershops b ON b.id = cr.barbershop_id
      WHERE cr.id = cash_movements.cash_register_id
        AND b.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_superadmin() OR EXISTS (
      SELECT 1
      FROM public.cash_registers cr
      JOIN public.barbershops b ON b.id = cr.barbershop_id
      WHERE cr.id = cash_movements.cash_register_id
        AND b.owner_id = auth.uid()
    )
  );

-- ============================================================
-- FIN
-- ============================================================
