import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';

/**
 * POST /api/admin/delete-user
 * Body: { user_id: string, barber_id?: string }
 * Elimina al barbero (barbers), su fila en users y su usuario de Auth.
 * Autorizacion: el que llama debe ser superadmin O dueño de la barberia del barbero.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Token del que llama
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // 2. Validar el token y obtener el usuario que llama
    const callerClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );
    const { data: { user: caller }, error: callerError } = await callerClient.auth.getUser();
    if (callerError || !caller) {
      return NextResponse.json({ error: 'Sesion invalida' }, { status: 401 });
    }

    // 3. Parsear body
    const { user_id, barber_id } = await req.json();
    if (!user_id) {
      return NextResponse.json({ error: 'user_id requerido' }, { status: 400 });
    }

    // 4. Autorizacion
    const isSuperadmin = caller.user_metadata?.role === 'superadmin';
    let authorized = isSuperadmin;

    if (!authorized) {
      // ¿el que llama es dueño de la barberia del barbero a eliminar?
      const { data: barberRows } = await supabaseAdmin
        .from('barbers')
        .select('barbershop_id')
        .eq('user_id', user_id);

      const shopIds = (barberRows ?? []).map((b) => b.barbershop_id);
      if (shopIds.length > 0) {
        const { data: ownedShops } = await supabaseAdmin
          .from('barbershops')
          .select('id')
          .in('id', shopIds)
          .eq('owner_id', caller.id);
        authorized = !!ownedShops && ownedShops.length > 0;
      }
    }

    if (!authorized) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // 5. Eliminar (con service role, server-side)
    if (barber_id) {
      const { error } = await supabaseAdmin.from('barbers').delete().eq('id', barber_id);
      if (error) throw error;
    } else {
      const { error } = await supabaseAdmin.from('barbers').delete().eq('user_id', user_id);
      if (error) throw error;
    }

    const { error: userErr } = await supabaseAdmin.from('users').delete().eq('id', user_id);
    if (userErr) throw userErr;

    const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(user_id);
    if (authErr) throw authErr;

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
