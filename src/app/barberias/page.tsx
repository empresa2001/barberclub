'use client';

import { Scissors, MapPin, Star, Clock, Phone, Calendar, Users, Filter, Search } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

// Datos de ejemplo de barberías
const barbershops = [
  {
    id: 1,
    name: "Elite Barber Club",
    image: "/api/placeholder/400/300",
    rating: 4.9,
    reviews: 124,
    address: "Av. Corrientes 1234, CABA",
    phone: "+54 11 1234-5678",
    openTime: "09:00",
    closeTime: "20:00",
    services: ["Corte Clásico", "Barba", "Afeitado", "Tratamientos"],
    price: "desde $3.500",
    specialties: ["Cortes Modernos", "Barba Profesional"],
    description: "Barbería premium con más de 10 años de experiencia en cortes modernos y clásicos."
  },
  {
    id: 2,
    name: "Classic Cuts",
    image: "/api/placeholder/400/300",
    rating: 4.7,
    reviews: 89,
    address: "San Martín 567, Palermo",
    phone: "+54 11 2345-6789",
    openTime: "10:00",
    closeTime: "19:00",
    services: ["Corte Tradicional", "Barba", "Bigote"],
    price: "desde $2.800",
    specialties: ["Cortes Clásicos", "Estilo Vintage"],
    description: "Especialistas en cortes tradicionales con un toque moderno."
  },
  {
    id: 3,
    name: "Modern Style Barber",
    image: "/api/placeholder/400/300",
    rating: 4.8,
    reviews: 156,
    address: "Av. Santa Fe 2890, Recoleta",
    phone: "+54 11 3456-7890",
    openTime: "08:30",
    closeTime: "21:00",
    services: ["Fade", "Undercut", "Barba", "Cejas"],
    price: "desde $4.200",
    specialties: ["Fades", "Diseño de Barba"],
    description: "Los mejores fades y cortes modernos de la ciudad."
  },
  {
    id: 4,
    name: "Gentleman's Choice",
    image: "/api/placeholder/400/300",
    rating: 4.9,
    reviews: 203,
    address: "Florida 875, Microcentro",
    phone: "+54 11 4567-8901",
    openTime: "09:00",
    closeTime: "18:30",
    services: ["Corte Ejecutivo", "Afeitado Clásico", "Tratamientos"],
    price: "desde $5.000",
    specialties: ["Estilo Ejecutivo", "Afeitado Tradicional"],
    description: "Elegancia y profesionalismo para el hombre moderno."
  },
  {
    id: 5,
    name: "Urban Cuts",
    image: "/api/placeholder/400/300",
    rating: 4.6,
    reviews: 67,
    address: "Gorriti 4567, Villa Crick",
    phone: "+54 11 5678-9012",
    openTime: "11:00",
    closeTime: "20:30",
    services: ["Corte Urbano", "Degradados", "Color"],
    price: "desde $3.200",
    specialties: ["Estilos Urbanos", "Color y Mechas"],
    description: "Cortes urbanos y modernos para la nueva generación."
  },
  {
    id: 6,
    name: "Royal Barber",
    image: "/api/placeholder/400/300",
    rating: 4.8,
    reviews: 142,
    address: "Av. Cabildo 1523, Belgrano",
    phone: "+54 11 6789-0123",
    openTime: "09:30",
    closeTime: "19:30",
    services: ["Corte Premium", "Barba Real", "Masajes"],
    price: "desde $4.500",
    specialties: ["Servicio Premium", "Experiencia Completa"],
    description: "Tratamiento real para cada cliente, experiencia de lujo."
  }
];

export default function BarberiasPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedZone, setSelectedZone] = useState('all');
  const [sortBy, setSortBy] = useState('rating');

  const zones = [
    { value: 'all', label: 'Todas las zonas' },
    { value: 'palermo', label: 'Palermo' },
    { value: 'recoleta', label: 'Recoleta' },
    { value: 'caba', label: 'CABA' },
    { value: 'belgrano', label: 'Belgrano' },
    { value: 'microcentro', label: 'Microcentro' }
  ];

  const filteredBarbershops = barbershops
    .filter(shop => 
      shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shop.address.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(shop => 
      selectedZone === 'all' || 
      shop.address.toLowerCase().includes(selectedZone.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'reviews') return b.reviews - a.reviews;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-950 to-slate-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-barbershop-red/8 via-red-600/4 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-barbershop-blue/6 via-blue-600/3 to-transparent rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Header */}
      <Navbar />

      {/* Main Content */}
      <main className="relative z-10 !p-5 lg:!p-20">
        {/* Hero Section */}
        <section className="py-20 lg:py-32 ">
          <div className="mx-auto px-6 lg:px-8 ">
            <div className="text-center justify-items-center !mb-5">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
                Descubre las Mejores{' '}
                <span className="bg-gradient-to-r from-barbershop-red via-red-500 to-barbershop-blue bg-clip-text text-transparent">
                  Barberías
                </span>
              </h1>
              <p className="text-xl sm:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Encuentra la barbería perfecta cerca de ti. Calidad, estilo y profesionalismo garantizados.
              </p>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 mx-auto !mb-12">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="🔍 Buscar barbería o zona..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
                />
              </div>
              <select 
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500"
              >
                <option value="all">🌍 Todas las zonas</option>
                {zones.slice(1).map(zone => (
                  <option key={zone.value} value={zone.value}>{zone.label}</option>
                ))}
              </select>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500"
              >
                <option value="rating">⭐ Mejor valoradas</option>
                <option value="reviews">💬 Más reseñas</option>
                <option value="name">🔤 Nombre A-Z</option>
              </select>
            </div>
          </div>
        </section>

        {/* Barbershops Grid */}
        <section>
          <div className="mx-auto px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6  ">
              {filteredBarbershops.map((shop) => (
              
                <div
                  key={shop.id}
                  className="bg-gray-800 border border-gray-700 hover:border-red-500 transition-all duration-300 hover:shadow-2xl hover:shadow-red-500/10 group overflow-hidden rounded-lg"
                >
                  <div className="relative">
                    {/* Rating Badge */}
                    <div className="absolute top-4 right-4 z-10">
                      <div className="flex items-center text-amber-300 px-2 py-1 rounded-full text-base font-semibold">
                        <Star className="w-4 h-4 mr-1 fill-current" />
                        {shop.rating}({shop.reviews})
                      </div>
                    </div>

                    {/* Image with overlay */}
                    <div className="relative h-48 bg-gray-700 flex items-center justify-center overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-800 via-transparent to-transparent z-10" />
                      <div className="absolute inset-0 flex items-center justify-center z-20">
                        <Scissors className="w-16 h-16 text-white/80" />
                      </div>
                    </div>
                  </div>

                  <div className="!p-6">
                    {/* Header */}
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-white mb-2">{shop.name}</h3>
                      <p className="text-gray-400 text-sm leading-relaxed">{shop.description}</p>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <MapPin className="w-4 h-4 text-red-500 flex-shrink-0" />
                        <span>{shop.address}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Clock className="w-4 h-4 text-red-500 flex-shrink-0" />
                        <span>{shop.openTime} - {shop.closeTime}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Phone className="w-4 h-4 text-red-500 flex-shrink-0" />
                        <span>{shop.phone}</span>
                      </div>
                    </div>

                    {/* Services */}
                    <div className="mb-6">
                      <div className="flex flex-wrap gap-1">
                        {shop.services.slice(0, 3).map((service, index) => (
                          <span
                            key={index}
                            className="text-xs border border-gray-600 text-gray-300 hover:border-red-500 hover:text-red-400 px-2 py-1 rounded"
                          >
                            {service}
                          </span>
                        ))}
                        {shop.services.length > 3 && (
                          <span className="text-xs border border-gray-600 text-gray-300 px-2 py-1 rounded">
                            +{shop.services.length - 3} más
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Price and CTA */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">desde</p>
                        <p className="text-2xl font-bold text-white">{shop.price}</p>
                      </div>
                      <Link
                        href={`/book/${shop.id}`}
                        className="bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-2 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-red-500/25"
                      >
                        Agendar
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredBarbershops.length === 0 && (
              <div className="text-center py-20">
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-12 max-w-md mx-auto">
                  <Search className="h-16 w-16 text-gray-400 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-white mb-4">No se encontraron barberías</h3>
                  <p className="text-gray-400">
                    Intenta cambiar los filtros de búsqueda o buscar en otra zona.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
