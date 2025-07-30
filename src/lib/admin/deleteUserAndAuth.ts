import { supabase } from '@/lib/supabase';
import { deleteUserFromAuth } from './deleteUserFromAuth';

/**
 * Elimina un usuario de barbers, users y Supabase Auth.
 * Lanza error si alguna operación falla.
 */
export async function deleteUserAndAuth(user_id: string, barber_id?: string) {
  // 1. Eliminar de barbers (si se provee barber_id)
  if (barber_id) {
    const { error: barberDeleteError } = await supabase.from('barbers').delete().eq('id', barber_id);
    if (barberDeleteError) throw new Error('No se pudo eliminar el barbero');
  } else {
    // Si no se provee barber_id, eliminar todos los barbers de ese user
    const { error: barberDeleteError } = await supabase.from('barbers').delete().eq('user_id', user_id);
    if (barberDeleteError) throw new Error('No se pudo eliminar el barbero');
  }
  // 2. Eliminar de users
  const { error: userDeleteError } = await supabase.from('users').delete().eq('id', user_id);
  if (userDeleteError) throw new Error('No se pudo eliminar el usuario asociado');
  // 3. Eliminar de Supabase Auth
  await deleteUserFromAuth(user_id);
}
