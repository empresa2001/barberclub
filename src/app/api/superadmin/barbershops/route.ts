import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';

const statusToId = {
  pending: 1,
  active: 2,
  inactive: 3,
} as const;

type BarbershopStatus = keyof typeof statusToId;

function statusName(statusId: number): BarbershopStatus {
  if (statusId === 2) return 'active';
  if (statusId === 3) return 'inactive';
  return 'pending';
}

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function bearerToken(req: NextRequest) {
  return (req.headers.get('authorization') || '').replace('Bearer ', '').trim();
}

async function requireSuperadmin(req: NextRequest) {
  const token = bearerToken(req);
  if (!token) return { error: errorResponse('No autenticado', 401) };

  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
  const caller = authData.user;
  if (authError || !caller) return { error: errorResponse('Sesion invalida', 401) };

  if (caller.user_metadata?.role === 'superadmin') {
    return { caller };
  }

  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('user_type_id')
    .eq('id', caller.id)
    .maybeSingle();

  if (profile?.user_type_id === 1) {
    return { caller };
  }

  return { error: errorResponse('No autorizado', 403) };
}

async function getBarbershops() {
  const { data: shops, error } = await supabaseAdmin
    .from('barbershops')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  const ownerIds = Array.from(new Set((shops ?? []).map((shop) => shop.owner_id).filter(Boolean))) as string[];
  const ownersById = new Map<string, { name: string; email: string }>();

  if (ownerIds.length > 0) {
    const { data: owners, error: ownersError } = await supabaseAdmin
      .from('users')
      .select('id,name,email')
      .in('id', ownerIds);

    if (ownersError) throw ownersError;
    owners?.forEach((owner) => ownersById.set(owner.id, { name: owner.name, email: owner.email }));
  }

  return (shops ?? []).map((shop) => ({
    ...shop,
    users: shop.owner_id ? ownersById.get(shop.owner_id) ?? null : null,
    barbershop_status: { name: statusName(shop.status_id) },
  }));
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireSuperadmin(req);
    if ('error' in auth) return auth.error;

    const barbershops = await getBarbershops();
    return NextResponse.json({ barbershops });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al cargar barberias';
    return errorResponse(message, 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireSuperadmin(req);
    if ('error' in auth) return auth.error;

    const body = await req.json();
    const id = typeof body.id === 'string' ? body.id : '';
    const status = typeof body.status === 'string' ? body.status : '';

    if (!id) return errorResponse('ID de barberia requerido', 400);
    if (!(status in statusToId)) return errorResponse('Estado invalido', 400);

    const { error } = await supabaseAdmin
      .from('barbershops')
      .update({ status_id: statusToId[status as BarbershopStatus] })
      .eq('id', id);

    if (error) throw error;

    const barbershops = await getBarbershops();
    const barbershop = barbershops.find((shop) => shop.id === id);
    return NextResponse.json({ barbershop });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al actualizar barberia';
    return errorResponse(message, 500);
  }
}
