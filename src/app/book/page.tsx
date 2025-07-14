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

  const services = [
    { id: 1, name: "Corte Clásico", duration: "30 min", price: "$3.500" },
    { id: 2, name: "Corte + Barba", duration: "45 min", price: "$5.200" },
    { id: 3, name: "Afeitado Completo", duration: "25 min", price: "$2.800" },
    { id: 4, name: "Tratamiento Premium", duration: "60 min", price: "$7.500" },
  ];

  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30", "18:00", "18:30"
  ];

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

  // Resetear barbero seleccionado cuando cambie la barbería
  const handleBarbershopChange = (barbershopId: string) => {
    setSelectedBarbershop(barbershopId);
    setSelectedBarber(''); // Reset barber selection
  };

  return (
    <div className="!min-h-screen !bg-gradient-to-br !from-slate-950 !via-gray-950 !to-slate-900 !relative !overflow-hidden">
      {/* Sophisticated Background Elements */}
      <div className="!absolute !inset-0 !pointer-events-none">
        {/* Primary gradient orb */}
        <div className="!absolute !top-0 !right-0 !w-[800px] !h-[800px] !bg-gradient-to-br !from-barbershop-red/8 !via-red-600/4 !to-transparent !rounded-full !blur-3xl !animate-pulse"></div>
        {/* Secondary accent */}
        <div className="!absolute !bottom-0 !left-0 !w-[600px] !h-[600px] !bg-gradient-to-tr !from-barbershop-blue/6 !via-blue-600/3 !to-transparent !rounded-full !blur-3xl !animate-pulse !delay-2000"></div>
        {/* Tertiary depth layer */}
        <div className="!absolute !top-1/2 !left-1/2 !transform !-translate-x-1/2 !-translate-y-1/2 !w-[1000px] !h-[1000px] !bg-gradient-radial !from-barbershop-red/2 !via-transparent !to-transparent !rounded-full !animate-pulse !delay-1000"></div>
      </div>

      {/* Header */}
      <Navbar />

      {/* Main Content */}
      <main className="!relative !z-10 !p-6 lg:!p-20 !flex !justify-center">
        <div className="!max-w-4xl !mx-auto !px-6 lg:!px-8">
          <div className="!text-center !mb-16">
            <h1 className="!text-4xl sm:!text-5xl lg:!text-6xl !font-black !text-white !mb-6 !leading-tight">
              Agenda tu{' '}
              <span className="!bg-gradient-to-r !from-barbershop-red !via-red-500 !to-barbershop-blue !bg-clip-text !text-transparent">
                Turno
              </span>
            </h1>
            <p className="!text-xl sm:!text-2xl !text-gray-300 !max-w-3xl !mx-auto !leading-relaxed">
              Reserva tu cita en la mejor barbería. Rápido, fácil y sin complicaciones.
            </p>
          </div>

          {/* Booking Form */}
          <div className="!bg-gradient-to-br !from-white/10 !to-white/5 !backdrop-blur-xl !border !border-white/20 !shadow-2xl !rounded-3xl !p-8 lg:!p-16 hover:!shadow-barbershop-red/10 !transition-all !duration-700">
            <form onSubmit={handleSubmit} className="!space-y-10">
              {/* Barbershop Selection */}
              <div className="!space-y-6">
                <label className="!block !text-white !text-xl !font-bold !mb-4">
                  <MapPin className="!inline !h-6 !w-6 !mr-3 !text-barbershop-red" />
                  Selecciona la Barbería
                </label>
                <select
                  value={selectedBarbershop}
                  onChange={(e) => handleBarbershopChange(e.target.value)}
                  className="!w-full !px-6 !py-4 !bg-white/5 !border-2 !border-white/20 !rounded-xl !text-white !text-lg focus:!outline-none focus:!border-barbershop-red/50 focus:!ring-2 focus:!ring-barbershop-red/50 !transition-all !duration-300 !backdrop-blur-sm hover:!bg-white/10 hover:!border-white/30 !cursor-pointer"
                  required
                >
                  <option value="" className="!bg-slate-800 !text-gray-300">Selecciona una barbería</option>
                  {barbershops.map((shop) => (
                    <option key={shop.id} value={shop.id.toString()} className="!bg-slate-800 !text-white">
                      {shop.name} - {shop.address}
                    </option>
                  ))}
                </select>
              </div>

              {/* Service Selection */}
              <div className="!space-y-8">
                <label className="!block !text-white !text-xl !font-bold !mb-6">
                  <Calendar className="!inline !h-6 !w-6 !mr-3 !text-barbershop-red" />
                  Elige tu Servicio
                </label>
                <div className="!grid !grid-cols-1 md:!grid-cols-2 !gap-6">
                  {services.map((service) => (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => setSelectedService(service.id.toString())}
                      className={`!p-6 !rounded-xl !border-2 !transition-all !duration-300 !text-left !relative !cursor-pointer !backdrop-blur-sm ${
                        selectedService === service.id.toString()
                          ? '!border-barbershop-red !bg-barbershop-red/20 !text-white !shadow-lg !shadow-barbershop-red/30 !scale-105'
                          : '!border-white/20 !bg-white/5 !text-gray-300 hover:!border-barbershop-red/50 hover:!bg-white/10'
                      }`}
                    >
                      {selectedService === service.id.toString() && (
                        <div className="!absolute !top-4 !right-4 !w-4 !h-4 !bg-barbershop-red !rounded-full !animate-pulse"></div>
                      )}
                      <h3 className="!font-bold !text-lg !mb-3">{service.name}</h3>
                      <div className="!flex !justify-between !items-center">
                        <span className="!text-sm !opacity-80">{service.duration}</span>
                        <span className={`!font-bold !text-lg ${
                          selectedService === service.id.toString() ? '!text-white' : '!text-barbershop-red'
                        }`}>{service.price}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Barber Selection */}
              <div className="!space-y-8">
                <label className="!block !text-white !text-xl !font-bold !mb-6">
                  <User className="!inline !h-6 !w-6 !mr-3 !text-barbershop-red" />
                  Selecciona tu Barbero
                </label>
                {!selectedBarbershop ? (
                  <div className="!p-6 !bg-white/5 !border !border-white/20 !rounded-xl !text-center">
                    <p className="!text-gray-400 !text-lg !italic">Primero selecciona una barbería</p>
                  </div>
                ) : (
                  <div className="!grid !grid-cols-1 md:!grid-cols-2 !gap-6">
                    {availableBarbers.map((barber) => (
                      <button
                        key={barber.id}
                        type="button"
                        onClick={() => setSelectedBarber(barber.id.toString())}
                        className={`!p-6 !rounded-xl !border-2 !transition-all !duration-300 !text-center !relative !cursor-pointer !backdrop-blur-sm ${
                          selectedBarber === barber.id.toString()
                            ? '!border-barbershop-blue !bg-barbershop-blue/20 !text-white !shadow-lg !shadow-barbershop-blue/30 !scale-105'
                            : '!border-white/20 !bg-white/5 !text-gray-300 hover:!border-barbershop-blue/50 hover:!bg-white/10'
                        }`}
                      >
                        {selectedBarber === barber.id.toString() && (
                          <div className="!absolute !top-4 !right-4 !w-4 !h-4 !bg-barbershop-blue !rounded-full !animate-pulse"></div>
                        )}
                        <h3 className="!font-bold !text-lg !mb-3">{barber.name}</h3>
                        <p className="!text-sm !opacity-80">{barber.specialty}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Date and Time Selection */}
              <div className="!grid !grid-cols-1 md:!grid-cols-2 !gap-8">
                <div className="!space-y-4">
                  <label className="!block !text-white !text-xl !font-bold !mb-4">
                    <Calendar className="!inline !h-6 !w-6 !mr-3 !text-barbershop-red" />
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="!w-full !px-6 !py-4 !bg-white/5 !border-2 !border-white/20 !rounded-xl !text-white !text-lg focus:!outline-none focus:!border-barbershop-red/50 focus:!ring-2 focus:!ring-barbershop-red/50 !transition-all !duration-300 !backdrop-blur-sm hover:!bg-white/10 hover:!border-white/30 [color-scheme:dark]"
                    style={{ colorScheme: 'dark' }}
                    required
                  />
                </div>

                <div className="!space-y-4">
                  <label className="!block !text-white !text-xl !font-bold !mb-4">
                    <Clock className="!inline !h-6 !w-6 !mr-3 !text-barbershop-red" />
                    Horario
                  </label>
                  <select
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="!w-full !px-6 !py-4 !bg-white/5 !border-2 !border-white/20 !rounded-xl !text-white !text-lg focus:!outline-none focus:!border-barbershop-red/50 focus:!ring-2 focus:!ring-barbershop-red/50 !transition-all !duration-300 !backdrop-blur-sm hover:!bg-white/10 hover:!border-white/30 !cursor-pointer"
                    required
                  >
                    <option value="" className="!bg-slate-800 !text-gray-300">Selecciona un horario</option>
                    {timeSlots.map((time) => (
                      <option key={time} value={time} className="!bg-slate-800 !text-white">{time}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Customer Information */}
              <div className="!space-y-8">
                <h3 className="!text-white !text-xl !font-bold">Tus Datos de Contacto</h3>
                
                <div className="!grid !grid-cols-1 md:!grid-cols-2 !gap-8">
                  <div className="!space-y-4">
                    <label className="!block !text-gray-300 !mb-3 !text-lg !font-medium">
                      <Mail className="!inline !h-5 !w-5 !mr-2 !text-barbershop-red" />
                      Email
                    </label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="tu@email.com"
                      className="!w-full !px-6 !py-4 !bg-white/5 !border-2 !border-white/20 !rounded-xl !text-white !placeholder-gray-400 !text-lg focus:!outline-none focus:!border-barbershop-red/50 focus:!ring-2 focus:!ring-barbershop-red/50 !transition-all !duration-300 !backdrop-blur-sm hover:!bg-white/10 hover:!border-white/30"
                      required
                    />
                    <p className="!text-sm !text-gray-400 !mt-2">Te enviaremos la confirmación del turno</p>
                  </div>

                  <div className="!space-y-4">
                    <label className="!block !text-gray-300 !mb-3 !text-lg !font-medium">
                      <Phone className="!inline !h-5 !w-5 !mr-2 !text-barbershop-red" />
                      Teléfono de Contacto
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+54 11 1234-5678"
                      className="!w-full !px-6 !py-4 !bg-white/5 !border-2 !border-white/20 !rounded-xl !text-white !placeholder-gray-400 !text-lg focus:!outline-none focus:!border-barbershop-red/50 focus:!ring-2 focus:!ring-barbershop-red/50 !transition-all !duration-300 !backdrop-blur-sm hover:!bg-white/10 hover:!border-white/30"
                      required
                    />
                    <p className="!text-sm !text-gray-400 !mt-2">Para contactarte en caso de ser necesario</p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="!w-full !bg-gradient-to-r !from-barbershop-red !via-red-600 !to-barbershop-red !text-white !py-5 !px-8 !rounded-xl !font-bold !text-xl hover:!scale-105 !transition-all !duration-500 !shadow-xl !shadow-barbershop-red/30 hover:!shadow-barbershop-red/50 group !overflow-hidden !relative !cursor-pointer"
              >
                <span className="!relative !z-10">🎯 Confirmar Turno</span>
                <div className="!absolute !inset-0 !bg-gradient-to-r !from-white/0 !via-white/20 !to-white/0 !transform !-skew-x-12 !translate-x-[-100%] group-hover:!translate-x-[200%] !transition-transform !duration-1000"></div>
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
