"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, ArrowLeft, Lock, Mail, Building, AlertCircle } from "lucide-react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [touched, setTouched] = useState({ email: false, password: false });
  const [isLoading, setIsLoading] = useState(false);

  // Inline validation
  useEffect(() => {
    const next: typeof errors = {};
    if (touched.email) {
      if (!email) next.email = "El email es requerido";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Ingresá un email válido";
    }
    if (touched.password) {
      if (!password) next.password = "La contraseña es requerida";
      else if (password.length < 6) next.password = "Mínimo 6 caracteres";
    }
    setErrors((prev) => ({ ...prev, ...next, email: next.email, password: next.password }));
  }, [email, password, touched]);

  const isValid = email && password.length >= 6 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!isValid) return;

    setIsLoading(true);
    setErrors({});

    const { error: loginError, user } = await login(email, password);
    if (loginError || !user) {
      setIsLoading(false);
      setErrors({ general: loginError || "Error de autenticación" });
      toast.error(loginError || "Error de autenticación");
      return;
    }

    const { data: userRow, error: userFetchError } = await supabase
      .from("users").select("user_type_id, is_active").eq("id", user.id).single();

    if (userFetchError || !userRow) {
      setIsLoading(false);
      setErrors({ general: "No se pudo obtener el perfil del usuario." });
      return;
    }

    const { user_type_id, is_active } = userRow;

    // Barbero desactivado
    if (user_type_id === 3 && is_active === false) {
      await supabase.auth.signOut();
      setIsLoading(false);
      setErrors({ general: "Tu cuenta está desactivada. Consultá con el administrador." });
      return;
    }

    // Redirigir automáticamente según el rol detectado
    if (user_type_id === 1) {
      toast.success("¡Bienvenido!");
      window.location.href = "/admin";
    } else if (user_type_id === 2) {
      const { data: shop } = await supabase.from("barbershops").select("id").eq("owner_id", user.id).maybeSingle();
      if (!shop) {
        setIsLoading(false);
        setErrors({ general: "No se encontró la barbería asociada a tu cuenta." });
        return;
      }
      toast.success("¡Bienvenido!");
      window.location.href = `/adminBarber/${shop.id}`;
    } else if (user_type_id === 3) {
      toast.success("¡Bienvenido!");
      window.location.href = "/barberBook";
    } else {
      await supabase.auth.signOut();
      setIsLoading(false);
      setErrors({ general: "Tu cuenta no tiene un rol válido asignado." });
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col">
      {/* Back link */}
      <div className="p-4 sm:p-5">
        <Link href="/" className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Inicio
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-6 sm:py-8">
        <div className="w-full max-w-md">

          {/* Logo */}
          <div className="text-center mb-6 sm:mb-8">
            <Logo size="lg" className="justify-center" />
            <h1 className="text-xl font-bold text-white mt-6">Iniciá sesión</h1>
            <p className="text-gray-500 text-sm mt-1">Te llevamos a tu panel automáticamente</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-6 space-y-5">

            {errors.general && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {errors.general}
              </div>
            )}

            <AuthField
                label="Correo electrónico"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, general: undefined })); }}
                onBlur={() => setTouched((p) => ({ ...p, email: true }))}
                placeholder="tu@email.com"
                autoComplete="username"
                error={errors.email}
                icon={<Mail className="w-4 h-4" />}
                required
              />

            <AuthField
                label="Contraseña"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, general: undefined })); }}
                onBlur={() => setTouched((p) => ({ ...p, password: true }))}
                placeholder="••••••••"
                autoComplete="current-password"
                error={errors.password}
                required
                icon={<Lock className="w-4 h-4" />}
                action={
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />

            <button
              type="submit"
              disabled={isLoading || !isValid}
              className="w-full py-3 rounded-xl bg-[#b02e2e] text-white font-semibold text-sm hover:bg-[#b02e2e]/85 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Iniciando sesión...
                </>
              ) : "Iniciar sesión"}
            </button>

            <div className="text-center">
              <Link href="/forgot-password" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </form>

          {/* Register link */}
          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm mb-3">¿Primera vez aquí?</p>
            <Link
              href="/register"
              className="inline-flex min-h-11 items-center justify-center gap-2 px-5 py-2.5 border border-white/15 rounded-xl text-gray-300 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all text-sm"
            >
              <Building className="w-4 h-4" /> Registrar mi barbería
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}

type AuthFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  icon: React.ReactNode;
  action?: React.ReactNode;
};

function AuthField({ label, error, icon, action, required, ...props }: AuthFieldProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-white">
        {label}
        {required && <span className="ml-1 text-[#b02e2e]">*</span>}
      </label>
      <div
        className={`flex min-h-12 items-center gap-2 rounded-lg border bg-[#1a1a1a] px-3 transition-colors ${
          error
            ? "border-red-500 focus-within:ring-2 focus-within:ring-red-500"
            : "border-gray-600 focus-within:border-transparent focus-within:ring-2 focus-within:ring-[#b02e2e]"
        }`}
      >
        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center text-gray-500">
          {icon}
        </span>
        <input
          className="min-w-0 flex-1 bg-transparent py-3 text-sm text-white placeholder-gray-400 outline-none"
          required={required}
          {...props}
        />
        {action}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
