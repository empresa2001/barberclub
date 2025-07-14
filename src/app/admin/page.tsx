'use client';

import { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  Calendar, 
  TrendingUp, 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  MoreVertical,
  Download,
  Mail,
  Phone,
  MapPin,
  BarChart3,
  Activity,
  Star,
  Zap
} from 'lucide-react';
import Logo from '@/components/Logo';
import Link from 'next/link';

interface Barbershop {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  status: 'active' | 'pending' | 'suspended';
  admin_name: string;
  admin_email: string;
  created_at: string;
  last_login?: string;
  total_barbers: number;
  total_appointments: number;
  monthly_revenue: number;
}

interface DashboardStats {
  total_barbershops: number;
  active_barbershops: number;
  pending_barbershops: number;
  total_users: number;
  monthly_appointments: number;
  monthly_revenue: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    total_barbershops: 0,
    active_barbershops: 0,
    pending_barbershops: 0,
    total_users: 0,
    monthly_appointments: 0,
    monthly_revenue: 0
  });

  const [barbershops, setBarbershops] = useState<Barbershop[]>([]);
  const [filteredBarbershops, setFilteredBarbershops] = useState<Barbershop[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'suspended'>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Simulamos datos para la demo
  useEffect(() => {
    const loadData = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockStats: DashboardStats = {
        total_barbershops: 42,
        active_barbershops: 35,
        pending_barbershops: 5,
        total_users: 287,
        monthly_appointments: 3542,
        monthly_revenue: 125800
      };

      const mockBarbershops: Barbershop[] = [
        {
          id: '1',
          name: 'Barbería Clásica Premium',
          email: 'info@barberiaclasica.com',
          phone: '+54 11 4567-8901',
          address: 'Av. Corrientes 1234, CABA',
          status: 'active',
          admin_name: 'Carlos Martínez',
          admin_email: 'carlos@barberiaclasica.com',
          created_at: '2024-01-15',
          last_login: '2024-01-20',
          total_barbers: 6,
          total_appointments: 234,
          monthly_revenue: 18500
        },
        {
          id: '2',
          name: 'Modern Cut Studio',
          email: 'contact@moderncut.com',
          phone: '+54 11 5678-9012',
          address: 'Palermo Hollywood 567, CABA',
          status: 'active',
          admin_name: 'Ana García',
          admin_email: 'ana@moderncut.com',
          created_at: '2024-01-10',
          last_login: '2024-01-19',
          total_barbers: 8,
          total_appointments: 389,
          monthly_revenue: 24200
        },
        {
          id: '3',
          name: 'Barber Shop Elite',
          email: 'admin@barbershopelite.com',
          phone: '+54 11 6789-0123',
          address: 'Belgrano R 890, CABA',
          status: 'pending',
          admin_name: 'Miguel Rodríguez',
          admin_email: 'miguel@barbershopelite.com',
          created_at: '2024-01-18',
          total_barbers: 0,
          total_appointments: 0,
          monthly_revenue: 0
        },
        {
          id: '4',
          name: 'Style & Cuts',
          email: 'info@stylecuts.com',
          phone: '+54 11 7890-1234',
          address: 'Villa Crespo 456, CABA',
          status: 'active',
          admin_name: 'Laura Fernández',
          admin_email: 'laura@stylecuts.com',
          created_at: '2024-01-05',
          last_login: '2024-01-20',
          total_barbers: 4,
          total_appointments: 156,
          monthly_revenue: 12800
        }
      ];

      setStats(mockStats);
      setBarbershops(mockBarbershops);
      setFilteredBarbershops(mockBarbershops);
      setIsLoading(false);
    };

    loadData();
  }, []);

  // Filtrar barberías
  useEffect(() => {
    let filtered = barbershops;

    if (searchTerm) {
      filtered = filtered.filter(barbershop =>
        barbershop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        barbershop.admin_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        barbershop.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(barbershop => barbershop.status === statusFilter);
    }

    setFilteredBarbershops(filtered);
  }, [barbershops, searchTerm, statusFilter]);

  const handleStatusChange = async (barbershopId: string, newStatus: 'active' | 'suspended') => {
    setBarbershops(prev => 
      prev.map(barbershop => 
        barbershop.id === barbershopId 
          ? { ...barbershop, status: newStatus }
          : barbershop
      )
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { 
        color: 'bg-green-500/20 text-green-400 border-green-500/30', 
        label: 'Activa',
        icon: CheckCircle
      },
      pending: { 
        color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', 
        label: 'Pendiente',
        icon: Clock
      },
      suspended: { 
        color: 'bg-red-500/20 text-red-400 border-red-500/30', 
        label: 'Suspendida',
        icon: XCircle
      }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const IconComponent = config.icon;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${config.color} group-hover:scale-105 transition-transform duration-200`}>
        <IconComponent className="h-3 w-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const statCards = [
    {
      title: 'Total Barberías',
      value: stats.total_barbershops,
      icon: Building2,
      color: 'text-barbershop-blue',
      bgColor: 'bg-barbershop-blue/10',
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: 'Barberías Activas',
      value: stats.active_barbershops,
      icon: CheckCircle,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      change: '+8%',
      changeType: 'positive'
    },
    {
      title: 'Usuarios Totales',
      value: stats.total_users,
      icon: Users,
      color: 'text-barbershop-red',
      bgColor: 'bg-barbershop-red/10',
      change: '+23%',
      changeType: 'positive'
    },
    {
      title: 'Ingresos Mensuales',
      value: `$${stats.monthly_revenue.toLocaleString()}`,
      icon: TrendingUp,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      change: '+15%',
      changeType: 'positive'
    }
  ];

  if (isLoading) {
    return (
      <div className="!min-h-screen !bg-gradient-to-br !from-slate-950 !via-gray-950 !to-slate-900 !flex !items-center !justify-center !relative !overflow-hidden">
        {/* Animated background */}
        <div className="!absolute !inset-0 !pointer-events-none">
          <div className="!absolute !top-20 !left-10 !w-72 !h-72 !bg-red-500/10 !rounded-full !blur-3xl !animate-pulse"></div>
          <div className="!absolute !bottom-20 !right-10 !w-80 !h-80 !bg-blue-500/10 !rounded-full !blur-3xl !animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
        
        <div className="!text-center !relative !z-10">
          <div className="!relative">
            <div className="!absolute !inset-0 !bg-red-500/20 !rounded-full !blur-2xl !animate-pulse"></div>
            <div className="!relative !bg-gradient-to-br !from-white/20 !to-white/10 !p-8 !rounded-full !mb-8 !border !border-white/20 !backdrop-blur-xl">
              <Building2 className="!h-20 !w-20 !text-red-400 !animate-pulse" />
            </div>
          </div>
          <h2 className="!text-3xl !font-bold !text-white !mb-4 !drop-shadow-lg">Cargando Panel Superadmin</h2>
          <p className="!text-white/60 !mb-8 !font-medium">Preparando tu dashboard...</p>
          <div className="!flex !items-center !justify-center !space-x-3">
            <div className="!w-3 !h-3 !bg-red-500 !rounded-full !animate-bounce"></div>
            <div className="!w-3 !h-3 !bg-red-500 !rounded-full !animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="!w-3 !h-3 !bg-red-500 !rounded-full !animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="!min-h-screen !bg-gradient-to-br !from-slate-950 !via-gray-950 !to-slate-900 !relative !overflow-hidden">
      {/* Animated Background Elements */}
      <div className="!absolute !inset-0 !pointer-events-none">
        <div className="!absolute !top-20 !left-10 !w-96 !h-96 !bg-red-500/10 !rounded-full !blur-3xl !animate-pulse"></div>
        <div className="!absolute !bottom-20 !right-10 !w-80 !h-80 !bg-blue-500/10 !rounded-full !blur-3xl !animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="!absolute !top-1/2 !left-1/3 !w-72 !h-72 !bg-purple-500/5 !rounded-full !blur-3xl !animate-pulse" style={{animationDelay: '4s'}}></div>
        <div className="!absolute !top-10 !right-1/4 !w-64 !h-64 !bg-emerald-500/5 !rounded-full !blur-3xl !animate-pulse" style={{animationDelay: '6s'}}></div>
      </div>

      {/* Header */}
      <header className="!bg-gradient-to-r !from-white/10 !via-white/5 !to-white/10 !backdrop-blur-xl !border-b !border-white/20 !sticky !top-0 !z-50">
        <div className="!max-w-7xl !mx-auto !px-4 sm:!px-6 lg:!px-8">
          <div className="!flex !items-center !justify-between !h-20">
            <div className="!flex !items-center !space-x-6">
                        <Link href="/" className="inline-block">
            <Logo size="md" />
          </Link>
              <div>
                <h1 className="!text-2xl !font-bold !text-white !drop-shadow-lg">Panel Superadmin</h1>
                <p className="!text-sm !text-white/70 !font-medium">BarberClub Management Dashboard</p>
              </div>
            </div>
            <div className="!flex !items-center !space-x-4">
              <button className="!inline-flex !items-center !px-6 !py-3 !bg-gradient-to-r !from-blue-600 !to-blue-700 !text-white !rounded-xl !font-semibold !shadow-lg !shadow-blue-500/25 hover:!shadow-blue-500/40 hover:!scale-105 !transition-all !duration-300 !group !backdrop-blur-sm">
                <Download className="!h-4 !w-4 !mr-2 group-hover:!scale-110 !transition-transform !duration-300" />
                Exportar
              </button>
              <div className="!relative !group">
                <div className="!w-12 !h-12 !bg-gradient-to-r !from-red-500 !to-red-600 !rounded-xl !flex !items-center !justify-center group-hover:!scale-110 !transition-transform !duration-300 !cursor-pointer !shadow-lg !shadow-red-500/25">
                  <span className="!text-white !text-sm !font-bold">SA</span>
                </div>
                <div className="!absolute !inset-0 !bg-red-500/30 !rounded-xl !animate-pulse !opacity-0 group-hover:!opacity-100 !transition-opacity !duration-300"></div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="!max-w-7xl !mx-auto !px-4 sm:!px-6 lg:!px-8 !py-12 !relative">
        {/* Stats Cards */}
        <div className="!grid !grid-cols-1 md:!grid-cols-2 lg:!grid-cols-4 !gap-8 !mb-16">
          {statCards.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div
                key={stat.title}
                className="!group !relative"
                style={{animationDelay: `${index * 0.1}s`}}
              >
                <div className="!absolute !inset-0 !bg-gradient-to-br !from-white/10 !to-white/5 !rounded-2xl !blur-xl group-hover:!blur-2xl !transition-all !duration-500"></div>
                <div className="!relative !bg-gradient-to-br !from-white/10 !to-white/5 !backdrop-blur-xl !p-8 !rounded-2xl !border !border-white/20 group-hover:!border-white/30 !transform group-hover:!scale-105 group-hover:!-translate-y-2 !transition-all !duration-500 !h-full !shadow-xl !shadow-black/20">
                  <div className="!flex !items-center !justify-between">
                    <div>
                      <p className="!text-sm !text-white/60 !mb-2 !font-medium">{stat.title}</p>
                      <p className="!text-3xl !font-bold !text-white group-hover:!text-transparent group-hover:!bg-gradient-to-r group-hover:!from-red-400 group-hover:!to-blue-400 group-hover:!bg-clip-text !transition-all !duration-300">
                        {stat.value}
                      </p>
                      <div className="!flex !items-center !mt-3">
                        <span className="!text-xs !text-green-400 !font-semibold !bg-green-400/10 !px-2 !py-1 !rounded-lg">
                          {stat.change}
                        </span>
                        <span className="!text-xs !text-white/50 !ml-2">vs mes anterior</span>
                      </div>
                    </div>
                    <div className={`!bg-gradient-to-br !from-white/20 !to-white/10 !p-4 !rounded-2xl group-hover:!scale-110 group-hover:!rotate-6 !transition-all !duration-300 !shadow-lg`}>
                      <IconComponent className={`!h-8 !w-8 !text-white`} />
                    </div>
                  </div>
                  <div className="!absolute !bottom-0 !left-0 !w-0 !h-1 !bg-gradient-to-r !from-red-500 !to-blue-500 group-hover:!w-full !transition-all !duration-500 !rounded-b-2xl"></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="!grid !grid-cols-2 md:!grid-cols-4 !gap-6 !mb-16">
          {[
            { icon: Plus, label: 'Nueva Barbería', color: 'group-hover:!text-green-400' },
            { icon: BarChart3, label: 'Reportes', color: 'group-hover:!text-blue-400' },
            { icon: Activity, label: 'Actividad', color: 'group-hover:!text-yellow-400' },
            { icon: Star, label: 'Reviews', color: 'group-hover:!text-purple-400' }
          ].map((action, index) => {
            const IconComponent = action.icon;
            return (
              <button
                key={action.label}
                className={`!group !p-6 !bg-gradient-to-br !from-white/10 !to-white/5 !backdrop-blur-xl !border !border-white/20 !rounded-2xl !text-white ${action.color} !transition-all !duration-300 hover:!scale-105 hover:!border-white/30 !shadow-xl !shadow-black/10`}
                style={{animationDelay: `${index * 0.1}s`}}
              >
                <IconComponent className="!h-7 !w-7 !mx-auto !mb-3 group-hover:!scale-110 !transition-transform !duration-300" />
                <span className="!text-sm !font-semibold group-hover:!text-white !transition-colors !duration-300">
                  {action.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filters and Search */}
        <div className="!bg-gradient-to-br !from-white/10 !to-white/5 !backdrop-blur-xl !border !border-white/20 !rounded-2xl !p-8 !mb-12 !shadow-xl !shadow-black/20">
          <div className="!flex !flex-col lg:!flex-row !gap-6 !items-start lg:!items-center !justify-between">
            <div className="!flex-1 !max-w-md !relative !group">
              <Search className="!absolute !left-4 !top-1/2 !transform !-translate-y-1/2 !h-5 !w-5 !text-white/50 group-focus-within:!text-red-400 !transition-colors !duration-300" />
              <input
                type="text"
                placeholder="Buscar barberías, administradores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="!w-full !pl-12 !pr-4 !py-4 !bg-white/5 !border !border-white/20 !rounded-xl !text-white !placeholder-white/50 focus:!outline-none focus:!ring-2 focus:!ring-red-500/50 focus:!border-red-500/50 !transition-all !duration-300 hover:!border-white/30 !backdrop-blur-sm"
              />
            </div>
            
            <div className="!flex !gap-4 !items-center">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="!px-6 !py-4 !bg-white/5 !border !border-white/20 !rounded-xl !text-white focus:!outline-none focus:!ring-2 focus:!ring-red-500/50 !transition-all !duration-300 hover:!border-white/30 !backdrop-blur-sm"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activas</option>
                <option value="pending">Pendientes</option>
                <option value="suspended">Suspendidas</option>
              </select>
              
              <button className="!inline-flex !items-center !px-8 !py-4 !bg-gradient-to-r !from-red-500 !to-red-600 !text-white !rounded-xl !font-semibold !shadow-lg !shadow-red-500/25 hover:!shadow-red-500/40 !transform hover:!scale-105 !transition-all !duration-300 !group">
                <Plus className="!h-5 !w-5 !mr-2 group-hover:!rotate-90 !transition-transform !duration-300" />
                Nueva Barbería
              </button>
            </div>
          </div>
        </div>

        {/* Barbershops Table */}
        <div className="!bg-gradient-to-br !from-white/10 !to-white/5 !backdrop-blur-xl !border !border-white/20 !rounded-2xl !shadow-2xl !overflow-hidden">
          <div className="!px-8 !py-6 !border-b !border-white/20 !bg-gradient-to-r !from-white/5 !to-transparent">
            <div className="!flex !items-center !justify-between">
              <h2 className="!text-xl !font-bold !text-white !drop-shadow-lg">
                Barberías Registradas ({filteredBarbershops.length})
              </h2>
              <div className="!flex !items-center !space-x-2">
                <Zap className="!h-5 !w-5 !text-red-400 !animate-pulse" />
                <span className="!text-sm !text-white/70 !font-medium">En tiempo real</span>
              </div>
            </div>
          </div>
          
          <div className="!overflow-x-auto">
            <table className="!w-full">
              <thead className="!bg-white/5">
                <tr>
                  <th className="!px-8 !py-5 !text-left !text-xs !font-semibold !text-white/70 !uppercase !tracking-wider">
                    Barbería
                  </th>
                  <th className="!px-8 !py-5 !text-left !text-xs !font-semibold !text-white/70 !uppercase !tracking-wider">
                    Administrador
                  </th>
                  <th className="!px-8 !py-5 !text-left !text-xs !font-semibold !text-white/70 !uppercase !tracking-wider">
                    Estado
                  </th>
                  <th className="!px-8 !py-5 !text-left !text-xs !font-semibold !text-white/70 !uppercase !tracking-wider">
                    Estadísticas
                  </th>
                  <th className="!px-8 !py-5 !text-left !text-xs !font-semibold !text-white/70 !uppercase !tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="!divide-y !divide-white/10">
                {filteredBarbershops.map((barbershop, index) => (
                  <tr 
                    key={barbershop.id} 
                    className="!group hover:!bg-white/5 !transition-all !duration-300"
                    style={{animationDelay: `${index * 0.05}s`}}
                  >
                    <td className="!px-8 !py-6">
                      <div className="!flex !items-center !space-x-4">
                        <div className="!relative">
                          <div className="!w-14 !h-14 !bg-gradient-to-br !from-red-500/20 !to-blue-500/20 !rounded-2xl !flex !items-center !justify-center group-hover:!scale-110 !transition-transform !duration-300 !shadow-lg">
                            <Building2 className="!h-7 !w-7 !text-red-400" />
                          </div>
                          <div className="!absolute !-top-1 !-right-1 !w-4 !h-4 !bg-green-500 !rounded-full !border-2 !border-white/20 !animate-pulse"></div>
                        </div>
                        <div>
                          <div className="!text-sm !font-semibold !text-white group-hover:!text-red-400 !transition-colors !duration-300">
                            {barbershop.name}
                          </div>
                          <div className="!text-sm !text-white/60 !flex !items-center !mt-1">
                            <MapPin className="!h-3 !w-3 !mr-1" />
                            {barbershop.address}
                          </div>
                          <div className="!text-sm !text-white/60 !flex !items-center !mt-1">
                            <Phone className="!h-3 !w-3 !mr-1" />
                            {barbershop.phone}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="!px-8 !py-6">
                      <div>
                        <div className="!text-sm !font-medium !text-white">
                          {barbershop.admin_name}
                        </div>
                        <div className="!text-sm !text-white/60 !flex !items-center !mt-1">
                          <Mail className="!h-3 !w-3 !mr-1" />
                          {barbershop.admin_email}
                        </div>
                        {barbershop.last_login && (
                          <div className="!text-xs !text-white/50 !flex !items-center !mt-1">
                            <Clock className="!h-3 !w-3 !mr-1" />
                            Último acceso: {new Date(barbershop.last_login).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="!px-8 !py-6">
                      {getStatusBadge(barbershop.status)}
                    </td>
                    <td className="!px-8 !py-6">
                      <div className="!grid !grid-cols-3 !gap-4">
                        <div className="!text-center !p-3 !bg-white/5 !rounded-xl group-hover:!bg-white/10 !transition-colors !duration-300 !border !border-white/10">
                          <div className="!text-sm !font-semibold !text-white">
                            {barbershop.total_barbers}
                          </div>
                          <div className="!text-xs !text-white/60">Barberos</div>
                        </div>
                        <div className="!text-center !p-3 !bg-white/5 !rounded-xl group-hover:!bg-white/10 !transition-colors !duration-300 !border !border-white/10">
                          <div className="!text-sm !font-semibold !text-white">
                            {barbershop.total_appointments}
                          </div>
                          <div className="!text-xs !text-white/60">Turnos</div>
                        </div>
                        <div className="!text-center !p-3 !bg-white/5 !rounded-xl group-hover:!bg-white/10 !transition-colors !duration-300 !border !border-white/10">
                          <div className="!text-sm !font-semibold !text-green-400">
                            ${barbershop.monthly_revenue.toLocaleString()}
                          </div>
                          <div className="!text-xs !text-white/60">Mensual</div>
                        </div>
                      </div>
                    </td>
                    <td className="!px-8 !py-6">
                      <div className="!flex !items-center !space-x-2">
                        <button className="!p-2 !text-white/60 hover:!text-blue-400 hover:!bg-blue-400/10 !rounded-lg !transition-all !duration-300 !group/btn">
                          <Eye className="!h-4 !w-4 group-hover/btn:!scale-110 !transition-transform !duration-300" />
                        </button>
                        <button className="!p-2 !text-white/60 hover:!text-red-400 hover:!bg-red-400/10 !rounded-lg !transition-all !duration-300 !group/btn">
                          <Edit className="!h-4 !w-4 group-hover/btn:!scale-110 !transition-transform !duration-300" />
                        </button>
                        {barbershop.status === 'pending' && (
                          <button 
                            onClick={() => handleStatusChange(barbershop.id, 'active')}
                            className="!p-2 !text-white/60 hover:!text-green-400 hover:!bg-green-400/10 !rounded-lg !transition-all !duration-300 !group/btn"
                          >
                            <CheckCircle className="!h-4 !w-4 group-hover/btn:!scale-110 !transition-transform !duration-300" />
                          </button>
                        )}
                        {barbershop.status === 'active' && (
                          <button 
                            onClick={() => handleStatusChange(barbershop.id, 'suspended')}
                            className="!p-2 !text-white/60 hover:!text-red-400 hover:!bg-red-400/10 !rounded-lg !transition-all !duration-300 !group/btn"
                          >
                            <XCircle className="!h-4 !w-4 group-hover/btn:!scale-110 !transition-transform !duration-300" />
                          </button>
                        )}
                        <button className="!p-2 !text-white/60 hover:!text-white hover:!bg-white/10 !rounded-lg !transition-all !duration-300 !group/btn">
                          <MoreVertical className="!h-4 !w-4 group-hover/btn:!scale-110 !transition-transform !duration-300" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredBarbershops.length === 0 && (
            <div className="!text-center !py-20">
              <div className="!relative !inline-block !mb-8">
                <div className="!absolute !inset-0 !bg-white/10 !rounded-full !blur-2xl"></div>
                <div className="!relative !bg-gradient-to-br !from-white/20 !to-white/10 !p-8 !rounded-full !border !border-white/20">
                  <Building2 className="!h-20 !w-20 !text-white/60 !mx-auto" />
                </div>
              </div>
              <h3 className="!text-2xl !font-bold !text-white !mb-4 !drop-shadow-lg">
                No se encontraron barberías
              </h3>
              <p className="!text-white/60 !max-w-md !mx-auto !mb-8 !leading-relaxed">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Intenta ajustar los filtros de búsqueda para ver más resultados'
                  : 'Aún no hay barberías registradas en el sistema. ¡Invita a los primeros barberos!'
                }
              </p>
              <button className="!inline-flex !items-center !px-8 !py-4 !bg-gradient-to-r !from-red-500 !to-red-600 !text-white !rounded-xl !font-semibold !shadow-lg !shadow-red-500/25 hover:!shadow-red-500/40 !transform hover:!scale-105 !transition-all !duration-300">
                <Plus className="!h-5 !w-5 !mr-2" />
                Registrar Primera Barbería
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
