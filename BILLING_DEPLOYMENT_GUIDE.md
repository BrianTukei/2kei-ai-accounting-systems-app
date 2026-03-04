# Production Billing System — Deployment Guide

> Complete setup guide for the 2K AI Accounting Systems billing infrastructure.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Stripe Setup](#stripe-setup)
3. [Database Migration](#database-migration)
4. [Edge Functions Deployment](#edge-functions-deployment)
5. [Environment Variables](#environment-variables)
6. [Webhook Configuration](#webhook-configuration)
7. [Testing Checklist](#testing-checklist)
8. [Go-Live Checklist](#go-live-checklist)

---

## Architecture Overview

```
User → Billing Page → stripe-checkout Edge Function → Stripe Checkout Session
                                                         ↓
Stripe Dashboard ← stripe-webhook Edge Function ← Stripe Webhook Events
         ↓
   subscriptions table (Supabase) → OrganizationContext → SubscriptionGuard
```

**Key components:**

| Component | Path | Purpose |
|-----------|------|---------|
| Plans config | `src/lib/plans.ts` | Single source of truth for plan definitions |
| Stripe Checkout | `supabase/functions/stripe-checkout/` | Creates Stripe checkout sessions |
| Stripe Webhook | `supabase/functions/stripe-webhook/` | Processes all Stripe events |
| Usage Tracking | `src/services/usageTracking.ts` | Tracks metered feature usage |
| Billing Hook | `src/hooks/useBilling.ts` | Frontend billing state management |
| Billing Page | `src/pages/Billing.tsx` | User-facing subscription management |
| Billing Dashboard | `src/components/dashboard/BillingDashboard.tsx` | Usage & plan summary card |
| Subscription Guard | `src/components/SubscriptionGuard.tsx` | Route/feature gating by plan |
| Admin Panel | `src/components/admin/AdminBillingPanel.tsx` | Admin billing management |
| DB Migration | `supabase/migrations/20260305000001_billing_system_upgrade.sql` | Schema upgrades |

---

## Stripe Setup

### 1. Create Products & Prices

In [Stripe Dashboard → Products](https://dashboard.stripe.com/products):

**Pro Plan:**
- Name: `2K AI Pro`
- Monthly price: $29/month (recurring)
- Annual price: $290/year (recurring) — ~$24.17/mo equivalent
- Copy the `price_xxx` IDs

**Enterprise Plan:**
- Name: `2K AI Enterprise`
- Monthly price: $79/month (recurring)
- Annual price: $790/year (recurring) — ~$65.83/mo equivalent
- Copy the `price_xxx` IDs

### 2. Configure Customer Portal

In [Stripe Dashboard → Settings → Customer Portal](https://dashboard.stripe.com/settings/billing/portal):

- ✅ Allow customers to update payment methods
- ✅ Allow customers to view invoices
- ✅ Allow customers to cancel subscriptions
- ✅ Allow customers to switch plans
- Save the portal configuration

### 3. Create Webhook Endpoint

In [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks):

- Endpoint URL: `https://<your-project-ref>.supabase.co/functions/v1/stripe-webhook`
- Events to listen for:
  - `checkout.session.completed`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
  - `customer.subscription.deleted`
  - `customer.subscription.updated`
  - `customer.subscription.trial_will_end`
- Copy the webhook signing secret (`whsec_xxx`)

---

## Database Migration

Run the billing system migration:

```bash
# If using Supabase CLI
supabase db push

# Or apply directly in Supabase SQL Editor:
# Copy contents of supabase/migrations/20260305000001_billing_system_upgrade.sql
```

This migration:
- Adds subscription fields to `profiles` table (stripe IDs, trial dates, usage counters)
- Extends `subscriptions` table with usage tracking and payment method fields
- Extends `subscription_plans` with storage/report limits and Stripe price IDs
- Creates `usage_events` table for metered billing
- Creates `admin_billing_overrides` table for admin audit trail
- Creates `webhook_events` table for idempotent event processing
- Adds database functions: `get_org_usage_counts()`, `check_usage_limit()`, `reset_monthly_usage()`, `admin_billing_overview()`
- Upserts production plan data
- Adds RLS policies
- Adds auto-expire trial trigger

---

## Edge Functions Deployment

```bash
# Deploy all functions
supabase functions deploy stripe-checkout --no-verify-jwt
supabase functions deploy stripe-webhook --no-verify-jwt
supabase functions deploy activate-subscription --no-verify-jwt

# Note: stripe-checkout performs its own JWT validation
# stripe-webhook validates via Stripe signature
```

---

## Environment Variables

### Supabase Edge Function Secrets

Set these via Supabase Dashboard → Edge Functions → Secrets, or CLI:

```bash
supabase secrets set \
  STRIPE_SECRET_KEY=sk_live_... \
  STRIPE_WEBHOOK_SECRET=whsec_... \
  STRIPE_PRICE_PRO_MONTHLY=price_... \
  STRIPE_PRICE_PRO_ANNUAL=price_... \
  STRIPE_PRICE_ENTERPRISE_MONTHLY=price_... \
  STRIPE_PRICE_ENTERPRISE_ANNUAL=price_... \
  FLUTTERWAVE_SECRET_KEY=FLWSECK_... \
  OWNER_MOMO_NUMBER=256753634290
```

### Frontend Environment (`.env.local`)

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_APP_URL=https://briantukei-2kei-ai-accounting-systems-app.onrender.com
VITE_STRIPE_PRICE_PRO_MONTHLY=price_...
VITE_STRIPE_PRICE_PRO_ANNUAL=price_...
VITE_STRIPE_PRICE_ENTERPRISE_MONTHLY=price_...
VITE_STRIPE_PRICE_ENTERPRISE_ANNUAL=price_...
```

---

## Webhook Configuration

### Webhook Flow

```
Stripe Event → stripe-webhook Edge Function
  1. Verify signature (STRIPE_WEBHOOK_SECRET)
  2. Check idempotency (webhook_events table)
  3. Process event:
     - checkout.session.completed → Activate subscription
     - invoice.payment_succeeded → Renew + reset usage
     - invoice.payment_failed → Mark past_due
     - customer.subscription.deleted → Downgrade to free
     - customer.subscription.updated → Sync status/period
     - customer.subscription.trial_will_end → Log warning
  4. Auto-settle to owner's MoMo wallet (Flutterwave Transfer)
```

### Retry Policy

Stripe retries failed webhooks up to 3 times. Our webhook handler:
- Returns 200 for successfully processed events
- Returns 200 for duplicate events (idempotent)
- Returns 400 for signature verification failures
- Returns 500 for unexpected errors (Stripe will retry)

---

## Testing Checklist

### Stripe Test Mode

Use test keys (`pk_test_...`, `sk_test_...`) first:

- [ ] **New subscription**: Free → Pro monthly upgrade
- [ ] **Annual billing**: Free → Enterprise annual
- [ ] **Free trial**: 7-day trial starts with card on file
- [ ] **Trial expiry**: Subscription converts after trial ends
- [ ] **Payment failure**: Invoice fails → status becomes `past_due`
- [ ] **Subscription cancel**: Cancel at period end works correctly
- [ ] **Subscription reactivate**: Reactivate before period end
- [ ] **Plan change**: Pro → Enterprise upgrade mid-cycle
- [ ] **Webhook idempotency**: Same event processed only once
- [ ] **Usage tracking**: Invoice creation increments counter
- [ ] **Usage limits**: Free plan stops at limit (5 invoices/mo)
- [ ] **Admin override**: Manually activate/cancel subscription
- [ ] **Billing dashboard**: Shows correct plan, usage, payment method
- [ ] **SubscriptionGuard**: Blocks premium features for free users
- [ ] **Trial countdown**: Shows remaining trial days
- [ ] **Past due banner**: Shows payment failed warning

### Test Card Numbers

| Card | Number | Result |
|------|--------|--------|
| Success | 4242 4242 4242 4242 | Payment succeeds |
| Decline | 4000 0000 0000 0002 | Payment declined |
| SCA Required | 4000 0027 6000 3184 | 3D Secure required |
| Insufficient | 4000 0000 0000 9995 | Insufficient funds |

---

## Go-Live Checklist

### Pre-Launch

- [ ] Switch from Stripe test keys to live keys
- [ ] Create production products/prices in Stripe Dashboard
- [ ] Update all price IDs in environment variables
- [ ] Configure production webhook endpoint
- [ ] Run database migration on production Supabase
- [ ] Deploy Edge Functions to production
- [ ] Verify webhook signature in production
- [ ] Test with real card in production (refund afterward)

### Security

- [ ] STRIPE_SECRET_KEY is only in Edge Function secrets (never in frontend)
- [ ] STRIPE_WEBHOOK_SECRET is set and webhook verifies signatures
- [ ] RLS policies active on subscriptions, billing_events, usage_events tables
- [ ] Admin routes check for admin role
- [ ] No test keys in production environment
- [ ] CORS configured for production domain only

### Monitoring

- [ ] Stripe Dashboard → Developers → Events: Check for failed webhooks
- [ ] Supabase Dashboard → Edge Functions → Logs: Monitor function errors
- [ ] Set up Stripe email alerts for failed payments
- [ ] Monitor `webhook_events` table for processing errors
- [ ] Monitor `billing_events` table for revenue tracking

### Post-Launch

- [ ] Verify first real subscription activates correctly
- [ ] Verify trial starts and countdown displays properly
- [ ] Verify cancellation flow works end-to-end
- [ ] Verify admin billing panel shows accurate data
- [ ] Set up monthly revenue reporting from `billing_events`
