"use client";

import { useState } from "react";
import {
  Eye,
  EyeOff,
  ArrowLeft,
  Building,
  User,
  Phone,
  MapPin,
  CheckCircle,
  Sparkles,
  Shield,
  Zap,
} from "lucide-react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { authApi, barbershopsApi, barbersApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

interface FormData {
  // Barbershop Info
  barbershopName: string;
  barbershopAddress: string;
  barbershopPhone: string;
  barbershopEmail: string;

  // Admin User Info
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  confirmPassword: string;

  // Terms
  acceptTerms: boolean;
  acceptPrivacy: boolean;
}

export default function RegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    barbershopName: "",
    barbershopAddress: "",
    barbershopPhone: "",
    barbershopEmail: "",
    adminName: "",
    adminEmail: "",
    adminPassword: "",
    confirmPassword: "",
    acceptTerms: false,
    acceptPrivacy: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleNextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  console.log('Iniciando registro...');

  try {
    // Usar authApi en lugar de llamadas directas a supabase
    const result = await authApi.signUp({
      email: formData.adminEmail,
      password: formData.adminPassword,
      name: formData.adminName,
      barbershopName: formData.barbershopName,
      barbershopAddress: formData.barbershopAddress,
      barbershopPhone: formData.barbershopPhone,
      barbershopEmail: formData.barbershopEmail
    });

    console.log('Registro completado:', result);
    toast.success("¡Registro exitoso! Por favor verifica tu email para continuar.");
    router.push("/auth/verify-email");

  } catch (error: any) {
    console.error("Error en el registro:", error);
    toast.error(error.message || "Error al completar el registro");
  } finally {
    setIsLoading(false);
  }
};

  const isStep1Valid =
    formData.barbershopName &&
    formData.barbershopAddress &&
    formData.barbershopPhone;
  const isStep2Valid =
    formData.adminName &&
    formData.adminEmail &&
    formData.adminPassword &&
    formData.confirmPassword &&
    formData.adminPassword === formData.confirmPassword;
  const isStep3Valid = formData.acceptTerms && formData.acceptPrivacy;

  const stepConfig = [
    {
      number: 1,
      title: "Información de Barbería",
      description: "Datos básicos de tu negocio",
      icon: Building,
      color: "bg-barbershop-red",
    },
    {
      number: 2,
      title: "Datos del Administrador",
      description: "Tu información personal",
      icon: User,
      color: "bg-barbershop-blue",
    },
    {
      number: 3,
      title: "Términos y Condiciones",
      description: "Acepta nuestros términos",
      icon: CheckCircle,
      color: "bg-green-500",
    },
  ];

  return (
    <div className="bg-gradient-to-br from-slate-950 via-gray-950 to-slate-900 relative overflow-hidden">
      {/* Sophisticated Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Primary gradient orb */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-barbershop-red/8 via-red-600/4 to-transparent rounded-full blur-3xl animate-pulse"></div>
        {/* Secondary accent */}
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-barbershop-blue/6 via-blue-600/3 to-transparent rounded-full blur-3xl animate-pulse delay-2000"></div>
        {/* Tertiary depth layer */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gradient-radial from-barbershop-red/2 via-transparent to-transparent rounded-full animate-pulse delay-1000"></div>
      </div>

      <div className="flex items-center justify-center min-h-screen p-4 sm:p-6 relative">
        {/* Back to Login */}
        <Link
          href="/login"
          className="absolute top-4 left-4 sm:top-8 sm:left-8 inline-flex items-center px-3 sm:px-4 py-2 text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 rounded-full transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-barbershop-red/50"
          aria-label="Volver al login"
        >
          <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 group-hover:-translate-x-0.5 transition-transform duration-300" />
          <span className="text-xs sm:text-sm font-medium">
            Volver al Login
          </span>
        </Link>

        <div className="w-full max-w-2xl animate-fade-in-up mt-10">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="mb-4 sm:mb-6">
              <Logo size="lg" className="justify-center" />
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 sm:mb-3">
              Registrar Nueva Barbería
            </h1>
            <p className="text-base sm:text-lg text-gray-300 px-4">
              Únete a la plataforma BarberClub en solo 3 pasos
            </p>
          </div>

          

          {/* Progress Indicator */}
          <div className="mb-8 sm:mb-12">
            <div className="flex items-center justify-center mb-6 sm:mb-8 max-w-3xl mx-auto px-4">
              {stepConfig.map((step, index) => {
                const IconComponent = step.icon;
                const isActive = currentStep >= step.number;
                const isCurrent = currentStep === step.number;

                return (
                  <div key={step.number} className="flex items-center">
                    <div className="relative flex items-center justify-center">
                      <div
                        className={`
                          w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center font-bold text-white transition-all duration-500 relative z-10
                          ${isCurrent ? "scale-110 shadow-xl" : "scale-100"}
                        `}
                        style={{
                          backgroundColor: isActive
                            ? step.number === 1
                              ? "#b02e2e"
                              : step.number === 2
                              ? "#2e4a7d"
                              : "#22c55e"
                            : "#374151",
                        }}
                      >
                        <IconComponent
                          className={`h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 ${
                            isCurrent ? "animate-pulse" : ""
                          }`}
                        />
                      </div>
                      {isActive && (
                        <div
                          className="absolute inset-0 rounded-full animate-pulse opacity-30"
                          style={{
                            backgroundColor:
                              step.number === 1
                                ? "#b02e2e"
                                : step.number === 2
                                ? "#2e4a7d"
                                : "#22c55e",
                          }}
                        ></div>
                      )}
                    </div>
                    {index < stepConfig.length - 1 && (
                      <div className="w-12 sm:w-16 lg:w-24 mx-2 sm:mx-4 lg:mx-6">
                        <div
                          className="h-1 rounded-full transition-all duration-500"
                          style={{
                            backgroundColor:
                              currentStep > step.number
                                ? step.number === 1
                                  ? "#b02e2e"
                                  : step.number === 2
                                  ? "#2e4a7d"
                                  : "#22c55e"
                                : "#374151",
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="text-center px-4">
              <h2 className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2">
                {stepConfig[currentStep - 1]?.title}
              </h2>
              <p className="text-sm sm:text-base text-gray-400">
                {stepConfig[currentStep - 1]?.description}
              </p>
            </div>
          </div>

          {/* Registration Card */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 xl:p-12 hover:shadow-barbershop-red/10 transition-all duration-700">
            <form onSubmit={handleSubmit}>
              {/* Step 1: Barbershop Information */}
              {currentStep === 1 && (
                <div className="space-y-4 sm:space-y-6 animate-fade-in-up">
                  <div className="grid grid-cols-1 gap-4 sm:gap-6">
                    <div className="relative group">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Nombre de la Barbería *
                      </label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-focus-within:text-barbershop-red transition-colors duration-300" />
                        <input
                          name="barbershopName"
                          value={formData.barbershopName}
                          onChange={handleInputChange}
                          placeholder="Ej: Barbería Clásica"
                          required
                          className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 bg-white/5 border-2 border-white/20 rounded-lg sm:rounded-xl text-white placeholder-gray-400 text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-barbershop-red/50 focus:border-barbershop-red/50 transition-all duration-300 backdrop-blur-sm hover:bg-white/10 hover:border-white/30"
                        />
                      </div>
                    </div>

                    <div className="relative group">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Dirección *
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-focus-within:text-barbershop-red transition-colors duration-300" />
                        <input
                          name="barbershopAddress"
                          value={formData.barbershopAddress}
                          onChange={handleInputChange}
                          placeholder="Av. Corrientes 1234, Buenos Aires"
                          required
                          className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 bg-white/5 border-2 border-white/20 rounded-lg sm:rounded-xl text-white placeholder-gray-400 text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-barbershop-red/50 focus:border-barbershop-red/50 transition-all duration-300 backdrop-blur-sm hover:bg-white/10 hover:border-white/30"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      <div className="relative group">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Teléfono *
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-focus-within:text-barbershop-red transition-colors duration-300" />
                          <input
                            name="barbershopPhone"
                            value={formData.barbershopPhone}
                            onChange={handleInputChange}
                            placeholder="+54 11 1234-5678"
                            required
                            className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 bg-white/5 border-2 border-white/20 rounded-lg sm:rounded-xl text-white placeholder-gray-400 text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-barbershop-red/50 focus:border-barbershop-red/50 transition-all duration-300 backdrop-blur-sm hover:bg-white/10 hover:border-white/30"
                          />
                        </div>
                      </div>

                      <div className="relative group">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Email (Opcional)
                        </label>
                        <input
                          type="email"
                          name="barbershopEmail"
                          value={formData.barbershopEmail}
                          onChange={handleInputChange}
                          placeholder="info@barberia.com"
                          className="w-full px-4 py-3 sm:py-4 bg-white/5 border-2 border-white/20 rounded-lg sm:rounded-xl text-white placeholder-gray-400 text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-barbershop-red/50 focus:border-barbershop-red/50 transition-all duration-300 backdrop-blur-sm hover:bg-white/10 hover:border-white/30"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleNextStep}
                    disabled={!isStep1Valid}
                    className="w-full bg-gradient-to-r from-barbershop-red to-red-600 text-white py-3 sm:py-4 rounded-lg sm:rounded-xl font-semibold text-base sm:text-lg hover:from-barbershop-red/90 hover:to-red-600/90 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-barbershop-red/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group"
                  >
                    <span className="relative z-10">
                      Siguiente: Datos del Administrador
                    </span>
                    <div className="absolute inset-0 bg-white/20 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
                  </button>
                </div>
              )}

              {/* Step 2: Admin User Information */}
              {currentStep === 2 && (
                <div className="space-y-4 sm:space-y-6 animate-fade-in-up">
                  <div className="grid grid-cols-1 gap-4 sm:gap-6">
                    <div className="relative group">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Nombre Completo *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-focus-within:text-barbershop-blue transition-colors duration-300" />
                        <input
                          name="adminName"
                          value={formData.adminName}
                          onChange={handleInputChange}
                          placeholder="Juan Pérez"
                          required
                          className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 bg-white/5 border-2 border-white/20 rounded-lg sm:rounded-xl text-white placeholder-gray-400 text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-barbershop-blue/50 focus:border-barbershop-blue/50 transition-all duration-300 backdrop-blur-sm hover:bg-white/10 hover:border-white/30"
                        />
                      </div>
                    </div>

                    <div className="relative group">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        name="adminEmail"
                        value={formData.adminEmail}
                        onChange={handleInputChange}
                        placeholder="admin@barberia.com"
                        required
                        className="w-full px-4 py-3 sm:py-4 bg-white/5 border-2 border-white/20 rounded-lg sm:rounded-xl text-white placeholder-gray-400 text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-barbershop-blue/50 focus:border-barbershop-blue/50 transition-all duration-300 backdrop-blur-sm hover:bg-white/10 hover:border-white/30"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      <div className="relative group">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Contraseña *
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            name="adminPassword"
                            value={formData.adminPassword}
                            onChange={handleInputChange}
                            placeholder="••••••••"
                            required
                            className="w-full px-4 pr-12 sm:pr-14 py-3 sm:py-4 bg-white/5 border-2 border-white/20 rounded-lg sm:rounded-xl text-white placeholder-gray-400 text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-barbershop-blue/50 focus:border-barbershop-blue/50 transition-all duration-300 backdrop-blur-sm hover:bg-white/10 hover:border-white/30"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-barbershop-blue transition-colors duration-300 focus:outline-none"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                            ) : (
                              <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="relative group">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Confirmar Contraseña *
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            placeholder="••••••••"
                            required
                            className="w-full px-4 pr-12 sm:pr-14 py-3 sm:py-4 bg-white/5 border-2 border-white/20 rounded-lg sm:rounded-xl text-white placeholder-gray-400 text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-barbershop-blue/50 focus:border-barbershop-blue/50 transition-all duration-300 backdrop-blur-sm hover:bg-white/10 hover:border-white/30"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-barbershop-blue transition-colors duration-300 focus:outline-none"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                            ) : (
                              <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {formData.adminPassword &&
                      formData.confirmPassword &&
                      formData.adminPassword !== formData.confirmPassword && (
                        <div className="p-3 sm:p-4 bg-red-500/10 border border-red-500/20 rounded-lg sm:rounded-xl backdrop-blur-sm">
                          <p className="text-red-300 text-sm font-medium">
                            Las contraseñas no coinciden
                          </p>
                        </div>
                      )}
                  </div>

                  <div className="flex gap-3 sm:gap-4">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="flex-1 border-2 border-white/20 text-gray-300 py-3 sm:py-4 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base hover:border-white/30 hover:text-white transition-all duration-300 backdrop-blur-sm"
                    >
                      Anterior
                    </button>
                    <button
                      type="button"
                      onClick={handleNextStep}
                      disabled={!isStep2Valid}
                      className="flex-1 bg-gradient-to-r from-barbershop-blue to-blue-600 text-white py-3 sm:py-4 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base hover:from-barbershop-blue/90 hover:to-blue-600/90 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-barbershop-blue/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group"
                    >
                      <span className="relative z-10">Siguiente: Términos</span>
                      <div className="absolute inset-0 bg-white/20 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Terms and Conditions */}
              {currentStep === 3 && (
                <div className="space-y-6 sm:space-y-8 animate-fade-in-up">
                  <div className="text-center mb-6 sm:mb-8">
                    <div className="bg-green-500/10 p-3 sm:p-4 rounded-full w-fit mx-auto mb-3 sm:mb-4">
                      <CheckCircle className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-green-400" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                      ¡Casi listo!
                    </h3>
                    <p className="text-sm sm:text-base text-gray-400 px-4">
                      Solo falta aceptar nuestros términos para completar el
                      registro
                    </p>
                  </div>

                  <div className="space-y-4 sm:space-y-6">
                    <label className="flex items-start text-sm group cursor-pointer">
                      <input
                        type="checkbox"
                        name="acceptTerms"
                        checked={formData.acceptTerms}
                        onChange={handleInputChange}
                        className="mr-3 mt-1 rounded border-white/20 bg-white/5 text-barbershop-red focus:ring-barbershop-red w-4 h-4 flex-shrink-0"
                        required
                      />
                      <span className="text-gray-300 group-hover:text-white transition-colors duration-300">
                        Acepto los{" "}
                        <Link
                          href="/terms"
                          className="text-barbershop-red hover:text-red-400 underline transition-colors duration-300"
                        >
                          Términos y Condiciones
                        </Link>{" "}
                        de uso de BarberClub
                      </span>
                    </label>

                    <label className="flex items-start text-sm group cursor-pointer">
                      <input
                        type="checkbox"
                        name="acceptPrivacy"
                        checked={formData.acceptPrivacy}
                        onChange={handleInputChange}
                        className="mr-3 mt-1 rounded border-white/20 bg-white/5 text-barbershop-red focus:ring-barbershop-red w-4 h-4 flex-shrink-0"
                        required
                      />
                      <span className="text-gray-300 group-hover:text-white transition-colors duration-300">
                        Acepto la{" "}
                        <Link
                          href="/privacy"
                          className="text-barbershop-red hover:text-red-400 underline transition-colors duration-300"
                        >
                          Política de Privacidad
                        </Link>{" "}
                        y el tratamiento de mis datos personales
                      </span>
                    </label>
                  </div>

                  <div className="p-4 sm:p-6 bg-gradient-to-r from-barbershop-blue/10 to-barbershop-red/10 border border-white/10 rounded-lg sm:rounded-xl backdrop-blur-sm">
                    <h4 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">
                      🎉 ¿Qué incluye tu registro?
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm text-gray-300">
                      <div className="flex items-center">
                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-400 mr-2 flex-shrink-0" />
                        Panel de administración completo
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-400 mr-2 flex-shrink-0" />
                        Gestión de barberos y servicios
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-400 mr-2 flex-shrink-0" />
                        Sistema de turnos inteligente
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-400 mr-2 flex-shrink-0" />
                        Notificaciones por WhatsApp
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-400 mr-2 flex-shrink-0" />
                        Reportes y estadísticas
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-400 mr-2 flex-shrink-0" />
                        Soporte 24/7
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 sm:gap-4">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="flex-1 border-2 border-white/20 text-gray-300 py-3 sm:py-4 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base hover:border-white/30 hover:text-white transition-all duration-300 backdrop-blur-sm"
                    >
                      Anterior
                    </button>
                    <button
                      type="submit"
                      disabled={!isStep3Valid}
                      className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 sm:py-4 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base hover:from-green-500/90 hover:to-green-600/90 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2 sm:mr-3"></div>
                          Registrando...
                        </div>
                      ) : (
                        <>
                          <span className="relative z-10">
                            🚀 Crear mi Barbería
                          </span>
                          <div className="absolute inset-0 bg-white/20 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Footer */}
          <div className="mt-8 sm:mt-12 text-center">
            <p className="text-gray-400 text-xs sm:text-sm px-4">
              © 2025 BarberClub. Transformando barberías, un corte a la vez.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
