"use client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface Barber {
  id: string;
  user_id: string;
  user: {
    name: string;
    email: string;
  };
  is_active?: boolean;
}

export default function AdminBarberPage() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  // Estado para el modal de confirmación de eliminación y reactivación
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; barber: Barber | null }>({ open: false, barber: null });
  const [reactivateModal, setReactivateModal] = useState<{ open: boolean; barber: Barber | null }>({ open: false, barber: null });

  // Obtener el barbershopId desde la URL usando Next.js App Router
  const params = useParams();
  const barbershopId = params?.barbershopId as string;

  // Validar que sea un UUID (opcional, pero recomendado)
  // Puedes agregar una validación más estricta si lo deseas
  if (!barbershopId) {
    return (
      <div className="text-red-500 p-8 text-center">No se encontró la barbería. URL inválida.</div>
    );
  }

  useEffect(() => {
    const fetchBarbersAndOwner = async () => {
      setLoading(true);
      // 1. Obtener owner_id de la barbería
      const { data: barbershopData, error: barbershopError } = await supabase
        .from("barbershops")
        .select("owner_id")
        .eq("id", barbershopId)
        .maybeSingle();
      if (barbershopError || !barbershopData) {
        setError("No se pudo obtener la barbería");
        setLoading(false);
        return;
      }
      setOwnerId(barbershopData.owner_id);
      // 2. Obtener barberos
      const { data, error } = await supabase
        .from("barbers")
        .select("id, user_id, users!barbers_user_id_fkey(name, email, is_active)")
        .eq("barbershop_id", barbershopId);
      if (error) {
        setError("Error al cargar los peluqueros");
      } else {
        setBarbers(
          (data || []).map((b: any) => ({
            id: b.id,
            user_id: b.user_id,
            user: {
              name: b.users?.name || "Sin nombre",
              email: b.users?.email || "Sin email",
            },
            is_active: b.users?.is_active !== false, // true por default si no existe
          }))
        );
      }
      setLoading(false);
    };
    fetchBarbersAndOwner();
  }, [barbershopId]);

  const handleOpenModal = () => {
    setForm({ name: "", email: "", password: "" });
    setShowModal(true);
    setError(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreateBarber = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    const { name, email, password } = form;
    if (!name || !email || !password) {
      setError("Todos los campos son requeridos");
      setCreating(false);
      return;
    }
    // 1. Crear usuario en Supabase Auth
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });
    if (signUpError || !signUpData?.user) {
      setError("No se pudo crear el usuario: " + (signUpError?.message || ""));
      setCreating(false);
      return;
    }
    const userId = signUpData.user.id;
    // 2. Insertar o actualizar en tabla users con user_type_id: 3
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .maybeSingle();
    if (!existingUser) {
      const { error: userInsertError } = await supabase.from("users").insert([
        { id: userId, name, email, user_type_id: 3 }, // 3 = barber
      ]);
      if (userInsertError) {
        setError("No se pudo crear el perfil de usuario");
        setCreating(false);
        return;
      }
    } else {
      // Si ya existe, aseguramos que user_type_id sea 3
      const { error: userUpdateError } = await supabase.from("users").update({ user_type_id: 3 }).eq("id", userId);
      if (userUpdateError) {
        setError("No se pudo actualizar el tipo de usuario");
        setCreating(false);
        return;
      }
    }
    // 3. Asociar como barbero
    const { error: insertError } = await supabase.from("barbers").insert([
      { user_id: userId, barbershop_id: barbershopId },
    ]);
    if (insertError) {
      setError("No se pudo asociar el peluquero");
    } else {
      setShowModal(false);
      // Refrescar lista
      setLoading(true);
      const { data } = await supabase
        .from("barbers")
        .select("id, user_id, users!barbers_user_id_fkey(name, email)")
        .eq("barbershop_id", barbershopId);
      setBarbers(
        (data || []).map((b: any) => ({
          id: b.id,
          user_id: b.user_id,
          user: {
            name: b.users?.name || "Sin nombre",
            email: b.users?.email || "Sin email",
          },
        }))
      );
      setLoading(false);
    }
    setCreating(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-950 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
        <div className="absolute top-10 right-1/4 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '6s'}}></div>
      </div>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-white drop-shadow-lg mb-2">Panel de Administración de la Barbería</h1>
          <p className="text-white/70 font-medium">Gestiona tu equipo y operaciones</p>
        </header>
        {/* Estadísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
          <div className="bg-gradient-to-br from-barbershop-blue/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-xl">
            <div className="text-4xl font-bold text-barbershop-blue mb-2">
              {loading ? <LoadingSpinner /> : barbers.filter(b => b.is_active !== false).length}
            </div>
            <div className="text-gray-300">Peluqueros activos</div>
          </div>
          {/* Aquí puedes agregar más cards de estadísticas */}
        </div>
        {/* Listado de peluqueros */}
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden mb-12">
          <div className="px-8 py-6 border-b border-white/20 bg-gradient-to-r from-white/5 to-transparent flex items-center justify-between">
            <h2 className="text-xl font-bold text-white drop-shadow-lg">Peluqueros</h2>
            <Button onClick={handleOpenModal} className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-barbershop-blue to-barbershop-red text-white rounded-xl font-semibold shadow-lg shadow-barbershop-blue/25 hover:shadow-barbershop-red/40 hover:scale-105 transition-all duration-300 group backdrop-blur-sm">
              Agregar Peluquero
            </Button>
          </div>
          {loading ? (
            <div className="flex justify-center py-8"><LoadingSpinner /></div>
          ) : barbers.length === 0 ? (
            <div className="text-gray-400 text-center py-12 text-lg">No hay peluqueros registrados.</div>
          ) : (
            <ul className="divide-y divide-white/10">
          {barbers.map((barber) => {
                // No permitir eliminar al dueño de la barbería
                const isOwner = !!ownerId && barber.user_id === ownerId;
                const isInactive = barber.is_active === false;
                return (
                  <li key={barber.id} className="py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between group hover:bg-white/5 rounded-xl px-8 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="bg-barbershop-blue/20 rounded-full w-14 h-14 flex items-center justify-center text-barbershop-blue font-bold text-2xl uppercase shadow-lg">
                        {barber.user.name?.charAt(0) || "-"}
                      </div>
                      <div>
                        <div className="font-semibold text-white text-lg group-hover:text-barbershop-blue transition-colors">{barber.user.name}</div>
                        <div className="text-gray-400 text-sm group-hover:text-barbershop-blue/80 transition-colors">{barber.user.email}</div>
                        {isOwner && (
                          <div className="text-xs text-barbershop-blue font-semibold mt-1">Dueño</div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4 sm:mt-0">
                      {isInactive ? (
                        <Button
                          className="bg-gradient-to-r from-emerald-600 to-green-500 text-white px-4 py-2 rounded-lg font-semibold shadow hover:scale-105 transition-transform"
                          onClick={() => {
                            setReactivateModal({ open: true, barber });
                          }}
                        >
                          Reactivar
                        </Button>
                      ) : (
                        <Button
                          className="bg-gradient-to-r from-red-600 to-barbershop-red text-white px-4 py-2 rounded-lg font-semibold shadow hover:scale-105 transition-transform disabled:opacity-50"
                          disabled={isOwner}
                          title={isOwner ? "No puedes eliminar al dueño de la barbería" : "Desactivar barbero"}
                          onClick={() => {
                            if (isOwner) return;
                            setDeleteModal({ open: true, barber });
                          }}
                        >
                          Desactivar
                        </Button>
                      )}
      {/* Modal de confirmación para desactivar barbero */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, barber: null })}
        title="Confirmar desactivación"
      >
        <div className="space-y-4">
          <p className="text-gray-200 text-center">
            ¿Seguro que deseas desactivar al barbero <span className="font-bold text-barbershop-red">{deleteModal.barber?.user.name}</span>?<br />
            El usuario no podrá acceder ni ser listado como activo, pero podrás reactivarlo en cualquier momento.<br />
            <span className="text-xs text-gray-400">(No se elimina de la base de datos ni de Supabase Auth)</span>
          </p>
          {error && <div className="text-red-400 text-sm animate-shake text-center">{error}</div>}
          <div className="flex justify-end gap-2 mt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setDeleteModal({ open: false, barber: null })}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-barbershop-red text-white font-semibold"
              disabled={loading}
              onClick={async () => {
                if (!deleteModal.barber) return;
                setLoading(true);
                setError(null);
                const barber = deleteModal.barber;
                // 1. Desactivar usuario (is_active = false)
                const { error: userUpdateError } = await supabase.from("users").update({ is_active: false }).eq("id", barber.user_id);
                if (userUpdateError) {
                  setError("No se pudo desactivar el usuario");
                  setLoading(false);
                  return;
                }
                setBarbers((prev) => prev.map((b) => b.id === barber.id ? { ...b, is_active: false } : b));
                setDeleteModal({ open: false, barber: null });
                setLoading(false);
              }}
            >
              {loading ? <LoadingSpinner size="sm" /> : "Desactivar"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de confirmación para reactivar barbero */}
      <Modal
        isOpen={reactivateModal.open}
        onClose={() => setReactivateModal({ open: false, barber: null })}
        title="Confirmar reactivación"
      >
        <div className="space-y-4">
          <p className="text-gray-200 text-center">
            ¿Seguro que deseas reactivar al barbero <span className="font-bold text-emerald-400">{reactivateModal.barber?.user.name}</span>?<br />
            El usuario podrá volver a acceder y será listado como activo.<br />
          </p>
          {error && <div className="text-red-400 text-sm animate-shake text-center">{error}</div>}
          <div className="flex justify-end gap-2 mt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setReactivateModal({ open: false, barber: null })}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-emerald-600 text-white font-semibold"
              disabled={loading}
              onClick={async () => {
                if (!reactivateModal.barber) return;
                setLoading(true);
                setError(null);
                const barber = reactivateModal.barber;
                // 1. Reactivar usuario (is_active = true)
                const { error: userUpdateError } = await supabase.from("users").update({ is_active: true }).eq("id", barber.user_id);
                if (userUpdateError) {
                  setError("No se pudo reactivar el usuario");
                  setLoading(false);
                  return;
                }
                setBarbers((prev) => prev.map((b) => b.id === barber.id ? { ...b, is_active: true } : b));
                setReactivateModal({ open: false, barber: null });
                setLoading(false);
              }}
            >
              {loading ? <LoadingSpinner size="sm" /> : "Reactivar"}
            </Button>
          </div>
        </div>
      </Modal>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        {/* Modal para crear peluquero */}
        <Modal isOpen={showModal} onClose={handleCloseModal} title="Registrar nuevo Peluquero">
          <form onSubmit={handleCreateBarber} className="space-y-6">
            <Input
              label="Nombre"
              name="name"
              value={form.name}
              onChange={handleInputChange}
              required
              placeholder="Nombre completo"
              autoFocus
            />
            <Input
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleInputChange}
              required
              placeholder="usuario@email.com"
            />
            <Input
              label="Contraseña"
              name="password"
              type="password"
              value={form.password}
              onChange={handleInputChange}
              required
              placeholder="Contraseña segura"
            />
            {error && <div className="text-red-400 text-sm animate-shake">{error}</div>}
            <div className="flex justify-end gap-2 mt-2">
              <Button type="button" variant="secondary" onClick={handleCloseModal}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-barbershop-blue text-white font-semibold" disabled={creating}>
                {creating ? <LoadingSpinner size="sm" /> : "Registrar"}
              </Button>
            </div>
          </form>
        </Modal>
        {/* Área para futuras estadísticas */}
        <div className="w-full mt-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-gray-400 text-center">
            Próximamente: más estadísticas y funcionalidades para tu barbería.
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
