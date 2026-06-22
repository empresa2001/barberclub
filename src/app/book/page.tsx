'use client';

import { Calendar, Clock, MapPin, User, Phone, Mail, CheckCircle, ChevronLeft, ChevronRight, Scissors, Lock, TicketCheck, Search } from 'lucide-react';
import { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';

// ─── Wizard steps ───────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Barbería y barbero' },
  { id: 2, label: 'Servicio' },
  { id: 3, label: 'Fecha y hora' },
  { id: 4, label: 'Tus datos' },
];

export default function BookPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <svg className="animate-spin w-6 h-6 text-[#b02e2e]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    }>
      <BookContent />
    </Suspense>
  );
}

function BookContent() {
  const searchParams = useSearchParams();
  const lockedShopId = searchParams?.get('barbershop') ?? null;
  const lockedBarberId = searchParams?.get('barber') ?? null;

  const [currentStep, setCurrentStep] = useState(1);

  const [selectedBarbershop, setSelectedBarbershop] = useState('');
  const [selectedBarber, setSelectedBarber] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [barbershopSearch, setBarbershopSearch] = useState('');

  const [barbershops, setBarbershops] = useState<any[]>([]);
  const [barbers, setBarbers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [bookingCode, setBookingCode] = useState('');

  const [allTimeSlots, setAllTimeSlots] = useState<{ time: string; available: boolean }[]>([]);

  const filteredBarbershops = useMemo(() => {
    const q = barbershopSearch.trim().toLowerCase();
    if (!q) return barbershops;

    return barbershops.filter((shop) =>
      shop.name?.toLowerCase().includes(q) ||
      shop.location?.toLowerCase().includes(q) ||
      shop.phone?.toLowerCase().includes(q)
    );
  }, [barbershops, barbershopSearch]);

  const visibleBarbershopResults = useMemo(
    () => filteredBarbershops.slice(0, 24),
    [filteredBarbershops]
  );

  const selectedBarbershopData = useMemo(
    () => barbershops.find((shop) => shop.id.toString() === selectedBarbershop),
    [barbershops, selectedBarbershop]
  );
  const todayInputValue = getLocalDateInputValue();
  const selectedDateIsPast = isPastDate(selectedDate);
  const selectedSlotIsPast = !!selectedDate && !!selectedTime && isPastDateTime(selectedDate, selectedTime);

  // ── Cargar barberías ──────────────────────────────────────────────────────
  useEffect(() => {
    supabase.from('barbershops').select('*').order('name').then(({ data }) => {
      if (data) setBarbershops(data);
    });
  }, []);

  // ── Si viene una barbería en la URL, fijarla automáticamente ───────────────
  useEffect(() => {
    if (lockedShopId) setSelectedBarbershop(lockedShopId);
  }, [lockedShopId]);

  // ── Si viene un barbero en la URL, fijarlo cuando estén cargados ───────────
  useEffect(() => {
    if (lockedBarberId && barbers.some((b) => b.id.toString() === lockedBarberId)) {
      setSelectedBarber(lockedBarberId);
    }
  }, [lockedBarberId, barbers]);

  // ── Cargar barberos al cambiar barbería ───────────────────────────────────
  useEffect(() => {
    if (!selectedBarbershop) { setBarbers([]); return; }
    supabase
      .from('barbers')
      .select('id, user_id, users!barbers_user_id_fkey(name, email)')
      .eq('barbershop_id', selectedBarbershop)
      .then(({ data }) => { if (data) setBarbers(data); });
  }, [selectedBarbershop]);

  // ── Cargar servicios al cambiar barbería ──────────────────────────────────
  useEffect(() => {
    if (!selectedBarbershop) { setServices([]); return; }
    supabase
      .from('services')
      .select('*')
      .eq('barbershop_id', selectedBarbershop)
      .order('name')
      .then(({ data }) => { if (data) setServices(data); });
  }, [selectedBarbershop]);

  // ── Cargar slots disponibles ──────────────────────────────────────────────
  useEffect(() => {
    if (!selectedBarber || !selectedDate || !selectedService) {
      setAllTimeSlots([]);
      return;
    }
    if (isPastDate(selectedDate)) {
      setAllTimeSlots([]);
      setSlotsLoading(false);
      return;
    }

    let cancelled = false;

    const fetchSlots = async () => {
      setSlotsLoading(true);
      const dayOfWeek = getLocalDate(selectedDate).getDay();

      const { data: schedules, error: schedError } = await supabase
        .from('schedules')
        .select('from_time, to_time')
        .eq('barber_id', selectedBarber)
        .eq('day_of_week', dayOfWeek);

      if (cancelled) return;
      if (schedError || !schedules?.length) { setAllTimeSlots([]); setSlotsLoading(false); return; }

      const allSlots: string[] = [];
      schedules.forEach((sch: any) => {
        let [h, m] = sch.from_time.split(':').map(Number);
        const [endH, endM] = sch.to_time.split(':').map(Number);
        while (h < endH || (h === endH && m < endM)) {
          allSlots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
          m += 30;
          if (m >= 60) { h++; m = 0; }
        }
      });

      const selectedServiceObj = services.find((s) => s.id === selectedService);
      const serviceDuration = selectedServiceObj?.duration_min || 30;

      const { data: scheduleExceptions } = await supabase
        .from('schedule_exceptions')
        .select('from_time, to_time')
        .eq('barber_id', selectedBarber)
        .eq('date', selectedDate);

      if (cancelled) return;

      const dayBlocked = scheduleExceptions?.find((e: any) => e.from_time === null && e.to_time === null);
      if (dayBlocked) { setAllTimeSlots([]); setSlotsLoading(false); return; }

      const startOfDay = getLocalDate(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = getLocalDate(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: existingAppointments } = await supabase.rpc('get_busy_slots', {
        p_barber_id: selectedBarber,
        p_from: startOfDay.toISOString(),
        p_to: endOfDay.toISOString(),
      });

      if (cancelled) return;

      const slotsWithAvailability: { time: string; available: boolean }[] = [];

      for (const timeSlot of allSlots) {
        if (cancelled) return;
        let isAvailable = true;
        const slotsNeeded = Math.ceil(serviceDuration / 30);
        const currentIdx = allSlots.indexOf(timeSlot);

        for (let i = 0; i < slotsNeeded; i++) {
          const checkIdx = currentIdx + i;
          if (checkIdx >= allSlots.length) { isAvailable = false; break; }
          const checkSlot = allSlots[checkIdx];

          for (const exc of scheduleExceptions || []) {
            if (exc.from_time && exc.to_time) {
              const excFrom = exc.from_time.split(':').reduce((h: number, m: string) => h * 60 + parseInt(m), 0);
              const excTo = exc.to_time.split(':').reduce((h: number, m: string) => h * 60 + parseInt(m), 0);
              const slotMin = checkSlot.split(':').reduce((h: number, m: string) => h * 60 + parseInt(m), 0);
              if (slotMin >= excFrom && slotMin < excTo) { isAvailable = false; break; }
            }
          }
          if (!isAvailable) break;

          for (const apt of existingAppointments || []) {
            const existingDate = new Date(apt.date);
            if (existingDate.toISOString().split('T')[0] !== selectedDate) continue;
            const existingTime = `${existingDate.getUTCHours().toString().padStart(2, '0')}:${existingDate.getUTCMinutes().toString().padStart(2, '0')}`;
            if (existingTime === checkSlot) { isAvailable = false; break; }
            const existingSlotsNeeded = Math.ceil((apt.duration_min || 30) / 30);
            const existingIdx = allSlots.indexOf(existingTime);
            if (existingIdx !== -1 && checkIdx >= existingIdx && checkIdx < existingIdx + existingSlotsNeeded) {
              isAvailable = false; break;
            }
          }
          if (!isAvailable) break;
        }

        const slotDateTime = new Date(`${selectedDate}T${timeSlot}:00`);
        if (slotDateTime <= new Date()) isAvailable = false;

        slotsWithAvailability.push({ time: timeSlot, available: isAvailable });
      }

      if (!cancelled) { setAllTimeSlots(slotsWithAvailability); setSlotsLoading(false); }
    };

    fetchSlots();
    return () => { cancelled = true; };
  }, [selectedBarber, selectedDate, selectedService]);

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setLoading(true);

    try {
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim());
      if (!emailOk) { toast.error('Ingresá un email válido.'); setLoading(false); return; }

      if (customerPhone?.trim()) {
        const digits = customerPhone.replace(/[^\d]/g, '');
        if (digits.length < 8 || digits.length > 15) {
          toast.error('Ingresá un teléfono válido (8 a 15 dígitos).'); setLoading(false); return;
        }
      }

      const selectedSlot = allTimeSlots.find((s) => s.time === selectedTime);
      if (!selectedSlot?.available) {
        toast.error('El horario seleccionado no está disponible.'); setLoading(false); return;
      }

      if (isPastDateTime(selectedDate, selectedTime)) {
        toast.error('No podés reservar un horario pasado.'); setLoading(false); return;
      }

      const selectedServiceObj = services.find((s) => s.id === selectedService);
      if (!selectedServiceObj) { toast.error('Servicio no encontrado.'); setLoading(false); return; }

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barber_id: selectedBarber,
          service_id: selectedService,
          date: selectedDate,
          time: selectedTime,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone || null,
        }),
      });

      const result = await response.json().catch(() => null);
      setLoading(false);

      if (!response.ok) {
        toast.error(result?.error || 'Ocurrió un error al agendar. Intenta nuevamente.');
        return;
      }

      setBookingCode(result.booking_code);
      setSubmitted(true);
    } catch {
      toast.error('Error inesperado. Intenta nuevamente.');
      setLoading(false);
    }
  };

  // ── Handlers de navegación ────────────────────────────────────────────────
  const handleBarbershopChange = (id: string) => {
    setSelectedBarbershop(id);
    setSelectedBarber('');
    setSelectedService('');
    setSelectedTime('');
    setAllTimeSlots([]);
  };

  const handleBarberChange = (id: string) => {
    setSelectedBarber(id);
    setSelectedTime('');
    setAllTimeSlots([]);
  };

  const handleServiceChange = (id: string) => {
    setSelectedService(id);
    setSelectedTime('');
    setAllTimeSlots([]);
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSelectedTime('');
    if (isPastDate(date)) setAllTimeSlots([]);
  };

  const canAdvanceStep1 = !!selectedBarbershop && !!selectedBarber;
  const canAdvanceStep2 = !!selectedService;
  const canAdvanceStep3 = !!selectedDate && !selectedDateIsPast && !!selectedTime && !selectedSlotIsPast;
  const canAdvanceStep4 = !!customerName.trim() && !!customerEmail.trim();

  const canAdvance = [canAdvanceStep1, canAdvanceStep2, canAdvanceStep3, canAdvanceStep4];

  // ── Pantalla de éxito ─────────────────────────────────────────────────────
  if (submitted) {
    const shop = barbershops.find((s) => s.id.toString() === selectedBarbershop);
    const barber = barbers.find((b) => b.id.toString() === selectedBarber);
    const service = services.find((s) => s.id.toString() === selectedService);
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500/40 flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">¡Turno confirmado!</h1>
              <p className="text-gray-400">Te enviamos la confirmación a <span className="text-white">{customerEmail}</span></p>
            </div>
            {bookingCode && (
              <div className="rounded-2xl border border-[#b02e2e]/35 bg-[#b02e2e]/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b02e2e]">Código de reserva</p>
                <p className="mt-2 break-all text-2xl font-black text-white">{bookingCode}</p>
                <p className="mt-2 text-xs leading-relaxed text-gray-400">
                  Guardalo para cambiar o cancelar tu turno desde "Gestionar mi reserva".
                </p>
              </div>
            )}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-left space-y-3">
              <Detail icon={<MapPin className="w-4 h-4" />} label="Barbería" value={shop?.name || '—'} />
              <Detail icon={<User className="w-4 h-4" />} label="Barbero" value={barber?.users?.name || '—'} />
              <Detail icon={<Scissors className="w-4 h-4" />} label="Servicio" value={service?.name || '—'} />
              <Detail icon={<Calendar className="w-4 h-4" />} label="Fecha" value={formatDate(selectedDate)} />
              <Detail icon={<Clock className="w-4 h-4" />} label="Hora" value={selectedTime} />
            </div>
            <button
              onClick={() => {
                setSubmitted(false);
                setCurrentStep(1);
                setSelectedBarbershop(''); setSelectedBarber(''); setSelectedService('');
                setSelectedDate(''); setSelectedTime('');
                setCustomerName(''); setCustomerEmail(''); setCustomerPhone('');
                setBookingCode('');
                setAllTimeSlots([]);
              }}
              className="w-full py-3 rounded-xl border border-white/20 text-gray-300 hover:bg-white/5 transition-colors text-sm"
            >
              Agendar otro turno
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Layout principal ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col">
      <Navbar />

      <main className="flex-1 py-6 px-3 sm:px-6 sm:py-8">
        <div className="max-w-2xl mx-auto">

          {/* Encabezado */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-3xl font-bold text-white mb-1">Agendar turno</h1>
            <p className="text-gray-400 text-sm">Completá los pasos para reservar tu cita</p>
          </div>

          <Link
            href="/reserva"
            className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition-colors hover:border-[#b02e2e]/40 hover:bg-[#b02e2e]/10"
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-[#2e4a7d]/30 bg-[#2e4a7d]/15 text-[#2e4a7d]">
                <TicketCheck className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-white">¿Ya reservaste?</span>
                <span className="block text-xs leading-relaxed text-gray-400">Gestioná, cambiá o cancelá tu turno.</span>
              </span>
            </span>
            <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-500" />
          </Link>

          {/* Barra de pasos */}
          <StepBar
            steps={lockedShopId ? [{ id: 1, label: 'Tu barbero' }, ...STEPS.slice(1)] : STEPS}
            current={currentStep}
            canAdvance={canAdvance}
            onStepClick={(s) => { if (s < currentStep || canAdvance[s - 2]) setCurrentStep(s); }}
          />

          {/* Contenido del paso */}
          <div className="mt-5 sm:mt-6 bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-8 animate-fade-in-up">

            {/* PASO 1 — Barbería y barbero */}
            {currentStep === 1 && (
              <div className="space-y-6">
                {lockedShopId ? (
                  /* Barbería fijada desde su perfil */
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-[#b02e2e]/8 border border-[#b02e2e]/25">
                    <div className="w-10 h-10 rounded-xl bg-[#b02e2e]/15 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-[#b02e2e]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-semibold text-sm truncate">
                        {barbershops.find((s) => s.id.toString() === lockedShopId)?.name || 'Barbería seleccionada'}
                      </p>
                      <p className="text-gray-400 text-xs truncate">
                        {barbershops.find((s) => s.id.toString() === lockedShopId)?.location || 'Reservando en esta barbería'}
                      </p>
                    </div>
                    <span className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0 pt-0.5">
                      <Lock className="w-3 h-3" /> Fijada
                    </span>
                  </div>
                ) : (
                  <>
                    <StepTitle icon={<MapPin className="w-5 h-5 text-[#b02e2e]" />} title="Seleccioná la barbería" />
                    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(240px,320px)]">
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                        <input
                          type="search"
                          value={barbershopSearch}
                          onChange={(e) => setBarbershopSearch(e.target.value)}
                          placeholder="Buscar barbería..."
                          className="h-11 w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-3 text-sm text-white placeholder-gray-600 transition-colors focus:border-[#b02e2e]/60 focus:outline-none focus:ring-1 focus:ring-[#b02e2e]/60"
                        />
                      </div>
                      <select
                        value={selectedBarbershop}
                        onChange={(e) => handleBarbershopChange(e.target.value)}
                        className="h-11 w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-3 text-sm text-white transition-colors focus:border-[#b02e2e]/60 focus:outline-none focus:ring-1 focus:ring-[#b02e2e]/60"
                      >
                        <option value="">Elegir desde el desplegable</option>
                        {barbershops.map((shop) => (
                          <option key={shop.id} value={shop.id}>
                            {shop.name}{shop.location ? ` - ${shop.location}` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedBarbershopData && (
                      <div className="flex items-start gap-3 rounded-xl border border-[#b02e2e]/30 bg-[#b02e2e]/10 p-3">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#b02e2e]/15">
                          <CheckCircle className="h-4 w-4 text-[#b02e2e]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-white break-words">{selectedBarbershopData.name}</p>
                          <p className="mt-0.5 text-xs text-gray-400 break-words">
                            {selectedBarbershopData.location || 'Sin direccion cargada'}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="rounded-2xl border border-white/10 bg-white/3">
                      <div className="flex items-center justify-between gap-3 border-b border-white/8 px-3 py-2.5">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Resultados</p>
                        <span className="rounded-full bg-white/5 px-2 py-1 text-xs text-gray-500">
                          {filteredBarbershops.length} de {barbershops.length}
                        </span>
                      </div>

                      <div className="max-h-[320px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                        <div className="grid gap-2">
                          {visibleBarbershopResults.map((shop) => (
                            <SelectCard
                              key={shop.id}
                              active={selectedBarbershop === shop.id.toString()}
                              onClick={() => handleBarbershopChange(shop.id.toString())}
                              primary={shop.name}
                              secondary={shop.location}
                            />
                          ))}
                          {barbershops.length === 0 && <EmptySlot text="Cargando barberías..." />}
                          {barbershops.length > 0 && filteredBarbershops.length === 0 && (
                            <EmptySlot text="No encontramos barberías con esa búsqueda" />
                          )}
                        </div>
                      </div>

                      {filteredBarbershops.length > visibleBarbershopResults.length && (
                        <div className="border-t border-white/8 px-3 py-2 text-center text-xs text-gray-500">
                          Mostrando las primeras {visibleBarbershopResults.length}. Usá la búsqueda o el desplegable para afinar.
                        </div>
                      )}
                    </div>
                  </>
                )}

                {selectedBarbershop && lockedBarberId ? (
                  /* Barbero fijado desde su link */
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-[#2e4a7d]/8 border border-[#2e4a7d]/25">
                    <div className="w-10 h-10 rounded-xl bg-[#2e4a7d]/15 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-[#2e4a7d]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-semibold text-sm truncate">
                        {barbers.find((b) => b.id.toString() === lockedBarberId)?.users?.name || 'Tu barbero'}
                      </p>
                      <p className="text-gray-400 text-xs truncate">Reservando con este barbero</p>
                    </div>
                    <span className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0 pt-0.5">
                      <Lock className="w-3 h-3" /> Fijado
                    </span>
                  </div>
                ) : selectedBarbershop && (
                  <>
                    <StepTitle icon={<User className="w-5 h-5 text-[#b02e2e]" />} title="Seleccioná tu barbero" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {barbers.map((b) => (
                        <SelectCard
                          key={b.id}
                          active={selectedBarber === b.id.toString()}
                          onClick={() => handleBarberChange(b.id.toString())}
                          primary={b.users?.name || 'Sin nombre'}
                          secondary={b.users?.email}
                        />
                      ))}
                      {barbers.length === 0 && <EmptySlot text="No hay barberos disponibles" />}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* PASO 2 — Servicio */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <StepTitle icon={<Scissors className="w-5 h-5 text-[#b02e2e]" />} title="Elegí tu servicio" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {services.map((svc) => (
                    <button
                      key={svc.id}
                      type="button"
                      onClick={() => handleServiceChange(svc.id.toString())}
                      className={`text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                        selectedService === svc.id.toString()
                          ? 'border-[#b02e2e] bg-[#b02e2e]/10'
                          : 'border-white/10 bg-white/3 hover:border-white/25 hover:bg-white/8'
                      }`}
                    >
                      <p className="font-semibold text-white text-sm">{svc.name}</p>
                      <div className="flex items-center justify-between gap-3 mt-2">
                        <span className="text-xs text-gray-400">{svc.duration_min ? `${svc.duration_min} min` : ''}</span>
                        {svc.price && (
                          <span className={`text-sm font-bold ${selectedService === svc.id.toString() ? 'text-[#b02e2e]' : 'text-gray-300'}`}>
                            ${svc.price}
                          </span>
                        )}
                      </div>
                      {selectedService === svc.id.toString() && (
                        <div className="mt-2 flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#b02e2e]" />
                          <span className="text-xs text-[#b02e2e] font-medium">Seleccionado</span>
                        </div>
                      )}
                    </button>
                  ))}
                  {services.length === 0 && <EmptySlot text="No hay servicios disponibles" />}
                </div>
              </div>
            )}

            {/* PASO 3 — Fecha y hora */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <StepTitle icon={<Calendar className="w-5 h-5 text-[#b02e2e]" />} title="Elegí la fecha" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    min={todayInputValue}
                    className="mt-3 w-full sm:w-auto px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white focus:outline-none focus:border-[#b02e2e]/60 focus:ring-1 focus:ring-[#b02e2e]/60 transition-colors [color-scheme:dark]"
                    style={{ colorScheme: 'dark' }}
                  />
                  {selectedDateIsPast && (
                    <div className="mt-3 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3">
                      <p className="text-sm font-medium text-red-200">No podÃ©s reservar en una fecha pasada.</p>
                      <p className="mt-1 text-xs text-red-200/70">ElegÃ­ una fecha desde hoy en adelante.</p>
                    </div>
                  )}
                </div>

                {selectedDate && !selectedDateIsPast && (
                  <div>
                    <StepTitle icon={<Clock className="w-5 h-5 text-[#b02e2e]" />} title="Elegí el horario" />

                    {slotsLoading && (
                      <div className="mt-3 flex items-center gap-2 text-gray-400 text-sm">
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Verificando disponibilidad...
                      </div>
                    )}

                    {!slotsLoading && allTimeSlots.length === 0 && selectedDate && (
                      <div className="mt-3 p-4 rounded-xl bg-red-500/8 border border-red-500/20 text-center">
                        <p className="text-red-300 text-sm font-medium">El barbero no trabaja este día</p>
                        <p className="text-red-400/70 text-xs mt-1">Probá con otra fecha</p>
                      </div>
                    )}

                    {!slotsLoading && allTimeSlots.length > 0 && (
                      <>
                        {/* Leyenda */}
                        <div className="mt-3 mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-400">
                          <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded bg-[#2e4a7d]/40 border border-[#2e4a7d]" />
                            Disponible
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded bg-white/5 border border-white/10" />
                            Ocupado
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded bg-[#b02e2e]/40 border border-[#b02e2e]" />
                            Seleccionado
                          </span>
                        </div>

                        {/* Grilla de slots */}
                        <div className="grid grid-cols-3 min-[380px]:grid-cols-4 sm:grid-cols-6 gap-2">
                          {allTimeSlots.map((slot) => {
                            const isSelected = selectedTime === slot.time;
                            const isAvailable = slot.available;
                            return (
                              <button
                                key={slot.time}
                                type="button"
                                disabled={!isAvailable}
                                onClick={() => isAvailable && setSelectedTime(slot.time)}
                                title={!isAvailable ? 'Ocupado' : undefined}
                                className={`
                                  relative min-h-11 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                                  ${isSelected
                                    ? 'bg-[#b02e2e]/40 border-2 border-[#b02e2e] text-white'
                                    : isAvailable
                                      ? 'bg-[#2e4a7d]/20 border border-[#2e4a7d]/50 text-white hover:bg-[#2e4a7d]/40 hover:border-[#2e4a7d] cursor-pointer'
                                      : 'bg-white/3 border border-white/8 text-white/20 cursor-not-allowed'
                                  }
                                `}
                              >
                                {!isAvailable && (
                                  <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <span className="w-full h-px bg-white/15 rotate-[-10deg] block absolute" />
                                  </span>
                                )}
                                <span className={!isAvailable ? 'opacity-30' : ''}>{slot.time}</span>
                              </button>
                            );
                          })}
                        </div>

                        {allTimeSlots.every((s) => !s.available) && (
                          <p className="mt-4 text-center text-sm text-yellow-300/70">Todos los horarios están ocupados. Probá con otra fecha.</p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* PASO 4 — Datos del cliente */}
            {currentStep === 4 && (
              <div className="space-y-5">
                <StepTitle icon={<User className="w-5 h-5 text-[#b02e2e]" />} title="Tus datos de contacto" />

                {/* Resumen de la reserva */}
                <div className="p-4 rounded-xl bg-white/4 border border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <Detail icon={<MapPin className="w-3.5 h-3.5" />} label="Barbería" value={barbershops.find((s) => s.id.toString() === selectedBarbershop)?.name || '—'} compact />
                  <Detail icon={<User className="w-3.5 h-3.5" />} label="Barbero" value={barbers.find((b) => b.id.toString() === selectedBarber)?.users?.name || '—'} compact />
                  <Detail icon={<Scissors className="w-3.5 h-3.5" />} label="Servicio" value={services.find((s) => s.id.toString() === selectedService)?.name || '—'} compact />
                  <Detail icon={<Clock className="w-3.5 h-3.5" />} label="Turno" value={`${formatDate(selectedDate)} ${selectedTime}`} compact />
                </div>

                <Input
                  label="Nombre completo"
                  placeholder="Juan Pérez"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="tu@email.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  helperText="Te enviaremos la confirmación del turno"
                  required
                />
                <Input
                  label="Teléfono"
                  type="tel"
                  placeholder="+54 11 1234-5678"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  helperText="Opcional — para contactarte si hace falta"
                />
              </div>
            )}
          </div>

          {/* Navegación entre pasos */}
          <div className="mt-6 flex items-center justify-between gap-3">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((s) => s - 1)}
                className="flex min-h-11 flex-1 items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/15 text-gray-300 hover:bg-white/5 transition-colors text-sm sm:flex-none"
              >
                <ChevronLeft className="w-4 h-4" /> Anterior
              </button>
            ) : <span />}

            {currentStep < 4 ? (
              <button
                type="button"
                disabled={!canAdvance[currentStep - 1]}
                onClick={() => setCurrentStep((s) => s + 1)}
                className="flex min-h-11 flex-1 items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#b02e2e] text-white font-medium text-sm hover:bg-[#b02e2e]/85 transition-colors disabled:opacity-40 disabled:cursor-not-allowed sm:flex-none sm:px-6"
              >
                Siguiente <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={!canAdvanceStep4 || loading}
                onClick={handleSubmit}
                className="flex min-h-11 flex-1 items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#b02e2e] text-white font-semibold text-sm hover:bg-[#b02e2e]/85 transition-colors disabled:opacity-40 disabled:cursor-not-allowed sm:flex-none sm:px-6"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Agendando...
                  </>
                ) : (
                  <>Confirmar turno <CheckCircle className="w-4 h-4" /></>
                )}
              </button>
            )}
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}

// ─── Sub-componentes ─────────────────────────────────────────────────────────

function StepBar({ steps, current, canAdvance, onStepClick }: {
  steps: { id: number; label: string }[];
  current: number;
  canAdvance: boolean[];
  onStepClick: (s: number) => void;
}) {
  return (
    <div className="flex items-center gap-0">
      {steps.map((step, idx) => {
        const done = step.id < current;
        const active = step.id === current;
        const clickable = done || (step.id > 1 && canAdvance[step.id - 2]);
        return (
          <div key={step.id} className="flex items-center flex-1 min-w-0">
            <button
              type="button"
              onClick={() => clickable && onStepClick(step.id)}
              className={`flex min-h-10 flex-col items-center gap-1.5 flex-1 min-w-0 transition-opacity ${clickable ? 'cursor-pointer' : 'cursor-default'} ${!active && !done ? 'opacity-40' : ''}`}
            >
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                done ? 'bg-[#b02e2e] border-[#b02e2e] text-white' :
                active ? 'bg-transparent border-[#b02e2e] text-[#b02e2e]' :
                'bg-transparent border-white/20 text-gray-500'
              }`}>
                {done ? <CheckCircle className="w-4 h-4" /> : step.id}
              </div>
              <span className={`text-xs text-center leading-tight hidden sm:block ${active ? 'text-white font-medium' : done ? 'text-gray-400' : 'text-gray-600'}`}>
                {step.label}
              </span>
            </button>
            {idx < steps.length - 1 && (
              <div className={`h-px flex-1 mx-0.5 sm:mx-1 max-w-[24px] sm:max-w-[32px] transition-colors ${done ? 'bg-[#b02e2e]/50' : 'bg-white/10'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function StepTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-start gap-2 mb-1">
      {icon}
      <h2 className="text-white font-semibold text-base leading-tight">{title}</h2>
    </div>
  );
}

function SelectCard({ active, onClick, primary, secondary }: {
  active: boolean; onClick: () => void; primary: string; secondary?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[64px] text-left p-3 rounded-xl border transition-all duration-150 w-full ${
        active ? 'border-[#b02e2e] bg-[#b02e2e]/10' : 'border-white/10 bg-white/3 hover:border-white/25 hover:bg-white/8'
      }`}
    >
      <p className="font-semibold text-white text-sm leading-snug break-words">{primary}</p>
      {secondary && <p className="text-xs text-gray-400 mt-0.5 break-words">{secondary}</p>}
      {active && (
        <div className="mt-2 flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#b02e2e]" />
          <span className="text-xs text-[#b02e2e] font-medium">Seleccionado</span>
        </div>
      )}
    </button>
  );
}

function EmptySlot({ text }: { text: string }) {
  return (
    <div className="col-span-full p-4 rounded-xl bg-white/3 border border-white/8 text-center">
      <p className="text-gray-500 text-sm italic">{text}</p>
    </div>
  );
}

function Detail({ icon, label, value, compact }: { icon: React.ReactNode; label: string; value: string; compact?: boolean }) {
  return (
    <div className={`flex items-start gap-2 ${compact ? '' : 'py-1 border-b border-white/5 last:border-0'}`}>
      <span className="text-gray-500 mt-0.5 flex-shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-gray-500 text-xs">{label}</p>
        <p className="text-white text-xs font-medium break-words">{value}</p>
      </div>
    </div>
  );
}

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function getLocalDateInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getLocalDate(dateStr: string) {
  return new Date(`${dateStr}T00:00:00`);
}

function isPastDate(dateStr: string) {
  if (!dateStr) return false;
  return getLocalDate(dateStr) < getLocalDate(getLocalDateInputValue());
}

function isPastDateTime(dateStr: string, timeStr: string) {
  const selectedDateTime = new Date(`${dateStr}T${timeStr}:00`);
  return Number.isNaN(selectedDateTime.getTime()) || selectedDateTime <= new Date();
}
