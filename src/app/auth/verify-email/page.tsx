"use client";

import { Suspense, useState, useEffect } from "react";
import { Mail, ArrowLeft, RefreshCw, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { authApi } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Manejar errores del callback
  useEffect(() => {
    const error = searchParams?.get('error') ?? null;
    if (error) {
      console.log('❌ Error recibido en verify-email:', error);
      let errorMessage = '';
      
      switch (error) {
        case 'callback_error':
          errorMessage = 'Error al procesar la verificación. Por favor intenta nuevamente.';
          break;
        case 'unexpected_error':
          errorMessage = 'Error inesperado. Por favor contacta soporte si el problema persiste.';
          break;
        case 'no_code':
          errorMessage = 'Enlace de verificación inválido. Por favor solicita un nuevo email.';
          break;
        case 'no_user':
          errorMessage = 'No se pudo verificar el usuario. Por favor intenta nuevamente.';
          break;
        default:
          errorMessage = 'Error en la verificación. Por favor intenta nuevamente.';
      }
      
      toast.error(errorMessage);
    }
  }, [searchParams]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResendEmail = async () => {
    setIsResending(true);
    try {
      // Obtener el usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user || !user.email) {
        toast.error('No se encontró información de usuario. Por favor regístrate nuevamente.');
        return;
      }

      // Reenviar email de verificación
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        console.error('Error al reenviar email:', error);
        toast.error('Error al enviar el email. Por favor intenta más tarde.');
        return;
      }

      toast.success('¡Email de verificación reenviado! Revisa tu bandeja de entrada.');
      setResendCooldown(60); // 60 segundos de cooldown
      
    } catch (error: any) {
      console.error('Error inesperado:', error);
      toast.error('Error inesperado. Por favor intenta más tarde.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-950 to-slate-900 relative overflow-hidden">
      {/* Sophisticated Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-barbershop-blue/8 via-blue-600/4 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-barbershop-red/6 via-red-600/3 to-transparent rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="flex items-center justify-center min-h-screen p-4 sm:p-6 relative">
        {/* Back to Home */}
        <Link
          href="/"
          className="absolute top-4 left-4 sm:top-8 sm:left-8 inline-flex items-center px-3 sm:px-4 py-2 text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 rounded-full transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-barbershop-blue/50"
        >
          <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 group-hover:-translate-x-0.5 transition-transform duration-300" />
          <span className="text-xs sm:text-sm font-medium">Volver al Inicio</span>
        </Link>

        <div className="w-full max-w-md animate-fade-in-up">
          {/* Main Card */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 text-center">
            
            {/* Logo */}
            <div className="mb-6">
              <Logo size="md" className="justify-center" />
            </div>

            {/* Mail Icon */}
            <div className="mb-8">
              <div className="bg-gradient-to-br from-barbershop-blue/20 via-barbershop-blue/10 to-transparent w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
                <Mail className="h-10 w-10 text-barbershop-blue" />
              </div>
            </div>

            {/* Content */}
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                ¡Verifica tu Email!
              </h1>
              <p className="text-gray-300 leading-relaxed mb-6">
                Te hemos enviado un enlace de verificación a tu correo electrónico. 
                Haz clic en el enlace para activar tu cuenta y completar el registro de tu barbería.
              </p>
              
              <div className="bg-barbershop-blue/10 border border-barbershop-blue/20 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="h-5 w-5 text-barbershop-blue mr-2" />
                  <span className="text-barbershop-blue font-medium">Proceso de Verificación</span>
                </div>
                <p className="text-sm text-gray-300">
                  Una vez verificado tu email, tu barbería será habilitada en un plazo de 48 horas.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-4">
              {/* Resend Email Button */}
              <button
                onClick={handleResendEmail}
                disabled={isResending || resendCooldown > 0}
                className="w-full bg-gradient-to-r from-barbershop-blue to-blue-600 text-white py-3 px-4 rounded-lg font-semibold text-base hover:from-barbershop-blue/90 hover:to-blue-600/90 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-barbershop-blue/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                    Reenviando...
                  </>
                ) : resendCooldown > 0 ? (
                  <>
                    <Clock className="h-5 w-5 mr-2" />
                    Reenviar en {resendCooldown}s
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-5 w-5 mr-2" />
                    Reenviar Email
                  </>
                )}
              </button>

              {/* Help Text */}
              <p className="text-sm text-gray-400">
                ¿No ves el email? Revisa tu carpeta de spam o correo no deseado.
              </p>
            </div>
          </div>

          {/* Steps Indicator */}
          <div className="mt-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-white mb-4 text-center">Próximos pasos:</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="w-6 h-6 bg-barbershop-blue rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
                <span className="text-gray-300 text-sm">Registro completado</span>
              </div>
              <div className="flex items-center">
                <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <Mail className="h-4 w-4 text-white" />
                </div>
                <span className="text-gray-300 text-sm">Verificar email (paso actual)</span>
              </div>
              <div className="flex items-center">
                <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <Clock className="h-4 w-4 text-white" />
                </div>
                <span className="text-gray-400 text-sm">Activación en 48 horas</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}
