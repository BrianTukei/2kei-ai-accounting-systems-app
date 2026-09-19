import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: Record<string, unknown>, status = 200) => new Response(
  JSON.stringify(body),
  { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
);

const normalizeEmail = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
};

const escapeHtml = (value: unknown): string => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const body = await req.json();
    const name = String(body.name ?? body.full_name ?? '').trim();
    const email = normalizeEmail(body.email);
    const company = String(body.company ?? body.company_name ?? '').trim();
    const phone = String(body.phone ?? '').trim();
    const preferredDate = String(body.preferredDate ?? body.preferred_date ?? '').trim();
    const preferredTime = String(body.preferredTime ?? body.preferred_time ?? '').trim();
    const timezone = String(body.timezone ?? 'UTC').trim() || 'UTC';
    const website = String(body.website ?? '').trim() || null;
    const message = String(body.message ?? '').trim() || null;

    if (!name || !email || !company || !phone || !preferredDate || !preferredTime) {
      return json({ error: 'Name, email, company, phone, date, and time are required.' }, 400);
    }
    if (!email) return json({ error: 'A valid email address is required.' }, 400);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) {
      return json({ error: 'Preferred date must use YYYY-MM-DD format.' }, 400);
    }
    if (!/^\d{2}:\d{2}$/.test(preferredTime)) {
      return json({ error: 'Preferred time must use HH:MM format.' }, 400);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('[book-demo] Missing Supabase service configuration');
      return json({ error: 'Demo booking service is not configured.' }, 503);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { data: existing, error: slotError } = await admin
      .from('demo_bookings')
      .select('id')
      .eq('preferred_date', preferredDate)
      .eq('preferred_time', preferredTime)
      .in('status', ['pending', 'confirmed'])
      .limit(1)
      .maybeSingle();
    if (slotError) throw slotError;
    if (existing) return json({ error: 'This time slot is already booked.' }, 409);

    const { data: booking, error: insertError } = await admin
      .from('demo_bookings')
      .insert({
        name,
        email,
        company_name: company,
        phone,
        website,
        preferred_date: preferredDate,
        preferred_time: preferredTime,
        timezone,
        message,
        source: 'website',
        status: 'pending',
        meeting_platform: 'zoom',
        duration: 30,
      })
      .select()
      .single();
    if (insertError) throw insertError;

    const resendKey = Deno.env.get('RESEND_API_KEY');
    const resendFrom = Deno.env.get('RESEND_FROM') || Deno.env.get('FROM_EMAIL');
    const notificationEmail = Deno.env.get('DEMO_NOTIFICATION_EMAIL');
    let notificationSent = false;

    if (resendKey && resendFrom && notificationEmail) {
      const providerResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: resendFrom,
          to: [notificationEmail],
          subject: `New demo booking - ${company}`,
          html: `<h2>New demo request</h2>
            <p><strong>Name:</strong> ${escapeHtml(name)}</p>
            <p><strong>Email:</strong> ${escapeHtml(email)}</p>
            <p><strong>Company:</strong> ${escapeHtml(company)}</p>
            <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
            <p><strong>Preferred:</strong> ${escapeHtml(preferredDate)} at ${escapeHtml(preferredTime)} (${escapeHtml(timezone)})</p>
            <p><strong>Message:</strong> ${escapeHtml(message || 'None')}</p>`,
        }),
      });
      const providerBody = await providerResponse.json().catch(() => ({}));
      console.info('[book-demo] Resend response', { status: providerResponse.status, body: providerBody });
      if (!providerResponse.ok) {
        console.error('[book-demo] Resend notification failed', providerBody);
      } else {
        notificationSent = true;
      }
    }

    return json({
      success: true,
      notificationSent,
      data: {
        booking: {
          ...booking,
          preferredDate: booking.preferred_date,
          preferredTime: booking.preferred_time,
          company: booking.company_name,
        },
      },
    });
  } catch (error) {
    console.error('[book-demo] Booking failed', error);
    return json({ error: 'Unable to create demo booking. Please try again later.' }, 500);
  }
});
