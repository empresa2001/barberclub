import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';

type RegisterOwnerBody = {
  authUserId?: string;
  email?: string;
  name?: string;
  barbershopName?: string;
  barbershopAddress?: string;
  barbershopPhone?: string;
  barbershopEmail?: string;
};

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RegisterOwnerBody;
    const authUserId = text(body.authUserId);
    const email = text(body.email).toLowerCase();
    const name = text(body.name);
    const barbershopName = text(body.barbershopName);
    const barbershopAddress = text(body.barbershopAddress);
    const barbershopPhone = text(body.barbershopPhone);
    const barbershopEmail = text(body.barbershopEmail).toLowerCase() || null;

    if (!authUserId || !email || !name || !barbershopName || !barbershopAddress || !barbershopPhone) {
      return errorResponse('Faltan datos obligatorios para completar el registro.', 400);
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(authUserId);
    if (authError || !authData.user) {
      return errorResponse('No encontramos el usuario de Auth creado para este registro.', 404);
    }

    if (authData.user.email?.toLowerCase() !== email) {
      return errorResponse('El email no coincide con el usuario creado en Auth.', 409);
    }

    const { data: ownerType, error: ownerTypeError } = await supabaseAdmin
      .from('user_types')
      .select('id')
      .eq('name', 'barbershop_admin')
      .single();

    if (ownerTypeError || !ownerType) {
      return errorResponse('No existe el tipo de usuario barbershop_admin. Revisa el setup de Supabase.', 500);
    }

    const { error: userError } = await supabaseAdmin
      .from('users')
      .upsert(
        {
          id: authUserId,
          email,
          name,
          user_type_id: ownerType.id,
          is_active: true,
        },
        { onConflict: 'id' }
      );

    if (userError) throw userError;

    const shopPayload = {
      name: barbershopName,
      description: 'Nueva barberia',
      location: barbershopAddress,
      phone: barbershopPhone,
      email: barbershopEmail,
      owner_id: authUserId,
      status_id: 1,
    };

    const { data: existingShop, error: existingShopError } = await supabaseAdmin
      .from('barbershops')
      .select('id')
      .eq('owner_id', authUserId)
      .limit(1)
      .maybeSingle();

    if (existingShopError) throw existingShopError;

    let barbershop;
    if (existingShop) {
      const { data, error } = await supabaseAdmin
        .from('barbershops')
        .update(shopPayload)
        .eq('id', existingShop.id)
        .select()
        .single();

      if (error) throw error;
      barbershop = data;
    } else {
      const { data, error } = await supabaseAdmin
        .from('barbershops')
        .insert(shopPayload)
        .select()
        .single();

      if (error) throw error;
      barbershop = data;
    }

    const { data: existingBarber, error: existingBarberError } = await supabaseAdmin
      .from('barbers')
      .select('id,user_id,barbershop_id')
      .eq('user_id', authUserId)
      .limit(1)
      .maybeSingle();

    if (existingBarberError) throw existingBarberError;

    let barber;
    if (existingBarber) {
      const { data, error } = await supabaseAdmin
        .from('barbers')
        .update({ barbershop_id: barbershop.id })
        .eq('id', existingBarber.id)
        .select()
        .single();

      if (error) throw error;
      barber = data;
    } else {
      const { data, error } = await supabaseAdmin
        .from('barbers')
        .insert({
          user_id: authUserId,
          barbershop_id: barbershop.id,
        })
        .select()
        .single();

      if (error) throw error;
      barber = data;
    }

    const { error: updateUserError } = await supabaseAdmin
      .from('users')
      .update({ barber_id: barber.id })
      .eq('id', authUserId);

    if (updateUserError) throw updateUserError;

    return NextResponse.json({ userId: authUserId, barbershop, barber });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error inesperado al completar el registro.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
