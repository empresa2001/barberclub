-- Recordatorios de turnos por WhatsApp
-- Marca cuándo se envió el recordatorio para no duplicar envíos.

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz;

-- Índice para que el cron filtre rápido los turnos sin recordatorio enviado.
CREATE INDEX IF NOT EXISTS idx_appointments_reminder
  ON appointments (date)
  WHERE reminder_sent_at IS NULL;
