'use client';

import { Calendar, Clock, MapPin, User, Phone, Mail } from 'lucide-react';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function BookPage() {
  const [selectedBarbershop, setSelectedBarbershop] = useState('');
  const [selectedBarber, setSelectedBarber] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  const barbershops = [
    { id: 1, name: "Elite Barber Club", address: "Av. Corrientes 1234, CABA" },
    { id: 2, name: "Classic Cuts", address: "San Martín 567, Palermo" },
    { id: 3, name: "Modern Style Barber", address: "Av. Santa Fe 2890, Recoleta" },
    { id: 4, name: "Gentleman's Choice", address: "Florida 875, Microcentro" },
    { id: 5, name: "Urban Cuts", address: "Gorriti 4567, Villa Crick" },
    { id: 6, name: "Royal Barber", address: "Av. Cabildo 1523, Belgrano" },
  ];

  const barbersByBarbershop = {
    1: [
      { id: 1, name: "Carlos Martínez", specialty: "Cortes Modernos" },
      { id: 2, name: "Diego López", specialty: "Barbas Profesionales" },
    ],
    2: [
      { id: 3, name: "Miguel Torres", specialty: "Cortes Clásicos" },
      { id: 4, name: "Roberto Silva", specialty: "Estilo Vintage" },
    ],
    3: [
      { id: 5, name: "Alejandro Ruiz", specialty: "Fades Modernos" },
      { id: 6, name: "Fernando Castro", specialty: "Diseño de Barba" },
    ],
    4: [
      { id: 7, name: "Sebastián Morales", specialty: "Estilo Ejecutivo" },
      { id: 8, name: "Pablo Herrera", specialty: "Afeitado Tradicional" },
    ],
    5: [
      { id: 9, name: "Matías Jiménez", specialty: "Estilos Urbanos" },
      { id: 10, name: "Lucas Vargas", specialty: "Color y Mechas" },
    ],
    6: [
      { id: 11, name: "Ricardo Mendoza", specialty: "Servicio Premium" },
      { id: 12, name: "Andrés Paredes", specialty: "Experiencia Completa" },
    ],
  };

  const servicesByBarber = {
    1: [ // Carlos Martínez - Cortes Modernos
      { id: 1, name: "Corte Fade Moderno", duration: "45 min", price: "$4.500" },
      { id: 2, name: "Corte + Barba Moderna", duration: "60 min", price: "$6.200" },
      { id: 3, name: "Diseño de Cabello", duration: "50 min", price: "$5.800" },
    ],
    2: [ // Diego López - Barbas Profesionales
      { id: 4, name: "Afeitado Tradicional", duration: "30 min", price: "$3.200" },
      { id: 5, name: "Diseño de Barba", duration: "40 min", price: "$4.800" },
      { id: 6, name: "Corte + Barba Premium", duration: "70 min", price: "$7.500" },
    ],
    3: [ // Miguel Torres - Cortes Clásicos
      { id: 7, name: "Corte Clásico", duration: "30 min", price: "$3.500" },
      { id: 8, name: "Corte Ejecutivo", duration: "35 min", price: "$4.000" },
      { id: 9, name: "Corte + Afeitado Clásico", duration: "50 min", price: "$5.500" },
    ],
    4: [ // Roberto Silva - Estilo Vintage
      { id: 10, name: "Corte Vintage", duration: "40 min", price: "$4.200" },
      { id: 11, name: "Pompadour Clásico", duration: "45 min", price: "$4.800" },
      { id: 12, name: "Experiencia Vintage Completa", duration: "80 min", price: "$8.500" },
    ],
    5: [ // Alejandro Ruiz - Fades Modernos
      { id: 13, name: "Fade Bajo", duration: "35 min", price: "$3.800" },
      { id: 14, name: "Fade Alto", duration: "40 min", price: "$4.200" },
      { id: 15, name: "Fade + Diseño", duration: "55 min", price: "$6.000" },
    ],
    6: [ // Fernando Castro - Diseño de Barba
      { id: 16, name: "Perfilado de Barba", duration: "25 min", price: "$2.800" },
      { id: 17, name: "Diseño Artístico", duration: "45 min", price: "$5.200" },
      { id: 18, name: "Tratamiento de Barba", duration: "35 min", price: "$4.000" },
    ],
    7: [ // Sebastián Morales - Estilo Ejecutivo
      { id: 19, name: "Corte Ejecutivo Premium", duration: "40 min", price: "$4.800" },
      { id: 20, name: "Corte + Afeitado Ejecutivo", duration: "55 min", price: "$6.500" },
      { id: 21, name: "Paquete Empresarial", duration: "70 min", price: "$8.000" },
    ],
    8: [ // Pablo Herrera - Afeitado Tradicional
      { id: 22, name: "Afeitado con Navaja", duration: "30 min", price: "$3.500" },
      { id: 23, name: "Afeitado Premium", duration: "45 min", price: "$4.800" },
      { id: 24, name: "Experiencia Tradicional", duration: "60 min", price: "$6.500" },
    ],
    9: [ // Matías Jiménez - Estilos Urbanos
      { id: 25, name: "Corte Urbano", duration: "35 min", price: "$3.800" },
      { id: 26, name: "Estilo Rapper", duration: "45 min", price: "$4.500" },
      { id: 27, name: "Diseño Urbano + Color", duration: "90 min", price: "$9.500" },
    ],
    10: [ // Lucas Vargas - Color y Mechas
      { id: 28, name: "Mechas Sutiles", duration: "120 min", price: "$12.000" },
      { id: 29, name: "Color Completo", duration: "150 min", price: "$15.000" },
      { id: 30, name: "Corte + Color", duration: "180 min", price: "$18.500" },
    ],
    11: [ // Ricardo Mendoza - Servicio Premium
      { id: 31, name: "Experiencia Premium", duration: "90 min", price: "$12.500" },
      { id: 32, name: "Tratamiento VIP", duration: "120 min", price: "$18.000" },
      { id: 33, name: "Paquete Royal", duration: "150 min", price: "$25.000" },
    ],
    12: [ // Andrés Paredes - Experiencia Completa
      { id: 34, name: "Makeover Completo", duration: "120 min", price: "$15.500" },
      { id: 35, name: "Experiencia Spa", duration: "150 min", price: "$20.000" },
      { id: 36, name: "Transformación Total", duration: "180 min", price: "$28.000" },
    ],
  };

  const timeSlotsByBarber = {
    1: [ // Carlos Martínez - Cortes Modernos
      "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"
    ],
    2: [ // Diego López - Barbas Profesionales
      "09:00", "09:30", "10:00", "11:00", "11:30", "15:00", "15:30", "16:00", "16:30", "17:00"
    ],
    3: [ // Miguel Torres - Cortes Clásicos
      "09:00", "09:30", "10:00", "10:30", "11:00", "14:00", "14:30", "15:00", "15:30", "16:00"
    ],
    4: [ // Roberto Silva - Estilo Vintage
      "10:00", "10:30", "11:00", "11:30", "12:00", "15:00", "15:30", "16:00", "16:30", "17:00"
    ],
    5: [ // Alejandro Ruiz - Fades Modernos
      "09:30", "10:00", "10:30", "11:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"
    ],
    6: [ // Fernando Castro - Diseño de Barba
      "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "15:00", "15:30", "16:00", "16:30"
    ],
    7: [ // Sebastián Morales - Estilo Ejecutivo
      "08:30", "09:00", "09:30", "10:00", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"
    ],
    8: [ // Pablo Herrera - Afeitado Tradicional
      "09:00", "09:30", "10:00", "10:30", "11:00", "15:00", "15:30", "16:00", "16:30", "17:00"
    ],
    9: [ // Matías Jiménez - Estilos Urbanos
      "11:00", "11:30", "12:00", "14:00", "14:30", "15:00", "15:30", "16:00", "17:00", "17:30"
    ],
    10: [ // Lucas Vargas - Color y Mechas
      "09:00", "10:00", "11:00", "14:00", "15:00", "16:00" // Horarios más espaciados para servicios largos
    ],
    11: [ // Ricardo Mendoza - Servicio Premium
      "09:00", "10:30", "12:00", "14:00", "15:30", "17:00" // Horarios VIP espaciados
    ],
    12: [ // Andrés Paredes - Experiencia Completa
      "08:00", "10:00", "12:00", "14:00", "16:00" // Sesiones largas, pocos horarios
    ],
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí iría la lógica para enviar el turno
    console.log({
      selectedBarbershop,
      selectedBarber,
      selectedService,
      selectedDate,
      selectedTime,
      customerPhone,
      customerEmail
    });
    alert('¡Turno agendado exitosamente! Te enviaremos la confirmación por email.');
  };

  // Obtener barberos de la barbería seleccionada
  const availableBarbers = selectedBarbershop ? barbersByBarbershop[parseInt(selectedBarbershop) as keyof typeof barbersByBarbershop] || [] : [];

  // Obtener servicios del barbero seleccionado
  const availableServices = selectedBarber ? servicesByBarber[parseInt(selectedBarber) as keyof typeof servicesByBarber] || [] : [];

  // Obtener horarios del barbero seleccionado
  const availableTimeSlots = selectedBarber ? timeSlotsByBarber[parseInt(selectedBarber) as keyof typeof timeSlotsByBarber] || [] : [];

  // Resetear barbero y servicio seleccionados cuando cambie la barbería
  const handleBarbershopChange = (barbershopId: string) => {
    setSelectedBarbershop(barbershopId);
    setSelectedBarber(''); // Reset barber selection
    setSelectedService(''); // Reset service selection
    setSelectedTime(''); // Reset time selection
  };

  // Resetear servicio y tiempo seleccionados cuando cambie el barbero
  const handleBarberChange = (barberId: string) => {
    setSelectedBarber(barberId);
    setSelectedService(''); // Reset service selection
    setSelectedTime(''); // Reset time selection
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-950 to-slate-900 relative overflow-hidden">
  {/* Background Elements */}
  <div className="absolute inset-0 pointer-events-none">
    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-barbershop-red/8 via-red-600/4 to-transparent rounded-full blur-3xl animate-pulse"></div>
    <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-barbershop-blue/6 via-blue-600/3 to-transparent rounded-full blur-3xl animate-pulse delay-2000"></div>
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gradient-radial from-barbershop-red/2 via-transparent to-transparent rounded-full animate-pulse delay-1000"></div>
  </div>

  {/* Header */}
  <Navbar />

  {/* Main Content */}
  <main className="relative z-10 p-4 sm:p-6 lg:p-20 flex justify-center">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-8 sm:mb-12 lg:mb-16">
        <h1 className="text-3xl sm:text-4xl lg:text-6xl font-black text-white mb-4 sm:mb-6 leading-tight">
          Agenda tu{' '}
          <span className="bg-gradient-to-r from-barbershop-red via-red-500 to-barbershop-blue bg-clip-text text-transparent">
            Turno
          </span>
        </h1>
        <p className="text-lg sm:text-xl lg:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
          Reserva tu cita en la mejor barbería. Rápido, fácil y sin complicaciones.
        </p>
      </div>

      {/* Booking Form */}
      <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl sm:rounded-3xl p-4 sm:p-8 lg:p-16 hover:shadow-barbershop-red/10 transition-all duration-700">
        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8 lg:space-y-10">
          {/* Barbershop Selection */}
          <div className="space-y-4 sm:space-y-6">
            <label className="block text-white text-lg sm:text-xl font-bold mb-3 sm:mb-4">
              <MapPin className="inline h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 text-barbershop-red" />
              Selecciona la Barbería
            </label>
            <select
              value={selectedBarbershop}
              onChange={(e) => handleBarbershopChange(e.target.value)}
              className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-white/5 border-2 border-white/20 rounded-lg sm:rounded-xl text-white text-base sm:text-lg focus:outline-none focus:border-barbershop-red/50 focus:ring-2 focus:ring-barbershop-red/50 transition-all duration-300 backdrop-blur-sm hover:bg-white/10 hover:border-white/30 cursor-pointer"
              required
            >
              <option value="" className="bg-slate-800 text-gray-300">Selecciona una barbería</option>
              {barbershops.map((shop) => (
                <option key={shop.id} value={shop.id.toString()} className="bg-slate-800 text-white">
                  {shop.name} - {shop.address}
                </option>
              ))}
            </select>
          </div>

          {/* Barber Selection */}
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            <label className="block text-white text-lg sm:text-xl font-bold mb-3 sm:mb-4 lg:mb-6">
              <User className="inline h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 text-barbershop-red" />
              Selecciona tu Barbero
            </label>
            {!selectedBarbershop ? (
              <div className="p-4 sm:p-6 bg-white/5 border border-white/20 rounded-lg sm:rounded-xl text-center">
                <p className="text-gray-400 text-sm sm:text-base lg:text-lg italic">Primero selecciona una barbería</p>
              </div>
            ) : (
              <>
                {/* Mobile: Select dropdown */}
                <div className="block md:hidden">
                  <select
                    value={selectedBarber}
                    onChange={(e) => handleBarberChange(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border-2 border-white/20 rounded-lg text-white text-base focus:outline-none focus:border-barbershop-blue/50 focus:ring-2 focus:ring-barbershop-blue/50 transition-all duration-300 backdrop-blur-sm hover:bg-white/10 hover:border-white/30 cursor-pointer"
                    required
                  >
                    <option value="" className="bg-slate-800 text-gray-300">Selecciona un barbero</option>
                    {availableBarbers.map((barber) => (
                      <option key={barber.id} value={barber.id.toString()} className="bg-slate-800 text-white">
                        {barber.name} - {barber.specialty}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Desktop: Button grid */}
                <div className="hidden md:grid grid-cols-1 md:grid-cols-2 gap-6">
                  {availableBarbers.map((barber) => (
                    <button
                      key={barber.id}
                      type="button"
                      onClick={() => handleBarberChange(barber.id.toString())}
                      className={`p-6 rounded-xl border-2 transition-all duration-300 text-center relative cursor-pointer backdrop-blur-sm ${
                        selectedBarber === barber.id.toString()
                          ? 'border-barbershop-blue bg-barbershop-blue/20 text-white shadow-lg shadow-barbershop-blue/30 scale-105'
                          : 'border-white/20 bg-white/5 text-gray-300 hover:border-barbershop-blue/50 hover:bg-white/10'
                      }`}
                    >
                      {selectedBarber === barber.id.toString() && (
                        <div className="absolute top-4 right-4 w-4 h-4 bg-barbershop-blue rounded-full animate-pulse"></div>
                      )}
                      <h3 className="font-bold text-lg mb-3">{barber.name}</h3>
                      <p className="text-sm opacity-80">{barber.specialty}</p>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Service Selection */}
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            <label className="block text-white text-lg sm:text-xl font-bold mb-3 sm:mb-4 lg:mb-6">
              <Calendar className="inline h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 text-barbershop-red" />
              Elige tu Servicio
            </label>
            
            {!selectedBarber ? (
              <div className="p-4 sm:p-6 bg-white/5 border border-white/20 rounded-lg sm:rounded-xl text-center">
                <p className="text-gray-400 text-sm sm:text-base lg:text-lg italic">Primero selecciona un barbero</p>
              </div>
            ) : (
              <>
                {/* Mobile: Select dropdown */}
                <div className="block md:hidden">
                  <select
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border-2 border-white/20 rounded-lg text-white text-base focus:outline-none focus:border-barbershop-red/50 focus:ring-2 focus:ring-barbershop-red/50 transition-all duration-300 backdrop-blur-sm hover:bg-white/10 hover:border-white/30 cursor-pointer"
                    required
                  >
                    <option value="" className="bg-slate-800 text-gray-300">Selecciona un servicio</option>
                    {availableServices.map((service) => (
                      <option key={service.id} value={service.id.toString()} className="bg-slate-800 text-white">
                        {service.name} - {service.duration} - {service.price}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Desktop: Button grid */}
                <div className="hidden md:grid grid-cols-1 md:grid-cols-2 gap-6">
                  {availableServices.map((service) => (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => setSelectedService(service.id.toString())}
                      className={`p-6 rounded-xl border-2 transition-all duration-300 text-left relative cursor-pointer backdrop-blur-sm ${
                        selectedService === service.id.toString()
                          ? 'border-barbershop-red bg-barbershop-red/20 text-white shadow-lg shadow-barbershop-red/30 scale-105'
                          : 'border-white/20 bg-white/5 text-gray-300 hover:border-barbershop-red/50 hover:bg-white/10'
                      }`}
                    >
                      {selectedService === service.id.toString() && (
                        <div className="absolute top-4 right-4 w-4 h-4 bg-barbershop-red rounded-full animate-pulse"></div>
                      )}
                      <h3 className="font-bold text-lg mb-3">{service.name}</h3>
                      <div className="flex justify-between items-center">
                        <span className="text-sm opacity-80">{service.duration}</span>
                        <span className={`font-bold text-lg ${
                          selectedService === service.id.toString() ? 'text-white' : 'text-barbershop-red'
                        }`}>{service.price}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Date and Time Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            <div className="space-y-3 sm:space-y-4">
              <label className="block text-white text-lg sm:text-xl font-bold mb-3 sm:mb-4">
                <Calendar className="inline h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 text-barbershop-red" />
                Fecha
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-white/5 border-2 border-white/20 rounded-lg sm:rounded-xl text-white text-base sm:text-lg focus:outline-none focus:border-barbershop-red/50 focus:ring-2 focus:ring-barbershop-red/50 transition-all duration-300 backdrop-blur-sm hover:bg-white/10 hover:border-white/30 [color-scheme:dark]"
                style={{ colorScheme: 'dark' }}
                required
              />
            </div>

            <div className="space-y-3 sm:space-y-4">
              <label className="block text-white text-lg sm:text-xl font-bold mb-3 sm:mb-4">
                <Clock className="inline h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 text-barbershop-red" />
                Horario
              </label>
              {!selectedBarber ? (
                <div className="p-3 sm:p-4 bg-white/5 border border-white/20 rounded-lg sm:rounded-xl text-center">
                  <p className="text-gray-400 text-xs sm:text-sm italic">Primero selecciona un barbero</p>
                </div>
              ) : (
                <select
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-white/5 border-2 border-white/20 rounded-lg sm:rounded-xl text-white text-base sm:text-lg focus:outline-none focus:border-barbershop-red/50 focus:ring-2 focus:ring-barbershop-red/50 transition-all duration-300 backdrop-blur-sm hover:bg-white/10 hover:border-white/30 cursor-pointer"
                  required
                >
                  <option value="" className="bg-slate-800 text-gray-300">Selecciona un horario</option>
                  {availableTimeSlots.map((time) => (
                    <option key={time} value={time} className="bg-slate-800 text-white">{time}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Customer Information */}
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            <h3 className="text-white text-lg sm:text-xl font-bold">Tus Datos de Contacto</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              <div className="space-y-3 sm:space-y-4">
                <label className="block text-gray-300 mb-2 sm:mb-3 text-base sm:text-lg font-medium">
                  <Mail className="inline h-4 w-4 sm:h-5 sm:w-5 mr-2 text-barbershop-red" />
                  Email
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-white/5 border-2 border-white/20 rounded-lg sm:rounded-xl text-white placeholder-gray-400 text-base sm:text-lg focus:outline-none focus:border-barbershop-red/50 focus:ring-2 focus:ring-barbershop-red/50 transition-all duration-300 backdrop-blur-sm hover:bg-white/10 hover:border-white/30"
                  required
                />
                <p className="text-xs sm:text-sm text-gray-400 mt-1 sm:mt-2">Te enviaremos la confirmación del turno</p>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <label className="block text-gray-300 mb-2 sm:mb-3 text-base sm:text-lg font-medium">
                  <Phone className="inline h-4 w-4 sm:h-5 sm:w-5 mr-2 text-barbershop-red" />
                  Teléfono de Contacto
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+54 11 1234-5678"
                  className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-white/5 border-2 border-white/20 rounded-lg sm:rounded-xl text-white placeholder-gray-400 text-base sm:text-lg focus:outline-none focus:border-barbershop-red/50 focus:ring-2 focus:ring-barbershop-red/50 transition-all duration-300 backdrop-blur-sm hover:bg-white/10 hover:border-white/30"
                  required
                />
                <p className="text-xs sm:text-sm text-gray-400 mt-1 sm:mt-2">Para contactarte en caso de ser necesario</p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-barbershop-red via-red-600 to-barbershop-red text-white py-4 sm:py-5 px-6 sm:px-8 rounded-lg sm:rounded-xl font-bold text-lg sm:text-xl hover:scale-105 transition-all duration-500 shadow-xl shadow-barbershop-red/30 hover:shadow-barbershop-red/50 group overflow-hidden relative cursor-pointer"
          >
            <span className="relative z-10">🎯 Confirmar Turno</span>
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
          </button>
        </form>
      </div>
    </div>
  </main>

  {/* Footer */}
  <Footer />
</div>
  );
}
