'use client';

import Link from 'next/link';
import Logo from './Logo';
import { useAuth } from '@/contexts/AuthContext';

export default function Footer() {
  const { user } = useAuth();

  return (
    <footer className="bg-[#111111] border-t border-white/8 mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">

        <div className="flex flex-col items-center gap-8">
          <Logo size="md" />

          <p className="text-gray-500 text-sm text-center max-w-sm leading-relaxed">
            La plataforma para gestionar tu barbería. Turnos, equipo y métricas en un solo lugar.
          </p>

          {/* CTAs — solo visibles para visitantes anónimos */}
          {!user && (
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/register"
                className="px-6 py-2.5 bg-[#b02e2e] text-white text-sm font-medium rounded-xl hover:bg-[#b02e2e]/85 transition-colors text-center"
              >
                Registrar mi barbería
              </Link>
              <Link
                href="/login"
                className="px-6 py-2.5 border border-white/15 text-gray-300 text-sm font-medium rounded-xl hover:bg-white/5 hover:text-white transition-colors text-center"
              >
                Iniciar sesión
              </Link>
            </div>
          )}

          <div className="border-t border-white/8 w-full pt-6 text-center">
            <p className="text-gray-600 text-xs">© 2025 BarberClub. Todos los derechos reservados.</p>
          </div>
        </div>

      </div>
    </footer>
  );
}
