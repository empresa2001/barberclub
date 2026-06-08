import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
// Evita que Next cachee la respuesta del cron.
export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/reminders
 *
 * Envía recordatorios de WhatsApp para los turnos de las próximas 24 h que
 * todavía no fueron notificados. Pensado para ejecutarse por cron (Vercel Cron
 * o cualquier scheduler que pegue a esta URL).
 *
 * Seguridad: requiere header `Authorization: Bearer <CRON_SECRET>`.
 *   - Vercel Cron agrega este header automáticamente si definís CRON_SECRET.
 *
 * Variables de entorno necesarias (ver .env.example):
 *   CRON_SECRET                  -> secreto compartido para autorizar el cron
 *   WHATSAPP_TOKEN               -> token de la WhatsApp Cloud API (Meta)
 *   WHATSAPP_PHONE_NUMBER_ID     -> id del número emisor en Meta
 *   WHATSAPP_TEMPLATE_NAME       -> nombre de la plantilla aprobada (4 variables)
 *   WHATSAPP_TEMPLATE_LANG       -> código de idioma de la plantilla (ej: es_AR)
 *
 * La plantilla aprobada en Meta debe tener 4 variables en el cuerpo, en orden:
 *   {{1}} nombre del cliente
 *   {{2}} nombre de la barbería
 *   {{3}} fecha (dd/mm/aaaa)
 *   {{4}} hora (HH:MM)
 */
export async function GET(req: NextRequest) {
  // 1. Autorización del cron
  const authHeader = req.headers.get('authorization') || '';
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  // 2. Config de WhatsApp
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME;
  const templateLang = process.env.WHATSAPP_TEMPLATE_LANG || 'es_AR';
  if (!token || !phoneNumberId || !templateName) {
    return NextResponse.json(
      { error: 'Falta configurar WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID / WHATSAPP_TEMPLATE_NAME' },
      { status: 500 }
    );
  }

  try {
    // 3. Ventana: turnos desde ahora hasta dentro de 24 h, sin recordatorio enviado
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const { data: apts, error: aptErr } = await supabaseAdmin
      .from('appointments')
      .select('id, date, customer_name, customer_phone, barber_id, service_id, status_id, reminder_sent_at')
      .gte('date', now.toISOString())
      .lte('date', in24h.toISOString())
      .is('reminder_sent_at', null)
      .in('status_id', [1, 2]) // pendiente o confirmado (no cancelado)
      .returns<any[]>();

    if (aptErr) throw aptErr;
    if (!apts || apts.length === 0) {
      return NextResponse.json({ ok: true, sent: 0, message: 'No hay turnos para recordar' });
    }

    // 4. Resolver barberos -> barbería, y nombres de servicio (mapas)
    const barberIds = [...new Set(apts.map((a) => a.barber_id).filter(Boolean))];
    const serviceIds = [...new Set(apts.map((a) => a.service_id).filter(Boolean))];

    const { data: barbers } = await supabaseAdmin
      .from('barbers')
      .select('id, barbershop_id')
      .in('id', barberIds);

    const shopIds = [...new Set((barbers ?? []).map((b) => b.barbershop_id).filter(Boolean))];
    const { data: shops } = await supabaseAdmin
      .from('barbershops')
      .select('id, name')
      .in('id', shopIds);

    const { data: services } = serviceIds.length
      ? await supabaseAdmin.from('services').select('id, name').in('id', serviceIds)
      : { data: [] as any[] };

    const barberToShop = new Map((barbers ?? []).map((b) => [b.id, b.barbershop_id]));
    const shopName = new Map((shops ?? []).map((s) => [s.id, s.name]));
    const serviceName = new Map((services ?? []).map((s) => [s.id, s.name]));

    // 5. Enviar uno por uno
    let sent = 0;
    const errors: { id: string; reason: string }[] = [];

    for (const apt of apts) {
      const phone = normalizePhone(apt.customer_phone);
      if (!phone) {
        errors.push({ id: apt.id, reason: 'Sin teléfono válido' });
        continue;
      }

      const shopId = barberToShop.get(apt.barber_id);
      const shop = (shopId && shopName.get(shopId)) || 'la barbería';
      const { dateStr, timeStr } = splitDateTime(apt.date);

      const ok = await sendWhatsAppTemplate({
        token,
        phoneNumberId,
        templateName,
        templateLang,
        to: phone,
        params: [apt.customer_name || 'Cliente', shop, dateStr, timeStr],
      });

      if (ok) {
        await supabaseAdmin
          .from('appointments')
          .update({ reminder_sent_at: new Date().toISOString() } as any)
          .eq('id', apt.id);
        sent++;
      } else {
        errors.push({ id: apt.id, reason: 'Falló el envío a WhatsApp' });
      }
    }

    return NextResponse.json({ ok: true, sent, total: apts.length, errors });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Normaliza un teléfono a formato internacional sin '+' (lo que pide la API).
 * Asume Argentina (54) si no viene código de país. Documentar a los clientes
 * que carguen el número con código de país para máxima precisión.
 */
function normalizePhone(raw: string | null | undefined): string | null {
  let d = (raw || '').replace(/\D/g, '');
  if (!d) return null;
  if (d.startsWith('54')) return d;
  if (d.startsWith('0')) d = d.slice(1);
  // quitar el 15 inicial típico de celulares AR si quedó pegado al área
  return '54' + d;
}

/** Separa "2026-06-09T15:00:00+00:00" en fecha dd/mm/aaaa y hora HH:MM. */
function splitDateTime(iso: string): { dateStr: string; timeStr: string } {
  const [datePart, timePart] = (iso || '').split('T');
  const [y, m, d] = (datePart || '').split('-');
  const timeStr = (timePart || '').slice(0, 5);
  return { dateStr: d && m && y ? `${d}/${m}/${y}` : datePart || '', timeStr };
}

async function sendWhatsAppTemplate(opts: {
  token: string;
  phoneNumberId: string;
  templateName: string;
  templateLang: string;
  to: string;
  params: string[];
}): Promise<boolean> {
  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${opts.phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${opts.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: opts.to,
        type: 'template',
        template: {
          name: opts.templateName,
          language: { code: opts.templateLang },
          components: [
            {
              type: 'body',
              parameters: opts.params.map((text) => ({ type: 'text', text })),
            },
          ],
        },
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
