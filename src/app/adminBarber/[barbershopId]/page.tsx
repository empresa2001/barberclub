"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import {
  Users, Scissors, Settings, LayoutDashboard,
  TrendingUp, Calendar, Clock, Plus, Pencil, Trash2,
  CheckCircle, XCircle, RotateCcw, ChevronRight, Save, X,
  Link2, Copy, Check, ExternalLink, MessageCircle, Wallet, Filter,
} from "lucide-react";
import toast from "react-hot-toast";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Barber {
  id: string;
  user_id: string;
  user: { name: string; email: string };
  is_active?: boolean;
}

interface Service {
  id: string;
  name: string;
  price: number | null;
  duration_min: number | null;
}

interface Appointment {
  id: string;
  date: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string | null;
  booking_code?: string;
  barber_id?: string;
  service_id?: string;
  status_id: number;
  duration_min: number;
  services?: { name: string; price: number | null };
  barbers?: { users: { name: string } | null };
}

interface Barbershop {
  id: string;
  name: string;
  address: string;
  owner_id: string;
}

type Tab = "dashboard" | "appointments" | "cash" | "barbers" | "services" | "settings";

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminBarberPage() {
  const params = useParams();
  const barbershopId = params?.barbershopId as string;

  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [barbershop, setBarbershop] = useState<Barbershop | null>(null);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  if (!barbershopId) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <p className="text-red-400">URL inválida — no se encontró el ID de la barbería.</p>
      </div>
    );
  }

  const fetchAll = useCallback(async () => {
    setLoading(true);

    const [shopRes, barbersRes, servicesRes, aptsRes] = await Promise.all([
      supabase.from("barbershops").select("*").eq("id", barbershopId).maybeSingle(),
      supabase.from("barbers").select("id,user_id,users!barbers_user_id_fkey(name,email,is_active)").eq("barbershop_id", barbershopId),
      supabase.from("services").select("id,name,price,duration_min").eq("barbershop_id", barbershopId).order("name"),
      supabase
        .from("appointments")
        .select("id,date,customer_name,customer_email,customer_phone,barber_id,service_id,status_id,duration_min,services(name,price),barbers(users(name))")
        .in("barber_id",
          // subquery workaround: se pasa array vacío si aún no hay barberos
          (await supabase.from("barbers").select("id").eq("barbershop_id", barbershopId)).data?.map((b: any) => b.id) || []
        )
        .order("date", { ascending: false })
        .limit(200),
    ]);

    if (shopRes.data) setBarbershop(shopRes.data as any);
    if (barbersRes.data) {
      setBarbers(
        barbersRes.data.map((b: any) => ({
          id: b.id,
          user_id: b.user_id,
          user: { name: b.users?.name || "Sin nombre", email: b.users?.email || "Sin email" },
          is_active: b.users?.is_active !== false,
        }))
      );
    }
    if (servicesRes.data) setServices(servicesRes.data);
    if (aptsRes.data) setAppointments(aptsRes.data as any);

    setLoading(false);
  }, [barbershopId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "appointments", label: "Turnos", icon: <Calendar className="w-4 h-4" /> },
    { id: "cash", label: "Caja", icon: <Wallet className="w-4 h-4" /> },
    { id: "barbers",   label: "Barberos",  icon: <Users className="w-4 h-4" /> },
    { id: "services",  label: "Servicios", icon: <Scissors className="w-4 h-4" /> },
    { id: "settings",  label: "Configuración", icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-3 sm:px-6 py-6 sm:py-8">

        {/* Header */}
        <div className="mb-6">
          {loading ? (
            <div className="h-8 w-48 bg-white/5 rounded-lg animate-pulse" />
          ) : (
            <>
              <h1 className="text-xl sm:text-3xl font-bold text-white break-words">{barbershop?.name || "Mi Barbería"}</h1>
              <p className="text-gray-500 text-sm mt-0.5 break-words">{barbershop?.address}</p>
            </>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1 mb-6 sm:mb-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex min-h-10 items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-[#b02e2e] text-white shadow-sm"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {loading ? (
          <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
        ) : (
          <>
            {activeTab === "dashboard" && (
              <DashboardTab
                appointments={appointments}
                barbers={barbers}
                services={services}
                barbershopId={barbershopId}
                barbershopName={barbershop?.name || ""}
              />
            )}
            {activeTab === "appointments" && (
              <AppointmentsTab appointments={appointments} barbers={barbers} onRefresh={fetchAll} />
            )}
            {activeTab === "cash" && (
              <CashTab appointments={appointments} barbershopId={barbershopId} />
            )}
            {activeTab === "barbers" && (
              <BarbersTab
                barbers={barbers}
                barbershopId={barbershopId}
                ownerId={barbershop?.owner_id || null}
                onRefresh={fetchAll}
              />
            )}
            {activeTab === "services" && (
              <ServicesTab services={services} barbershopId={barbershopId} onRefresh={fetchAll} />
            )}
            {activeTab === "settings" && (
              <SettingsTab barbershop={barbershop} onRefresh={fetchAll} />
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

// ─── Dashboard Tab ────────────────────────────────────────────────────────────

function DashboardTab({ appointments, barbers, services, barbershopId, barbershopName }: {
  appointments: Appointment[];
  barbers: Barber[];
  services: Service[];
  barbershopId: string;
  barbershopName: string;
}) {
  const today = new Date().toISOString().split("T")[0];

  const todayApts = appointments.filter((a) => a.date.startsWith(today) && a.status_id !== 3);
  const pendingApts = appointments.filter((a) => a.status_id === 1);
  const activeBarbers = barbers.filter((b) => b.is_active !== false);

  // Ingresos estimados de los últimos 30 días (servicios completados)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentApts = appointments.filter(
    (a) => new Date(a.date) >= thirtyDaysAgo && a.status_id === 4
  );
  const estimatedRevenue = recentApts.reduce((sum, apt) => {
    const price = (apt.services as any)?.price;
    return sum + (typeof price === "number" ? price : 0);
  }, 0);

  // Turnos últimos 7 días para el gráfico
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split("T")[0];
    const count = appointments.filter((a) => a.date.startsWith(dateStr) && a.status_id !== 3).length;
    const label = d.toLocaleDateString("es-AR", { weekday: "short" });
    return { dateStr, label, count };
  });
  const maxCount = Math.max(...last7.map((d) => d.count), 1);

  // Próximas citas (hoy en adelante, pendientes)
  const upcoming = appointments
    .filter((a) => a.date >= today && a.status_id === 1)
    .slice(0, 6);

  return (
    <div className="space-y-8">
      {/* Link de reservas */}
      <ShareLinkCard barbershopId={barbershopId} barbershopName={barbershopName} />

      {/* KPI cards */}
      <div className="grid grid-cols-1 min-[380px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          label="Turnos hoy"
          value={todayApts.length}
          icon={<Calendar className="w-5 h-5" />}
          color="red"
        />
        <KpiCard
          label="Pendientes"
          value={pendingApts.length}
          icon={<Clock className="w-5 h-5" />}
          color="blue"
        />
        <KpiCard
          label="Barberos activos"
          value={activeBarbers.length}
          icon={<Users className="w-5 h-5" />}
          color="green"
        />
        <KpiCard
          label="Ingresos (30 días)"
          value={estimatedRevenue > 0 ? `$${estimatedRevenue.toLocaleString("es-AR")}` : "—"}
          icon={<TrendingUp className="w-5 h-5" />}
          color="purple"
        />
      </div>

      {/* Gráfico de turnos */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6">
        <h2 className="text-white font-semibold mb-5 text-sm">Turnos — últimos 7 días</h2>
        <div className="flex items-end gap-2 h-32">
          {last7.map((day) => (
            <div key={day.dateStr} className="flex-1 flex flex-col items-center gap-1.5">
              <span className="text-xs text-gray-500">{day.count > 0 ? day.count : ""}</span>
              <div
                className={`w-full rounded-t-md transition-all duration-500 ${
                  day.dateStr === today ? "bg-[#b02e2e]" : "bg-[#2e4a7d]/60"
                }`}
                style={{ height: `${(day.count / maxCount) * 100}%`, minHeight: day.count > 0 ? "6px" : "2px" }}
              />
              <span className={`text-xs capitalize ${day.dateStr === today ? "text-white font-medium" : "text-gray-500"}`}>
                {day.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Próximas citas */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6">
        <h2 className="text-white font-semibold mb-4 text-sm">Próximas citas</h2>
        {upcoming.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-6">No hay citas programadas</p>
        ) : (
          <div className="divide-y divide-white/5">
            {upcoming.map((apt) => {
              const date = new Date(apt.date);
              const timeStr = `${date.getUTCHours().toString().padStart(2, "0")}:${date.getUTCMinutes().toString().padStart(2, "0")}`;
              const dateStr = date.toLocaleDateString("es-AR", { day: "numeric", month: "short", timeZone: "UTC" });
              const barberName = (apt.barbers as any)?.users?.name;
              const serviceName = (apt.services as any)?.name;
              return (
                <div key={apt.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#2e4a7d]/30 flex items-center justify-center flex-shrink-0 text-xs font-bold text-[#2e4a7d] uppercase">
                      {apt.customer_name?.charAt(0) || "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">{apt.customer_name}</p>
                      <p className="text-gray-500 text-xs truncate">{serviceName}{barberName ? ` · ${barberName}` : ""}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-white text-sm font-medium">{timeStr}</p>
                    <p className="text-gray-500 text-xs">{dateStr}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({ label, value, icon, color }: {
  label: string; value: string | number; icon: React.ReactNode;
  color: "red" | "blue" | "green" | "purple";
}) {
  const colors = {
    red:    "text-[#b02e2e] bg-[#b02e2e]/10 border-[#b02e2e]/20",
    blue:   "text-[#2e4a7d] bg-[#2e4a7d]/10 border-[#2e4a7d]/20",
    green:  "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    purple: "text-violet-400 bg-violet-400/10 border-violet-400/20",
  };
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5">
      <div className={`w-9 h-9 rounded-xl border flex items-center justify-center mb-3 ${colors[color]}`}>
        {icon}
      </div>
      <p className="text-xl sm:text-2xl font-bold text-white break-words">{value}</p>
      <p className="text-gray-500 text-xs mt-0.5">{label}</p>
    </div>
  );
}

// ─── Share Link Card ───────────────────────────────────────────────────────────

function ShareLinkCard({ barbershopId, barbershopName }: {
  barbershopId: string;
  barbershopName: string;
}) {
  const [copied, setCopied] = useState(false);

  // Construir la URL pública (perfil de la barbería)
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const bookingUrl = `${origin}/barberias/${barbershopId}`;

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
    `¡Reservá tu turno en ${barbershopName || "nuestra barbería"}! 💈\n${bookingUrl}`
  );
  const whatsappUrl = `https://wa.me/?text=${waText}`;

  return (
    <div className="bg-gradient-to-r from-[#b02e2e]/15 to-[#2e4a7d]/15 border border-white/10 rounded-2xl p-5 sm:p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-[#b02e2e]/15 border border-[#b02e2e]/20 flex items-center justify-center flex-shrink-0">
          <Link2 className="w-4 h-4 text-[#b02e2e]" />
        </div>
        <div>
          <h3 className="text-white font-semibold text-sm">Tu link de reservas</h3>
          <p className="text-gray-400 text-xs mt-0.5">
            Compartilo con tus clientes para que saquen turno online.
          </p>
        </div>
      </div>

      {/* URL display */}
      <div className="flex items-center gap-2 bg-[#1a1a1a]/60 border border-white/10 rounded-xl px-3 py-2.5 mb-3">
        <Link2 className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
        <span className="text-gray-300 text-xs sm:text-sm truncate flex-1">{bookingUrl}</span>
      </div>

      {/* actions */}
      <div className="grid grid-cols-1 min-[380px]:grid-cols-3 gap-2">
        <button
          onClick={handleCopy}
          className="flex min-h-10 items-center justify-center gap-1.5 px-4 py-2 bg-[#b02e2e] text-white text-xs font-medium rounded-lg hover:bg-[#b02e2e]/85 transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copiado" : "Copiar link"}
        </button>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-10 items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600/90 text-white text-xs font-medium rounded-lg hover:bg-emerald-600 transition-colors"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          WhatsApp
        </a>
        <a
          href={bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-10 items-center justify-center gap-1.5 px-4 py-2 border border-white/15 text-gray-300 text-xs font-medium rounded-lg hover:bg-white/5 hover:text-white transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Ver perfil
        </a>
      </div>
    </div>
  );
}

// ─── Barbers Tab ──────────────────────────────────────────────────────────────

function AppointmentsTab({ appointments, barbers, onRefresh }: {
  appointments: Appointment[];
  barbers: Barber[];
  onRefresh: () => void;
}) {
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split("T")[0]);
  const [statusFilter, setStatusFilter] = useState("active");
  const [barberFilter, setBarberFilter] = useState("all");
  const [savingId, setSavingId] = useState<string | null>(null);

  const filtered = appointments.filter((appointment) => {
    const dateMatches = !dateFilter || appointment.date.startsWith(dateFilter);
    const barberMatches = barberFilter === "all" || appointment.barber_id === barberFilter;
    const statusMatches =
      statusFilter === "all" ||
      (statusFilter === "active" && appointment.status_id !== 3) ||
      appointment.status_id.toString() === statusFilter;

    return dateMatches && barberMatches && statusMatches;
  });

  const updateStatus = async (appointment: Appointment, statusId: number) => {
    setSavingId(appointment.id);
    const { data: { user } } = await supabase.auth.getUser();
    const payload: Record<string, any> = {
      status_id: statusId,
      updated_by: user?.id || null,
    };

    if (statusId === 3) payload.cancelled_at = new Date().toISOString();

    const { error } = await supabase.from("appointments").update(payload).eq("id", appointment.id);
    setSavingId(null);

    if (error) {
      toast.error("No se pudo actualizar el turno");
      return;
    }

    toast.success(statusId === 3 ? "Turno cancelado" : "Turno actualizado");
    onRefresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-white font-semibold">Turnos</h2>
          <p className="text-gray-500 text-xs mt-0.5">Consultá reservas activas, canceladas y completadas sin perder historial.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Filter className="w-4 h-4" />
          {filtered.length} resultado{filtered.length === 1 ? "" : "s"}
        </div>
      </div>

      <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:grid-cols-3">
        <label className="block">
          <span className="mb-2 block text-xs font-medium text-gray-400">Fecha</span>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full rounded-xl border border-white/15 bg-[#1a1a1a] px-3 py-2.5 text-sm text-white [color-scheme:dark] focus:border-[#b02e2e]/60 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-medium text-gray-400">Estado</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-xl border border-white/15 bg-[#1a1a1a] px-3 py-2.5 text-sm text-white focus:border-[#b02e2e]/60 focus:outline-none"
          >
            <option value="active">Activas</option>
            <option value="all">Todas</option>
            <option value="1">Pendientes</option>
            <option value="2">Confirmadas</option>
            <option value="3">Canceladas</option>
            <option value="4">Completadas</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-medium text-gray-400">Barbero</span>
          <select
            value={barberFilter}
            onChange={(e) => setBarberFilter(e.target.value)}
            className="w-full rounded-xl border border-white/15 bg-[#1a1a1a] px-3 py-2.5 text-sm text-white focus:border-[#b02e2e]/60 focus:outline-none"
          >
            <option value="all">Todos</option>
            {barbers.map((barber) => (
              <option key={barber.id} value={barber.id}>{barber.user.name}</option>
            ))}
          </select>
        </label>
      </div>

      {filtered.length === 0 ? (
        <EmptyState text="No hay turnos para los filtros seleccionados" />
      ) : (
        <div className="grid gap-3">
          {filtered.map((appointment) => {
            const date = new Date(appointment.date);
            const time = `${date.getUTCHours().toString().padStart(2, "0")}:${date.getUTCMinutes().toString().padStart(2, "0")}`;
            const day = date.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
            const service = (appointment.services as any)?.name || "Servicio";
            const price = (appointment.services as any)?.price;
            const barber = (appointment.barbers as any)?.users?.name || "Barbero";

            return (
              <div key={appointment.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-white font-semibold break-words">{appointment.customer_name}</p>
                      <StatusPill statusId={appointment.status_id} />
                      {appointment.booking_code && (
                        <span className="rounded-full border border-[#2e4a7d]/40 bg-[#2e4a7d]/15 px-2 py-0.5 text-xs font-semibold text-blue-200">
                          {appointment.booking_code}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 grid gap-1 text-xs text-gray-400 sm:grid-cols-2">
                      <span>{day} · {time}</span>
                      <span>{service}{typeof price === "number" ? ` · $${price.toLocaleString("es-AR")}` : ""}</span>
                      <span>{barber}</span>
                      <span className="break-words">{appointment.customer_email}{appointment.customer_phone ? ` · ${appointment.customer_phone}` : ""}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 min-[420px]:flex md:flex-shrink-0">
                    {appointment.status_id !== 2 && appointment.status_id !== 3 && (
                      <button
                        disabled={savingId === appointment.id}
                        onClick={() => updateStatus(appointment, 2)}
                        className="min-h-10 rounded-lg border border-[#2e4a7d]/45 px-3 py-2 text-xs font-semibold text-blue-200 hover:bg-[#2e4a7d]/20 disabled:opacity-50"
                      >
                        Confirmar
                      </button>
                    )}
                    {appointment.status_id !== 4 && appointment.status_id !== 3 && (
                      <button
                        disabled={savingId === appointment.id}
                        onClick={() => updateStatus(appointment, 4)}
                        className="min-h-10 rounded-lg border border-emerald-400/35 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-400/10 disabled:opacity-50"
                      >
                        Completar
                      </button>
                    )}
                    {appointment.status_id !== 3 && (
                      <button
                        disabled={savingId === appointment.id}
                        onClick={() => updateStatus(appointment, 3)}
                        className="min-h-10 rounded-lg border border-red-400/35 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-400/10 disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CashTab({ appointments, barbershopId }: {
  appointments: Appointment[];
  barbershopId: string;
}) {
  const today = new Date().toISOString().split("T")[0];
  const [businessDate, setBusinessDate] = useState(today);
  const [register, setRegister] = useState<any | null>(null);
  const [movements, setMovements] = useState<any[]>([]);
  const [openingAmount, setOpeningAmount] = useState("");
  const [movementForm, setMovementForm] = useState({ type: "manual_income", concept: "", amount: "" });
  const [countedAmount, setCountedAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const completedApts = appointments.filter((appointment) => appointment.date.startsWith(businessDate) && appointment.status_id === 4);
  const serviceIncome = completedApts.reduce((sum, appointment) => {
    const price = (appointment.services as any)?.price;
    return sum + (typeof price === "number" ? price : 0);
  }, 0);
  const manualIncome = movements.filter((movement) => movement.type === "manual_income").reduce((sum, movement) => sum + Number(movement.amount || 0), 0);
  const manualExpense = movements.filter((movement) => movement.type === "manual_expense").reduce((sum, movement) => sum + Number(movement.amount || 0), 0);
  const expectedTotal = Number(register?.opening_amount || 0) + serviceIncome + manualIncome - manualExpense;
  const difference = register?.counted_amount != null ? Number(register.counted_amount) - expectedTotal : null;

  const loadRegister = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("cash_registers")
      .select("*")
      .eq("barbershop_id", barbershopId)
      .eq("business_date", businessDate)
      .order("opened_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    setRegister(data || null);

    if (data) {
      const { data: movementRows } = await supabase
        .from("cash_movements")
        .select("*")
        .eq("cash_register_id", data.id)
        .order("created_at", { ascending: false });
      setMovements(movementRows || []);
      setCountedAmount(data.counted_amount?.toString() || "");
      setNotes(data.notes || "");
    } else {
      setMovements([]);
      setCountedAmount("");
      setNotes("");
    }

    setLoading(false);
  }, [barbershopId, businessDate]);

  useEffect(() => { loadRegister(); }, [loadRegister]);

  const openRegister = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("cash_registers").insert({
      barbershop_id: barbershopId,
      business_date: businessDate,
      opened_by: user?.id || null,
      opening_amount: Number(openingAmount || 0),
      status: "open",
    });
    setLoading(false);

    if (error) {
      toast.error("No se pudo abrir la caja. Verificá que no haya otra caja abierta.");
      return;
    }

    toast.success("Caja abierta");
    setOpeningAmount("");
    loadRegister();
  };

  const addMovement = async () => {
    if (!register || !movementForm.concept.trim() || !movementForm.amount) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("cash_movements").insert({
      cash_register_id: register.id,
      type: movementForm.type,
      concept: movementForm.concept.trim(),
      amount: Number(movementForm.amount),
      created_by: user?.id || null,
    });

    if (error) {
      toast.error("No se pudo registrar el movimiento");
      return;
    }

    setMovementForm({ type: "manual_income", concept: "", amount: "" });
    toast.success("Movimiento registrado");
    loadRegister();
  };

  const closeRegister = async () => {
    if (!register || register.status !== "open") return;
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("cash_registers")
      .update({
        status: "closed",
        counted_amount: Number(countedAmount || 0),
        notes,
        closed_by: user?.id || null,
        closed_at: new Date().toISOString(),
      })
      .eq("id", register.id);

    if (error) {
      toast.error("No se pudo cerrar la caja");
      return;
    }

    toast.success("Caja cerrada");
    loadRegister();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-white font-semibold">Caja</h2>
          <p className="text-gray-500 text-xs mt-0.5">Apertura, movimientos y cierre diario.</p>
        </div>
        <label className="block sm:w-48">
          <span className="mb-2 block text-xs font-medium text-gray-400">Fecha</span>
          <input
            type="date"
            value={businessDate}
            onChange={(e) => setBusinessDate(e.target.value)}
            className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white [color-scheme:dark] focus:border-[#b02e2e]/60 focus:outline-none"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 lg:grid-cols-5">
        <CashMetric label="Cortes" value={completedApts.length} />
        <CashMetric label="Servicios" value={`$${serviceIncome.toLocaleString("es-AR")}`} />
        <CashMetric label="Ingresos" value={`$${manualIncome.toLocaleString("es-AR")}`} />
        <CashMetric label="Egresos" value={`$${manualExpense.toLocaleString("es-AR")}`} />
        <CashMetric label="Esperado" value={`$${expectedTotal.toLocaleString("es-AR")}`} />
      </div>

      {!register ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
          <h3 className="text-white font-semibold text-sm">Abrir caja del día</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              type="number"
              min="0"
              step="0.01"
              value={openingAmount}
              onChange={(e) => setOpeningAmount(e.target.value)}
              placeholder="Monto inicial"
              className="w-full rounded-xl border border-white/15 bg-[#1a1a1a] px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-[#b02e2e]/60 focus:outline-none"
            />
            <button
              disabled={loading}
              onClick={openRegister}
              className="min-h-11 rounded-xl bg-[#b02e2e] px-5 py-3 text-sm font-semibold text-white hover:bg-[#b02e2e]/85 disabled:opacity-50"
            >
              Abrir caja
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-white font-semibold text-sm">Movimientos manuales</h3>
              <span className={`rounded-full px-2 py-1 text-xs font-semibold ${register.status === "open" ? "bg-emerald-400/10 text-emerald-300" : "bg-white/10 text-gray-300"}`}>
                {register.status === "open" ? "Abierta" : "Cerrada"}
              </span>
            </div>
            {register.status === "open" && (
              <div className="mt-4 grid gap-3">
                <select
                  value={movementForm.type}
                  onChange={(e) => setMovementForm({ ...movementForm, type: e.target.value })}
                  className="rounded-xl border border-white/15 bg-[#1a1a1a] px-3 py-2.5 text-sm text-white focus:border-[#b02e2e]/60 focus:outline-none"
                >
                  <option value="manual_income">Ingreso</option>
                  <option value="manual_expense">Egreso</option>
                </select>
                <input
                  value={movementForm.concept}
                  onChange={(e) => setMovementForm({ ...movementForm, concept: e.target.value })}
                  placeholder="Concepto"
                  className="rounded-xl border border-white/15 bg-[#1a1a1a] px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:border-[#b02e2e]/60 focus:outline-none"
                />
                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={movementForm.amount}
                    onChange={(e) => setMovementForm({ ...movementForm, amount: e.target.value })}
                    placeholder="Monto"
                    className="rounded-xl border border-white/15 bg-[#1a1a1a] px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:border-[#b02e2e]/60 focus:outline-none"
                  />
                  <button onClick={addMovement} className="min-h-11 rounded-xl border border-[#2e4a7d]/45 px-4 py-2 text-sm font-semibold text-blue-200 hover:bg-[#2e4a7d]/20">
                    Agregar
                  </button>
                </div>
              </div>
            )}
            <div className="mt-5 divide-y divide-white/5">
              {movements.length === 0 ? (
                <p className="py-4 text-sm text-gray-500">Sin movimientos manuales.</p>
              ) : movements.map((movement) => (
                <div key={movement.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span className="min-w-0 break-words text-gray-300">{movement.concept}</span>
                  <span className={movement.type === "manual_expense" ? "text-red-300" : "text-emerald-300"}>
                    {movement.type === "manual_expense" ? "-" : "+"}${Number(movement.amount).toLocaleString("es-AR")}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
            <h3 className="text-white font-semibold text-sm">Cierre</h3>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-3 text-gray-300"><span>Monto inicial</span><strong>${Number(register.opening_amount || 0).toLocaleString("es-AR")}</strong></div>
              <div className="flex justify-between gap-3 text-gray-300"><span>Total esperado</span><strong>${expectedTotal.toLocaleString("es-AR")}</strong></div>
              {difference !== null && (
                <div className={`flex justify-between gap-3 ${difference === 0 ? "text-emerald-300" : "text-yellow-200"}`}>
                  <span>Diferencia</span><strong>${difference.toLocaleString("es-AR")}</strong>
                </div>
              )}
            </div>
            <div className="mt-5 grid gap-3">
              <input
                type="number"
                min="0"
                step="0.01"
                disabled={register.status !== "open"}
                value={countedAmount}
                onChange={(e) => setCountedAmount(e.target.value)}
                placeholder="Monto contado al cierre"
                className="rounded-xl border border-white/15 bg-[#1a1a1a] px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:border-[#b02e2e]/60 focus:outline-none disabled:opacity-50"
              />
              <textarea
                disabled={register.status !== "open"}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observaciones"
                rows={3}
                className="rounded-xl border border-white/15 bg-[#1a1a1a] px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:border-[#b02e2e]/60 focus:outline-none disabled:opacity-50"
              />
              <button
                disabled={register.status !== "open" || !countedAmount}
                onClick={closeRegister}
                className="min-h-11 rounded-xl bg-[#b02e2e] px-5 py-3 text-sm font-semibold text-white hover:bg-[#b02e2e]/85 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cerrar caja
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusPill({ statusId }: { statusId: number }) {
  const data = {
    1: { label: "Pendiente", className: "border-yellow-500/30 bg-yellow-500/10 text-yellow-200" },
    2: { label: "Confirmado", className: "border-[#2e4a7d]/40 bg-[#2e4a7d]/20 text-blue-200" },
    3: { label: "Cancelado", className: "border-red-500/30 bg-red-500/10 text-red-300" },
    4: { label: "Completado", className: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" },
  }[statusId] || { label: "Estado", className: "border-white/10 bg-white/5 text-gray-300" };

  return <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${data.className}`}>{data.label}</span>;
}

function CashMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-lg font-bold text-white break-words">{value}</p>
      <p className="mt-1 text-xs text-gray-500">{label}</p>
    </div>
  );
}

function BarbersTab({ barbers, barbershopId, ownerId, onRefresh }: {
  barbers: Barber[];
  barbershopId: string;
  ownerId: string | null;
  onRefresh: () => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; barber: Barber | null }>({ open: false, barber: null });
  const [reactivateModal, setReactivateModal] = useState<{ open: boolean; barber: Barber | null }>({ open: false, barber: null });
  const [actionLoading, setActionLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setFormError(null);
    const { name, email, password } = form;
    if (!name || !email || !password) { setFormError("Todos los campos son requeridos"); setCreating(false); return; }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError || !signUpData?.user) {
      setFormError("No se pudo crear el usuario: " + (signUpError?.message || "")); setCreating(false); return;
    }
    const userId = signUpData.user.id;
    const { data: existing } = await supabase.from("users").select("id").eq("id", userId).maybeSingle();
    if (!existing) {
      const { error } = await supabase.from("users").insert([{ id: userId, name, email, user_type_id: 3 }]);
      if (error) { setFormError("No se pudo crear el perfil"); setCreating(false); return; }
    } else {
      await supabase.from("users").update({ user_type_id: 3 }).eq("id", userId);
    }
    const { error: insertError } = await supabase.from("barbers").insert([{ user_id: userId, barbershop_id: barbershopId }]);
    if (insertError) { setFormError("No se pudo asociar el peluquero"); setCreating(false); return; }

    setShowModal(false);
    setForm({ name: "", email: "", password: "" });
    setCreating(false);
    onRefresh();
  };

  const handleDeactivate = async () => {
    if (!deleteModal.barber) return;
    setActionLoading(true);
    await supabase.from("users").update({ is_active: false }).eq("id", deleteModal.barber.user_id);
    setDeleteModal({ open: false, barber: null });
    setActionLoading(false);
    onRefresh();
  };

  const handleReactivate = async () => {
    if (!reactivateModal.barber) return;
    setActionLoading(true);
    await supabase.from("users").update({ is_active: true }).eq("id", reactivateModal.barber.user_id);
    setReactivateModal({ open: false, barber: null });
    setActionLoading(false);
    onRefresh();
  };

  const active = barbers.filter((b) => b.is_active !== false);
  const inactive = barbers.filter((b) => b.is_active === false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
        <div>
          <h2 className="text-white font-semibold">Barberos</h2>
          <p className="text-gray-500 text-xs mt-0.5">{active.length} activos · {inactive.length} inactivos</p>
        </div>
        <Button onClick={() => { setForm({ name: "", email: "", password: "" }); setFormError(null); setShowModal(true); }}
          className="flex min-h-11 items-center justify-center gap-2 bg-[#b02e2e] text-white text-sm px-4 py-2 rounded-xl hover:bg-[#b02e2e]/85 transition-colors"
        >
          <Plus className="w-4 h-4" /> Agregar barbero
        </Button>
      </div>

      {barbers.length === 0 ? (
        <EmptyState text="No hay barberos registrados" />
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <ul className="divide-y divide-white/5">
            {barbers.map((barber) => {
              const isOwner = !!ownerId && barber.user_id === ownerId;
              const isInactive = barber.is_active === false;
              return (
                <li key={barber.id} className="flex flex-col gap-3 px-4 py-4 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between sm:px-5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-[#2e4a7d]/20 flex items-center justify-center text-sm font-bold text-[#2e4a7d] uppercase flex-shrink-0">
                      {barber.user.name?.charAt(0) || "?"}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={`text-sm font-medium break-words ${isInactive ? "text-gray-500" : "text-white"}`}>{barber.user.name}</p>
                        {isOwner && <span className="text-xs bg-[#2e4a7d]/30 text-[#2e4a7d] px-2 py-0.5 rounded-full">Dueño</span>}
                        {isInactive && <span className="text-xs bg-white/5 text-gray-500 px-2 py-0.5 rounded-full">Inactivo</span>}
                      </div>
                      <p className="text-gray-500 text-xs truncate">{barber.user.email}</p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 min-[420px]:ml-4">
                    {isInactive ? (
                      <button
                        onClick={() => setReactivateModal({ open: true, barber })}
                        className="flex min-h-10 items-center justify-center gap-1.5 text-xs text-emerald-400 border border-emerald-400/30 px-3 py-1.5 rounded-lg hover:bg-emerald-400/10 transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" /> Reactivar
                      </button>
                    ) : (
                      <button
                        disabled={isOwner}
                        onClick={() => !isOwner && setDeleteModal({ open: true, barber })}
                        className="flex min-h-10 items-center justify-center gap-1.5 text-xs text-red-400 border border-red-400/30 px-3 py-1.5 rounded-lg hover:bg-red-400/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <XCircle className="w-3 h-3" /> Desactivar
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Modal — crear barbero */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Agregar barbero">
        <form onSubmit={handleCreate} className="space-y-4 mt-4">
          <Input label="Nombre" name="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Nombre completo" autoFocus />
          <Input label="Email" name="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required placeholder="correo@ejemplo.com" />
          <Input label="Contraseña" name="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required placeholder="Contraseña segura" />
          {formError && <p className="text-red-400 text-sm">{formError}</p>}
          <div className="flex flex-col min-[380px]:flex-row min-[380px]:justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button type="submit" disabled={creating} className="bg-[#b02e2e] text-white px-4 py-2 rounded-lg text-sm">
              {creating ? <LoadingSpinner size="sm" /> : "Registrar"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal — desactivar */}
      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, barber: null })}
        onConfirm={handleDeactivate}
        loading={actionLoading}
        title="Desactivar barbero"
        message={<>¿Desactivar a <strong className="text-white">{deleteModal.barber?.user.name}</strong>? Podrás reactivarlo en cualquier momento.</>}
        confirmLabel="Desactivar"
        confirmClass="bg-[#b02e2e]"
      />

      {/* Modal — reactivar */}
      <ConfirmModal
        isOpen={reactivateModal.open}
        onClose={() => setReactivateModal({ open: false, barber: null })}
        onConfirm={handleReactivate}
        loading={actionLoading}
        title="Reactivar barbero"
        message={<>¿Reactivar a <strong className="text-white">{reactivateModal.barber?.user.name}</strong>?</>}
        confirmLabel="Reactivar"
        confirmClass="bg-emerald-600"
      />
    </div>
  );
}

// ─── Services Tab ─────────────────────────────────────────────────────────────

function ServicesTab({ services, barbershopId, onRefresh }: {
  services: Service[];
  barbershopId: string;
  onRefresh: () => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", price: "", duration_min: "" });
  const [saving, setSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; service: Service | null }>({ open: false, service: null });
  const [deleting, setDeleting] = useState(false);

  const openCreate = () => { setForm({ name: "", price: "", duration_min: "" }); setEditingId(null); setShowModal(true); };
  const openEdit = (svc: Service) => {
    setForm({ name: svc.name, price: svc.price?.toString() || "", duration_min: svc.duration_min?.toString() || "" });
    setEditingId(svc.id);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name,
      price: form.price ? parseFloat(form.price) : undefined,
      duration_min: form.duration_min ? parseInt(form.duration_min) : undefined,
      barbershop_id: barbershopId,
    };
    if (editingId) {
      await supabase.from("services").update(payload as any).eq("id", editingId);
    } else {
      await supabase.from("services").insert([payload as any]);
    }
    setSaving(false);
    setShowModal(false);
    onRefresh();
  };

  const handleDelete = async () => {
    if (!deleteModal.service) return;
    setDeleting(true);
    await supabase.from("services").delete().eq("id", deleteModal.service.id);
    setDeleting(false);
    setDeleteModal({ open: false, service: null });
    onRefresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
        <div>
          <h2 className="text-white font-semibold">Servicios</h2>
          <p className="text-gray-500 text-xs mt-0.5">{services.length} servicios registrados</p>
        </div>
        <button
          onClick={openCreate}
          className="flex min-h-11 items-center justify-center gap-2 bg-[#b02e2e] text-white text-sm px-4 py-2 rounded-xl hover:bg-[#b02e2e]/85 transition-colors"
        >
          <Plus className="w-4 h-4" /> Nuevo servicio
        </button>
      </div>

      {services.length === 0 ? (
        <EmptyState text="No hay servicios registrados" action={{ label: "Agregar servicio", onClick: openCreate }} />
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="divide-y divide-white/5 sm:hidden">
            {services.map((svc) => (
              <div key={svc.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-white font-medium text-sm break-words">{svc.name}</p>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                      <span className="text-gray-400">{svc.duration_min ? `${svc.duration_min} min` : "Sin duración"}</span>
                      <span className={svc.price ? "text-white font-semibold" : "text-gray-600"}>
                        {svc.price ? `$${svc.price.toLocaleString("es-AR")}` : "Sin precio"}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-1">
                    <button onClick={() => openEdit(svc)} className="min-h-10 min-w-10 rounded-lg text-gray-400 transition-colors hover:bg-white/10 hover:text-white">
                      <Pencil className="mx-auto w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteModal({ open: true, service: svc })} className="min-h-10 min-w-10 rounded-lg text-gray-400 transition-colors hover:bg-red-500/10 hover:text-red-400">
                      <Trash2 className="mx-auto w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <table className="hidden w-full text-sm sm:table">
            <thead>
              <tr className="border-b border-white/8">
                <th className="text-left text-gray-500 font-medium px-5 py-3 text-xs uppercase tracking-wide">Servicio</th>
                <th className="text-right text-gray-500 font-medium px-5 py-3 text-xs uppercase tracking-wide">Duración</th>
                <th className="text-right text-gray-500 font-medium px-5 py-3 text-xs uppercase tracking-wide">Precio</th>
                <th className="px-3 py-3 w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {services.map((svc) => (
                <tr key={svc.id} className="group hover:bg-white/3 transition-colors">
                  <td className="px-5 py-3.5 text-white font-medium">{svc.name}</td>
                  <td className="px-5 py-3.5 text-gray-400 text-right">{svc.duration_min ? `${svc.duration_min} min` : "—"}</td>
                  <td className="px-5 py-3.5 text-right">
                    <span className={svc.price ? "text-white font-semibold" : "text-gray-600"}>
                      {svc.price ? `$${svc.price.toLocaleString("es-AR")}` : "—"}
                    </span>
                  </td>
                  <td className="px-3 py-3.5">
                    <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(svc)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteModal({ open: true, service: svc })} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal crear/editar */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? "Editar servicio" : "Nuevo servicio"}>
        <form onSubmit={handleSave} className="space-y-4 mt-4">
          <Input label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Ej: Corte y barba" autoFocus />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Duración (minutos)" type="number" min="15" step="15" value={form.duration_min} onChange={(e) => setForm({ ...form, duration_min: e.target.value })} placeholder="30" />
            <Input label="Precio ($)" type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="1500" />
          </div>
          <div className="flex flex-col min-[380px]:flex-row min-[380px]:justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving} className="bg-[#b02e2e] text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">
              {saving ? <LoadingSpinner size="sm" /> : <><Save className="w-4 h-4" /> Guardar</>}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal eliminar */}
      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, service: null })}
        onConfirm={handleDelete}
        loading={deleting}
        title="Eliminar servicio"
        message={<>¿Eliminar <strong className="text-white">{deleteModal.service?.name}</strong>? Esta acción no se puede deshacer.</>}
        confirmLabel="Eliminar"
        confirmClass="bg-[#b02e2e]"
      />
    </div>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────

function SettingsTab({ barbershop, onRefresh }: { barbershop: Barbershop | null; onRefresh: () => void }) {
  const [form, setForm] = useState({ name: barbershop?.name || "", address: barbershop?.address || "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (barbershop) setForm({ name: barbershop.name, address: barbershop.address });
  }, [barbershop]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await supabase.from("barbershops").update({ name: form.name, address: form.address }).eq("id", barbershop?.id || "");
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    onRefresh();
  };

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h2 className="text-white font-semibold">Datos de la barbería</h2>
        <p className="text-gray-500 text-xs mt-0.5">Editá el nombre y la dirección que ven los clientes</p>
      </div>

      <form onSubmit={handleSave} className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6 space-y-5">
        <Input
          label="Nombre de la barbería"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
          placeholder="Ej: BarberClub Centro"
        />
        <Input
          label="Dirección"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          placeholder="Ej: Av. Corrientes 1234, CABA"
        />

        <div className="flex flex-col gap-3 pt-2 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
          {saved ? (
            <span className="flex items-center gap-1.5 text-emerald-400 text-sm">
              <CheckCircle className="w-4 h-4" /> Cambios guardados
            </span>
          ) : <span />}
          <button
            type="submit"
            disabled={saving}
            className="flex min-h-11 items-center justify-center gap-2 bg-[#b02e2e] text-white text-sm px-5 py-2.5 rounded-xl hover:bg-[#b02e2e]/85 transition-colors disabled:opacity-50"
          >
            {saving ? <LoadingSpinner size="sm" /> : <><Save className="w-4 h-4" /> Guardar cambios</>}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function ConfirmModal({ isOpen, onClose, onConfirm, loading, title, message, confirmLabel, confirmClass }: {
  isOpen: boolean; onClose: () => void; onConfirm: () => void; loading: boolean;
  title: string; message: React.ReactNode; confirmLabel: string; confirmClass: string;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="mt-4 space-y-5">
        <p className="text-gray-300 text-sm leading-relaxed">{message}</p>
        <div className="flex flex-col min-[380px]:flex-row min-[380px]:justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>Cancelar</Button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex min-h-10 items-center justify-center gap-2 text-white text-sm font-medium px-4 py-2 rounded-lg transition-opacity disabled:opacity-50 ${confirmClass}`}
          >
            {loading ? <LoadingSpinner size="sm" /> : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function EmptyState({ text, action }: { text: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="bg-white/3 border border-white/8 rounded-2xl p-12 text-center">
      <p className="text-gray-500 text-sm">{text}</p>
      {action && (
        <button onClick={action.onClick} className="mt-3 text-sm text-[#b02e2e] hover:underline flex items-center gap-1 mx-auto">
          <Plus className="w-3.5 h-3.5" /> {action.label}
        </button>
      )}
    </div>
  );
}
