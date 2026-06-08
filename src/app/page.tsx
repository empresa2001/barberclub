'use client';

import { Calendar, Users, Star, Zap, Shield, Phone, Clock, Scissors } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col">
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 pt-20 pb-24 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-[#b02e2e]/10 border border-[#b02e2e]/20 rounded-full px-4 py-1.5 mb-8">
          <div className="w-1.5 h-1.5 rounded-full bg-[#b02e2e]" />
          <span className="text-[#b02e2e] text-xs font-medium tracking-wide">Plataforma de gestión para barberías</span>
        </div>

        {/* Heading */}
        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white leading-tight tracking-tight max-w-4xl">
          Tu barbería,{' '}
          <span className="bg-gradient-to-r from-[#b02e2e] to-[#2e4a7d] bg-clip-text text-transparent">
            profesional
          </span>
        </h1>

        <p className="mt-6 text-gray-400 text-lg sm:text-xl max-w-xl leading-relaxed">
          Gestión de turnos, equipo y métricas para barberías que quieren operar con más orden y menos fricción.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/book"
            className="px-7 py-3 bg-[#b02e2e] text-white font-semibold rounded-xl hover:bg-[#b02e2e]/85 transition-colors text-sm"
          >
            Agendar un turno
          </Link>
          <Link
            href="/login"
            className="px-7 py-3 border border-white/15 text-gray-300 font-medium rounded-xl hover:bg-white/5 hover:text-white transition-colors text-sm"
          >
            Gestionar mi barbería
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-12 max-w-2xl w-full">
          {[
            { value: '50+',  label: 'Barberías' },
            { value: '1K+',  label: 'Turnos / mes' },
            { value: '98%',  label: 'Satisfacción' },
            { value: '24/7', label: 'Disponible' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl sm:text-4xl font-black text-white">{s.value}</p>
              <p className="text-gray-500 text-xs uppercase tracking-widest mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section className="bg-[#111111] border-t border-white/8 py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              ¿Por qué{' '}
              <span className="bg-gradient-to-r from-[#b02e2e] to-[#2e4a7d] bg-clip-text text-transparent">
                BarberClub?
              </span>
            </h2>
            <p className="mt-3 text-gray-500 text-base max-w-lg mx-auto">
              Herramientas pensadas para que el barbero se enfoque en cortar, no en administrar.
            </p>
          </div>

          {/* 3 feature cards */}
          <div className="grid sm:grid-cols-3 gap-5 mb-14">
            {[
              {
                icon: <Calendar className="w-6 h-6" />,
                color: 'text-[#b02e2e] bg-[#b02e2e]/10',
                title: 'Agenda inteligente',
                desc: 'Turnos en tiempo real con disponibilidad automática. Sin llamadas, sin confusiones.',
              },
              {
                icon: <Users className="w-6 h-6" />,
                color: 'text-[#2e4a7d] bg-[#2e4a7d]/10',
                title: 'Gestión completa',
                desc: 'Barberos, servicios, horarios y métricas desde un solo panel.',
              },
              {
                icon: <Star className="w-6 h-6" />,
                color: 'text-[#b02e2e] bg-[#b02e2e]/10',
                title: 'Experiencia premium',
                desc: 'App instalable (PWA), funciona desde cualquier dispositivo, sin downloads.',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="bg-white/4 border border-white/8 rounded-2xl p-6 hover:border-white/15 transition-colors"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                  {f.icon}
                </div>
                <h3 className="text-white font-semibold text-sm mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* 4 mini features */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: <Zap className="w-5 h-5" />,    label: 'Carga rápida',      color: 'text-[#b02e2e]' },
              { icon: <Shield className="w-5 h-5" />,  label: 'Datos seguros',     color: 'text-[#2e4a7d]' },
              { icon: <Phone className="w-5 h-5" />,   label: 'WhatsApp nativo',   color: 'text-[#b02e2e]' },
              { icon: <Clock className="w-5 h-5" />,   label: 'Siempre online',    color: 'text-[#2e4a7d]' },
            ].map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-3 bg-white/4 border border-white/8 rounded-xl px-4 py-3"
              >
                <span className={f.color}>{f.icon}</span>
                <span className="text-gray-300 text-sm font-medium">{f.label}</span>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── CTA final ─────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 text-center">
        <div className="max-w-lg mx-auto space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-[#b02e2e]/10 border border-[#b02e2e]/20 flex items-center justify-center mx-auto">
            <Scissors className="w-6 h-6 text-[#b02e2e]" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Llevá tu barbería al siguiente nivel
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Registrá tu barbería gratis y empezá a recibir turnos online hoy mismo.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              href="/register"
              className="px-7 py-3 bg-[#b02e2e] text-white font-semibold rounded-xl hover:bg-[#b02e2e]/85 transition-colors text-sm"
            >
              Registrar mi barbería
            </Link>
            <Link
              href="/barberias"
              className="px-7 py-3 border border-white/15 text-gray-300 font-medium rounded-xl hover:bg-white/5 hover:text-white transition-colors text-sm"
            >
              Ver barberías
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
