'use client';

import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Logo from './Logo';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path: string) => pathname === path;

  return (
    <header className={`bg-slate-950/80 backdrop-blur-2xl sticky top-0 z-50 transition-all duration-500 ${scrollY > 50 ? 'bg-slate-950/95' : ''}`}>
      <div className="w-full mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 lg:h-24">
          {/* Logo - Left side */}
          <div className="lg:flex-1">
          <Link href="/" className="inline-block">
            <Logo size="md" />
          </Link>
          </div>

          {/* Centered Navigation */}
          <nav className="hidden lg:flex items-center justify-center lg:flex-1 space-x-8 gap-20">
            <Link 
              href="/" 
              className={`relative transition-all duration-300 font-medium text-lg xl:text-xl group ${
                isActive('/') 
                  ? 'text-barbershop-red' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <span className="relative z-10">Inicio</span>
              <div className="absolute inset-0 bg-gradient-to-r from-barbershop-red/0 to-barbershop-red/0 group-hover:from-barbershop-red/10 group-hover:to-barbershop-red/5 rounded-lg transition-all duration-300 -m-3"></div>
              <span className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-barbershop-red to-red-500 transition-all duration-500 ${
                isActive('/') ? 'w-full' : 'w-0 group-hover:w-full'
              }`}></span>
            </Link>
            
            <Link 
              href="/barberias" 
              className={`relative transition-all duration-300 font-medium text-lg xl:text-xl group ${
                isActive('/barberias') 
                  ? 'text-barbershop-red' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <span className="relative z-10">Barberías</span>
              <div className="absolute inset-0 bg-gradient-to-r from-barbershop-red/0 to-barbershop-red/0 group-hover:from-barbershop-red/10 group-hover:to-barbershop-red/5 rounded-lg transition-all duration-300 -m-3"></div>
              <span className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-barbershop-red to-red-500 transition-all duration-500 ${
                isActive('/barberias') ? 'w-full' : 'w-0 group-hover:w-full'
              }`}></span>
            </Link>
            
            <Link 
              href="/book" 
              className={`relative transition-all duration-300 font-medium text-lg xl:text-xl group ${
                isActive('/book') 
                  ? 'text-barbershop-red' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <span className="relative z-10">Agendar Turno</span>
              <div className="absolute inset-0 bg-gradient-to-r from-barbershop-red/0 to-barbershop-red/0 group-hover:from-barbershop-red/10 group-hover:to-barbershop-red/5 rounded-lg transition-all duration-300 -m-3"></div>
              <span className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-barbershop-red to-red-500 transition-all duration-500 ${
                isActive('/book') ? 'w-full' : 'w-0 group-hover:w-full'
              }`}></span>
            </Link>
          </nav>

          {/* Right side - Iniciar Sesión */}
          <div className="hidden lg:flex items-center justify-end lg:flex-1">
            <Link 
              href="/login" 
              className="relative bg-gradient-to-r from-barbershop-red via-red-600 to-barbershop-red bg-size-200 bg-pos-0 hover:bg-pos-100 text-white px-6 lg:px-8 py-2.5 lg:py-3 rounded-full font-semibold text-lg xl:text-xl transition-all duration-500 shadow-xl shadow-barbershop-red/30 hover:shadow-barbershop-red/50 hover:scale-105 group overflow-hidden"
            >
              <span className="relative z-10">Iniciar Sesión</span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden relative p-3 rounded-xl bg-gray-800/50 backdrop-blur-sm text-gray-300 hover:text-white hover:bg-gray-700/50 transition-all duration-300"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden py-6 border-t border-gray-800 animate-in slide-in-from-top duration-300">
            <div className="space-y-4">
              <Link 
                href="/" 
                className={`block transition-colors py-3 font-medium text-lg ${
                  isActive('/') 
                    ? 'text-barbershop-red' 
                    : 'text-gray-300 hover:text-white'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Inicio
              </Link>
              <Link 
                href="/barberias" 
                className={`block transition-colors py-3 font-medium text-lg ${
                  isActive('/barberias') 
                    ? 'text-barbershop-red' 
                    : 'text-gray-300 hover:text-white'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Barberías
              </Link>
              <Link 
                href="/book" 
                className={`block transition-colors py-3 font-medium text-lg ${
                  isActive('/book') 
                    ? 'text-barbershop-red' 
                    : 'text-gray-300 hover:text-white'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Agendar Turno
              </Link>
              <Link 
                href="/about" 
                className="block text-gray-300 hover:text-white transition-colors py-3 font-medium text-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                Nosotros
              </Link>
              <Link 
                href="/contact" 
                className="block text-gray-300 hover:text-white transition-colors py-3 font-medium text-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                Contacto
              </Link>
              <Link 
                href="/login" 
                className="block bg-gradient-to-r from-barbershop-red to-red-600 text-white px-6 py-3 rounded-xl font-semibold text-center text-lg shadow-lg mt-4"
                onClick={() => setIsMenuOpen(false)}
              >
                Iniciar Sesión
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
