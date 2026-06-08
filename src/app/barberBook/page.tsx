"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { schedulesApi, appointmentsApi } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { CalendarDays, Clock, Ban, Plus, Trash2, Save, CheckCircle, Link2, Copy, Check, ExternalLink, MessageCircle } from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import toast from "react-hot-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

type Interval = { from: string; to: string };
type ScheduleUI = { day: string; intervals: Interval[] };
type ExceptionUI = { id: string; date: string; intervals: Interval[] };
type Tab = "appointments" | "schedules" | "exceptions";

function getStatusLabel(id: number) {
  return { 1: "Pendiente", 2: "Confirmado", 3: "Cancelado", 4: "Completado" }[id] ?? "Desconocido";
}
function getStatusColor(id: number) {
  return { 1: "bg-yellow-500/15 text-yellow-300 border-yellow-500/20",
           2: "bg-[#2e4a7d]/20 text-blue-300 border-[#2e4a7d]/30",
           3: "bg-red-500/15 text-red-300 border-red-500/20",
           4: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20" }[id]
    ?? "bg-white/5 text-gray-400 border-white/10";
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BarberBookPage() {
  const { user, loading: authLoading } = useAuth();
  const [barberId, setBarberId] = useState<string | null>(null);
  const [barbershopId, setBarbershopId] = useState<string | null>(null);
  const [barberName, setBarberName] = useState<string>("");
  const [activeTab, setActiveTab] = useState<Tab>("appointments");
  const [loading, setLoading] = useState(true);

  // Appointment state
  const [appointments, setAppointments] = useState<any[]>([]);

  // Schedule state
  const [schedules, setSchedules] = useState<ScheduleUI[]>(
    DAYS.map((day) => ({ day, intervals: [] }))
  );
  const [selectedDay, setSelectedDay] = useState(DAYS[0]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [saving, setSaving] = useState(false);

  // Exception state
  const [exceptions, setExceptions] = useState<ExceptionUI[]>([]);
  const [excDate, setExcDate] = useState("");
  const [excFrom, setExcFrom] = useState("");
  const [excTo, setExcTo] = useState("");
  const [excIntervals, setExcIntervals] = useState<Interval[]>([]);
  const [savingExc, setSavingExc] = useState(false);

  // ── Resolve barber ID ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    supabase.from("users").select("barber_id, name").eq("id", user.id).single()
      .then(({ data }) => {
        if (data?.name) setBarberName(data.name);
        if (data?.barber_id) {
          setBarberId(data.barber_id);
          // Obtener la barbería a la que pertenece para armar el link
          supabase.from("barbers").select("barbershop_id").eq("id", data.barber_id).single()
            .then(({ data: b }) => { if (b?.barbershop_id) setBarbershopId(b.barbershop_id); });
        }
      });
  }, [user]);

  // ── Fetch all data ─────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!barberId) return;
    setLoading(true);

    // Appointments
    const dbApts = await appointmentsApi.getByBarber(barberId, 60);
    setAppointments(dbApts || []);

    // Schedules
    const dbSch = await schedulesApi.getByBarber(barberId);
    const grouped: Record<string, Interval[]> = {};
    for (const s of dbSch) {
      const day = DAYS[s.day_of_week ?? 0] || DAYS[0];
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push({ from: s.from_time, to: s.to_time });
    }
    setSchedules(DAYS.map((day) => ({ day, intervals: grouped[day] || [] })));

    // Exceptions
    await refreshExceptions(barberId);

    setLoading(false);
  }, [barberId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const refreshExceptions = async (bid: string) => {
    const { data } = await supabase
      .from("schedule_exceptions")
      .select("id,date,from_time,to_time")
      .eq("barber_id", bid)
      .order("date", { ascending: true });

    if (!data) return;
    const grouped: Record<string, Interval[]> = {};
    for (const ex of data) {
      if (!grouped[ex.date]) grouped[ex.date] = [];
      if (ex.from_time && ex.to_time) grouped[ex.date].push({ from: ex.from_time, to: ex.to_time });
    }
    const dates = Array.from(new Set(data.map((e: any) => e.date))) as string[];
    setExceptions(dates.map((date) => ({
      id: data.find((e: any) => e.date === date)?.id ?? "",
      date,
      intervals: grouped[date] ?? [],
    })));
  };

  // ── Schedule handlers ──────────────────────────────────────────────────────
  const handleAddInterval = () => {
    if (!from || !to) return;
    setSchedules((prev) =>
      prev.map((s) => s.day === selectedDay ? { ...s, intervals: [...s.intervals, { from, to }] } : s)
    );
    setFrom(""); setTo("");
  };

  const handleDeleteInterval = (day: string, idx: number) => {
    setSchedules((prev) =>
      prev.map((s) => s.day === day ? { ...s, intervals: s.intervals.filter((_, i) => i !== idx) } : s)
    );
  };

  const handleSaveSchedules = async () => {
    if (!barberId) return;
    setSaving(true);
    const { error: delErr } = await supabase.from("schedules").delete().eq("barber_id", barberId);
    if (delErr) { toast.error("Error al guardar horarios"); setSaving(false); return; }

    const inserts = schedules.flatMap((s, dayIdx) =>
      s.intervals.map((iv) => ({
        barber_id: barberId,
        day_of_week: DAYS.indexOf(s.day),
        from_time: iv.from,
        to_time: iv.to,
      }))
    );
    if (inserts.length > 0) {
      const { error } = await supabase.from("schedules").insert(inserts);
      if (error) { toast.error("Error al guardar horarios"); setSaving(false); return; }
    }
    setSaving(false);
    toast.success("Horarios guardados");
  };

  // ── Exception handlers ─────────────────────────────────────────────────────
  const handleAddExcInterval = () => {
    if (!excFrom || !excTo) return;
    setExcIntervals((p) => [...p, { from: excFrom, to: excTo }]);
    setExcFrom(""); setExcTo("");
  };

  const handleSaveException = async () => {
    if (!barberId || !excDate) return;
    setSavingExc(true);
    await supabase.from("schedule_exceptions").delete().eq("barber_id", barberId).eq("date", excDate);
    if (excIntervals.length > 0) {
      await supabase.from("schedule_exceptions").insert(
        excIntervals.map((iv) => ({ barber_id: barberId, date: excDate, from_time: iv.from, to_time: iv.to }))
      );
    } else {
      await supabase.from("schedule_exceptions").insert({ barber_id: barberId, date: excDate });
    }
    setExcDate(""); setExcIntervals([]);
    await refreshExceptions(barberId);
    setSavingExc(false);
    toast.success(excIntervals.length === 0 ? "Día bloqueado" : "Excepción guardada");
  };

  const handleDeleteException = async (date: string) => {
    if (!barberId) return;
    await supabase.from("schedule_exceptions").delete().eq("barber_id", barberId).eq("date", date);
    setExceptions((p) => p.filter((e) => e.date !== date));
    toast.success("Excepción eliminada");
  };

  // ── Tabs ───────────────────────────────────────────────────────────────────
  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "appointments", label: "Mis turnos",   icon: <CalendarDays className="w-4 h-4" /> },
    { id: "schedules",    label: "Mis horarios",  icon: <Clock className="w-4 h-4" /> },
    { id: "exceptions",   label: "Excepciones",  icon: <Ban className="w-4 h-4" /> },
  ];

  const today = new Date().toISOString().split("T")[0];
  const upcomingApts = appointments.filter((a) => a.date >= today && a.status_id !== 3);
  const pastApts = appointments.filter((a) => a.date < today || a.status_id === 3);

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Mi agenda</h1>
          <p className="text-gray-500 text-sm mt-0.5">Gestión de turnos y horarios</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 flex-1 justify-center px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-[#b02e2e] text-white shadow-sm"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {authLoading || (loading && !appointments.length && !schedules[0]?.intervals.length) ? (
          <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
        ) : (
          <>
            {/* ── TAB: TURNOS ─────────────────────────────────────────────── */}
            {activeTab === "appointments" && (
              <div className="space-y-8">
                {/* Link de reservas con el barbero preseleccionado */}
                {barbershopId && barberId && (
                  <BarberShareLink
                    barbershopId={barbershopId}
                    barberId={barberId}
                    barberName={barberName}
                  />
                )}

                {/* Próximos */}
                <Section title="Próximos turnos" count={upcomingApts.length}>
                  {upcomingApts.length === 0 ? (
                    <EmptyState text="No tenés turnos próximos" />
                  ) : (
                    <div className="space-y-2">
                      {upcomingApts.map((a) => <AptRow key={a.id} apt={a} />)}
                    </div>
                  )}
                </Section>

                {/* Historial */}
                {pastApts.length > 0 && (
                  <Section title="Historial" count={pastApts.length} muted>
                    <div className="space-y-2">
                      {pastApts.slice(0, 10).map((a) => <AptRow key={a.id} apt={a} muted />)}
                    </div>
                  </Section>
                )}
              </div>
            )}

            {/* ── TAB: HORARIOS ───────────────────────────────────────────── */}
            {activeTab === "schedules" && (
              <div className="space-y-6">
                {/* Agregar intervalo */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <h2 className="text-white font-semibold text-sm mb-4">Agregar intervalo de atención</h2>
                  <div className="flex flex-wrap gap-3 items-end">
                    <div>
                      <label className="text-gray-500 text-xs block mb-1">Día</label>
                      <select
                        value={selectedDay}
                        onChange={(e) => setSelectedDay(e.target.value)}
                        className="bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#b02e2e]/60 [color-scheme:dark]"
                      >
                        {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-gray-500 text-xs block mb-1">Desde</label>
                      <input type="time" value={from} onChange={(e) => setFrom(e.target.value)}
                        className="bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#b02e2e]/60 [color-scheme:dark]" />
                    </div>
                    <div>
                      <label className="text-gray-500 text-xs block mb-1">Hasta</label>
                      <input type="time" value={to} onChange={(e) => setTo(e.target.value)}
                        className="bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#b02e2e]/60 [color-scheme:dark]" />
                    </div>
                    <button
                      onClick={handleAddInterval}
                      disabled={!from || !to}
                      className="flex items-center gap-1.5 px-4 py-2 bg-[#2e4a7d]/30 border border-[#2e4a7d]/40 text-blue-300 rounded-lg text-sm hover:bg-[#2e4a7d]/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-3.5 h-3.5" /> Agregar
                    </button>
                  </div>
                </div>

                {/* Vista semanal */}
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                  <div className="grid grid-cols-1 divide-y divide-white/5">
                    {schedules.map((s) => (
                      <div key={s.day} className="flex items-start gap-4 px-5 py-4">
                        <span className={`w-24 flex-shrink-0 text-sm font-medium pt-0.5 ${
                          s.intervals.length > 0 ? "text-white" : "text-gray-600"
                        }`}>{s.day}</span>
                        <div className="flex-1 flex flex-wrap gap-2 min-h-[28px]">
                          {s.intervals.length === 0 ? (
                            <span className="text-gray-700 text-xs italic pt-0.5">Sin atención</span>
                          ) : (
                            s.intervals.map((iv, idx) => (
                              <div key={idx} className="flex items-center gap-1.5 bg-[#2e4a7d]/20 border border-[#2e4a7d]/30 rounded-lg px-3 py-1">
                                <span className="text-blue-200 text-xs font-medium">{iv.from} – {iv.to}</span>
                                <button
                                  onClick={() => handleDeleteInterval(s.day, idx)}
                                  className="text-gray-600 hover:text-red-400 transition-colors ml-1"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSaveSchedules}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#b02e2e] text-white text-sm font-medium rounded-xl hover:bg-[#b02e2e]/85 transition-colors disabled:opacity-50"
                >
                  {saving ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4" />}
                  Guardar horarios
                </button>
              </div>
            )}

            {/* ── TAB: EXCEPCIONES ────────────────────────────────────────── */}
            {activeTab === "exceptions" && (
              <div className="space-y-6">
                {/* Formulario */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
                  <h2 className="text-white font-semibold text-sm">Bloquear o modificar un día específico</h2>
                  <p className="text-gray-500 text-xs">
                    Si no agregás intervalos, se bloqueará todo el día. Si agregás intervalos, solo esos horarios estarán disponibles.
                  </p>

                  <div>
                    <label className="text-gray-500 text-xs block mb-1">Fecha</label>
                    <input
                      type="date"
                      value={excDate}
                      onChange={(e) => setExcDate(e.target.value)}
                      min={today}
                      className="bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#b02e2e]/60 [color-scheme:dark]"
                    />
                  </div>

                  <div className="flex flex-wrap gap-3 items-end">
                    <div>
                      <label className="text-gray-500 text-xs block mb-1">Desde (opcional)</label>
                      <input type="time" value={excFrom} onChange={(e) => setExcFrom(e.target.value)}
                        className="bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#b02e2e]/60 [color-scheme:dark]" />
                    </div>
                    <div>
                      <label className="text-gray-500 text-xs block mb-1">Hasta</label>
                      <input type="time" value={excTo} onChange={(e) => setExcTo(e.target.value)}
                        className="bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#b02e2e]/60 [color-scheme:dark]" />
                    </div>
                    <button
                      onClick={handleAddExcInterval}
                      disabled={!excFrom || !excTo}
                      className="flex items-center gap-1.5 px-4 py-2 bg-[#2e4a7d]/30 border border-[#2e4a7d]/40 text-blue-300 rounded-lg text-sm hover:bg-[#2e4a7d]/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-3.5 h-3.5" /> Agregar intervalo
                    </button>
                  </div>

                  {excIntervals.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {excIntervals.map((iv, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 bg-[#2e4a7d]/20 border border-[#2e4a7d]/30 rounded-lg px-3 py-1">
                          <span className="text-blue-200 text-xs">{iv.from} – {iv.to}</span>
                          <button onClick={() => setExcIntervals((p) => p.filter((_, i) => i !== idx))}
                            className="text-gray-600 hover:text-red-400 transition-colors">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={handleSaveException}
                    disabled={!excDate || savingExc}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#b02e2e] text-white text-sm font-medium rounded-xl hover:bg-[#b02e2e]/85 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {savingExc ? <LoadingSpinner size="sm" /> : <Ban className="w-4 h-4" />}
                    {excIntervals.length === 0 ? "Bloquear día completo" : "Guardar excepción"}
                  </button>
                </div>

                {/* Lista de excepciones */}
                <div>
                  <h2 className="text-white font-semibold text-sm mb-3">Días con excepción guardados</h2>
                  {exceptions.length === 0 ? (
                    <EmptyState text="No hay excepciones configuradas" />
                  ) : (
                    <div className="bg-white/5 border border-white/10 rounded-2xl divide-y divide-white/5 overflow-hidden">
                      {exceptions.map((ex) => {
                        const d = new Date(ex.date + "T12:00:00");
                        const label = d.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "short" });
                        return (
                          <div key={ex.date} className="flex items-center justify-between px-5 py-4 gap-4">
                            <div className="min-w-0">
                              <p className="text-white text-sm font-medium capitalize">{label}</p>
                              {ex.intervals.length === 0 ? (
                                <p className="text-red-400 text-xs mt-0.5">Todo el día bloqueado</p>
                              ) : (
                                <p className="text-blue-300 text-xs mt-0.5">
                                  Solo: {ex.intervals.map((i) => `${i.from}–${i.to}`).join(", ")}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => handleDeleteException(ex.date)}
                              className="flex-shrink-0 p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function BarberShareLink({ barbershopId, barberId, barberName }: {
  barbershopId: string;
  barberId: string;
  barberName: string;
}) {
  const [copied, setCopied] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  // Link directo al booking con la barbería y el barbero ya fijados
  const bookingUrl = `${origin}/book?barbershop=${barbershopId}&barber=${barberId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(bookingUrl);
      setCopied(true);
      toast.success("¡Link copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("No se pudo copiar el link");
    }
  };

  const waText = encodeURIComponent(
    `¡Reservá tu turno conmigo${barberName ? `, ${barberName}` : ""}! 💈\n${bookingUrl}`
  );
  const whatsappUrl = `https://wa.me/?text=${waText}`;

  return (
    <div className="bg-gradient-to-r from-[#b02e2e]/15 to-[#2e4a7d]/15 border border-white/10 rounded-2xl p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-[#b02e2e]/15 border border-[#b02e2e]/20 flex items-center justify-center flex-shrink-0">
          <Link2 className="w-4 h-4 text-[#b02e2e]" />
        </div>
        <div>
          <h3 className="text-white font-semibold text-sm">Tu link de reservas</h3>
          <p className="text-gray-400 text-xs mt-0.5">
            Compartilo y tus clientes reservan directamente con vos.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-[#1a1a1a]/60 border border-white/10 rounded-xl px-3 py-2.5 mb-3">
        <Link2 className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
        <span className="text-gray-300 text-xs sm:text-sm truncate flex-1">{bookingUrl}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#b02e2e] text-white text-xs font-medium rounded-lg hover:bg-[#b02e2e]/85 transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copiado" : "Copiar link"}
        </button>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600/90 text-white text-xs font-medium rounded-lg hover:bg-emerald-600 transition-colors"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          WhatsApp
        </a>
        <a
          href={bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-4 py-2 border border-white/15 text-gray-300 text-xs font-medium rounded-lg hover:bg-white/5 hover:text-white transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Probar
        </a>
      </div>
    </div>
  );
}

function Section({ title, count, children, muted }: {
  title: string; count: number; children: React.ReactNode; muted?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h2 className={`text-sm font-semibold ${muted ? "text-gray-500" : "text-white"}`}>{title}</h2>
        <span className="text-xs bg-white/8 text-gray-500 px-2 py-0.5 rounded-full">{count}</span>
      </div>
      {children}
    </div>
  );
}

function AptRow({ apt, muted }: { apt: any; muted?: boolean }) {
  const date = new Date(apt.date);
  const timeStr = `${date.getUTCHours().toString().padStart(2, "0")}:${date.getUTCMinutes().toString().padStart(2, "0")}`;
  const dateStr = date.toLocaleDateString("es-AR", { day: "numeric", month: "short", timeZone: "UTC" });

  return (
    <div className={`flex items-center justify-between px-4 py-3.5 rounded-xl border transition-colors ${
      muted
        ? "bg-white/3 border-white/6 opacity-60"
        : "bg-white/5 border-white/10 hover:border-white/20"
    }`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-full bg-[#2e4a7d]/20 flex items-center justify-center text-xs font-bold text-[#2e4a7d] uppercase flex-shrink-0">
          {apt.customer_name?.charAt(0) || "?"}
        </div>
        <div className="min-w-0">
          <p className="text-white text-sm font-medium truncate">{apt.customer_name}</p>
          <p className="text-gray-500 text-xs truncate">
            {apt.services?.name || "Servicio"}
            {apt.services?.price ? ` · $${apt.services.price.toLocaleString("es-AR")}` : ""}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0 ml-3">
        <div className="text-right hidden sm:block">
          <p className="text-white text-sm font-medium">{timeStr}</p>
          <p className="text-gray-500 text-xs">{dateStr}</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-lg border font-medium ${getStatusColor(apt.status_id)}`}>
          {getStatusLabel(apt.status_id)}
        </span>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="bg-white/3 border border-white/8 rounded-2xl p-10 text-center">
      <p className="text-gray-600 text-sm">{text}</p>
    </div>
  );
}
