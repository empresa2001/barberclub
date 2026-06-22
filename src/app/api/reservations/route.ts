import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin.server';
import { getSlotAvailability } from '@/lib/bookingAvailability';

export const runtime = 'nodejs';

type LookupBody = {
  booking_code?: string;
  contact?: string;
};

type PatchBody = LookupBody & {
  action?: 'cancel' | 'reschedule' | 'update_contact';
  date?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string | null;
  notes?: string;
};

const appointmentSelect = `
  id,
  date,
  duration_min,
  status_id,
  customer_name,
  customer_email,
  customer_phone,
  booking_code,
  barber_id,
  service_id,
  created_at,
  updated_at,
  cancelled_at,
  rescheduled_from,
  notes,
  services(id,name,price,duration_min),
  appointment_status(id,name),
  barbers(id,barbershop_id,users!barbers_user_id_fkey(name,email),barbershops(id,name,location,phone))
`;

const appointmentBaseSelect = `
  id,
  date,
  duration_min,
  status_id,
  customer_name,
  customer_email,
  customer_phone,
  booking_code,
  barber_id,
  service_id,
  created_at,
  updated_at,
  services(id,name,price,duration_min),
  appointment_status(id,name),
  barbers(id,barbershop_id,users!barbers_user_id_fkey(name,email),barbershops(id,name,location,phone))
`;

const appointmentMinimalSelect = `
  id,
  date,
  duration_min,
  status_id,
  customer_name,
  customer_email,
  customer_phone,
  booking_code,
  barber_id,
  service_id,
  created_at,
  updated_at
`;

function normalizeCode(code?: string) {
  return code?.trim().toUpperCase() ?? '';
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function missingSchemaColumn(error: any) {
  return ['PGRST204', '42703'].includes(error?.code);
}

function missingBookingCodeColumn(error: any) {
  return missingSchemaColumn(error) && String(error?.message || '').includes('booking_code');
}

function getDateInput(date: string) {
  return date.slice(0, 10);
}

function canModify(appointment: any) {
  return appointment.status_id !== 3 && appointment.status_id !== 4 && new Date(appointment.date) > new Date();
}

function modifyBlockReason(appointment: any) {
  if (appointment.status_id === 3) return 'cancelled';
  if (appointment.status_id === 4) return 'completed';
  if (new Date(appointment.date) <= new Date()) return 'past';
  return null;
}

function publicAppointment(appointment: any) {
  return {
    ...appointment,
    booking_code: appointment.booking_code || `ID-${appointment.id}`,
    can_modify: canModify(appointment),
    modify_block_reason: modifyBlockReason(appointment),
  };
}

async function selectAppointmentById(id: string) {
  let result = await supabaseAdmin
    .from('appointments')
    .select(appointmentSelect)
    .eq('id', id)
    .maybeSingle();

  if (missingSchemaColumn(result.error)) {
    result = await supabaseAdmin
      .from('appointments')
      .select(appointmentBaseSelect)
      .eq('id', id)
      .maybeSingle();
  }

  if (result.error) {
    result = await supabaseAdmin
      .from('appointments')
      .select(appointmentMinimalSelect)
      .eq('id', id)
      .maybeSingle();
  }

  return result;
}

async function selectAppointmentByBookingCode(bookingCode: string) {
  let result = await supabaseAdmin
    .from('appointments')
    .select(appointmentSelect)
    .eq('booking_code', bookingCode)
    .maybeSingle();

  if (missingSchemaColumn(result.error) && !missingBookingCodeColumn(result.error)) {
    result = await supabaseAdmin
      .from('appointments')
      .select(appointmentBaseSelect)
      .eq('booking_code', bookingCode)
      .maybeSingle();
  }

  if (missingSchemaColumn(result.error) && !missingBookingCodeColumn(result.error)) {
    result = await supabaseAdmin
      .from('appointments')
      .select(appointmentMinimalSelect)
      .eq('booking_code', bookingCode)
      .maybeSingle();
  }

  return result;
}

async function findAppointment(body: LookupBody) {
  const bookingCode = normalizeCode(body.booking_code);
  if (!bookingCode) {
    return { error: 'Ingresá el código de reserva.', status: 400 as const };
  }

  const fallbackId = bookingCode.startsWith('ID-') ? bookingCode.slice(3) : '';

  let data;
  let error;

  if (fallbackId && isUuid(fallbackId)) {
    const result = await selectAppointmentById(fallbackId);
    data = result.data;
    error = result.error;
  } else {
    const result = await selectAppointmentByBookingCode(bookingCode);
    data = result.data;
    error = result.error;
  }

  if (missingBookingCodeColumn(error) && !fallbackId) {
    return {
      error: 'Falta aplicar la migración de códigos de reserva para buscar turnos por código.',
      status: 400 as const
    };
  }

  if (error) return { error: 'No pudimos buscar la reserva. Probá nuevamente.', status: 500 as const };
  if (!data) return { error: 'No encontramos una reserva con ese código.', status: 404 as const };

  return { appointment: data };
}

async function validateNewDate(appointment: any, nextDate: string) {
  const parsedDate = new Date(nextDate);
  if (Number.isNaN(parsedDate.getTime())) {
    return 'La nueva fecha no es válida.';
  }

  if (parsedDate <= new Date()) {
    return 'No podés mover la reserva a un horario pasado.';
  }

  const day = getDateInput(nextDate);
  const time = nextDate.slice(11, 16);
  if (!day || !time) {
    return 'Elegí fecha y horario para reprogramar.';
  }

  const dayOfWeek = new Date(`${day}T00:00:00`).getDay();
  const { data: schedules, error: schedulesError } = await supabaseAdmin
    .from('schedules')
    .select('from_time, to_time')
    .eq('barber_id', appointment.barber_id)
    .eq('day_of_week', dayOfWeek);

  if (schedulesError) return 'No pudimos validar la agenda del barbero.';
  if (!schedules?.length) return 'El barbero no trabaja en esa fecha.';

  const { data: exceptions } = await supabaseAdmin
    .from('schedule_exceptions')
    .select('from_time, to_time')
    .eq('barber_id', appointment.barber_id)
    .eq('date', day);

  const startOfDay = new Date(`${day}T00:00:00`);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(`${day}T00:00:00`);
  endOfDay.setHours(23, 59, 59, 999);

  const { data: busySlots, error: busyError } = await supabaseAdmin.rpc('get_busy_slots', {
    p_barber_id: appointment.barber_id,
    p_from: startOfDay.toISOString(),
    p_to: endOfDay.toISOString(),
  });

  if (busyError) return 'No pudimos validar la disponibilidad.';

  const availability = getSlotAvailability({
    date: day,
    schedules,
    exceptions,
    busySlots,
    durationMin: appointment.duration_min,
    ignoreDate: appointment.date,
  });

  const selectedSlot = availability.find((slot) => slot.time === time);
  if (!selectedSlot?.available) return 'Ese horario no está disponible. Elegí otro.';

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as LookupBody;
    const result = await findAppointment(body);

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ appointment: publicAppointment(result.appointment) });
  } catch {
    return NextResponse.json({ error: 'Error inesperado al buscar la reserva.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = (await req.json()) as PatchBody;
    const result = await findAppointment(body);

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const appointment = result.appointment;
    if (!body.action) {
      return NextResponse.json({ error: 'Acción requerida.' }, { status: 400 });
    }

    if (!canModify(appointment)) {
      return NextResponse.json({ error: 'Esta reserva ya no se puede modificar.' }, { status: 400 });
    }

    const updatePayload: Record<string, unknown> = {};
    if (body.action === 'cancel') {
      updatePayload.status_id = 3;
      updatePayload.cancelled_at = new Date().toISOString();
      updatePayload.notes = body.notes || appointment.notes;
    }

    if (body.action === 'update_contact') {
      if (body.customer_name?.trim()) updatePayload.customer_name = body.customer_name.trim();
      if (body.customer_email?.trim()) updatePayload.customer_email = body.customer_email.trim().toLowerCase();
      if (body.customer_phone !== undefined) updatePayload.customer_phone = body.customer_phone?.trim() || null;
    }

    if (body.action === 'reschedule') {
      if (!body.date) {
        return NextResponse.json({ error: 'Elegí la nueva fecha y horario.' }, { status: 400 });
      }

      const validationError = await validateNewDate(appointment, body.date);
      if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

      updatePayload.date = body.date;
      updatePayload.rescheduled_from = appointment.date;
      if (body.customer_name?.trim()) updatePayload.customer_name = body.customer_name.trim();
      if (body.customer_email?.trim()) updatePayload.customer_email = body.customer_email.trim().toLowerCase();
      if (body.customer_phone !== undefined) updatePayload.customer_phone = body.customer_phone?.trim() || null;
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('appointments')
      .update(updatePayload)
      .eq('id', appointment.id)
      .select(appointmentSelect)
      .single();

    if (updateError) {
      if (updateError.code === '23P01' || updateError.code === '23505') {
        return NextResponse.json({ error: 'Ese horario acaba de ser reservado. Elegí otro.' }, { status: 409 });
      }

      return NextResponse.json({ error: 'No pudimos actualizar la reserva.' }, { status: 500 });
    }

    return NextResponse.json({ appointment: publicAppointment(updated) });
  } catch {
    return NextResponse.json({ error: 'Error inesperado al actualizar la reserva.' }, { status: 500 });
  }
}
