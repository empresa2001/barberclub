import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin.server';
import { getSlotAvailability } from '@/lib/bookingAvailability';

export const runtime = 'nodejs';

type AppointmentBody = {
  barber_id?: string;
  service_id?: string;
  date?: string;
  time?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string | null;
};

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function isPastDateTime(date: string, time: string) {
  const parsed = new Date(`${date}T${time}:00`);
  return Number.isNaN(parsed.getTime()) || parsed <= new Date();
}

function missingBookingCodeColumn(error: any) {
  return ['PGRST204', '42703'].includes(error?.code) && String(error.message || '').includes('booking_code');
}

function migrationRequiredResponse() {
  return errorResponse(
    'Falta aplicar la migracion de codigos de reserva. Ejecuta database/migration-booking-code-required.sql en Supabase SQL Editor.',
    500
  );
}

async function ensureBookingCodeSchema() {
  const { error } = await supabaseAdmin
    .from('appointments')
    .select('booking_code')
    .limit(1);

  return error;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AppointmentBody;
    const barberId = text(body.barber_id);
    const serviceId = text(body.service_id);
    const date = text(body.date);
    const time = text(body.time);
    const customerName = text(body.customer_name);
    const customerEmail = text(body.customer_email).toLowerCase();
    const customerPhone = text(body.customer_phone);

    if (!barberId || !serviceId || !date || !time || !customerName || !customerEmail) {
      return errorResponse('Faltan datos obligatorios para crear el turno.', 400);
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
      return errorResponse('La fecha u hora no es valida.', 400);
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      return errorResponse('Ingresa un email valido.', 400);
    }

    if (customerPhone) {
      const digits = customerPhone.replace(/[^\d]/g, '');
      if (digits.length < 8 || digits.length > 15) {
        return errorResponse('Ingresa un telefono valido.', 400);
      }
    }

    if (isPastDateTime(date, time)) {
      return errorResponse('No podes reservar un horario pasado.', 400);
    }

    const schemaError = await ensureBookingCodeSchema();
    if (missingBookingCodeColumn(schemaError)) return migrationRequiredResponse();
    if (schemaError) return errorResponse('No pudimos validar la configuracion de reservas.', 500);

    const { data: service, error: serviceError } = await supabaseAdmin
      .from('services')
      .select('id, barbershop_id, duration_min')
      .eq('id', serviceId)
      .maybeSingle();

    if (serviceError) return errorResponse('No pudimos validar el servicio.', 500);
    if (!service) return errorResponse('Servicio no encontrado.', 404);

    const { data: barber, error: barberError } = await supabaseAdmin
      .from('barbers')
      .select('id, barbershop_id')
      .eq('id', barberId)
      .maybeSingle();

    if (barberError) return errorResponse('No pudimos validar el barbero.', 500);
    if (!barber) return errorResponse('Barbero no encontrado.', 404);
    if (String(barber.barbershop_id) !== String(service.barbershop_id)) {
      return errorResponse('El servicio no pertenece a la barberia del barbero.', 400);
    }

    const dayOfWeek = new Date(`${date}T00:00:00`).getDay();
    const { data: schedules, error: schedulesError } = await supabaseAdmin
      .from('schedules')
      .select('from_time, to_time')
      .eq('barber_id', barberId)
      .eq('day_of_week', dayOfWeek);

    if (schedulesError) return errorResponse('No pudimos validar la agenda del barbero.', 500);
    if (!schedules?.length) return errorResponse('El barbero no trabaja en esa fecha.', 400);

    const { data: exceptions, error: exceptionsError } = await supabaseAdmin
      .from('schedule_exceptions')
      .select('from_time, to_time')
      .eq('barber_id', barberId)
      .eq('date', date);

    if (exceptionsError) return errorResponse('No pudimos validar excepciones de agenda.', 500);

    const startOfDay = new Date(`${date}T00:00:00`);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(`${date}T00:00:00`);
    endOfDay.setHours(23, 59, 59, 999);

    const { data: busySlots, error: busyError } = await supabaseAdmin.rpc('get_busy_slots', {
      p_barber_id: barberId,
      p_from: startOfDay.toISOString(),
      p_to: endOfDay.toISOString(),
    });

    if (busyError) return errorResponse('No pudimos validar disponibilidad.', 500);

    const availability = getSlotAvailability({
      date,
      schedules,
      exceptions,
      busySlots,
      durationMin: service.duration_min || 30,
    });

    const selectedSlot = availability.find((slot) => slot.time === time);
    if (!selectedSlot?.available) {
      return errorResponse('El horario seleccionado no esta disponible.', 409);
    }

    const { data: appointment, error: insertError } = await supabaseAdmin
      .from('appointments')
      .insert({
        barber_id: barberId,
        service_id: serviceId,
        date: `${date}T${time}:00`,
        duration_min: service.duration_min || 30,
        status_id: 2,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone || null,
      })
      .select('id, booking_code')
      .single();

    if (missingBookingCodeColumn(insertError) || insertError?.code === '23502') {
      return migrationRequiredResponse();
    }

    if (insertError?.code === '23P01') {
      return errorResponse('Ese horario acaba de ser reservado. Por favor elegi otro.', 409);
    }

    if (insertError) {
      return errorResponse('No pudimos crear el turno. Proba nuevamente.', 500);
    }

    if (!appointment?.booking_code) return migrationRequiredResponse();

    return NextResponse.json({
      id: appointment.id,
      booking_code: appointment.booking_code,
    });
  } catch {
    return errorResponse('Error inesperado al crear el turno.', 500);
  }
}
