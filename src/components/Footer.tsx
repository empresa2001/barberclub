'use client';

import Link from 'next/link';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer style={{padding: "40px"}} className="bg-slate-950 border-t border-gray-800/50 mt-32 pt-32 pb-20 lg:mt-40 lg:pt-40 lg:pb-32">
      <div className="w-full flex flex-col items-center px-6 lg:px-8">
        <div className="flex flex-col items-center text-center space-y-12 lg:space-y-16 max-w-7xl w-full">
          {/* Logo Section */}
          <div className="flex justify-center w-full">
            <Logo size="lg" variant="default" />
          </div>
          
          {/* Description */}
          <div className="flex justify-center w-full">
            <p className="text-xl lg:text-2xl xl:text-3xl text-gray-300 leading-relaxed font-light text-center max-w-4xl">
              La plataforma más completa para gestionar tu barbería. Únete a cientos de barberos que ya confían en BarberClub.
            </p>
          </div>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-6 lg:gap-8 w-full max-w-2xl">
            <Link 
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center px-10 lg:px-12 py-5 lg:py-6 bg-gradient-to-r from-barbershop-red via-red-600 to-barbershop-red bg-size-200 bg-pos-0 hover:bg-pos-100 text-white rounded-full font-bold text-xl lg:text-2xl hover:scale-105 transition-all duration-500 shadow-2xl shadow-barbershop-red/40 group overflow-hidden min-w-[280px] lg:min-w-[320px]"
            >
              <span className="relative z-10">Registrar mi Barbería</span>
              
            </Link>
            <Link 
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center px-10 lg:px-12 py-5 lg:py-6 border-2 border-barbershop-red text-barbershop-red rounded-full font-bold text-xl lg:text-2xl hover:bg-barbershop-red hover:text-white transition-all duration-500 shadow-xl shadow-barbershop-red/20 hover:shadow-barbershop-red/40 backdrop-blur-sm hover:scale-105 min-w-[280px] lg:min-w-[320px]"
            >
              Iniciar Sesión
            </Link>
          </div>

          {/* Copyright */}
          <div className="pt-8 lg:pt-12 border-t border-gray-800/50 w-full flex justify-center">
            <p className="text-gray-400 text-sm lg:text-base text-center">
              © 2025 BarberClub. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
