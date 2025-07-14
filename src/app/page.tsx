'use client';

import { Scissors, Calendar, Users, Star, Phone, MapPin, Clock, ChevronDown, Sparkles, Zap, Shield } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function Home() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-950 to-slate-900 relative overflow-hidden">
      {/* Sophisticated Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Primary gradient orb */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-barbershop-red/8 via-red-600/4 to-transparent rounded-full blur-3xl animate-pulse"></div>
        {/* Secondary accent */}
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-barbershop-blue/6 via-blue-600/3 to-transparent rounded-full blur-3xl animate-pulse delay-2000"></div>
        {/* Tertiary depth layer */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gradient-radial from-barbershop-red/2 via-transparent to-transparent rounded-full animate-pulse delay-1000"></div>
        
        {/* Elegant floating particles */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-barbershop-red/40 rounded-full animate-float"></div>
        <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-barbershop-blue/30 rounded-full animate-float delay-500"></div>
        <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-barbershop-red/50 rounded-full animate-float delay-1000"></div>
        <div className="absolute bottom-1/4 right-1/3 w-2.5 h-2.5 bg-barbershop-blue/20 rounded-full animate-float delay-1500"></div>
      </div>

      {/* Header */}
      <Navbar />

      {/* Hero Section */}
      <section className="relative mmin-h-fit flex items-center justify-center overflow-hidden">
        {/* Elegant floating elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-8 w-3 h-3 bg-barbershop-red/30 rounded-full animate-float"></div>
          <div className="absolute top-1/3 right-12 w-2 h-2 bg-barbershop-blue/40 rounded-full animate-float delay-700"></div>
          <div className="absolute bottom-1/3 left-1/4 w-1.5 h-1.5 bg-barbershop-red/50 rounded-full animate-float delay-1200"></div>
          <div className="absolute bottom-1/4 right-1/3 w-2.5 h-2.5 bg-barbershop-blue/25 rounded-full animate-float delay-1800"></div>
        </div>

        <div className="w-full flex flex-col items-center justify-center px-6 lg:px-8 relative">
          <div className="flex flex-col items-center text-center space-y-12 w-full">
            {/* Main Heading with enhanced typography */}
            <div className="flex flex-col items-center space-y-8 animate-in fade-in slide-in-from-bottom duration-1000">
              <div className="flex flex-col items-center space-y-6">
                <h2 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black text-white leading-[0.9] tracking-tight text-center">
                  Tu Barbería,
                </h2>
                <div className="relative inline-block">
                  <h2 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black leading-[0.9] tracking-tight text-center">
                    <span className="bg-gradient-to-r from-barbershop-red via-red-500 to-barbershop-blue bg-clip-text text-transparent animate-gradient-x">
                      Profesional
                    </span>
                  </h2>
                  <div className="absolute inset-0 bg-gradient-to-r from-barbershop-red/20 via-red-500/20 to-barbershop-blue/20 blur-3xl -z-10 animate-glow"></div>
                </div>
              </div>
              
              <div className="flex flex-col items-center space-y-6 max-w-4xl w-full">
                <p className="text-xl sm:text-2xl lg:text-3xl text-gray-300 leading-relaxed font-light text-center">
                  Gestiona tu barbería de manera profesional.
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl text-gray-400 leading-relaxed text-center">
                  Agenda turnos, controla tu negocio y brinda la{' '}
                  <span className="text-barbershop-red font-semibold">mejor experiencia</span> a tus clientes.
                </p>
              </div>
            </div>

            {/* CTA Buttons with enhanced design */}
            <div className="!m-10 flex flex-col sm:flex-row justify-center items-center gap-6 sm:gap-8 animate-in fade-in slide-in-from-bottom duration-1000 delay-500 w-full">
              <Link
                href="/login"
                className="group  relative inline-flex items-center justify-center px-10 py-5 border-2 border-barbershop-red text-barbershop-red rounded-full font-bold text-xl hover:bg-barbershop-red hover:text-white transform hover:scale-105 transition-all duration-500 shadow-xl shadow-barbershop-red/30 hover:shadow-barbershop-red/50 backdrop-blur-sm bg-white/5 hover:bg-barbershop-red/100 min-w-[280px] overflow-hidden "
              >
                <Users className="h-7  w-7 mr-4 group-hover:scale-110 transition-transform duration-500" />
                <span className="relative z-10">Gestiona tu barberia</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-barbershop-red/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </Link>
            </div>

            {/* Stats Preview with professional spacing */}
            <div className="flex justify-center w-full">
              <div className="flex flex-col items-center w-full max-w-5xl mt-20 animate-in fade-in slide-in-from-bottom duration-1000 delay-700">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12 w-full">
                  <div className="text-center group hover:scale-105 transition-all duration-500 p-6 rounded-2xl hover:bg-white/5 backdrop-blur-sm flex flex-col items-center">
                    <div className="text-4xl lg:text-5xl font-black text-white mb-3 group-hover:text-barbershop-red transition-colors duration-300">50+</div>
                    <div className="text-base text-gray-400 font-medium tracking-wide uppercase">Barberías</div>
                  </div>
                  <div className="text-center group hover:scale-105 transition-all duration-500 p-6 rounded-2xl hover:bg-white/5 backdrop-blur-sm flex flex-col items-center">
                    <div className="text-4xl lg:text-5xl font-black text-white mb-3 group-hover:text-barbershop-red transition-colors duration-300">1K+</div>
                    <div className="text-base text-gray-400 font-medium tracking-wide uppercase">Turnos/Mes</div>
                  </div>
                  <div className="text-center group hover:scale-105 transition-all duration-500 p-6 rounded-2xl hover:bg-white/5 backdrop-blur-sm flex flex-col items-center">
                    <div className="text-4xl lg:text-5xl font-black text-white mb-3 group-hover:text-barbershop-red transition-colors duration-300">98%</div>
                    <div className="text-base text-gray-400 font-medium tracking-wide uppercase">Satisfacción</div>
                  </div>
                  <div className="text-center group hover:scale-105 transition-all duration-500 p-6 rounded-2xl hover:bg-white/5 backdrop-blur-sm flex flex-col items-center">
                    <div className="text-4xl lg:text-5xl font-black text-white mb-3 group-hover:text-barbershop-red transition-colors duration-300">24/7</div>
                    <div className="text-base text-gray-400 font-medium tracking-wide uppercase">Soporte</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* Features Section */}
      <section className="pt-32 lg:pt-40 bg-gradient-to-b from-slate-950/50 to-gray-950/80 relative">
        {/* Sophisticated background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(176,46,46,0.08)_0%,transparent_70%)]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(176,46,46,0.03)_50%,transparent_100%)]"></div>
        
        <div className="w-full flex flex-col items-center px-6 lg:px-8 relative gap-12">
          {/* Section Header with enhanced spacing */}
          <div className="flex flex-col items-center text-center mb-32 animate-in fade-in slide-in-from-bottom duration-1000">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-barbershop-red/20 via-barbershop-red/10 to-barbershop-blue/20 rounded-full mb-12 group hover:scale-110 transition-transform duration-500 shadow-2xl shadow-barbershop-red/20">
              <Sparkles className="h-12 w-12 text-barbershop-red group-hover:text-barbershop-blue transition-colors duration-500" />
            </div>
            <h3 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-white mb-8 leading-tight tracking-tight text-center">
              ¿Por qué elegir{' '}
              <span className="bg-gradient-to-r from-barbershop-red via-red-500 to-barbershop-blue bg-clip-text text-transparent">
                BarberClub?
              </span>
            </h3>
            <p className="text-xl sm:text-2xl text-gray-300 max-w-4xl leading-relaxed font-light text-center">
              Descubre las características que hacen de BarberClub la plataforma ideal para tu barbería
            </p>
          </div>
          
          {/* Features Grid with enhanced spacing */}
          <div className="flex justify-center w-full">
            <div className="w-full max-w-6xl">
              <div className="grid lg:grid-cols-3 gap-12 lg:gap-16 mb-24">
                {/* Feature 1 */}
                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-barbershop-red/15 via-barbershop-red/5 to-transparent rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-700"></div>
                  <div className="relative bg-slate-900/60 backdrop-blur-2xl p-12 lg:p-16 rounded-3xl border border-gray-700/30 group-hover:border-barbershop-red/40 transform group-hover:scale-105 transition-all duration-700 h-full shadow-2xl group-hover:shadow-barbershop-red/20">
                    <div className="bg-gradient-to-br from-barbershop-red/30 via-barbershop-red/20 to-barbershop-red/10 w-28 h-28 rounded-3xl flex items-center justify-center mx-auto mb-10 group-hover:rotate-6 transition-transform duration-700 shadow-xl shadow-barbershop-red/30">
                      <Calendar className="h-14 w-14 text-barbershop-red group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <h4 className="text-2xl lg:text-3xl font-black text-white mb-6 group-hover:text-barbershop-red transition-colors duration-500 text-center">
                      Agenda Inteligente
                    </h4>
                    <p className="text-gray-300 leading-relaxed text-lg group-hover:text-gray-200 transition-colors duration-500 text-center">
                      Sistema de turnos automático con disponibilidad en tiempo real y confirmación por WhatsApp.
                    </p>
                    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-0 h-1 bg-gradient-to-r from-barbershop-red to-red-500 group-hover:w-24 transition-all duration-700 rounded-full"></div>
                  </div>
                </div>
                
                {/* Feature 2 */}
                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-barbershop-blue/15 via-barbershop-blue/5 to-transparent rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-700"></div>
                  <div className="relative bg-slate-900/60 backdrop-blur-2xl p-12 lg:p-16 rounded-3xl border border-gray-700/30 group-hover:border-barbershop-blue/40 transform group-hover:scale-105 transition-all duration-700 h-full shadow-2xl group-hover:shadow-barbershop-blue/20">
                    <div className="bg-gradient-to-br from-barbershop-blue/30 via-barbershop-blue/20 to-barbershop-blue/10 w-28 h-28 rounded-3xl flex items-center justify-center mx-auto mb-10 group-hover:rotate-6 transition-transform duration-700 shadow-xl shadow-barbershop-blue/30">
                      <Users className="h-14 w-14 text-barbershop-blue group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <h4 className="text-2xl lg:text-3xl font-black text-white mb-6 group-hover:text-barbershop-blue transition-colors duration-500 text-center">
                      Gestión Completa
                    </h4>
                    <p className="text-gray-300 leading-relaxed text-lg group-hover:text-gray-200 transition-colors duration-500 text-center">
                      Administra barberos, servicios, horarios y clientes desde un panel intuitivo y fácil de usar.
                    </p>
                    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-0 h-1 bg-gradient-to-r from-barbershop-blue to-blue-500 group-hover:w-24 transition-all duration-700 rounded-full"></div>
                  </div>
                </div>
                
                {/* Feature 3 */}
                <div className="group relative lg:col-span-1">
                  <div className="absolute inset-0 bg-gradient-to-br from-barbershop-red/15 via-barbershop-red/5 to-transparent rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-700"></div>
                  <div className="relative bg-slate-900/60 backdrop-blur-2xl p-12 lg:p-16 rounded-3xl border border-gray-700/30 group-hover:border-barbershop-red/40 transform group-hover:scale-105 transition-all duration-700 h-full shadow-2xl group-hover:shadow-barbershop-red/20">
                    <div className="bg-gradient-to-br from-barbershop-red/30 via-barbershop-red/20 to-barbershop-red/10 w-28 h-28 rounded-3xl flex items-center justify-center mx-auto mb-10 group-hover:rotate-6 transition-transform duration-700 shadow-xl shadow-barbershop-red/30">
                      <Star className="h-14 w-14 text-barbershop-red group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <h4 className="text-2xl lg:text-3xl font-black text-white mb-6 group-hover:text-barbershop-red transition-colors duration-500 text-center">
                      Experiencia Premium
                    </h4>
                    <p className="text-gray-300 leading-relaxed text-lg group-hover:text-gray-200 transition-colors duration-500 text-center">
                      Aplicación PWA instalable, funciona sin conexión y brinda una experiencia nativa.
                    </p>
                    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-0 h-1 bg-gradient-to-r from-barbershop-red to-red-500 group-hover:w-24 transition-all duration-700 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Features with enhanced design */}
          <div style={{marginBottom: "30px"}} className="flex justify-center w-full">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12 max-w-5xl w-full">
              <div className="text-center group hover:scale-105 transition-transform duration-500 flex flex-col items-center">
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm p-8 rounded-2xl mb-6 group-hover:bg-barbershop-red/10 transition-all duration-500 shadow-xl group-hover:shadow-barbershop-red/20">
                  <Zap className="h-12 w-12 text-barbershop-red mx-auto group-hover:scale-110 transition-transform duration-500" />
                </div>
                <h5 className="font-black text-white mb-3 text-lg text-center">Súper Rápido</h5>
                <p className="text-gray-400 text-base text-center">Carga instantánea</p>
              </div>
              
              <div className="text-center group hover:scale-105 transition-transform duration-500 flex flex-col items-center">
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm p-8 rounded-2xl mb-6 group-hover:bg-barbershop-blue/10 transition-all duration-500 shadow-xl group-hover:shadow-barbershop-blue/20">
                  <Shield className="h-12 w-12 text-barbershop-blue mx-auto group-hover:scale-110 transition-transform duration-500" />
                </div>
                <h5 className="font-black text-white mb-3 text-lg text-center">100% Seguro</h5>
                <p className="text-gray-400 text-base text-center">Datos protegidos</p>
              </div>
              
              <div className="text-center group hover:scale-105 transition-transform duration-500 flex flex-col items-center">
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm p-8 rounded-2xl mb-6 group-hover:bg-barbershop-red/10 transition-all duration-500 shadow-xl group-hover:shadow-barbershop-red/20">
                  <Phone className="h-12 w-12 text-barbershop-red mx-auto group-hover:scale-110 transition-transform duration-500" />
                </div>
                <h5 className="font-black text-white mb-3 text-lg text-center">WhatsApp</h5>
                <p className="text-gray-400 text-base text-center">Integración nativa</p>
              </div>
              
              <div className="text-center group hover:scale-105 transition-transform duration-500 flex flex-col items-center">
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm p-8 rounded-2xl mb-6 group-hover:bg-barbershop-blue/10 transition-all duration-500 shadow-xl group-hover:shadow-barbershop-blue/20">
                  <Clock className="h-12 w-12 text-barbershop-blue mx-auto group-hover:scale-110 transition-transform duration-500" />
                </div>
                <h5 className="font-black text-white mb-3 text-lg text-center">24/7</h5>
                <p className="text-gray-400 text-base text-center">Siempre disponible</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer  />
    </div>
  );
}
