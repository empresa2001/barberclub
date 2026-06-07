-- ============================================================
-- Migracion Fase 2 (P1) - Aislamiento multi-tenant via RLS
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- Idempotente: usa DROP POLICY IF EXISTS / CREATE OR REPLACE.
-- ============================================================

-- ------------------------------------------------------------
-- Helpers SECURITY DEFINER (corren como owner -> NO disparan RLS,
-- por eso no hay recursion al consultar barbershops/barbers).
-- ------------------------------------------------------------

-- ¿El usuario actual es dueño de esta barberia?
CREATE OR REPLACE FUNCTION public.owns_barbershop(shop_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM barbershops
    WHERE id = shop_id AND owner_id = auth.uid()
  )
$$;

-- ¿El usuario actual puede gestionar a este barbero?
-- (es dueño de la barberia del barbero, O es el propio barbero)
CREATE OR REPLACE FUNCTION public.can_manage_barber(b_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM barbers bb
    JOIN barbershops bs ON bb.barbershop_id = bs.id
    WHERE bb.id = b_id
      AND (bs.owner_id = auth.uid() OR bb.user_id = auth.uid())
  )
$$;

-- (is_superadmin ya existe desde Fase 1; lo recreamos por las dudas)
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE((auth.jwt() -> 'user_metadata' ->> 'role') = 'superadmin', false)
$$;

-- ============================================================
-- USERS
-- ============================================================
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
CREATE POLICY "Users can update their own data" ON public.users
    FOR UPDATE USING (auth.uid()::text = id::text OR public.is_superadmin());

DROP POLICY IF EXISTS "Superadmins can delete users" ON public.users;
CREATE POLICY "Superadmins can delete users" ON public.users
    FOR DELETE USING (public.is_superadmin());

-- ============================================================
-- BARBERSHOPS
-- ============================================================
DROP POLICY IF EXISTS "Owners can update their barbershops" ON public.barbershops;
CREATE POLICY "Owners can update their barbershops" ON public.barbershops
    FOR UPDATE USING (owner_id::text = auth.uid()::text OR public.is_superadmin());

DROP POLICY IF EXISTS "Owners can delete their barbershops" ON public.barbershops;
CREATE POLICY "Owners can delete their barbershops" ON public.barbershops
    FOR DELETE USING (owner_id::text = auth.uid()::text OR public.is_superadmin());

-- ============================================================
-- BARBERS  (tighten INSERT + add UPDATE/DELETE)
-- ============================================================
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.barbers;
CREATE POLICY "Owners can add barbers" ON public.barbers
    FOR INSERT WITH CHECK (public.owns_barbershop(barbershop_id) OR public.is_superadmin());

DROP POLICY IF EXISTS "Owners can update their barbers" ON public.barbers;
CREATE POLICY "Owners can update their barbers" ON public.barbers
    FOR UPDATE USING (public.owns_barbershop(barbershop_id) OR public.is_superadmin());

DROP POLICY IF EXISTS "Owners can delete their barbers" ON public.barbers;
CREATE POLICY "Owners can delete their barbers" ON public.barbers
    FOR DELETE USING (public.owns_barbershop(barbershop_id) OR public.is_superadmin());

-- ============================================================
-- SERVICES (tighten INSERT + add UPDATE/DELETE)
-- ============================================================
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.services;
CREATE POLICY "Owners can add services" ON public.services
    FOR INSERT WITH CHECK (public.owns_barbershop(barbershop_id) OR public.is_superadmin());

DROP POLICY IF EXISTS "Owners can update their services" ON public.services;
CREATE POLICY "Owners can update their services" ON public.services
    FOR UPDATE USING (public.owns_barbershop(barbershop_id) OR public.is_superadmin());

DROP POLICY IF EXISTS "Owners can delete their services" ON public.services;
CREATE POLICY "Owners can delete their services" ON public.services
    FOR DELETE USING (public.owns_barbershop(barbershop_id) OR public.is_superadmin());

-- ============================================================
-- SCHEDULES (tighten INSERT + add UPDATE/DELETE)
-- ============================================================
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.schedules;
CREATE POLICY "Manage schedules of own barbers" ON public.schedules
    FOR INSERT WITH CHECK (public.can_manage_barber(barber_id) OR public.is_superadmin());

DROP POLICY IF EXISTS "Update schedules of own barbers" ON public.schedules;
CREATE POLICY "Update schedules of own barbers" ON public.schedules
    FOR UPDATE USING (public.can_manage_barber(barber_id) OR public.is_superadmin());

DROP POLICY IF EXISTS "Delete schedules of own barbers" ON public.schedules;
CREATE POLICY "Delete schedules of own barbers" ON public.schedules
    FOR DELETE USING (public.can_manage_barber(barber_id) OR public.is_superadmin());

-- ============================================================
-- SCHEDULE_EXCEPTIONS (tighten INSERT + add UPDATE/DELETE)
-- ============================================================
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.schedule_exceptions;
CREATE POLICY "Manage exceptions of own barbers" ON public.schedule_exceptions
    FOR INSERT WITH CHECK (public.can_manage_barber(barber_id) OR public.is_superadmin());

DROP POLICY IF EXISTS "Update exceptions of own barbers" ON public.schedule_exceptions;
CREATE POLICY "Update exceptions of own barbers" ON public.schedule_exceptions
    FOR UPDATE USING (public.can_manage_barber(barber_id) OR public.is_superadmin());

DROP POLICY IF EXISTS "Delete exceptions of own barbers" ON public.schedule_exceptions;
CREATE POLICY "Delete exceptions of own barbers" ON public.schedule_exceptions
    FOR DELETE USING (public.can_manage_barber(barber_id) OR public.is_superadmin());

-- ============================================================
-- APPOINTMENTS (INSERT publico se mantiene; add UPDATE/DELETE)
-- ============================================================
DROP POLICY IF EXISTS "Manage appointments of own barbers" ON public.appointments;
CREATE POLICY "Manage appointments of own barbers" ON public.appointments
    FOR UPDATE USING (public.can_manage_barber(barber_id) OR public.is_superadmin());

DROP POLICY IF EXISTS "Delete appointments of own barbers" ON public.appointments;
CREATE POLICY "Delete appointments of own barbers" ON public.appointments
    FOR DELETE USING (public.can_manage_barber(barber_id) OR public.is_superadmin());

-- ============================================================
-- FIN Fase 2
-- ============================================================
