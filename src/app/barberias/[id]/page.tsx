'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Scissors, MapPin, Phone, Clock, Calendar, User, Star,
  ArrowLeft, ChevronRight, MessageSquare,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';

interface Barbershop {
  id: string;
  name: string;
  location: string;
  phone: string;
  description: string;
  image_url: string;
  status_id: number;
}
interface Barber {
  id: string;
  users: { name: string; email: string } | null;
}
interface Service {
  id: string;
  name: string;
  duration_min: number | null;
  price: number | null;
}

export default function BarbershopProfile() {
  const params = useParams();
  const id = params?.id as string;

  const [shop, setShop] = useState<Barbershop | null>(null);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      const { data: shopData } = await supabase
        .from('barbershops')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (cancelled) return;

      if (!shopData) { setNotFound(true); setIsLoading(false); return; }
      setShop(shopData as Barbershop);

      const [{ data: barbersData }, { data: servicesData }] = await Promise.all([
        supabase
          .from('barbers')
          .select('id, users!barbers_user_id_fkey(name, email)')
          .eq('barbershop_id', id),
        supabase
          .from('services')
          .select('id, name, duration_min, price')
          .eq('barbershop_id', id)
          .order('name'),
      ]);

      if (cancelled) return;
      setBarbers((barbersData as any) ?? []);
      setServices((servicesData as any) ?? []);
      setIsLoading(false);
    })();

    return () => { cancelled = true; };
  }, [id]);

  // ── loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-52 bg-white/5 rounded-2xl" />
            <div className="h-6 bg-white/8 rounded w-1/3" />
            <div className="h-4 bg-white/5 rounded w-2/3" />
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="h-24 bg-white/5 rounded-2xl" />
              <div className="h-24 bg-white/5 rounded-2xl" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── not found ─────────────────────────────────────────────────────────────
  if (notFound || !shop) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center space-y-4">
            <Scissors className="w-12 h-12 text-gray-700 mx-auto" />
            <h1 className="text-white text-xl font-bold">Barbería no encontrada</h1>
            <p className="text-gray-500 text-sm">Puede que ya no esté disponible.</p>
            <Link href="/barberias" className="inline-flex items-center gap-2 text-[#b02e2e] text-sm hover:underline">
              <ArrowLeft className="w-4 h-4" /> Volver al listado
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isActive = shop.status_id === 2;

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6">

        {/* back */}
        <Link href="/barberias" className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors mb-5">
          <ArrowLeft className="w-4 h-4" /> Barberías
        </Link>

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <div className="relative h-52 sm:h-64 rounded-2xl overflow-hidden border border-white/10 mb-6">
          {shop.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shop.image_url} alt={shop.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#2e4a7d]/30 to-[#b02e2e]/15 flex items-center justify-center">
              <Scissors className="w-16 h-16 text-white/20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-[#1a1a1a]/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-2">
              {isActive ? (
                <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-full px-2 py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Activa
                </span>
              ) : (
                <span className="text-xs text-gray-400 bg-white/5 border border-white/10 rounded-full px-2 py-0.5">No disponible</span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">{shop.name}</h1>
            {shop.location && (
              <p className="flex items-center gap-1.5 text-gray-300 text-sm mt-1">
                <MapPin className="w-4 h-4 text-[#b02e2e]" /> {shop.location}
              </p>
            )}
          </div>
        </div>

        {/* ── CTA bar ──────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-8">
          {shop.description && (
            <p className="text-gray-400 text-sm leading-relaxed flex-1">{shop.description}</p>
          )}
          {isActive && (
            <Link
              href={`/book?barbershop=${shop.id}`}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-[#b02e2e] text-white text-sm font-semibold rounded-xl hover:bg-[#b02e2e]/85 transition-colors flex-shrink-0"
            >
              <Calendar className="w-4 h-4" /> Agendar turno
            </Link>
          )}
        </div>

        {/* contact pills */}
        <div className="flex flex-wrap gap-3 mb-10">
          {shop.phone && (
            <span className="flex items-center gap-2 text-gray-300 text-sm bg-white/5 border border-white/10 rounded-xl px-3 py-2">
              <Phone className="w-4 h-4 text-[#2e4a7d]" /> {shop.phone}
            </span>
          )}
          <span className="flex items-center gap-2 text-gray-300 text-sm bg-white/5 border border-white/10 rounded-xl px-3 py-2">
            <User className="w-4 h-4 text-[#2e4a7d]" /> {barbers.length} {barbers.length === 1 ? 'barbero' : 'barberos'}
          </span>
          <span className="flex items-center gap-2 text-gray-300 text-sm bg-white/5 border border-white/10 rounded-xl px-3 py-2">
            <Scissors className="w-4 h-4 text-[#2e4a7d]" /> {services.length} {services.length === 1 ? 'servicio' : 'servicios'}
          </span>
        </div>

        {/* ── Servicios ────────────────────────────────────────────────────── */}
        <section className="mb-10">
          <SectionHeader icon={<Scissors className="w-5 h-5 text-[#b02e2e]" />} title="Servicios" />
          {services.length === 0 ? (
            <EmptyBox text="Esta barbería todavía no cargó sus servicios." />
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {services.map(s => (
                <div key={s.id} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">{s.name}</p>
                    {s.duration_min != null && (
                      <p className="flex items-center gap-1 text-gray-500 text-xs mt-0.5">
                        <Clock className="w-3 h-3" /> {s.duration_min} min
                      </p>
                    )}
                  </div>
                  {s.price != null && (
                    <span className="text-[#b02e2e] font-bold text-sm flex-shrink-0 ml-3">${s.price}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Barberos ─────────────────────────────────────────────────────── */}
        <section className="mb-10">
          <SectionHeader icon={<User className="w-5 h-5 text-[#b02e2e]" />} title="Nuestro equipo" />
          {barbers.length === 0 ? (
            <EmptyBox text="Esta barbería todavía no cargó su equipo." />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {barbers.map(b => (
                <div key={b.id} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-[#2e4a7d]/20 border border-[#2e4a7d]/20 flex items-center justify-center mx-auto mb-2">
                    <span className="text-[#2e4a7d] font-bold text-sm">
                      {(b.users?.name ?? '?').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <p className="text-white text-sm font-medium truncate">{b.users?.name ?? 'Barbero'}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Reseñas (empty state — pendiente de tabla) ───────────────────── */}
        <section className="mb-12">
          <SectionHeader
            icon={<Star className="w-5 h-5 text-[#b02e2e]" />}
            title="Reseñas"
            right={<span className="text-gray-600 text-xs">Próximamente</span>}
          />
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
            <MessageSquare className="w-8 h-8 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Aún no hay reseñas para esta barbería.</p>
            <p className="text-gray-600 text-xs mt-1">Sé el primero en dejar tu opinión luego de tu turno.</p>
          </div>
        </section>

        {/* bottom CTA */}
        {isActive && (
          <div className="bg-gradient-to-r from-[#b02e2e]/15 to-[#2e4a7d]/15 border border-white/10 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-white font-semibold">¿Listo para tu próximo corte?</p>
              <p className="text-gray-400 text-sm">Elegí barbero, servicio y horario en segundos.</p>
            </div>
            <Link
              href={`/book?barbershop=${shop.id}`}
              className="flex items-center gap-2 px-6 py-3 bg-[#b02e2e] text-white text-sm font-semibold rounded-xl hover:bg-[#b02e2e]/85 transition-colors whitespace-nowrap"
            >
              Agendar turno <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

// ─── sub-componentes ──────────────────────────────────────────────────────────

function SectionHeader({ icon, title, right }: { icon: React.ReactNode; title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-white font-semibold text-lg">{title}</h2>
      </div>
      {right}
    </div>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div className="bg-white/3 border border-white/8 rounded-xl p-6 text-center">
      <p className="text-gray-500 text-sm italic">{text}</p>
    </div>
  );
}
