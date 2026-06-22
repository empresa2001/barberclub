"use client";

import { useState } from "react";
import { Eye, EyeOff, ArrowLeft, Building, User, Phone, MapPin, CheckCircle, Mail } from "lucide-react";
import Link from "next/link";
import Logo from "@/components/Logo";
import Input from "@/components/ui/Input";
import { authApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface FormData {
  barbershopName: string;
  barbershopAddress: string;
  barbershopPhone: string;
  barbershopEmail: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  confirmPassword: string;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
}

const STEPS = [
  { id: 1, label: "Tu barbería" },
  { id: 2, label: "Tu cuenta" },
  { id: 3, label: "Confirmar" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState<FormData>({
    barbershopName: "", barbershopAddress: "", barbershopPhone: "", barbershopEmail: "",
    adminName: "", adminEmail: "", adminPassword: "", confirmPassword: "",
    acceptTerms: false, acceptPrivacy: false,
  });

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((p) => ({ ...p, [field]: val }));
  };

  const step1Valid = !!form.barbershopName && !!form.barbershopAddress && !!form.barbershopPhone;
  const step2Valid = !!form.adminName && !!form.adminEmail && !!form.adminPassword &&
    form.adminPassword === form.confirmPassword && form.adminPassword.length >= 6;
  const step3Valid = form.acceptTerms && form.acceptPrivacy;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!step3Valid) return;
    setIsLoading(true);
    try {
      await authApi.signUp({
        email: form.adminEmail,
        password: form.adminPassword,
        name: form.adminName,
        barbershopName: form.barbershopName,
        barbershopAddress: form.barbershopAddress,
        barbershopPhone: form.barbershopPhone,
        barbershopEmail: form.barbershopEmail,
      });
      toast.success("¡Registro exitoso! Verificá tu email para continuar.");
      router.push("/auth/verify-email");
    } catch (err: any) {
      toast.error(err.message || "Error al completar el registro");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col">
      {/* Back link */}
      <div className="p-4 sm:p-5">
        <Link href="/login" className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver al login
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-6 sm:py-8">
        <div className="w-full max-w-lg">

          {/* Logo + header */}
          <div className="text-center mb-6 sm:mb-8">
            <Logo size="lg" className="justify-center" />
            <h1 className="text-xl sm:text-2xl font-bold text-white mt-5 sm:mt-6 mb-1">Registrá tu barbería</h1>
            <p className="text-gray-500 text-sm">Completá los 3 pasos para comenzar</p>
          </div>

          {/* Step bar */}
          <div className="flex items-center mb-6 sm:mb-8">
            {STEPS.map((s, idx) => {
              const done = s.id < step;
              const active = s.id === step;
              return (
                <div key={s.id} className="flex items-center flex-1 min-w-0">
                  <div className="flex flex-col items-center flex-1 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                      done   ? "bg-[#b02e2e] border-[#b02e2e] text-white" :
                      active ? "border-[#b02e2e] text-[#b02e2e] bg-transparent" :
                               "border-white/15 text-gray-600 bg-transparent"
                    }`}>
                      {done ? <CheckCircle className="w-4 h-4" /> : s.id}
                    </div>
                    <span className={`text-xs mt-1.5 hidden sm:block ${active ? "text-white font-medium" : done ? "text-gray-500" : "text-gray-700"}`}>
                      {s.label}
                    </span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className={`h-px flex-1 max-w-[40px] mx-1 transition-colors ${done ? "bg-[#b02e2e]/50" : "bg-white/8"}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Card */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* PASO 1 — Barbería */}
              {step === 1 && (
                <>
                  <SectionTitle icon={<Building className="w-4 h-4 text-[#b02e2e]" />} title="Datos de la barbería" />
                  <Input label="Nombre de la barbería" value={form.barbershopName} onChange={set("barbershopName")} placeholder="Ej: Barbería Clásica" required autoFocus />
                  <Input label="Dirección" value={form.barbershopAddress} onChange={set("barbershopAddress")} placeholder="Av. Corrientes 1234, Buenos Aires" required />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Teléfono" type="tel" value={form.barbershopPhone} onChange={set("barbershopPhone")} placeholder="+54 11 1234-5678" required />
                    <Input label="Email (opcional)" type="email" value={form.barbershopEmail} onChange={set("barbershopEmail")} placeholder="info@barberia.com" />
                  </div>
                  <NavButtons onNext={() => setStep(2)} nextDisabled={!step1Valid} nextLabel="Continuar" />
                </>
              )}

              {/* PASO 2 — Admin */}
              {step === 2 && (
                <>
                  <SectionTitle icon={<User className="w-4 h-4 text-[#2e4a7d]" />} title="Tu cuenta de administrador" />
                  <Input label="Nombre completo" value={form.adminName} onChange={set("adminName")} placeholder="Juan Pérez" required autoFocus />
                  <Input label="Email" type="email" value={form.adminEmail} onChange={set("adminEmail")} placeholder="admin@barberia.com" required />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <PasswordField
                        label="Contraseña"
                        type={showPassword ? "text" : "password"}
                        value={form.adminPassword}
                        onChange={set("adminPassword")}
                        placeholder="••••••••"
                        required
                        autoComplete="new-password"
                        error={form.adminPassword && form.adminPassword.length < 6 ? "Mínimo 6 caracteres" : undefined}
                        action={
                          <button type="button" onClick={() => setShowPassword((s) => !s)}
                            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}>
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        }
                      />
                    <PasswordField
                        label="Confirmar contraseña"
                        type={showConfirm ? "text" : "password"}
                        value={form.confirmPassword}
                        onChange={set("confirmPassword")}
                        placeholder="••••••••"
                        required
                        autoComplete="new-password"
                        error={form.confirmPassword && form.adminPassword !== form.confirmPassword ? "Las contraseñas no coinciden" : undefined}
                        action={
                          <button type="button" onClick={() => setShowConfirm((s) => !s)}
                            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                            aria-label={showConfirm ? "Ocultar contraseña" : "Mostrar contraseña"}>
                            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        }
                      />
                  </div>
                  <NavButtons onPrev={() => setStep(1)} onNext={() => setStep(3)} nextDisabled={!step2Valid} nextLabel="Continuar" />
                </>
              )}

              {/* PASO 3 — Términos */}
              {step === 3 && (
                <>
                  {/* Resumen */}
                  <div className="bg-white/4 border border-white/8 rounded-xl p-4 space-y-2 text-sm">
                    <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-3">Resumen de tu registro</p>
                    <SummaryRow label="Barbería" value={form.barbershopName} />
                    <SummaryRow label="Dirección" value={form.barbershopAddress} />
                    <SummaryRow label="Teléfono" value={form.barbershopPhone} />
                    <SummaryRow label="Admin" value={form.adminName} />
                    <SummaryRow label="Email" value={form.adminEmail} />
                  </div>

                  {/* Checkboxes */}
                  <div className="space-y-3">
                    <CheckItem
                      checked={form.acceptTerms}
                      onChange={set("acceptTerms")}
                      label={<>Acepto los <Link href="/terms" className="text-[#b02e2e] hover:underline">Términos y Condiciones</Link> de BarberClub</>}
                    />
                    <CheckItem
                      checked={form.acceptPrivacy}
                      onChange={set("acceptPrivacy")}
                      label={<>Acepto la <Link href="/privacy" className="text-[#b02e2e] hover:underline">Política de Privacidad</Link> y el tratamiento de mis datos</>}
                    />
                  </div>

                  <NavButtons
                    onPrev={() => setStep(2)}
                    submitLabel={isLoading ? "Registrando..." : "Crear mi barbería"}
                    submitDisabled={!step3Valid || isLoading}
                    isLoading={isLoading}
                  />
                </>
              )}

            </form>
          </div>

          <p className="text-center text-gray-700 text-xs mt-6">© 2025 BarberClub</p>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-1">
      {icon}
      <h2 className="text-white font-semibold text-sm">{title}</h2>
    </div>
  );
}

type PasswordFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  action: React.ReactNode;
};

function PasswordField({ label, error, action, required, ...props }: PasswordFieldProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-barbershop-white">
        {label}
        {required && <span className="text-barbershop-red ml-1">*</span>}
      </label>
      <div
        className={`flex min-h-12 items-center gap-2 rounded-lg border bg-barbershop-black px-3 transition-colors ${
          error
            ? "border-red-500 focus-within:ring-2 focus-within:ring-red-500"
            : "border-gray-600 focus-within:border-transparent focus-within:ring-2 focus-within:ring-barbershop-red"
        }`}
      >
        <input
          className="min-w-0 flex-1 bg-transparent py-3 text-sm text-barbershop-white placeholder-gray-400 outline-none"
          required={required}
          {...props}
        />
        {action}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

function NavButtons({ onPrev, onNext, nextDisabled, nextLabel, submitLabel, submitDisabled, isLoading }: {
  onPrev?: () => void;
  onNext?: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
  submitLabel?: string;
  submitDisabled?: boolean;
  isLoading?: boolean;
}) {
  return (
    <div className="flex flex-col min-[380px]:flex-row gap-3 pt-2">
      {onPrev && (
        <button type="button" onClick={onPrev}
          className="flex-1 min-h-11 py-2.5 rounded-xl border border-white/15 text-gray-300 hover:bg-white/5 text-sm transition-colors">
          Anterior
        </button>
      )}
      {onNext && (
        <button type="button" onClick={onNext} disabled={nextDisabled}
          className="flex-1 min-h-11 py-2.5 rounded-xl bg-[#b02e2e] text-white text-sm font-medium hover:bg-[#b02e2e]/85 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          {nextLabel || "Siguiente"}
        </button>
      )}
      {submitLabel && (
        <button type="submit" disabled={submitDisabled}
          className="flex-1 min-h-11 py-2.5 rounded-xl bg-[#b02e2e] text-white text-sm font-medium hover:bg-[#b02e2e]/85 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          {isLoading && (
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {submitLabel}
        </button>
      )}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-white font-medium break-words max-w-[60%] text-right">{value || "—"}</span>
    </div>
  );
}

function CheckItem({ checked, onChange, label }: {
  checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; label: React.ReactNode;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
        checked ? "bg-[#b02e2e] border-[#b02e2e]" : "border-white/20 bg-white/5"
      }`}>
        <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
        {checked && <CheckCircle className="w-3 h-3 text-white" />}
      </div>
      <span className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors leading-snug">{label}</span>
    </label>
  );
}
