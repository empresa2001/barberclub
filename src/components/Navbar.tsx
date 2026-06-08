'use client';

import { Menu, X, LayoutDashboard, CalendarDays, LogOut, Scissors } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Logo from './Logo';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

// Perfil del usuario cacheado en la navbar
interface UserProfile {
  user_type_id: number; // 1=superadmin 2=admin 3=barber
  barbershop_id?: string | null;
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  // Cargar perfil cuando hay usuario logueado
  useEffect(() => {
    if (!user) { setProfile(null); return; }

    const fetchProfile = async () => {
      const { data } = await supabase
        .from('users')
        .select('user_type_id')
        .eq('id', user.id)
        .single();

      if (!data) return;
      const typeId = data.user_type_id;

      if (typeId === 1 || typeId === 2) {
        // Buscar barbershop_id del owner
        const { data: shop } = await supabase
          .from('barbershops')
          .select('id')
          .eq('owner_id', user.id)
          .maybeSingle();
        setProfile({ user_type_id: typeId, barbershop_id: shop?.id ?? null });
      } else {
        setProfile({ user_type_id: typeId });
      }
    };

    fetchProfile();
  }, [user]);

  const isActive = (path: string) => pathname === path || (pathname?.startsWith(path + '/') ?? false);

  // Construir los links según el rol
  const getNavLinks = (): { href: string; label: string; icon?: React.ReactNode }[] => {
    if (!user || !profile) {
      return [
        { href: '/',          label: 'Inicio' },
        { href: '/barberias', label: 'Barberías' },
        { href: '/book',      label: 'Agendar turno' },
      ];
    }
    if (profile.user_type_id === 3) {
      return [
        { href: '/barberBook', label: 'Mi agenda', icon: <CalendarDays className="w-4 h-4" /> },
      ];
    }
    const adminHref = profile.barbershop_id
      ? `/adminBarber/${profile.barbershop_id}`
      : '/adminBarber';
    return [
      { href: adminHref, label: 'Mi panel', icon: <LayoutDashboard className="w-4 h-4" /> },
    ];
  };

  const navLinks = getNavLinks();

  const NavLink = ({ href, label, icon }: { href: string; label: string; icon?: React.ReactNode }) => (
    <Link
      href={href}
      onClick={() => setMenuOpen(false)}
      className={`relative flex items-center gap-1.5 font-medium text-sm transition-colors group ${
        isActive(href) ? 'text-white' : 'text-gray-400 hover:text-white'
      }`}
    >
      {icon}
      {label}
      <span className={`absolute -bottom-1 left-0 h-px bg-[#b02e2e] transition-all duration-300 ${
        isActive(href) ? 'w-full' : 'w-0 group-hover:w-full'
      }`} />
    </Link>
  );

  return (
    <>
      <header className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-[#1a1a1a]/98 shadow-lg shadow-black/30' : 'bg-[#1a1a1a]/90'
      } backdrop-blur-xl border-b border-white/8`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Logo size="md" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <NavLink key={link.href} {...link} />
            ))}
          </nav>

          {/* Desktop right action */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <button
                onClick={logout}
                className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
              >
                <LogOut className="w-4 h-4" />
                Cerrar sesión
              </button>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 bg-[#b02e2e] text-white text-sm font-medium rounded-xl hover:bg-[#b02e2e]/85 transition-colors"
              >
                Iniciar sesión
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      {menuOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setMenuOpen(false)}
          />
          <div className="md:hidden fixed top-16 left-0 right-0 z-40 bg-[#1a1a1a] border-b border-white/10 shadow-xl">
            <nav className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? 'bg-white/8 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
              <div className="pt-2 border-t border-white/8 mt-2">
                {user ? (
                  <button
                    onClick={() => { setMenuOpen(false); logout(); }}
                    className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Cerrar sesión
                  </button>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-center w-full px-3 py-2.5 bg-[#b02e2e] text-white rounded-xl text-sm font-medium"
                  >
                    Iniciar sesión
                  </Link>
                )}
              </div>
            </nav>
          </div>
        </>
      )}
    </>
  );
}
