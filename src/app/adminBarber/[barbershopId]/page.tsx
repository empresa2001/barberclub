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
} from "lucide-react";

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

type Tab = "dashboard" | "barbers" | "services" | "settings";

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
        .select("id,date,customer_name,customer_email,status_id,duration_min,services(name,price),barbers(users(name))")
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
    { id: "barbers",   label: "Barberos",  icon: <Users className="w-4 h-4" /> },
    { id: "services",  label: "Servicios", icon: <Scissors className="w-4 h-4" /> },
    { id: "settings",  label: "Configuración", icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="mb-6">
          {loading ? (
            <div className="h-8 w-48 bg-white/5 rounded-lg animate-pulse" />
          ) : (
            <>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{barbershop?.name || "Mi Barbería"}</h1>
              <p className="text-gray-500 text-sm mt-0.5">{barbershop?.address}</p>
            </>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1 mb-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
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
              <DashboardTab appointments={appointments} barbers={barbers} services={services} />
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

function DashboardTab({ appointments, barbers, services }: {
  appointments: Appointment[];
  barbers: Barber[];
  services: Service[];
}) {
  const today = new Date().toISOString().split("T")[0];

  const todayApts = appointments.filter((a) => a.date.startsWith(today) && a.status_id !== 3);
  const pendingApts = appointments.filter((a) => a.status_id === 1);
  const activeBarbers = barbers.filter((b) => b.is_active !== false);

  // Ingresos estimados de los últimos 30 días (servicios completados)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentApts = appointments.filter(
    (a) => new Date(a.date) >= thirtyDaysAgo && a.status_id !== 3
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
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
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
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
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
                <div key={apt.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#2e4a7d]/30 flex items-center justify-center flex-shrink-0 text-xs font-bold text-[#2e4a7d] uppercase">
                      {apt.customer_name?.charAt(0) || "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">{apt.customer_name}</p>
                      <p className="text-gray-500 text-xs truncate">{serviceName}{barberName ? ` · ${barberName}` : ""}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
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
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <div className={`w-9 h-9 rounded-xl border flex items-center justify-center mb-3 ${colors[color]}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-gray-500 text-xs mt-0.5">{label}</p>
    </div>
  );
}

// ─── Barbers Tab ──────────────────────────────────────────────────────────────

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-semibold">Barberos</h2>
          <p className="text-gray-500 text-xs mt-0.5">{active.length} activos · {inactive.length} inactivos</p>
        </div>
        <Button onClick={() => { setForm({ name: "", email: "", password: "" }); setFormError(null); setShowModal(true); }}
          className="flex items-center gap-2 bg-[#b02e2e] text-white text-sm px-4 py-2 rounded-xl hover:bg-[#b02e2e]/85 transition-colors"
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
                <li key={barber.id} className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-[#2e4a7d]/20 flex items-center justify-center text-sm font-bold text-[#2e4a7d] uppercase flex-shrink-0">
                      {barber.user.name?.charAt(0) || "?"}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-medium ${isInactive ? "text-gray-500" : "text-white"}`}>{barber.user.name}</p>
                        {isOwner && <span className="text-xs bg-[#2e4a7d]/30 text-[#2e4a7d] px-2 py-0.5 rounded-full">Dueño</span>}
                        {isInactive && <span className="text-xs bg-white/5 text-gray-500 px-2 py-0.5 rounded-full">Inactivo</span>}
                      </div>
                      <p className="text-gray-500 text-xs truncate">{barber.user.email}</p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    {isInactive ? (
                      <button
                        onClick={() => setReactivateModal({ open: true, barber })}
                        className="flex items-center gap-1.5 text-xs text-emerald-400 border border-emerald-400/30 px-3 py-1.5 rounded-lg hover:bg-emerald-400/10 transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" /> Reactivar
                      </button>
                    ) : (
                      <button
                        disabled={isOwner}
                        onClick={() => !isOwner && setDeleteModal({ open: true, barber })}
                        className="flex items-center gap-1.5 text-xs text-red-400 border border-red-400/30 px-3 py-1.5 rounded-lg hover:bg-red-400/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
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
          <div className="flex justify-end gap-2 pt-2">
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-semibold">Servicios</h2>
          <p className="text-gray-500 text-xs mt-0.5">{services.length} servicios registrados</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-[#b02e2e] text-white text-sm px-4 py-2 rounded-xl hover:bg-[#b02e2e]/85 transition-colors"
        >
          <Plus className="w-4 h-4" /> Nuevo servicio
        </button>
      </div>

      {services.length === 0 ? (
        <EmptyState text="No hay servicios registrados" action={{ label: "Agregar servicio", onClick: openCreate }} />
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
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
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
          <div className="grid grid-cols-2 gap-4">
            <Input label="Duración (minutos)" type="number" min="15" step="15" value={form.duration_min} onChange={(e) => setForm({ ...form, duration_min: e.target.value })} placeholder="30" />
            <Input label="Precio ($)" type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="1500" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
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

      <form onSubmit={handleSave} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
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

        <div className="flex items-center justify-between pt-2">
          {saved ? (
            <span className="flex items-center gap-1.5 text-emerald-400 text-sm">
              <CheckCircle className="w-4 h-4" /> Cambios guardados
            </span>
          ) : <span />}
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-[#b02e2e] text-white text-sm px-5 py-2.5 rounded-xl hover:bg-[#b02e2e]/85 transition-colors disabled:opacity-50"
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
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>Cancelar</Button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex items-center gap-2 text-white text-sm font-medium px-4 py-2 rounded-lg transition-opacity disabled:opacity-50 ${confirmClass}`}
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
