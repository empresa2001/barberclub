"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CheckCircle, Clock, Mail, Phone, ArrowRight, Home, User } from 'lucide-react';
import Logo from '@/components/Logo';
import Link from 'next/link';

interface UserData {
  name: string;
  barbershop_name: string;
}

export default function ConfirmationPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/login');
          return;
        }

        // Obtener datos del usuario desde la tabla users
        const { data: userRecord } = await supabase
          .from('users')
          .select(`
            name,
            barbershops!inner (
              name
            )
          `)
          .eq('id', user.id)
          .single();

        if (userRecord && userRecord.barbershops) {
          // barbershops será un array, tomamos el primer elemento
          const barbershop = Array.isArray(userRecord.barbershops) 
            ? userRecord.barbershops[0] 
            : userRecord.barbershops;
            
          setUserData({
            name: userRecord.name,
            barbershop_name: barbershop?.name || 'Tu barbería'
          });
        }
      } catch (error) {
        console.error('Error al obtener datos del usuario:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-950 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-barbershop-blue"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-950 to-slate-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-barbershop-green/8 via-green-600/4 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-barbershop-blue/6 via-blue-600/3 to-transparent rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="flex items-center justify-center min-h-screen p-4 sm:p-6 relative">
        <div className="w-full max-w-2xl animate-fade-in-up">
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10">
            
            {/* Logo */}
            <div className="text-center mb-8">
              <Logo size="md" className="justify-center" />
            </div>

            {/* Success Icon */}
            <div className="text-center mb-8">
              <div className="bg-gradient-to-br from-green-500/20 via-green-500/10 to-transparent w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl animate-pulse">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
              
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                ¡Registro Exitoso!
              </h1>
              
              {userData && (
                <p className="text-xl text-gray-300 mb-2">
                  ¡Hola <span className="text-barbershop-blue font-semibold">{userData.name}</span>!
                </p>
              )}
              
              <p className="text-gray-300 leading-relaxed">
                Tu email ha sido verificado correctamente y tu cuenta ha sido creada.
              </p>
            </div>

            {/* Status Cards */}
            <div className="space-y-6 mb-8">
              {/* Account Status */}
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-green-400" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Cuenta Creada
                    </h3>
                    <p className="text-green-400 text-sm">
                      Tu cuenta de administrador ha sido creada exitosamente
                    </p>
                  </div>
                </div>
              </div>

              {/* Barbershop Approval Status */}
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                      <Clock className="h-5 w-5 text-yellow-400" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Barbería en Revisión
                    </h3>
                    <div className="space-y-2">
                      <p className="text-yellow-400 text-sm">
                        {userData ? userData.barbershop_name : 'Tu barbería'} está siendo revisada por nuestro equipo
                      </p>
                      <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-lg p-3">
                        <p className="text-yellow-300 text-xs font-medium">
                          ⏱️ Tiempo estimado: 24-48 horas
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-barbershop-blue/10 border border-barbershop-blue/20 rounded-xl p-6 mb-8">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Mail className="h-5 w-5 mr-2 text-barbershop-blue" />
                Próximos Pasos
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-barbershop-blue rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-300 text-sm">
                    Recibirás un email de confirmación cuando tu barbería sea aprobada
                  </p>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-barbershop-blue rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-300 text-sm">
                    Podrás acceder al panel de administración para configurar servicios y barberos
                  </p>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-barbershop-blue rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-300 text-sm">
                    Tu barbería estará disponible para recibir reservas de clientes
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-6 mb-8">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Phone className="h-5 w-5 mr-2 text-gray-400" />
                ¿Necesitas Ayuda?
              </h3>
              
              <p className="text-gray-300 text-sm mb-4">
                Si tienes alguna pregunta o necesitas asistencia, no dudes en contactarnos:
              </p>
              
              <div className="space-y-2">
                <p className="text-gray-400 text-sm">
                  📧 Email: <span className="text-white">soporte@barberclub.com</span>
                </p>
                <p className="text-gray-400 text-sm">
                  📱 WhatsApp: <span className="text-white">+1 (555) 123-4567</span>
                </p>
                <p className="text-gray-400 text-sm">
                  🕒 Horario: <span className="text-white">Lunes a Viernes 9:00 AM - 6:00 PM</span>
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-4">
              <Link
                href="/"
                className="w-full bg-gradient-to-r from-barbershop-blue to-blue-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-barbershop-blue/90 hover:to-blue-600/90 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-barbershop-blue/25 flex items-center justify-center group"
              >
                <Home className="h-6 w-6 mr-3" />
                Ir al Inicio
                <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <div className="text-center">
                <p className="text-gray-400 text-sm">
                  ¿Ya tienes una cuenta?{' '}
                  <Link href="/login" className="text-barbershop-blue hover:text-blue-400 transition-colors font-medium">
                    Iniciar Sesión
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
