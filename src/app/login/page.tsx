"use client";
import type React from "react";
import { useState, useEffect } from "react";
import {
  Eye,
  EyeOff,
  ArrowLeft,
  Lock,
  Mail,
  Crown,
  Building,
  Users,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";

interface LoginData {
  email: string;
  password: string;
  role: "superadmin" | "barbershop_admin" | "barber";
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

interface FormTouched {
  email: boolean;
  password: boolean;
}

export default function LoginPage() {
  const { login, loading: authLoading, user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] =
    useState<LoginData["role"]>("barbershop_admin");
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<FormTouched>({
    email: false,
    password: false,
  });
  const [isFormValid, setIsFormValid] = useState(false);

  const [formData, setFormData] = useState<LoginData>({
    email: "",
    password: "",
    role: "barbershop_admin",
  });

  // Validation functions
  const validateEmail = (email: string): string | undefined => {
    if (!email) return "El email es requerido";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Ingresa un email válido";
    return undefined;
  };

  const validatePassword = (password: string): string | undefined => {
    if (!password) return "La contraseña es requerida";
    if (password.length < 6)
      return "La contraseña debe tener al menos 6 caracteres";
    return undefined;
  };

  // Validate form on data change
  useEffect(() => {
    const newErrors: FormErrors = {};

    if (touched.email) {
      const emailError = validateEmail(formData.email);
      if (emailError) newErrors.email = emailError;
    }

    if (touched.password) {
      const passwordError = validatePassword(formData.password);
      if (passwordError) newErrors.password = passwordError;
    }

    setErrors(newErrors);
    setIsFormValid(
      formData.email !== "" &&
        formData.password !== "" &&
        !validateEmail(formData.email) &&
        !validatePassword(formData.password)
    );
  }, [formData, touched]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear general error when user starts typing
    if (errors.general) {
      setErrors((prev) => ({ ...prev, general: undefined }));
    }
  };

  const handleInputBlur = (field: keyof FormTouched) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleRoleChange = (role: LoginData["role"]) => {
    setSelectedRole(role);
    setFormData((prev) => ({ ...prev, role }));
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setTouched({ email: true, password: true })

  const emailError = validateEmail(formData.email)
  const passwordError = validatePassword(formData.password)

  if (emailError || passwordError) {
    setErrors({ email: emailError, password: passwordError })
    return
  }

  setIsLoading(true)
  setErrors({})

  // 1. Login con Supabase Auth
  const { error: loginError, user } = await login(formData.email, formData.password)

  if (loginError || !user) {
    setIsLoading(false)
    setErrors({ general: loginError || "Error de autenticación" })
    toast.error(loginError || "Error de autenticación")
    return
  }

  // 2. Obtener datos extendidos del usuario desde la tabla pública
  const { data: userRows, error: userFetchError } = await supabase
    .from("users")
    .select("user_type_id")
    .eq("id", user.id)
    .single()

  if (userFetchError || !userRows) {
    setIsLoading(false)
    setErrors({ general: "No se pudo obtener el perfil del usuario." })
    toast.error("No se pudo obtener el perfil del usuario.")
    return
  }

  const userTypeId = userRows.user_type_id
  const selectedRole = formData.role

  // Validación de acceso según rol elegido
  const canAccess =
    (selectedRole === "superadmin" && userTypeId === 1) ||
    (selectedRole === "barbershop_admin" && (userTypeId === 1 || userTypeId === 2)) ||
    (selectedRole === "barber" && userTypeId === 3)

  if (!canAccess) {
    // Logout para que no quede sesión activa
    await supabase.auth.signOut()
    setIsLoading(false)
    setErrors({ general: "No tienes permisos para acceder con este perfil." })
    toast.error("No tienes permisos para acceder con este perfil.")
    return
  }

  setIsLoading(false)
  toast.success("¡Bienvenido! Redirigiendo...")

  // Redirección basada en rol elegido
  const roleRedirectMap: Record<string, string> = {
    superadmin: "/admin",
    barbershop_admin: "/adminBarber",
    barber: "/barberBook",
  }

  window.location.href = roleRedirectMap[selectedRole]
}



  const roles = [
    {
      id: "barbershop_admin",
      label: "Administrador",
      description: "Gestiona tu barbería",
      icon: Building,
      color: "text-barbershop-red border-barbershop-red bg-barbershop-red/5",
      hoverColor: "hover:bg-barbershop-red/10",
      selectedColor:
        "bg-gradient-to-r from-barbershop-red/20 to-barbershop-red/10 border-barbershop-red shadow-lg shadow-barbershop-red/20",
    },
    {
      id: "barber",
      label: "Barbero",
      description: "Acceso profesional",
      icon: Users,
      color: "text-barbershop-blue border-barbershop-blue bg-barbershop-blue/5",
      hoverColor: "hover:bg-barbershop-blue/10",
      selectedColor:
        "bg-gradient-to-r from-barbershop-blue/20 to-barbershop-blue/10 border-barbershop-blue shadow-lg shadow-barbershop-blue/20",
    },
    {
      id: "superadmin",
      label: "Super Admin",
      description: "Control total",
      icon: Crown,
      color: "text-amber-400 border-amber-400 bg-amber-400/5",
      hoverColor: "hover:bg-amber-400/10",
      selectedColor:
        "bg-gradient-to-r from-amber-400/20 to-amber-400/10 border-amber-400 shadow-lg shadow-amber-400/20",
    },
  ];

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
      </div>

      <div className="flex items-center justify-center min-h-screen p-6 relative">
        {/* Back Button */}
        <Link
          href="/"
          className="absolute top-4 left-4 sm:top-8 sm:left-8 inline-flex items-center px-3 sm:px-4 py-2 text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 rounded-full transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-barbershop-red/50"
          aria-label="Volver al inicio"
        >
          <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 group-hover:-translate-x-0.5 transition-transform duration-300" />
          <span className="text-xs sm:text-sm font-medium">Inicio</span>
        </Link>

        <div className="w-full max-w-lg mt-12">
          {/* Logo Section */}
          <div className="text-center mb-12">
            <Logo size="lg" className="justify-center" />
          </div>

          {/* Role Selection */}
          <div className="mb-10">
            <h2 className="text-xl font-semibold text-white mb-6 text-center">
              Selecciona tu perfil
            </h2>
            <div
              className="space-y-3"
              role="radiogroup"
              aria-label="Seleccionar rol de usuario"
            >
              {roles.map((role) => {
                const IconComponent = role.icon;
                const isSelected = selectedRole === role.id;
                return (
                  <button
                    key={role.id}
                    onClick={() =>
                      handleRoleChange(role.id as LoginData["role"])
                    }
                    role="radio"
                    aria-checked={isSelected}
                    aria-label={`${role.label}: ${role.description}`}
                    className={`
                      relative w-full p-5 rounded-2xl border-2 transition-all duration-500 group 
                      focus:outline-none focus:ring-2 focus:ring-barbershop-red/50 focus:ring-offset-2 focus:ring-offset-transparent
                      backdrop-blur-sm hover:backdrop-blur-md
                      ${
                        isSelected
                          ? `${role.selectedColor} transform scale-[1.02]`
                          : `border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 hover:scale-[1.01]`
                      }
                    `}
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className={`
                        p-3 rounded-xl transition-all duration-300 
                        ${
                          isSelected
                            ? `bg-gradient-to-br ${
                                role.color.includes("barbershop-red")
                                  ? "from-barbershop-red/20 to-barbershop-red/10"
                                  : role.color.includes("barbershop-blue")
                                  ? "from-barbershop-blue/20 to-barbershop-blue/10"
                                  : "from-amber-400/20 to-amber-400/10"
                              }`
                            : "bg-white/10 group-hover:bg-white/15"
                        }
                      `}
                      >
                        <IconComponent
                          className={`
                          h-6 w-6 transition-all duration-300
                          ${
                            isSelected
                              ? role.color.split(" ")[0]
                              : "text-gray-300 group-hover:text-white"
                          }
                        `}
                        />
                      </div>
                      <div className="text-left flex-1">
                        <div
                          className={`
                          font-semibold text-lg transition-colors duration-300
                          ${
                            isSelected
                              ? "text-white"
                              : "text-gray-200 group-hover:text-white"
                          }
                        `}
                        >
                          {role.label}
                        </div>
                        <div className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                          {role.description}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="absolute top-4 right-4">
                        <div className="bg-white/20 rounded-full p-1">
                          <CheckCircle className="w-5 h-5 text-white animate-scale-in" />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Login Form */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-8 hover:shadow-barbershop-red/10 transition-all duration-700">
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              {/* General Error Message */}
              {errors.general && (
                <div className="flex items-center space-x-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl backdrop-blur-sm animate-shake">
                  <div className="bg-red-500/20 rounded-full p-1">
                    <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                  </div>
                  <span className="text-red-300 text-sm font-medium">
                    {errors.general}
                  </span>
                </div>
              )}

              {/* Email Field */}
              <div className="relative group">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Correo electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail
                      className={`h-5 w-5 transition-colors duration-300 ${
                        errors.email
                          ? "text-red-400"
                          : "text-gray-400 group-focus-within:text-barbershop-red"
                      }`}
                    />
                  </div>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    onBlur={() => handleInputBlur("email")}
                    placeholder="tu@email.com"
                    required
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    className={`
                      w-full pl-12 pr-4 py-4 bg-white/5 border-2 rounded-xl
                      text-white placeholder-gray-400 text-lg
                      focus:outline-none focus:ring-2 focus:ring-barbershop-red/50 focus:border-barbershop-red/50
                      transition-all duration-300 backdrop-blur-sm
                      hover:bg-white/10 hover:border-white/30
                      ${
                        errors.email
                          ? "border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50"
                          : "border-white/20"
                      }
                    `}
                  />
                </div>
                {errors.email && (
                  <div
                    id="email-error"
                    className="flex items-center space-x-2 mt-3 text-red-300 text-sm animate-fade-in"
                  >
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{errors.email}</span>
                  </div>
                )}
              </div>

              {/* Password Field */}
              <div className="relative group">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock
                      className={`h-5 w-5 transition-colors duration-300 ${
                        errors.password
                          ? "text-red-400"
                          : "text-gray-400 group-focus-within:text-barbershop-red"
                      }`}
                    />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    onBlur={() => handleInputBlur("password")}
                    placeholder="••••••••"
                    required
                    aria-invalid={!!errors.password}
                    aria-describedby={
                      errors.password ? "password-error" : undefined
                    }
                    className={`
                      w-full pl-12 pr-14 py-4 bg-white/5 border-2 rounded-xl
                      text-white placeholder-gray-400 text-lg
                      focus:outline-none focus:ring-2 focus:ring-barbershop-red/50 focus:border-barbershop-red/50
                      transition-all duration-300 backdrop-blur-sm
                      hover:bg-white/10 hover:border-white/30
                      ${
                        errors.password
                          ? "border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50"
                          : "border-white/20"
                      }
                    `}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                    }
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white transition-colors duration-300 focus:outline-none focus:text-barbershop-red"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <div
                    id="password-error"
                    className="flex items-center space-x-2 mt-3 text-red-300 text-sm animate-fade-in"
                  >
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{errors.password}</span>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !isFormValid}
                className={`
                  w-full py-4 rounded-xl font-semibold text-lg
                  transform transition-all duration-500
                  shadow-lg hover:shadow-2xl
                  relative overflow-hidden group
                  focus:outline-none focus:ring-2 focus:ring-barbershop-red/50 focus:ring-offset-2 focus:ring-offset-transparent
                  ${
                    isFormValid && !isLoading
                      ? "bg-gradient-to-r from-barbershop-red to-red-600 text-white hover:from-barbershop-red/90 hover:to-red-600/90 hover:scale-[1.02] hover:shadow-barbershop-red/30"
                      : "bg-gray-600/50 text-gray-400 cursor-not-allowed backdrop-blur-sm"
                  }
                `}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    <span>Iniciando sesión...</span>
                  </div>
                ) : (
                  <>
                    <span className="relative z-10">Iniciar Sesión</span>
                    {isFormValid && (
                      <div className="absolute inset-0 bg-white/10 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                    )}
                  </>
                )}
              </button>

              {/* Forgot Password */}
              <div className="text-center pt-2">
                <Link
                  href="/forgot-password"
                  className="text-sm text-gray-400 hover:text-white transition-colors duration-300 relative group focus:outline-none focus:ring-2 focus:ring-barbershop-red/50 rounded-lg p-2"
                >
                  <span className="relative">
                    ¿Olvidaste tu contraseña?
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-barbershop-red group-hover:w-full transition-all duration-300"></span>
                  </span>
                </Link>
              </div>
            </form>
          </div>

          {/* Register Link */}
          <div className="mt-10 text-center">
            <p className="text-gray-400 mb-6 text-lg">¿Primera vez aquí?</p>
            <Link
              href="/register"
              className="
                inline-flex items-center px-8 py-4
                bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm
                border-2 border-barbershop-red/50 text-white
                rounded-2xl font-semibold text-lg
                hover:bg-gradient-to-r hover:from-barbershop-red/20 hover:to-barbershop-red/10
                hover:border-barbershop-red hover:shadow-lg hover:shadow-barbershop-red/25
                transform hover:scale-105 transition-all duration-500
                group focus:outline-none focus:ring-2 focus:ring-barbershop-red/50
              "
            >
              <Building className="h-6 w-6 mr-3 group-hover:scale-110 transition-transform duration-300" />
              <span>Registrar mi Barbería</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
