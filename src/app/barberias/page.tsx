'use client';

import { useState, useEffect, useMemo } from 'react';
import { Scissors, MapPin, Phone, Search, Calendar } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { barbershopsApi } from '@/lib/api';

interface Barbershop {
  id: string;
  name: string;
  location: string;
  phone: string;
  description: string;
  barbershop_status: { name: string };
}

export default function BarberiasPage() {
  const [barbershops, setBarbershops] = useState<Barbershop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    barbershopsApi.getAll()
      .then((data: any) => {
        // mostrar solo las activas al público
        setBarbershops((data as Barbershop[]).filter(b => b.barbershop_status?.name === 'active'));
      })
      .catch(() => setBarbershops([]))
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return barbershops;
    const q = search.toLowerCase();
    return barbershops.filter(b =>
      b.name.toLowerCase().includes(q) ||
      (b.location ?? '').toLowerCase().includes(q)
    );
  }, [barbershops, search]);

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col">
      <Navbar />

      <main className="flex-1">

        {/* ── Hero ───────────────────────────────────────────────────────── */}
        <section className="px-4 sm:px-6 pt-16 pb-10 text-center">
          <div className="inline-flex items-center gap-2 bg-[#b02e2e]/10 border border-[#b02e2e]/20 rounded-full px-4 py-1.5 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-[#b02e2e]" />
            <span className="text-[#b02e2e] text-xs font-medium tracking-wide">Barberías verificadas</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight mb-4">
            Encontrá tu{' '}
            <span className="bg-gradient-to-r from-[#b02e2e] to-[#2e4a7d] bg-clip-text text-transparent">
              barbería ideal
            </span>
          </h1>
          <p className="text-gray-400 text-base sm:text-lg max-w-md mx-auto mb-8">
            Todas las barberías activas en BarberClub. Agendá tu turno en segundos.
          </p>

          {/* search */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar por nombre o ubicación…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 text-sm focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>
        </section>

        {/* ── Grid ───────────────────────────────────────────────────────── */}
        <section className="px-4 sm:px-6 pb-20 max-w-6xl mx-auto">

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white/5 border border-white/8 rounded-2xl overflow-hidden animate-pulse">
                  <div className="h-40 bg-white/5" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-white/8 rounded w-3/4" />
                    <div className="h-3 bg-white/5 rounded w-1/2" />
                    <div className="h-3 bg-white/5 rounded w-2/3" />
                    <div className="h-9 bg-white/8 rounded-xl mt-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <Scissors className="w-10 h-10 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">
                {search
                  ? 'Sin resultados para esa búsqueda'
                  : 'No hay barberías activas aún'}
              </p>
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="mt-3 text-[#b02e2e] text-sm hover:underline"
                >
                  Limpiar búsqueda
                </button>
              )}
            </div>
          ) : (
            <>
              {/* count */}
              <p className="text-gray-600 text-xs mb-5">
                {filtered.length} {filtered.length === 1 ? 'barbería encontrada' : 'barberías encontradas'}
                {search && ` para "${search}"`}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map(shop => (
                  <div
                    key={shop.id}
                    className="group bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-colors flex flex-col"
                  >
                    {/* banner */}
                    <div className="h-36 bg-gradient-to-br from-[#2e4a7d]/20 to-[#b02e2e]/10 flex items-center justify-center relative">
                      <Scissors className="w-10 h-10 text-white/20 group-hover:text-white/30 transition-colors" />
                      {/* badge activa */}
                      <span className="absolute top-3 right-3 flex items-center gap-1 text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-full px-2 py-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                        Activa
                      </span>
                    </div>

                    {/* content */}
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="text-white font-semibold text-base mb-1 truncate">{shop.name}</h3>

                      {shop.description && (
                        <p className="text-gray-500 text-xs leading-relaxed mb-3 line-clamp-2">{shop.description}</p>
                      )}

                      <div className="space-y-1.5 mb-4">
                        {shop.location && (
                          <p className="flex items-center gap-2 text-gray-500 text-xs">
                            <MapPin className="w-3.5 h-3.5 text-[#b02e2e] flex-shrink-0" />
                            <span className="truncate">{shop.location}</span>
                          </p>
                        )}
                        {shop.phone && (
                          <p className="flex items-center gap-2 text-gray-500 text-xs">
                            <Phone className="w-3.5 h-3.5 text-[#2e4a7d] flex-shrink-0" />
                            <span>{shop.phone}</span>
                          </p>
                        )}
                      </div>

                      <div className="mt-auto flex gap-2">
                        <Link
                          href={`/barberias/${shop.id}`}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-white/15 text-gray-300 text-sm font-medium rounded-xl hover:bg-white/5 hover:text-white transition-colors"
                        >
                          Ver perfil
                        </Link>
                        <Link
                          href={`/book?barbershop=${shop.id}`}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#b02e2e] text-white text-sm font-medium rounded-xl hover:bg-[#b02e2e]/85 transition-colors"
                        >
                          <Calendar className="w-4 h-4" />
                          Agendar
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
