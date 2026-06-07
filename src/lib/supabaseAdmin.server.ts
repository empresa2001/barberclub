import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Cliente con service_role. SOLO servidor.
// El import 'server-only' hace que el build FALLE si esto se importa
// desde un componente cliente, evitando filtrar la key al browser.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
}

export const supabaseAdmin = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
