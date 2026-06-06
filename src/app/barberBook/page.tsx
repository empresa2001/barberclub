"use client"
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { schedulesApi, appointmentsApi } from "@/lib/api";
import { Card, Button, Input } from "@/components/ui";

// Días de la semana
const DAYS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];


type Interval = {
  from: string; // "10:00"
  to: string;   // "18:00"
};

type ScheduleUI = {
  day: string;
  intervals: Interval[];
};

type ExceptionUI = {
  id: string;
  date: string; // YYYY-MM-DD
  intervals: Interval[]; // Si está vacío, el día está bloqueado
};

// Helper para mostrar el estado textual si appointment_status es null
function getStatusText(statusId: number) {
  if (statusId === 1) return 'Pendiente';
  if (statusId === 2) return 'Confirmado';
  if (statusId === 3) return 'Cancelado';
  if (statusId === 4) return 'Completado';
  return 'Desconocido';
}
export default function BarberBookPage() {

  const { user, loading: authLoading } = useAuth();
  const [barberId, setBarberId] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<ScheduleUI[]>(DAYS.map((day) => ({ day, intervals: [] })));
  const [selectedDay, setSelectedDay] = useState<string>(DAYS[0]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);
  // Excepciones de horario (bloqueos o cambios para días específicos)
  const [exceptions, setExceptions] = useState<ExceptionUI[]>([]);
  const [exceptionDate, setExceptionDate] = useState("");
  const [exceptionFrom, setExceptionFrom] = useState("");
  const [exceptionTo, setExceptionTo] = useState("");
  const [exceptionIntervals, setExceptionIntervals] = useState<Interval[]>([]);
  const [savingException, setSavingException] = useState(false);

  // Obtener barber_id del usuario logueado
  useEffect(() => {
    const fetchBarberId = async () => {
      if (!user) return;
      // Buscar barber_id en la tabla users
      const { data, error } = await (await import("@/lib/supabase")).supabase
        .from("users")
        .select("barber_id")
        .eq("id", user.id)
        .single();
      if (data?.barber_id) setBarberId(data.barber_id);
    };
    fetchBarberId();
  }, [user]);

  // Cargar horarios, turnos y excepciones del barbero
  useEffect(() => {
    const fetchData = async () => {
      if (!barberId) return;
      setLoading(true);

      // 1. Horarios
      const dbSchedules = await schedulesApi.getByBarber(barberId);

      // Agrupar por día
      const grouped: Record<string, Interval[]> = {};
      for (const s of dbSchedules) {
        const day = DAYS[s.day_of_week ?? 0] || DAYS[0];
        if (!grouped[day]) grouped[day] = [];
        grouped[day].push({ from: s.from_time, to: s.to_time });
      }
      setSchedules(DAYS.map((day, i) => ({ day, intervals: grouped[day] || [] })));

      // 2. Excepciones
      const { data: dbExceptions, error: exError } = await (await import("@/lib/supabase")).supabase
        .from("schedule_exceptions")
        .select("id,date,from_time,to_time")
        .eq("barber_id", barberId)
        .order("date", { ascending: true });
      // Agrupar excepciones por fecha
      const groupedExceptions: Record<string, Interval[]> = {};
      if (dbExceptions) {
        for (const ex of dbExceptions) {
          if (!groupedExceptions[ex.date]) groupedExceptions[ex.date] = [];
          if (ex.from_time && ex.to_time) {
            groupedExceptions[ex.date].push({ from: ex.from_time, to: ex.to_time });
          }
        }
      }
      setExceptions(
        dbExceptions
          ? Array.from(new Set(dbExceptions.map((e: any) => e.date))).map((date) => ({
              id: dbExceptions.find((e: any) => e.date === date)?.id ?? "",
              date,
              intervals: groupedExceptions[date],
            }))
          : []
      );

      // 3. Turnos
      const dbAppointments = await appointmentsApi.getByBarber(barberId, 30);
      setAppointments(dbAppointments || []);
      setLoading(false);
    };
    if (barberId) fetchData();
  }, [barberId]);
  // Agregar intervalo a la excepción (UI)
  const handleAddExceptionInterval = () => {
    if (!exceptionFrom || !exceptionTo) return;
    setExceptionIntervals((prev) => [...prev, { from: exceptionFrom, to: exceptionTo }]);
    setExceptionFrom("");
    setExceptionTo("");
  };

  // Eliminar intervalo de excepción (UI)
  const handleDeleteExceptionInterval = (idx: number) => {
    setExceptionIntervals((prev) => prev.filter((_, i) => i !== idx));
  };

  // Guardar excepción (bloquear día o definir horario especial)
  const handleSaveException = async () => {
    if (!barberId || !exceptionDate) return;
    setSavingException(true);
    // 1. Borrar excepciones existentes para ese día/barbero
    await (await import("@/lib/supabase")).supabase
      .from("schedule_exceptions")
      .delete()
      .eq("barber_id", barberId)
      .eq("date", exceptionDate);
    // 2. Insertar nuevas excepciones (si intervals vacío, es bloqueo total)
    if (exceptionIntervals.length > 0) {
      const inserts = exceptionIntervals.map((interval) => ({
        barber_id: barberId,
        date: exceptionDate,
        from_time: interval.from,
        to_time: interval.to,
      }));
      await (await import("@/lib/supabase")).supabase
        .from("schedule_exceptions")
        .insert(inserts);
    } else {
      // Insertar un registro vacío para bloquear todo el día
      await (await import("@/lib/supabase")).supabase
        .from("schedule_exceptions")
        .insert({ barber_id: barberId, date: exceptionDate });
    }
    setExceptionDate("");
    setExceptionIntervals([]);
    setSavingException(false);
    // Refrescar excepciones
    const { data: dbExceptions } = await (await import("@/lib/supabase")).supabase
      .from("schedule_exceptions")
      .select("id,date,from_time,to_time")
      .eq("barber_id", barberId)
      .order("date", { ascending: true });
    // Agrupar excepciones por fecha
    const groupedExceptions: Record<string, Interval[]> = {};
    if (dbExceptions) {
      for (const ex of dbExceptions) {
        if (!groupedExceptions[ex.date]) groupedExceptions[ex.date] = [];
        if (ex.from_time && ex.to_time) {
          groupedExceptions[ex.date].push({ from: ex.from_time, to: ex.to_time });
        }
      }
    }
    setExceptions(
      dbExceptions
        ? Array.from(new Set(dbExceptions.map((e: any) => e.date))).map((date) => ({
            id: dbExceptions.find((e: any) => e.date === date)?.id ?? "",
            date,
            intervals: groupedExceptions[date],
          }))
        : []
    );
  };

  // Eliminar excepción
  const handleDeleteException = async (date: string) => {
    if (!barberId) return;
    await (await import("@/lib/supabase")).supabase
      .from("schedule_exceptions")
      .delete()
      .eq("barber_id", barberId)
      .eq("date", date);
    setExceptions((prev) => prev.filter((e) => e.date !== date));
  };

  // Agregar intervalo (solo en UI)
  const handleAddInterval = () => {
    if (!from || !to) return;
    setSchedules((prev) =>
      prev.map((s) =>
        s.day === selectedDay
          ? { ...s, intervals: [...s.intervals, { from, to }] }
          : s
      )
    );
    setFrom("");
    setTo("");
  };

  // Eliminar intervalo (solo en UI)
  const handleDeleteInterval = (day: string, idx: number) => {
    setSchedules((prev) =>
      prev.map((s) =>
        s.day === day
          ? { ...s, intervals: s.intervals.filter((_, i) => i !== idx) }
          : s
      )
    );
  };

  // Guardar horarios en Supabase
  const handleSaveSchedules = async () => {
    if (!barberId) return;
    setSaving(true);
    // 1. Borrar todos los horarios actuales del barbero
    const { error: delError } = await (await import("@/lib/supabase")).supabase
      .from("schedules")
      .delete()
      .eq("barber_id", barberId);
    if (delError) {
      setSaving(false);
      alert("Error al borrar horarios antiguos");
      return;
    }
    // 2. Insertar los nuevos
    const inserts = [];
    for (let i = 0; i < schedules.length; i++) {
      const day = schedules[i].day;
      const dayIdx = DAYS.indexOf(day);
      for (const interval of schedules[i].intervals) {
        inserts.push({
          barber_id: barberId,
          day_of_week: dayIdx,
          from_time: interval.from,
          to_time: interval.to,
        });
      }
    }
    if (inserts.length > 0) {
      const { error: insError } = await (await import("@/lib/supabase")).supabase
        .from("schedules")
        .insert(inserts);
      if (insError) {
        setSaving(false);
        alert("Error al guardar horarios nuevos");
        return;
      }
    }
    setSaving(false);
    alert("Horarios guardados correctamente");
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-950 to-slate-900 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
          <div className="absolute top-10 right-1/4 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '6s'}}></div>
        </div>
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          <header className="mb-10 text-center">
            <h1 className="text-3xl font-bold text-white drop-shadow-lg mb-2">Gestión de horarios</h1>
            <p className="text-white/70 font-medium">Configura tus días y turnos de atención</p>
          </header>
          {authLoading || loading ? (
            <div className="flex justify-center py-8"><span className="text-gray-400">Cargando...</span></div>
          ) : (
            <>
              <Card className="mb-10 bg-gradient-to-br from-white/10 to-white/5 border border-white/20 shadow-2xl">
                <h2 className="text-xl font-bold text-white mb-4">Agregar intervalo</h2>
                <div className="flex flex-col md:flex-row gap-2 items-center justify-center mb-4">
                  <select
                    className="border border-gray-700 rounded-lg px-4 py-3 bg-barbershop-black text-barbershop-white focus:ring-2 focus:ring-barbershop-blue"
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(e.target.value)}
                  >
                    {DAYS.map((day) => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                  <Input
                    type="time"
                    className="w-32"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                  />
                  <span className="text-gray-400">-</span>
                  <Input
                    type="time"
                    className="w-32"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                  />
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={handleAddInterval}
                  >
                    Agregar
                  </Button>
                </div>
                <Button
                  variant="primary"
                  size="md"
                  className="mt-2"
                  onClick={handleSaveSchedules}
                  loading={saving}
                  disabled={saving}
                >
                  Guardar horarios
                </Button>
              </Card>

              {/* Excepciones de horario */}
              <Card className="mb-10 bg-gradient-to-br from-white/10 to-white/5 border border-white/20 shadow-2xl">
                <h2 className="text-xl font-bold text-white mb-4">Excepciones (bloquear/cambiar horario de un día específico)</h2>
                <div className="flex flex-col md:flex-row gap-2 items-center justify-center mb-4">
                  <Input
                    type="date"
                    className="w-40"
                    value={exceptionDate}
                    onChange={(e) => setExceptionDate(e.target.value)}
                  />
                  <Input
                    type="time"
                    className="w-32"
                    value={exceptionFrom}
                    onChange={(e) => setExceptionFrom(e.target.value)}
                    placeholder="Desde"
                  />
                  <span className="text-gray-400">-</span>
                  <Input
                    type="time"
                    className="w-32"
                    value={exceptionTo}
                    onChange={(e) => setExceptionTo(e.target.value)}
                    placeholder="Hasta"
                  />
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={handleAddExceptionInterval}
                    disabled={!exceptionDate || !exceptionFrom || !exceptionTo}
                  >
                    Agregar intervalo
                  </Button>
                </div>
                {/* Lista de intervalos para la excepción actual */}
                {exceptionIntervals.length > 0 && (
                  <ul className="flex flex-wrap gap-2 justify-center mb-2">
                    {exceptionIntervals.map((interval, idx) => (
                      <li key={idx} className="flex items-center bg-barbershop-black border border-barbershop-blue/30 rounded px-3 py-2">
                        <span className="mr-2 text-barbershop-white font-medium">{interval.from} - {interval.to}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-2 px-2 py-1 text-xs"
                          onClick={() => handleDeleteExceptionInterval(idx)}
                        >
                          Eliminar
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex flex-col md:flex-row gap-2 items-center justify-center">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleSaveException}
                    loading={savingException}
                    disabled={!exceptionDate || savingException}
                  >
                    {exceptionIntervals.length === 0 ? "Bloquear día completo" : "Guardar excepción"}
                  </Button>
                  {exceptionIntervals.length > 0 && (
                    <span className="text-xs text-gray-400">Si agregás intervalos, solo esos horarios estarán disponibles ese día</span>
                  )}
                </div>
                {/* Lista de excepciones existentes */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-barbershop-blue mb-2">Días con excepción</h3>
                  {exceptions.length === 0 ? (
                    <div className="text-gray-400 text-sm">No hay excepciones</div>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {exceptions.map((ex) => (
                        <li key={ex.date} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 justify-between bg-barbershop-black/60 rounded-lg px-4 py-3">
                          <div className="flex-1">
                            <span className="font-semibold text-barbershop-white text-base mr-2">{new Date(ex.date).toLocaleDateString("es-AR", { weekday: "long", year: "numeric", month: "short", day: "numeric" })}</span>
                            {ex.intervals.length === 0 ? (
                              <span className="text-barbershop-red font-semibold ml-2">Bloqueado todo el día</span>
                            ) : (
                              <span className="text-barbershop-blue font-medium ml-2">Horarios: {ex.intervals.map((i) => `${i.from} - ${i.to}`).join(", ")}</span>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="ml-2 px-2 py-1 text-xs"
                            onClick={() => handleDeleteException(ex.date)}
                          >
                            Eliminar excepción
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Card>

              <Card className="mb-10 bg-gradient-to-br from-white/10 to-white/5 border border-white/20 shadow-2xl">
                <h2 className="text-xl font-bold text-white mb-4">Horarios por día</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {schedules.map((s) => (
                    <div key={s.day} className="mb-2">
                      <div className="font-semibold text-barbershop-blue mb-1 text-lg">{s.day}</div>
                      {s.intervals.length === 0 ? (
                        <div className="text-gray-400 text-sm">Sin intervalos</div>
                      ) : (
                        <ul className="flex flex-wrap gap-2 justify-center">
                          {s.intervals.map((interval, idx) => (
                            <li key={idx} className="flex items-center bg-barbershop-black border border-barbershop-blue/30 rounded px-3 py-2">
                              <span className="mr-2 text-barbershop-white font-medium">{interval.from} - {interval.to}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                className="ml-2 px-2 py-1 text-xs"
                                onClick={() => handleDeleteInterval(s.day, idx)}
                              >
                                Eliminar
                              </Button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="mb-8 bg-gradient-to-br from-white/10 to-white/5 border border-white/20 shadow-2xl">
                <h2 className="text-xl font-bold text-white mb-4">Turnos</h2>
                {appointments.length === 0 ? (
                  <div className="text-gray-400 text-sm">No hay turnos</div>
                ) : (
                  <ul>
                    {appointments.map((a) => (
                      <li key={a.id} className="mb-4 flex flex-col md:flex-row md:items-center gap-2 md:gap-6 justify-center text-barbershop-white bg-barbershop-black/60 rounded-lg px-4 py-3">
                        <div className="flex-1">
                          <div className="font-semibold text-barbershop-blue text-base">{a.services?.name || 'Servicio'}</div>
                          <div className="text-sm text-gray-300">Cliente: <span className="font-medium">{a.customer_name}</span></div>
                          <div className="text-xs text-gray-400">{a.customer_email}</div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-sm text-barbershop-white">{a.date ? new Date(a.date).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }) : ''}</span>
                          <span className="text-xs text-gray-400">Duración: {a.duration_min} min</span>
                          <span className="text-xs text-barbershop-blue font-semibold">{a.services?.price ? a.services.price.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }) : ''}</span>
                          <span className="text-xs mt-1 px-2 py-1 rounded bg-barbershop-blue/20 text-barbershop-blue font-semibold">
                            {a.appointment_status?.name || getStatusText(a.status_id)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </>
          )}
        </main>
      </div>
      <Footer />
    </>
  );
}
