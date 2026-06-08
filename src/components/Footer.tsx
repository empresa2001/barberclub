'use client';

import Link from 'next/link';
import Logo from './Logo';
import { useAuth } from '@/contexts/AuthContext';
import { Scissors, Instagram, Mail } from 'lucide-react';

const LINKS_PLATFORM = [
  { href: '/',          label: 'Inicio' },
  { href: '/barberias', label: 'Barberías' },
  { href: '/book',      label: 'Agendar turno' },
];

const LINKS_ACCESS = [
  { href: '/login',    label: 'Iniciar sesión' },
  { href: '/register', label: 'Registrar barbería' },
];

export default function Footer() {
  const { user } = useAuth();

  return (
    <footer className="bg-[#1a1a1a] border-t border-white/8 mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* Main grid */}
        <div className="py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="lg:col-span-2 space-y-4">
            <Logo size="md" />
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
              Gestión de turnos, equipo y métricas para barberías que quieren crecer sin perder tiempo.
            </p>
            {/* CTAs solo para visitantes */}
            {!user && (
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Link
                  href="/register"
                  className="px-4 py-2 bg-[#b02e2e] text-white text-xs font-medium rounded-lg hover:bg-[#b02e2e]/85 transition-colors text-center"
                >
                  Registrar mi barbería
                </Link>
                <Link
                  href="/login"
                  className="px-4 py-2 border border-white/15 text-gray-400 text-xs font-medium rounded-lg hover:text-white hover:border-white/30 transition-colors text-center"
                >
                  Iniciar sesión
                </Link>
              </div>
            )}
          </div>

          {/* Plataforma */}
          <div className="space-y-3">
            <p className="text-white text-xs font-semibold uppercase tracking-widest">Plataforma</p>
            <ul className="space-y-2">
              {LINKS_PLATFORM.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-gray-500 text-sm hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Acceso — solo para no logueados */}
          {!user && (
            <div className="space-y-3">
              <p className="text-white text-xs font-semibold uppercase tracking-widest">Acceso</p>
              <ul className="space-y-2">
                {LINKS_ACCESS.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-gray-500 text-sm hover:text-white transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-gray-600 text-xs">© 2025 BarberClub. Todos los derechos reservados.</p>
          <p className="text-gray-700 text-xs flex items-center gap-1.5">
            Hecho para barberías <Scissors className="w-3 h-3" />
          </p>
        </div>

      </div>
    </footer>
  );
}
