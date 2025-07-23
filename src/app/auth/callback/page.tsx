"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CheckCircle, XCircle, Loader, ArrowRight } from 'lucide-react';
import Logo from '@/components/Logo';
import Link from 'next/link';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔄 Iniciando manejo de callback...');
        
        // Obtener el código de la URL
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        
        console.log('📧 Código presente:', code ? 'sí' : 'no');
        console.log('❌ Error en URL:', error);
        
        if (error) {
          console.error('Error en callback desde URL:', error);
          setStatus('error');
          setMessage('Error en la verificación del email.');
          return;
        }
        
        if (code) {
          console.log('🔄 Intercambiando código por sesión...');
          // Intercambiar el código por una sesión
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            console.error('❌ Error al verificar email:', exchangeError);
            setStatus('error');
            setMessage('Error al verificar el email. Por favor intenta nuevamente.');
            return;
          }

          if (data.user) {
            console.log('✅ Usuario verificado:', data.user.email);
            console.log('📅 Email confirmado en:', data.user.email_confirmed_at);
            
            setStatus('success');
            setMessage('¡Email verificado exitosamente!');
            
            // Redirigir a la página de confirmación después de 2 segundos
            setTimeout(() => {
              console.log('🚀 Redirigiendo a confirmación...');
              router.push('/auth/confirmation');
            }, 2000);
          } else {
            console.log('⚠️ No se encontró usuario');
            setStatus('error');
            setMessage('No se pudo completar la verificación.');
          }
        } else {
          // Si no hay código, verificar si ya hay una sesión activa
          console.log('🔍 Verificando sesión existente...');
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user) {
            console.log('✅ Sesión activa encontrada:', session.user.email);
            setStatus('success');
            setMessage('¡Email verificado exitosamente!');
            setTimeout(() => {
              router.push('/auth/confirmation');
            }, 1000);
          } else {
            console.log('❌ No se encontró sesión ni código');
            setStatus('error');
            setMessage('No se encontró información de verificación.');
          }
        }
      } catch (error) {
        console.error('❌ Error inesperado en callback:', error);
        setStatus('error');
        setMessage('Error inesperado durante la verificación.');
      }
    };

    handleAuthCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-950 to-slate-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-barbershop-green/8 via-green-600/4 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-barbershop-blue/6 via-blue-600/3 to-transparent rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="flex items-center justify-center min-h-screen p-4 sm:p-6 relative">
        <div className="w-full max-w-md animate-fade-in-up">
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 text-center">
            
            {/* Logo */}
            <div className="mb-8">
              <Logo size="md" className="justify-center" />
            </div>

            {/* Status Icon */}
            <div className="mb-8">
              {status === 'loading' && (
                <div className="bg-gradient-to-br from-barbershop-blue/20 via-barbershop-blue/10 to-transparent w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
                  <Loader className="h-10 w-10 text-barbershop-blue animate-spin" />
                </div>
              )}
              
              {status === 'success' && (
                <div className="bg-gradient-to-br from-green-500/20 via-green-500/10 to-transparent w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl animate-pulse">
                  <CheckCircle className="h-10 w-10 text-green-500" />
                </div>
              )}
              
              {status === 'error' && (
                <div className="bg-gradient-to-br from-red-500/20 via-red-500/10 to-transparent w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
                  <XCircle className="h-10 w-10 text-red-500" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="mb-8">
              {status === 'loading' && (
                <>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                    Verificando Email...
                  </h1>
                  <p className="text-gray-300 leading-relaxed">
                    Estamos procesando tu verificación de email. Esto solo tomará unos segundos.
                  </p>
                </>
              )}
              
              {status === 'success' && (
                <>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                    ¡Verificación Exitosa!
                  </h1>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    {message}
                  </p>
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                    <p className="text-green-400 text-sm">
                      Redirigiendo automáticamente en unos segundos...
                    </p>
                  </div>
                </>
              )}
              
              {status === 'error' && (
                <>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                    Error de Verificación
                  </h1>
                  <p className="text-gray-300 leading-relaxed mb-6">
                    {message}
                  </p>
                  <div className="space-y-4">
                    <Link
                      href="/auth/verify-email"
                      className="w-full bg-gradient-to-r from-barbershop-blue to-blue-600 text-white py-3 px-4 rounded-lg font-semibold text-base hover:from-barbershop-blue/90 hover:to-blue-600/90 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-barbershop-blue/25 flex items-center justify-center"
                    >
                      Solicitar Nuevo Email
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </Link>
                    <Link
                      href="/"
                      className="w-full border-2 border-gray-600 text-gray-300 py-3 px-4 rounded-lg font-semibold text-base hover:bg-gray-600/10 hover:border-gray-500 transition-all duration-300 flex items-center justify-center"
                    >
                      Volver al Inicio
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
