import { supabase } from '@/lib/supabase';

/**
 * Elimina un usuario (barbero) llamando al API route server-only,
 * que valida permisos y usa la service_role key del lado del servidor.
 * Nunca expone la service_role key al browser.
 */
export async function deleteUserAndAuth(user_id: string, barber_id?: string) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error('No hay sesion activa');

  const res = await fetch('/api/admin/delete-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ user_id, barber_id }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'No se pudo eliminar el usuario');
  }
  return true;
}
