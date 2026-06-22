'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowLeft, Calendar, CheckCircle, Clock, Mail, Phone, Save, Search, Scissors, TicketCheck, Trash2, User, XCircle } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';
import { getSlotAvailability, type TimeSlotAvailability } from '@/lib/bookingAvailability';

const inputClass = 'w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-600 transition-colors focus:border-[#b02e2e]/60 focus:outline-none focus:ring-1 focus:ring-[#b02e2e]/60';

type Reservation = {
  id: string;
  date: string;
  duration_min: number;
  status_id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  booking_code: string;
  barber_id: string;
  service_id: string;
  can_modify: boolean;
  modify_block_reason?: 'cancelled' | 'completed' | 'past' | null;
  services?: { id: string; name: string; price: number | null; duration_min: number | null } | null;
  appointment_status?: { id: number; name: string } | null;
  barbers?: {
    id: string;
    barbershop_id: string;
    users?: { name: string | null; email: string | null } | null;
    barbershops?: { id: string; name: string; location: string | null; phone: string | null } | null;
  } | null;
};

function dateInputFromIso(date: string) {
  return new Date(date).toISOString().split('T')[0];
}

function timeInputFromIso(date: string) {
  const parsed = new Date(date);
  return `${parsed.getUTCHours().toString().padStart(2, '0')}:${parsed.getUTCMinutes().toString().padStart(2, '0')}`;
}

function formatDateTime(date: string) {
  const parsed = new Date(date);
  return parsed.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusLabel(statusId: number, statusName?: string | null) {
  if (statusId === 3) return 'Cancelado';
  if (statusId === 4) return 'Completado';
  if (statusId === 2) return 'Confirmado';
  return statusName || 'Pendiente';
}

function modifyWarningText(reservation: Reservation) {
  if (reservation.modify_block_reason === 'cancelled') return 'Esta reserva no se puede modificar porque está cancelada.';
  if (reservation.modify_block_reason === 'completed') return 'Esta reserva no se puede modificar porque ya fue completada.';
  if (reservation.modify_block_reason === 'past') return 'Esta reserva no se puede modificar porque el horario ya pasó.';
  return 'Esta reserva no se puede modificar.';
}

export default function ManageReservationPage() {
  const [bookingCode, setBookingCode] = useState('');
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [editMode, setEditMode] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [slots, setSlots] = useState<TimeSlotAvailability[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const canModify = !!reservation?.can_modify;

  const statusClasses = useMemo(() => {
    if (!reservation) return 'border-white/10 bg-white/5 text-gray-300';
    if (reservation.status_id === 3) return 'border-red-500/30 bg-red-500/10 text-red-300';
    if (reservation.status_id === 4) return 'border-green-500/30 bg-green-500/10 text-green-300';
    if (reservation.status_id === 2) return 'border-[#2e4a7d]/40 bg-[#2e4a7d]/20 text-blue-200';
    return 'border-yellow-500/30 bg-yellow-500/10 text-yellow-200';
  }, [reservation]);

  useEffect(() => {
    if (!reservation || !editMode || !selectedDate) {
      setSlots([]);
      return;
    }

    let cancelled = false;

    const loadSlots = async () => {
      setSlotsLoading(true);
      const dayOfWeek = new Date(`${selectedDate}T00:00:00`).getDay();

      const { data: schedules, error: schedulesError } = await supabase
        .from('schedules')
        .select('from_time, to_time')
        .eq('barber_id', reservation.barber_id)
        .eq('day_of_week', dayOfWeek);

      if (cancelled) return;
      if (schedulesError || !schedules?.length) {
        setSlots([]);
        setSlotsLoading(false);
        return;
      }

      const { data: exceptions } = await supabase
        .from('schedule_exceptions')
        .select('from_time, to_time')
        .eq('barber_id', reservation.barber_id)
        .eq('date', selectedDate);

      const startOfDay = new Date(`${selectedDate}T00:00:00`);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(`${selectedDate}T00:00:00`);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: busySlots } = await supabase.rpc('get_busy_slots', {
        p_barber_id: reservation.barber_id,
        p_from: startOfDay.toISOString(),
        p_to: endOfDay.toISOString(),
      });

      if (cancelled) return;

      const availability = getSlotAvailability({
        date: selectedDate,
        schedules,
        exceptions,
        busySlots,
        durationMin: reservation.duration_min,
        ignoreDate: reservation.date,
      }).map((slot) => ({
        ...slot,
        available: slot.available && new Date(`${selectedDate}T${slot.time}:00`) > new Date(),
      }));

      setSlots(availability);
      setSlotsLoading(false);
    };

    loadSlots();
    return () => { cancelled = true; };
  }, [editMode, reservation, selectedDate]);

  const hydrateEditState = (appointment: Reservation) => {
    setSelectedDate(dateInputFromIso(appointment.date));
    setSelectedTime(timeInputFromIso(appointment.date));
    setCustomerName(appointment.customer_name || '');
    setCustomerEmail(appointment.customer_email || '');
    setCustomerPhone(appointment.customer_phone || '');
  };

  const handleLookup = async () => {
    setLoading(true);
    setError('');
    setReservation(null);
    setEditMode(false);

    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_code: bookingCode }),
      });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error || 'No pudimos encontrar la reserva.');
        return;
      }

      setReservation(payload.appointment);
      hydrateEditState(payload.appointment);
    } catch {
      setError('Error inesperado al buscar la reserva.');
    } finally {
      setLoading(false);
    }
  };

  const patchReservation = async (body: Record<string, unknown>, successMessage: string) => {
    setSaving(true);
    setError('');

    try {
      const response = await fetch('/api/reservations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_code: reservation?.booking_code || bookingCode,
          ...body,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error || 'No pudimos actualizar la reserva.');
        toast.error(payload.error || 'No pudimos actualizar la reserva.');
        return;
      }

      setReservation(payload.appointment);
      hydrateEditState(payload.appointment);
      setEditMode(false);
      toast.success(successMessage);
    } catch {
      setError('Error inesperado al actualizar la reserva.');
      toast.error('Error inesperado al actualizar la reserva.');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!reservation) return;

    const nextDate = `${selectedDate}T${selectedTime}:00`;
    const dateChanged = nextDate !== `${dateInputFromIso(reservation.date)}T${timeInputFromIso(reservation.date)}:00`;

    if (!customerName.trim() || !customerEmail.trim()) {
      toast.error('Nombre y email son obligatorios.');
      return;
    }

    if (dateChanged) {
      const selectedSlot = slots.find((slot) => slot.time === selectedTime);
      if (!selectedSlot?.available) {
        toast.error('Elegí un horario disponible.');
        return;
      }
    }

    await patchReservation({
      action: dateChanged ? 'reschedule' : 'update_contact',
      date: dateChanged ? nextDate : undefined,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone || null,
    }, dateChanged ? 'Turno reprogramado.' : 'Datos actualizados.');
  };

  const handleCancel = async () => {
    if (!reservation || !canModify) return;
    await patchReservation({ action: 'cancel' }, 'Reserva cancelada. El horario quedó liberado.');
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col">
      <Navbar />

      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto w-full max-w-3xl">
          <Link href="/book" className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Volver a reservar
          </Link>

          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#b02e2e]/25 bg-[#b02e2e]/10">
              <TicketCheck className="h-6 w-6 text-[#b02e2e]" />
            </div>
            <h1 className="text-2xl font-black text-white sm:text-3xl">Gestionar mi reserva</h1>
            <p className="mt-2 text-sm leading-relaxed text-gray-400">
              Ingresá el código de reserva para encontrar tu turno.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
              <Field label="Código de reserva">
                <input
                  type="text"
                  value={bookingCode}
                  onChange={(event) => setBookingCode(event.target.value.toUpperCase())}
                  placeholder="BC-1A2B3C4D"
                  className={`${inputClass} uppercase`}
                />
              </Field>

              <button
                type="button"
                disabled={loading}
                onClick={handleLookup}
                className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#b02e2e] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#b02e2e]/85 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Search className="h-4 w-4" />
                {loading ? 'Buscando...' : 'Buscar'}
              </button>
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-200">
                {error}
              </div>
            )}
          </div>

          {reservation && (
            <section className="mt-6 rounded-2xl border border-white/10 bg-[#111]/70 p-4 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#b02e2e]">{reservation.booking_code}</p>
                  <h2 className="mt-2 text-xl font-bold text-white">{reservation.services?.name || 'Servicio'}</h2>
                  <p className="mt-1 text-sm text-gray-400">{reservation.barbers?.barbershops?.name || 'BarberClub'}</p>
                </div>
                <span className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${statusClasses}`}>
                  {reservation.status_id === 3 ? <XCircle className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" />}
                  {statusLabel(reservation.status_id, reservation.appointment_status?.name)}
                </span>
              </div>

              {!canModify && (
                <div className="mt-4 rounded-xl border border-yellow-500/25 bg-yellow-500/10 p-3 text-sm text-yellow-100">
                  {modifyWarningText(reservation)}
                </div>
              )}

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Info icon={<Calendar />} label="Fecha y hora" value={formatDateTime(reservation.date)} />
                <Info icon={<Clock />} label="Duración" value={`${reservation.duration_min} min`} />
                <Info icon={<User />} label="Barbero" value={reservation.barbers?.users?.name || 'Sin asignar'} />
                <Info icon={<Scissors />} label="Servicio" value={reservation.services?.name || 'Servicio'} />
                <Info icon={<Mail />} label="Email" value={reservation.customer_email} />
                <Info icon={<Phone />} label="Teléfono" value={reservation.customer_phone || 'No informado'} />
              </div>

              {editMode && canModify && (
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <h3 className="text-sm font-semibold text-white">Editar reserva</h3>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <Field label="Nombre">
                      <input className={inputClass} value={customerName} onChange={(event) => setCustomerName(event.target.value)} />
                    </Field>
                    <Field label="Email">
                      <input className={inputClass} type="email" value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} />
                    </Field>
                    <Field label="Teléfono">
                      <input className={inputClass} type="tel" value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} />
                    </Field>
                    <Field label="Fecha">
                      <input
                        className={`${inputClass} [color-scheme:dark]`}
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={selectedDate}
                        onChange={(event) => {
                          setSelectedDate(event.target.value);
                          setSelectedTime('');
                        }}
                      />
                    </Field>
                  </div>

                  <div className="mt-5">
                    <p className="mb-3 text-sm font-medium text-white">Horario</p>
                    {slotsLoading && <p className="text-sm text-gray-400">Verificando disponibilidad...</p>}
                    {!slotsLoading && slots.length === 0 && <p className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-gray-400">No hay horarios disponibles para esa fecha.</p>}
                    {!slotsLoading && slots.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 min-[380px]:grid-cols-4 sm:grid-cols-6">
                        {slots.map((slot) => {
                          const selected = selectedTime === slot.time;
                          return (
                            <button
                              key={slot.time}
                              type="button"
                              disabled={!slot.available}
                              onClick={() => setSelectedTime(slot.time)}
                              className={`min-h-11 rounded-lg border px-2 py-2 text-sm font-semibold transition-colors ${
                                selected
                                  ? 'border-[#b02e2e] bg-[#b02e2e]/35 text-white'
                                  : slot.available
                                    ? 'border-[#2e4a7d]/50 bg-[#2e4a7d]/20 text-white hover:bg-[#2e4a7d]/35'
                                    : 'cursor-not-allowed border-white/10 bg-white/5 text-white/25'
                              }`}
                            >
                              {slot.time}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-6 grid gap-3 sm:flex sm:justify-end">
                {canModify && !editMode && (
                  <button
                    type="button"
                    onClick={() => setEditMode(true)}
                    className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#2e4a7d]/45 bg-[#2e4a7d]/20 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#2e4a7d]/35"
                  >
                    <Calendar className="h-4 w-4" />
                    Cambiar turno
                  </button>
                )}

                {canModify && editMode && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        hydrateEditState(reservation);
                        setEditMode(false);
                      }}
                      className="flex min-h-11 items-center justify-center rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-gray-300 transition-colors hover:bg-white/5"
                    >
                      Descartar
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={handleSave}
                      className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#b02e2e] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#b02e2e]/85 disabled:opacity-50"
                    >
                      <Save className="h-4 w-4" />
                      Guardar cambios
                    </button>
                  </>
                )}

                {canModify && (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleCancel}
                    className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Cancelar reserva
                  </button>
                )}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-white">{label}</span>
      {children}
    </label>
  );
}

function Info({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
      <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white/5 text-gray-400 [&>svg]:h-4 [&>svg]:w-4">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="break-words text-sm font-medium text-white">{value}</p>
      </div>
    </div>
  );
}
