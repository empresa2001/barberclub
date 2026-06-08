'use client';

import { useState, useEffect } from 'react';
import {
  Building2,
  Clock,
  Search,
  CheckCircle,
  XCircle,
  Loader2,
  MapPin,
  Phone,
  Mail,
} from 'lucide-react';
import Logo from '@/components/Logo';
import Link from 'next/link';
import { barbershopsApi } from '@/lib/api';
import { lookupService } from '@/lib/database';
import { ConfirmModal } from '@/components/ui';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface BarbershopWithRelations {
  id: string;
  name: string;
  owner_id: string | null;
  status_id: number;
  description: string;
  location: string;
  phone: string;
  image_url: string;
  created_at: string;
  updated_at: string;
  barbershop_status: { name: string };
  users: { name: string; email: string } | null;
}

interface DashboardStats {
  total_barbershops: number;
  active_barbershops: number;
  pending_barbershops: number;
  inactive_barbershops: number;
}

type StatusFilter = 'all' | 'active' | 'pending' | 'inactive';

// ─── helpers ────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg =
    status === 'active'   ? { cls: 'bg-green-500/15 text-green-400 border-green-500/25',   label: 'Activa',     Icon: CheckCircle } :
    status === 'pending'  ? { cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25', label: 'Pendiente', Icon: Clock } :
                            { cls: 'bg-red-500/15 text-red-400 border-red-500/25',          label: 'Inactiva',   Icon: XCircle };

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.cls}`}>
      <cfg.Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function KpiCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: number; sub: string; color: string;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-widest mb-2">{label}</p>
          <p className="text-3xl font-black text-white">{value}</p>
          <p className="text-gray-600 text-xs mt-1">{sub}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

// ─── page ────────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  const [stats, setStats] = useState<DashboardStats>({
    total_barbershops: 0,
    active_barbershops: 0,
    pending_barbershops: 0,
    inactive_barbershops: 0,
  });
  const [barbershops, setBarbershops] = useState<BarbershopWithRelations[]>([]);
  const [filtered, setFiltered] = useState<BarbershopWithRelations[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    barbershopId: string;
    barbershopName: string;
    currentStatus: string;
    newStatus: 'active' | 'inactive' | 'pending';
    type: 'approve' | 'reject' | 'suspend' | 'reactivate';
    title: string;
    message: string;
  }>({
    isOpen: false,
    barbershopId: '',
    barbershopName: '',
    currentStatus: '',
    newStatus: 'active',
    type: 'approve',
    title: '',
    message: '',
  });

  // ── load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        try { await lookupService.getBarbershopStatuses(); } catch {}
        const data = await barbershopsApi.getAll() as any;
        const processed: BarbershopWithRelations[] = data.map((b: any) => ({
          ...b,
          barbershop_status: b.barbershop_status || { name: 'pending' },
          users: null,
        }));
        setBarbershops(processed);
        setFiltered(processed);
        recalcStats(processed);
      } catch {
        toast.error('Error al cargar datos');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── filter ────────────────────────────────────────────────────────────────
  useEffect(() => {
    let f = barbershops;
    if (search) {
      const q = search.toLowerCase();
      f = f.filter(b =>
        b.name.toLowerCase().includes(q) ||
        (b.location ?? '').toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      f = f.filter(b => b.barbershop_status.name === statusFilter);
    }
    setFiltered(f);
  }, [barbershops, search, statusFilter]);

  // ── helpers ───────────────────────────────────────────────────────────────
  function recalcStats(list: BarbershopWithRelations[]) {
    setStats({
      total_barbershops:    list.length,
      active_barbershops:   list.filter(b => b.barbershop_status.name === 'active').length,
      pending_barbershops:  list.filter(b => b.barbershop_status.name === 'pending').length,
      inactive_barbershops: list.filter(b => b.barbershop_status.name === 'inactive').length,
    });
  }

  function openConfirm(id: string, currentStatus: string, newStatus: 'active' | 'inactive' | 'pending') {
    const bs = barbershops.find(b => b.id === id);
    if (!bs) return;
    const map: Record<string, { type: 'approve' | 'reject' | 'suspend' | 'reactivate'; title: string; message: string }> = {
      'pending→active':   { type: 'approve',    title: 'Aprobar Barbería',   message: 'La barbería podrá operar y recibir reservas.' },
      'pending→inactive': { type: 'reject',     title: 'Rechazar Barbería',  message: 'La solicitud será rechazada.' },
      'active→inactive':  { type: 'suspend',    title: 'Suspender Barbería', message: 'Los clientes no podrán hacer reservas.' },
      'inactive→active':  { type: 'reactivate', title: 'Reactivar Barbería', message: 'La barbería volverá a estar disponible.' },
    };
    const cfg = map[`${currentStatus}→${newStatus}`] ?? { type: 'approve' as const, title: 'Cambiar Estado', message: '¿Confirmar cambio de estado?' };
    setConfirmModal({ isOpen: true, barbershopId: id, barbershopName: bs.name, currentStatus, newStatus, ...cfg });
  }

  async function handleConfirm() {
    const { barbershopId, newStatus } = confirmModal;
    setLoadingStates(p => ({ ...p, [barbershopId]: true }));
    setConfirmModal(p => ({ ...p, isOpen: false }));
    try {
      await barbershopsApi.updateStatus(barbershopId, newStatus);
      setBarbershops(prev => {
        const updated = prev.map(b =>
          b.id === barbershopId ? { ...b, barbershop_status: { name: newStatus } } : b
        );
        recalcStats(updated);
        return updated;
      });
      const labels: Record<string, string> = { active: 'activada', inactive: 'desactivada', pending: 'marcada como pendiente' };
      toast.success(`Barbería ${labels[newStatus]}`);
    } catch (err: any) {
      toast.error(err.message ?? 'Error al actualizar');
    } finally {
      setLoadingStates(p => ({ ...p, [barbershopId]: false }));
    }
  }

  // ── loading state ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-[#b02e2e] animate-spin mx-auto" />
          <p className="text-gray-400 text-sm">Cargando panel…</p>
        </div>
      </div>
    );
  }

  // ── render ────────────────────────────────────────────────────────────────
  const FILTER_TABS: { value: StatusFilter; label: string }[] = [
    { value: 'all',      label: 'Todas' },
    { value: 'active',   label: 'Activas' },
    { value: 'pending',  label: 'Pendientes' },
    { value: 'inactive', label: 'Inactivas' },
  ];

  return (
    <div className="min-h-screen bg-[#1a1a1a]">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#1a1a1a]/95 backdrop-blur-xl border-b border-white/8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link href="/"><Logo size="md" /></Link>
            <div className="h-5 w-px bg-white/10" />
            <span className="text-white text-sm font-semibold">Super Admin</span>
          </div>
          <div className="w-8 h-8 bg-[#b02e2e]/20 border border-[#b02e2e]/30 rounded-lg flex items-center justify-center">
            <span className="text-[#b02e2e] text-xs font-bold">SA</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* ── KPI row ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon={Building2}   label="Total"      value={stats.total_barbershops}    sub="registradas"       color="bg-[#2e4a7d]/20 text-[#2e4a7d]" />
          <KpiCard icon={CheckCircle} label="Activas"    value={stats.active_barbershops}   sub="operando"          color="bg-green-500/15 text-green-400" />
          <KpiCard icon={Clock}       label="Pendientes" value={stats.pending_barbershops}  sub="requieren acción"  color="bg-yellow-500/15 text-yellow-400" />
          <KpiCard icon={XCircle}     label="Inactivas"  value={stats.inactive_barbershops} sub="suspendidas"       color="bg-[#b02e2e]/20 text-[#b02e2e]" />
        </div>

        {/* ── Table section ────────────────────────────────────────────── */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">

          {/* toolbar */}
          <div className="px-5 py-4 border-b border-white/8 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar barbería…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 text-sm focus:outline-none focus:border-white/20 transition-colors"
              />
            </div>

            {/* filter tabs */}
            <div className="flex items-center gap-1 bg-white/5 border border-white/8 rounded-xl p-1">
              {FILTER_TABS.map(t => (
                <button
                  key={t.value}
                  onClick={() => setStatusFilter(t.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    statusFilter === t.value ? 'bg-[#b02e2e] text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {t.label}
                  {t.value !== 'all' && (
                    <span className="ml-1 opacity-60">
                      {t.value === 'active'   ? stats.active_barbershops   :
                       t.value === 'pending'  ? stats.pending_barbershops  :
                       stats.inactive_barbershops}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* column headers */}
          <div className="hidden sm:grid grid-cols-[1fr_1fr_120px_180px] gap-4 px-5 py-3 border-b border-white/8 text-gray-600 text-xs uppercase tracking-widest">
            <span>Barbería</span>
            <span>Administrador</span>
            <span>Estado</span>
            <span>Acciones</span>
          </div>

          {/* rows */}
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <Building2 className="w-10 h-10 mx-auto mb-3 text-gray-700" />
              <p className="text-gray-600 text-sm">
                {search || statusFilter !== 'all'
                  ? 'Sin resultados para ese filtro'
                  : 'No hay barberías registradas'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filtered.map(b => {
                const status = b.barbershop_status.name;
                const busy = loadingStates[b.id];
                return (
                  <div
                    key={b.id}
                    className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_120px_180px] gap-4 px-5 py-4 hover:bg-white/3 transition-colors items-center"
                  >
                    {/* barbería */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 bg-[#2e4a7d]/20 border border-[#2e4a7d]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-4 h-4 text-[#2e4a7d]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate">{b.name}</p>
                        {b.location && (
                          <p className="text-gray-600 text-xs flex items-center gap-1 mt-0.5 truncate">
                            <MapPin className="w-3 h-3 flex-shrink-0" />{b.location}
                          </p>
                        )}
                        {b.phone && (
                          <p className="text-gray-600 text-xs flex items-center gap-1 truncate">
                            <Phone className="w-3 h-3 flex-shrink-0" />{b.phone}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* admin */}
                    <div className="min-w-0">
                      {b.users ? (
                        <>
                          <p className="text-white text-sm font-medium truncate">{b.users.name}</p>
                          <p className="text-gray-600 text-xs flex items-center gap-1 truncate">
                            <Mail className="w-3 h-3 flex-shrink-0" />{b.users.email}
                          </p>
                        </>
                      ) : (
                        <p className="text-gray-600 text-xs">
                          Registrado {new Date(b.created_at).toLocaleDateString('es-AR')}
                        </p>
                      )}
                    </div>

                    {/* estado */}
                    <div>
                      <StatusBadge status={status} />
                    </div>

                    {/* acciones */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {status === 'pending' && (
                        <>
                          <button
                            onClick={() => openConfirm(b.id, status, 'active')}
                            disabled={busy}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium rounded-lg hover:bg-green-500/20 transition-colors disabled:opacity-40"
                          >
                            {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                            Aprobar
                          </button>
                          <button
                            onClick={() => openConfirm(b.id, status, 'inactive')}
                            disabled={busy}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-40"
                          >
                            {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                            Rechazar
                          </button>
                        </>
                      )}
                      {status === 'active' && (
                        <button
                          onClick={() => openConfirm(b.id, status, 'inactive')}
                          disabled={busy}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-40"
                        >
                          {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                          Suspender
                        </button>
                      )}
                      {status === 'inactive' && (
                        <button
                          onClick={() => openConfirm(b.id, status, 'active')}
                          disabled={busy}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium rounded-lg hover:bg-green-500/20 transition-colors disabled:opacity-40"
                        >
                          {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                          Reactivar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* footer */}
          {filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-white/8 text-gray-600 text-xs">
              {filtered.length} {filtered.length === 1 ? 'barbería' : 'barberías'}
              {statusFilter !== 'all' && ` · filtrado por "${FILTER_TABS.find(t => t.value === statusFilter)?.label.toLowerCase()}"`}
            </div>
          )}
        </div>
      </div>

      {/* confirm modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(p => ({ ...p, isOpen: false }))}
        onConfirm={handleConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        barbershopName={confirmModal.barbershopName}
        isLoading={loadingStates[confirmModal.barbershopId] ?? false}
      />
    </div>
  );
}
