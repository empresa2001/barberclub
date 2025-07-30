import { createClient } from '@supabase/supabase-js';

// Este helper usa la service_role key para eliminar usuarios de Supabase Auth
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function deleteUserFromAuth(user_id: string) {
  if (!user_id) throw new Error('user_id requerido');
  const { error } = await supabaseAdmin.auth.admin.deleteUser(user_id);
  if (error) throw error;
  return true;
}
