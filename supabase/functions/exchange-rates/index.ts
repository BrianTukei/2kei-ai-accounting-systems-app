/**
 * exchange-rates Edge Function (Production-Grade)
 * ────────────────────────────────────────────────
 * Server-side exchange rate engine. Fetches live forex rates,
 * caches them in Supabase (10 min TTL), stores audit history,
 * and respects admin overrides.
 *
 * Endpoints:
 *   POST /exchange-rates
 *     { action: 'get_rates' }                    → all cached USD-based rates
 *     { action: 'get_rate', from, to }           → single pair rate
 *     { action: 'convert', amount, from, to }    → convert amount
 *     { action: 'refresh' }                      → force refresh from API
 *     { action: 'set_override', target, rate, reason }  → admin override
 *     { action: 'remove_override', target }      → remove admin override
 *     { action: 'get_overrides' }                → list admin overrides
 *     { action: 'get_history', target, days }    → rate history
 *
 * Required env vars:
 *   EXCHANGE_RATE_API_KEY     — ExchangeRate-API key (free tier OK)
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BASE_CURRENCY = 'USD';
const CACHE_TTL_MINUTES = 10;

// Fallback rates (approximate) used when API is unreachable
const FALLBACK_RATES: Record<string, number> = {
  USD: 1, EUR: 0.93, GBP: 0.80, JPY: 149.50, CAD: 1.36, AUD: 1.53,
  CHF: 0.88, CNY: 7.24, INR: 83.12, BRL: 4.97, ZAR: 18.70, KRW: 1320,
  SGD: 1.34, HKD: 7.82, SEK: 10.42, NOK: 10.55, DKK: 6.92, PLN: 4.02,
  CZK: 23.15, HUF: 362, RUB: 91.50, TRY: 30.50, MXN: 17.15,
  ARS: 830, CLP: 920, COP: 3950, PEN: 3.72, UYU: 39.20,
  EGP: 50.10, MAD: 10.05, NGN: 1580, GHS: 14.80, KES: 153,
  UGX: 3780, TZS: 2650, ZMW: 26.50, BWP: 13.60,
  AED: 3.67, SAR: 3.75, QAR: 3.64, KWD: 0.31, BHD: 0.377,
  OMR: 0.385, JOD: 0.71, LBP: 89500, THB: 35.20, VND: 24850,
  IDR: 15650, MYR: 4.72, PHP: 56.30, PKR: 278, BDT: 110,
  LKR: 320, NPR: 133, RWF: 1280, XOF: 610, XAF: 610, ETB: 56.50,
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function fetchLiveRates(apiKey: string): Promise<Record<string, number> | null> {
  try {
    const url = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${BASE_CURRENCY}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) {
      console.error(`ExchangeRate API returned ${res.status}`);
      return null;
    }
    const data = await res.json();
    if (data.result === 'success' && data.conversion_rates) {
      return data.conversion_rates as Record<string, number>;
    }
    console.error('ExchangeRate API unexpected response:', data);
    return null;
  } catch (err) {
    console.error('ExchangeRate API fetch error:', err);
    return null;
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const apiKey = Deno.env.get('EXCHANGE_RATE_API_KEY') || '';

    const adminDb = createClient(supabaseUrl, serviceKey);

    // Authenticate caller
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    let isAdmin = false;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await adminDb.auth.getUser(token);
      userId = user?.id || null;

      if (userId) {
        const { data: roleData } = await adminDb
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .eq('role', 'admin')
          .maybeSingle();
        isAdmin = !!roleData;
      }
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'get_rates';

    // ── get_rates: Return all cached rates ──────────────────────
    if (action === 'get_rates') {
      // Check if rates are fresh (within TTL)
      const { data: cachedRates } = await adminDb
        .from('exchange_rates')
        .select('target_currency, rate, fetched_at, expires_at, source')
        .eq('base_currency', BASE_CURRENCY)
        .order('target_currency');

      const now = new Date();
      const hasExpired = !cachedRates?.length ||
        cachedRates.some(r => new Date(r.expires_at) < now);

      let rates: Record<string, number> = {};
      let source = 'cache';
      let lastUpdated = cachedRates?.[0]?.fetched_at || null;

      if (hasExpired && apiKey) {
        // Refresh from API
        const liveRates = await fetchLiveRates(apiKey);
        if (liveRates) {
          source = 'live';
          rates = liveRates;
          lastUpdated = new Date().toISOString();

          // Upsert into exchange_rates cache
          const expiresAt = new Date(Date.now() + CACHE_TTL_MINUTES * 60 * 1000).toISOString();
          const upsertRows = Object.entries(liveRates).map(([currency, rate]) => ({
            base_currency: BASE_CURRENCY,
            target_currency: currency,
            rate,
            source: 'exchangerate-api',
            fetched_at: lastUpdated,
            expires_at: expiresAt,
          }));

          // Batch upsert
          for (let i = 0; i < upsertRows.length; i += 50) {
            await adminDb
              .from('exchange_rates')
              .upsert(upsertRows.slice(i, i + 50), {
                onConflict: 'base_currency,target_currency',
              });
          }

          // Store in history (sample — record top currencies + any overriden ones)
          const historyCurrencies = [
            'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BRL',
            'ZAR', 'NGN', 'GHS', 'KES', 'UGX', 'TZS', 'AED', 'SAR',
          ];
          const historyRows = historyCurrencies
            .filter(c => liveRates[c] !== undefined)
            .map(c => ({
              base_currency: BASE_CURRENCY,
              target_currency: c,
              rate: liveRates[c],
              source: 'exchangerate-api',
              recorded_at: lastUpdated,
            }));

          if (historyRows.length > 0) {
            await adminDb.from('exchange_rate_history').insert(historyRows);
          }
        } else {
          // API failed — use cached or fallback
          source = 'fallback';
          rates = cachedRates?.length
            ? Object.fromEntries(cachedRates.map(r => [r.target_currency, Number(r.rate)]))
            : { ...FALLBACK_RATES };
        }
      } else if (cachedRates?.length) {
        // Cache still fresh
        rates = Object.fromEntries(cachedRates.map(r => [r.target_currency, Number(r.rate)]));
      } else {
        // No cache, no API key → use fallback
        source = 'fallback';
        rates = { ...FALLBACK_RATES };
      }

      // Apply admin overrides on top
      const { data: overrides } = await adminDb
        .from('admin_rate_overrides')
        .select('target_currency, override_rate')
        .eq('base_currency', BASE_CURRENCY)
        .eq('active', true)
        .or('effective_until.is.null,effective_until.gt.' + new Date().toISOString());

      const appliedOverrides: string[] = [];
      if (overrides?.length) {
        for (const ov of overrides) {
          rates[ov.target_currency] = Number(ov.override_rate);
          appliedOverrides.push(ov.target_currency);
        }
      }

      return json({
        base: BASE_CURRENCY,
        rates,
        source,
        lastUpdated,
        overrides: appliedOverrides,
        cacheTTL: CACHE_TTL_MINUTES,
      });
    }

    // ── get_rate: Single pair ───────────────────────────────────
    if (action === 'get_rate') {
      const from = (body.from || BASE_CURRENCY).toUpperCase();
      const to = (body.to || BASE_CURRENCY).toUpperCase();

      if (from === to) {
        return json({ from, to, rate: 1, source: 'identity' });
      }

      // Check admin override first
      const { data: override } = await adminDb
        .from('admin_rate_overrides')
        .select('override_rate')
        .eq('base_currency', from)
        .eq('target_currency', to)
        .eq('active', true)
        .or('effective_until.is.null,effective_until.gt.' + new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (override) {
        return json({ from, to, rate: Number(override.override_rate), source: 'admin_override' });
      }

      // Check cache
      const { data: cached } = await adminDb
        .from('exchange_rates')
        .select('rate, fetched_at, source')
        .eq('base_currency', from)
        .eq('target_currency', to)
        .maybeSingle();

      if (cached) {
        return json({ from, to, rate: Number(cached.rate), source: cached.source, fetchedAt: cached.fetched_at });
      }

      // Cross-rate via USD
      if (from !== BASE_CURRENCY && to !== BASE_CURRENCY) {
        const { data: fromRate } = await adminDb
          .from('exchange_rates')
          .select('rate')
          .eq('base_currency', BASE_CURRENCY)
          .eq('target_currency', from)
          .maybeSingle();

        const { data: toRate } = await adminDb
          .from('exchange_rates')
          .select('rate')
          .eq('base_currency', BASE_CURRENCY)
          .eq('target_currency', to)
          .maybeSingle();

        if (fromRate && toRate) {
          const crossRate = Number(toRate.rate) / Number(fromRate.rate);
          return json({ from, to, rate: crossRate, source: 'cross_rate' });
        }
      }

      // Fallback
      const fallbackRate = (FALLBACK_RATES[to] || 1) / (FALLBACK_RATES[from] || 1);
      return json({ from, to, rate: fallbackRate, source: 'fallback' });
    }

    // ── convert: Convert amount ─────────────────────────────────
    if (action === 'convert') {
      const amount = Number(body.amount) || 0;
      const from = (body.from || BASE_CURRENCY).toUpperCase();
      const to = (body.to || BASE_CURRENCY).toUpperCase();

      if (from === to) {
        return json({ originalAmount: amount, convertedAmount: amount, from, to, rate: 1 });
      }

      // Use the DB function for consistency
      const { data, error } = await adminDb.rpc('get_exchange_rate', {
        p_base: from,
        p_target: to,
      });

      const rate = data ? Number(data) : (FALLBACK_RATES[to] || 1) / (FALLBACK_RATES[from] || 1);
      const converted = Math.round(amount * rate * 100) / 100;

      return json({
        originalAmount: amount,
        convertedAmount: converted,
        from,
        to,
        rate,
        rateDate: new Date().toISOString(),
      });
    }

    // ── refresh: Force refresh rates ────────────────────────────
    if (action === 'refresh') {
      if (!apiKey) {
        return json({ error: 'EXCHANGE_RATE_API_KEY not configured' }, 400);
      }

      const liveRates = await fetchLiveRates(apiKey);
      if (!liveRates) {
        return json({ error: 'Failed to fetch live rates' }, 502);
      }

      const now = new Date().toISOString();
      const expiresAt = new Date(Date.now() + CACHE_TTL_MINUTES * 60 * 1000).toISOString();

      const upsertRows = Object.entries(liveRates).map(([currency, rate]) => ({
        base_currency: BASE_CURRENCY,
        target_currency: currency,
        rate,
        source: 'exchangerate-api',
        fetched_at: now,
        expires_at: expiresAt,
      }));

      for (let i = 0; i < upsertRows.length; i += 50) {
        await adminDb
          .from('exchange_rates')
          .upsert(upsertRows.slice(i, i + 50), {
            onConflict: 'base_currency,target_currency',
          });
      }

      // Store history snapshot
      const historyRows = Object.entries(liveRates).map(([currency, rate]) => ({
        base_currency: BASE_CURRENCY,
        target_currency: currency,
        rate,
        source: 'exchangerate-api',
        recorded_at: now,
      }));

      for (let i = 0; i < historyRows.length; i += 50) {
        await adminDb.from('exchange_rate_history').insert(historyRows.slice(i, i + 50));
      }

      return json({
        message: 'Rates refreshed successfully',
        count: Object.keys(liveRates).length,
        fetchedAt: now,
        expiresAt,
      });
    }

    // ── set_override: Admin set rate override ───────────────────
    if (action === 'set_override') {
      if (!isAdmin) {
        return json({ error: 'Admin access required' }, 403);
      }

      const target = (body.target || '').toUpperCase();
      const rate = Number(body.rate);
      const reason = body.reason || '';
      const effectiveUntil = body.effective_until || null;

      if (!target || !rate || rate <= 0) {
        return json({ error: 'target and rate (>0) are required' }, 400);
      }

      // Deactivate existing override for this pair
      await adminDb
        .from('admin_rate_overrides')
        .update({ active: false, updated_at: new Date().toISOString() })
        .eq('base_currency', BASE_CURRENCY)
        .eq('target_currency', target)
        .eq('active', true);

      // Insert new override
      const { data, error } = await adminDb
        .from('admin_rate_overrides')
        .insert({
          base_currency: BASE_CURRENCY,
          target_currency: target,
          override_rate: rate,
          reason,
          set_by: userId,
          active: true,
          effective_until: effectiveUntil,
        })
        .select()
        .single();

      if (error) {
        return json({ error: error.message }, 500);
      }

      // Also record in history
      await adminDb.from('exchange_rate_history').insert({
        base_currency: BASE_CURRENCY,
        target_currency: target,
        rate,
        source: 'admin_override',
        recorded_at: new Date().toISOString(),
      });

      return json({ message: `Override set for ${BASE_CURRENCY}→${target}`, override: data });
    }

    // ── remove_override: Admin remove rate override ─────────────
    if (action === 'remove_override') {
      if (!isAdmin) {
        return json({ error: 'Admin access required' }, 403);
      }

      const target = (body.target || '').toUpperCase();
      if (!target) {
        return json({ error: 'target currency required' }, 400);
      }

      await adminDb
        .from('admin_rate_overrides')
        .update({ active: false, updated_at: new Date().toISOString() })
        .eq('base_currency', BASE_CURRENCY)
        .eq('target_currency', target)
        .eq('active', true);

      return json({ message: `Override removed for ${BASE_CURRENCY}→${target}` });
    }

    // ── get_overrides: List all active admin overrides ───────────
    if (action === 'get_overrides') {
      const { data: overrides } = await adminDb
        .from('admin_rate_overrides')
        .select('*')
        .eq('base_currency', BASE_CURRENCY)
        .eq('active', true)
        .order('target_currency');

      return json({ overrides: overrides || [] });
    }

    // ── get_history: Rate history for a pair ────────────────────
    if (action === 'get_history') {
      const target = (body.target || 'EUR').toUpperCase();
      const days = Math.min(Number(body.days) || 30, 365);

      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      const { data: history } = await adminDb
        .from('exchange_rate_history')
        .select('rate, source, recorded_at')
        .eq('base_currency', BASE_CURRENCY)
        .eq('target_currency', target)
        .gte('recorded_at', since)
        .order('recorded_at', { ascending: true });

      return json({
        base: BASE_CURRENCY,
        target,
        days,
        history: history || [],
      });
    }

    return json({ error: `Unknown action: ${action}` }, 400);

  } catch (err) {
    console.error('exchange-rates error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
});
