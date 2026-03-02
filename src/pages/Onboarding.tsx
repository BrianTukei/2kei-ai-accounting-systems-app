/**
 * Onboarding.tsx
 * ──────────────
 * Multi-step wizard shown once after a user signs up and
 * has no organization yet.  Guides them through:
 *
 *   Step 1 — Create company  (name, industry, country, currency)
 *   Step 2 — Set up timezone  (timezone, logo)
 *   Step 3 — Choose plan
 *   Step 4 — Invite team  (optional, skip-able)
 *   Step 5 — Done 🎉
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useCurrency, CURRENCIES as CONTEXT_CURRENCIES } from '@/contexts/CurrencyContext';
import { PLANS, PLAN_ORDER, type PlanId } from '@/lib/plans';
import { initiateCheckout, selectProvider, getDisplayPrice } from '@/services/billing';
import { processSubscription, clearActivationFlag } from '@/services/subscription';
import { sendTeamInvitation, sendLocalInvitation } from '@/services/teamInvitations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import {
  Building2, Globe, ChevronRight, Check, Zap, Users, Shield, Sparkles,
  Mail, Trash2, Copy, ArrowRight, BarChart3, FileText, Download, CheckCircle2,
  Link2, AlertTriangle, Loader2, UserPlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import BrandLogo from '@/components/BrandLogo';

// ─────────────────────────────────────────
// Constants
// ─────────────────────────────────────────

const INDUSTRIES = [
  'Agriculture', 'Construction', 'Consulting', 'E-Commerce', 'Education',
  'Finance & Accounting', 'Food & Beverage', 'Freelancing', 'Healthcare',
  'Hospitality', 'IT & Software', 'Logistics', 'Manufacturing',
  'Marketing & Media', 'NGO / Non-profit', 'Real Estate', 'Retail',
  'Transportation', 'Other',
];

const CURRENCIES = [
  { code: 'USD', label: 'US Dollar (USD)' },
  { code: 'EUR', label: 'Euro (EUR)' },
  { code: 'GBP', label: 'British Pound (GBP)' },
  { code: 'NGN', label: 'Nigerian Naira (NGN)' },
  { code: 'GHS', label: 'Ghanaian Cedi (GHS)' },
  { code: 'KES', label: 'Kenyan Shilling (KES)' },
  { code: 'ZAR', label: 'South African Rand (ZAR)' },
  { code: 'TZS', label: 'Tanzanian Shilling (TZS)' },
  { code: 'UGX', label: 'Ugandan Shilling (UGX)' },
  { code: 'EGP', label: 'Egyptian Pound (EGP)' },
  { code: 'MAD', label: 'Moroccan Dirham (MAD)' },
  { code: 'XOF', label: 'West African CFA (XOF)' },
  { code: 'CAD', label: 'Canadian Dollar (CAD)' },
  { code: 'AUD', label: 'Australian Dollar (AUD)' },
  { code: 'INR', label: 'Indian Rupee (INR)' },
];

const TIMEZONES = [
  'UTC', 'Africa/Lagos', 'Africa/Nairobi', 'Africa/Johannesburg', 'Africa/Accra',
  'Africa/Cairo', 'Africa/Casablanca', 'Africa/Dar_es_Salaam', 'Africa/Kampala',
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Dubai',
  'Asia/Kolkata', 'Asia/Singapore', 'Australia/Sydney',
];

const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia',
  'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium',
  'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria',
  'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia', 'Cameroon', 'Canada', 'Central African Republic', 'Chad',
  'Chile', 'China', 'Colombia', 'Comoros', 'Congo (DRC)', 'Congo (Republic)', 'Costa Rica', 'Croatia', 'Cuba',
  'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt',
  'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France',
  'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau',
  'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel',
  'Italy', 'Ivory Coast', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kosovo', 'Kuwait',
  'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania',
  'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania',
  'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique',
  'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria',
  'North Korea', 'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine', 'Panama',
  'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia',
  'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino',
  'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore',
  'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain',
  'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania',
  'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan',
  'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay',
  'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
];

// ─────────────────────────────────────────
// Step indicators
// ─────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Company'  },
  { id: 2, label: 'Settings' },
  { id: 3, label: 'Plan'     },
  { id: 4, label: 'Team'     },
  { id: 5, label: 'Done'     },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-1 justify-center mb-8">
      {STEPS.map((step, i) => (
        <React.Fragment key={step.id}>
          <div className="flex flex-col items-center gap-1">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all',
              step.id < current  && 'bg-indigo-600 text-white',
              step.id === current && 'bg-indigo-600 text-white ring-4 ring-indigo-100 dark:ring-indigo-900',
              step.id > current  && 'bg-slate-100 dark:bg-slate-800 text-slate-400',
            )}>
              {step.id < current ? <Check className="w-4 h-4" /> : step.id}
            </div>
            <span className={cn('text-xs hidden sm:block', step.id === current ? 'text-indigo-600 font-medium' : 'text-slate-400')}>
              {step.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={cn('h-px flex-1 mt-[-1rem]', step.id < current ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700')} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────
// Step 1 — Company details
// ─────────────────────────────────────────

interface CompanyData {
  name:     string;
  industry: string;
  country:  string;
  currency: string;
}

function StepCompany({ onNext }: { onNext: (data: CompanyData) => void }) {
  const [form, setForm] = useState<CompanyData>({
    name: '', industry: '', country: '', currency: 'USD',
  });

  const slug = form.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

  const set = (k: keyof CompanyData, v: string) => setForm((p) => ({ ...p, [k]: v }));
  const valid = form.name.trim().length >= 2 && form.currency;

  return (
    <div className="space-y-5">
      <div>
        <Label>Company / Business Name <span className="text-red-500">*</span></Label>
        <Input
          placeholder="e.g. Acme Consulting Ltd."
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          className="mt-1"
          autoFocus
        />
        {slug && (
          <p className="text-xs text-slate-400 mt-1">
            Your workspace URL: <span className="font-mono text-indigo-500">2kaiaccounting.app/<b>{slug}</b></span>
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Industry</Label>
          <Select onValueChange={(v) => set('industry', v)}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Select industry" /></SelectTrigger>
            <SelectContent className="max-h-60">
              {INDUSTRIES.map((ind) => <SelectItem key={ind} value={ind}>{ind}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Country</Label>
          <Select onValueChange={(v) => set('country', v)}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Select country" /></SelectTrigger>
            <SelectContent className="max-h-60">
              {COUNTRIES.map((country) => <SelectItem key={country} value={country}>{country}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Primary Currency <span className="text-red-500">*</span></Label>
        <Select defaultValue="USD" onValueChange={(v) => set('currency', v)}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Button type="button" className="w-full gap-2" disabled={!valid} onClick={() => onNext(form)}>
        Continue <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

// ─────────────────────────────────────────
// Step 2 — Timezone / logo
// ─────────────────────────────────────────

function StepSettings({ onNext, onBack }: { onNext: (tz: string) => void; onBack: () => void }) {
  const [tz, setTz] = useState('UTC');
  return (
    <div className="space-y-5">
      <div>
        <Label>Time Zone</Label>
        <Select defaultValue="UTC" onValueChange={setTz}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            {TIMEZONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <p className="text-xs text-slate-400 mt-1">Used for date/time display and report generation.</p>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" className="flex-1" onClick={onBack}>Back</Button>
        <Button type="button" className="flex-1 gap-2" onClick={() => onNext(tz)}>
          Continue <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Step 3 — Plan selection
// ─────────────────────────────────────────

const PLAN_ICONS = { free: Shield, pro: Zap, enterprise: Sparkles };

function StepPlan({
  orgId, email, currency, onNext, onBack,
}: {
  orgId: string; email: string; currency: string;
  onNext: (planId: PlanId) => void;
  onBack: () => void;
}) {
  const [selected, setSelected] = useState<PlanId>('free');
  const [billing, setBilling]   = useState<'monthly' | 'annual'>('monthly');
  const [loading, setLoading]   = useState(false);

  const proceed = async () => {
    console.log('[StepPlan] proceed called, selected:', selected, 'orgId:', orgId);
    
    if (selected === 'free') {
      console.log('[StepPlan] Free plan selected, proceeding directly');
      // Still persist to localStorage + DB so OrganizationContext picks it up
      await activateLocally(selected);
      onNext(selected);
      return;
    }
    
    // For paid plans, try external checkout first, fallback to local activation
    try {
      setLoading(true);
      const provider = selectProvider(currency);
      console.log('[StepPlan] Starting checkout, provider:', provider);

      // If demo provider, activate locally
      if (provider === 'demo') {
        await activateLocally(selected);
        toast.success(`${PLANS[selected].name} plan activated!`);
        onNext(selected);
        return;
      }

      const result = await initiateCheckout({
        organizationId: orgId,
        planId:         selected,
        billingCycle:   billing,
        email,
        currency,
        successUrl: `${window.location.origin}/dashboard?welcome=1&plan=${selected}&provider=${provider}`,
        cancelUrl:  `${window.location.origin}/onboarding`,
      }, provider);

      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else {
        // Inline checkout completed (e.g. Paystack popup)
        onNext(selected);
      }
    } catch (err) {
      console.warn('[StepPlan] External checkout failed, activating locally:', err);
      // Fallback: activate via demo mode so user isn't blocked
      await activateLocally(selected);
      toast.success(`${PLANS[selected].name} plan activated! (Trial mode)`);
      onNext(selected);
    } finally {
      setLoading(false);
    }
  };

  /** Activate subscription locally (demo mode) and persist to Supabase DB */
  const activateLocally = async (planId: PlanId) => {
    try {
      await processSubscription(
        orgId, 'onboarding-user', planId, billing,
        email, currency, 'demo',
      );
      clearActivationFlag();

      // Also persist to Supabase subscriptions table
      const periodEnd = new Date();
      if (billing === 'annual') periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      else periodEnd.setMonth(periodEnd.getMonth() + 1);

      await supabase.from('subscriptions').upsert({
        organization_id: orgId,
        plan_id: planId,
        status: 'active',
        billing_cycle: billing,
        current_period_start: new Date().toISOString(),
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: false,
        payment_provider: 'demo',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'organization_id' }).then(() => {
        console.log('[StepPlan] Subscription persisted to DB');
      }).catch(() => {
        console.warn('[StepPlan] DB persist failed (non-critical)');
      });
    } catch (e) {
      console.warn('[StepPlan] Local activation error (non-critical):', e);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-center gap-2 mb-2">
        {(['monthly','annual'] as const).map((cycle) => (
          <button key={cycle}
            type="button"
            className={cn('px-4 py-1.5 rounded-full text-sm font-medium border transition-all',
              billing === cycle
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300')}
            onClick={() => setBilling(cycle)}
          >
            {cycle === 'annual' ? 'Annual (save 17%)' : 'Monthly'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3">
        {PLAN_ORDER.map((planId) => {
          const plan = PLANS[planId];
          const Icon = PLAN_ICONS[planId];
          const dp = getDisplayPrice(planId, billing, currency);
          const isSelected = selected === planId;

          return (
            <div 
              key={planId}
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('[StepPlan] Plan clicked:', planId);
                setSelected(planId);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelected(planId);
                }
              }}
              className={cn(
                'rounded-xl border-2 p-4 text-left transition-all w-full cursor-pointer select-none',
                isSelected
                  ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/30'
                  : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300',
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center',
                    planId === 'free' ? 'bg-slate-100' : planId === 'pro' ? 'bg-indigo-100' : 'bg-purple-100')}>
                    <Icon className={cn('w-4 h-4', planId === 'free' ? 'text-slate-500' : planId === 'pro' ? 'text-indigo-600' : 'text-purple-600')} />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      {plan.name}
                      {plan.badge && <Badge variant="secondary" className="text-xs">{plan.badge}</Badge>}
                    </div>
                    <div className="text-xs text-slate-500">{plan.description}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900 dark:text-slate-100">
                    {dp.amount === 0 ? 'Free' : `${dp.formatted}/${billing === 'annual' ? 'yr' : 'mo'}`}
                  </div>
                  {plan.trialDays > 0 && <div className="text-xs text-indigo-500">{plan.trialDays}-day trial</div>}
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600 flex flex-wrap gap-1.5">
                {(planId === 'free'
                  ? ['10 invoices/mo', '1 user', '20 AI chats']
                  : planId === 'pro'
                  ? ['Unlimited invoices', 'Up to 5 users', '200 AI chats', 'AI assistant', 'Payroll']
                  : ['Everything in Pro', 'Unlimited users', '∞ AI chats', 'Team access', 'Priority support']
                ).map((feat) => (
                  <span key={feat} className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">{feat}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" className="flex-1" onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('[StepPlan] Back button clicked');
          onBack();
        }}>Back</Button>
        <Button 
          type="button" 
          className="flex-1 gap-2 cursor-pointer" 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('[StepPlan] Continue button clicked, selected:', selected);
            proceed();
          }} 
          disabled={loading}
        >
          {loading ? 'Processing…' : selected === 'free' ? 'Start for free' : `Start ${PLANS[selected].trialDays}-day trial`}
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Step 4 — Invite team
// ─────────────────────────────────────────

const ROLE_DESCRIPTIONS: Record<string, string> = {
  accountant: 'Full transaction & report access',
  manager:    'View transactions and reports',
  viewer:     'Read-only access',
};

interface PendingInvite {
  email:      string;
  role:       string;
  status:     'sending' | 'sent' | 'failed' | 'queued';
  acceptUrl?: string;
  emailSent?: boolean;
}

function isValidEmail(s: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s); }

function StepTeam({
  orgId, userId, orgName, selectedPlan, onNext, onBack,
}: {
  orgId: string;
  userId: string;
  orgName: string;
  selectedPlan: PlanId;
  onNext: (count: number) => void;
  onBack: () => void;
}) {
  const { user } = useAuth();
  const [email, setEmail]       = useState('');
  const [role, setRole]         = useState<'accountant' | 'manager' | 'viewer'>('viewer');
  const [loading, setLoading]   = useState(false);
  const [invited, setInvited]   = useState<PendingInvite[]>([]);
  const [emailError, setEmailError] = useState('');
  const [copiedUrl, setCopiedUrl]   = useState<string | null>(null);

  const isLocal = orgId.startsWith('local-');
  const plan = PLANS[selectedPlan];

  // Check max users limit
  const maxUsers = plan.maxUsers;
  const currentCount = invited.filter((i) => i.status !== 'failed').length + 1; // +1 for owner
  const atLimit = maxUsers !== -1 && currentCount >= maxUsers;

  const invite = async () => {
    const trimmed = email.trim().toLowerCase();

    // Validation
    if (!isValidEmail(trimmed)) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    if (trimmed === user?.email?.toLowerCase()) {
      setEmailError("You can't invite yourself — you're already the owner.");
      return;
    }
    if (invited.find((i) => i.email === trimmed && i.status !== 'failed')) {
      setEmailError('This email has already been invited.');
      return;
    }
    if (atLimit) {
      setEmailError(`Your ${plan.name} plan supports up to ${maxUsers} users. Upgrade to invite more.`);
      return;
    }

    setEmailError('');
    setLoading(true);

    // Optimistically add to list with 'sending' status
    const pendingInvite: PendingInvite = { email: trimmed, role, status: 'sending' };
    setInvited((p) => [...p, pendingInvite]);
    setEmail('');

    if (!isLocal) {
      // Real org — send via service (inserts to DB + triggers email)
      const result = await sendTeamInvitation({
        organizationId: orgId,
        email:          trimmed,
        role,
        invitedBy:      userId,
        orgName,
        invitedByName:  user?.user_metadata?.full_name || user?.email || 'A team member',
      });

      setInvited((prev) =>
        prev.map((i) =>
          i.email === trimmed
            ? {
                ...i,
                status:    result.success ? 'sent' : 'failed',
                acceptUrl: result.acceptUrl,
                emailSent: result.emailSent,
              }
            : i
        )
      );

      if (result.success) {
        if (result.emailSent) {
          toast.success(`Invitation email sent to ${trimmed}`);
        } else {
          toast.success(`Invitation created for ${trimmed}. Share the invite link manually.`);
        }
      } else {
        toast.error(result.error || `Failed to invite ${trimmed}. Try again.`);
      }
    } else {
      // Local/demo org — store in localStorage
      const localResult = sendLocalInvitation(trimmed, role);

      setInvited((prev) =>
        prev.map((i) =>
          i.email === trimmed
            ? { ...i, status: 'queued', acceptUrl: localResult.acceptUrl, emailSent: false }
            : i
        )
      );

      toast.success(`Invitation queued for ${trimmed} (demo mode)`);
    }

    setLoading(false);
  };

  const remove = (em: string) => {
    setInvited((p) => p.filter((i) => i.email !== em));
    if (isLocal) {
      const stored = JSON.parse(localStorage.getItem('2k_pending_invites') || '[]');
      localStorage.setItem('2k_pending_invites', JSON.stringify(stored.filter((i: { email: string }) => i.email !== em)));
    }
  };

  const retry = (em: string) => {
    setInvited((p) => p.filter((i) => i.email !== em));
    setEmail(em);
  };

  const copyInviteUrl = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedUrl(url);
      toast.success('Invite link copied!');
      setTimeout(() => setCopiedUrl(null), 2000);
    });
  };

  const successCount = invited.filter((i) => i.status === 'sent' || i.status === 'queued').length;

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 text-sm text-slate-500 dark:text-slate-400">
        <UserPlus className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
        <div>
          <p>Invite your accountant or team members. They'll receive an email with a link to join <strong className="text-slate-700 dark:text-slate-200">{orgName || 'your organization'}</strong>.</p>
          {maxUsers !== -1 && (
            <p className="text-xs text-slate-400 mt-1">
              Your <strong>{plan.name}</strong> plan allows up to {maxUsers} user{maxUsers !== 1 ? 's' : ''}.
              {currentCount > 1 && ` (${currentCount - 1} invited, ${Math.max(0, maxUsers - currentCount)} remaining)`}
            </p>
          )}
        </div>
      </div>

      {/* Email + Role input row */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="email"
              placeholder="colleague@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && !loading && !atLimit && invite()}
              className="pl-9"
              disabled={loading || atLimit}
              autoFocus
            />
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Select defaultValue="viewer" value={role} onValueChange={(v) => setRole(v as 'accountant' | 'manager' | 'viewer')}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="accountant">
                        <div className="flex flex-col">
                          <span>Accountant</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="manager">
                        <div className="flex flex-col">
                          <span>Manager</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="viewer">
                        <div className="flex flex-col">
                          <span>Viewer</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs max-w-48">
                {ROLE_DESCRIPTIONS[role]}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button
            type="button"
            onClick={invite}
            disabled={loading || !email.trim() || atLimit}
            className="gap-1.5"
          >
            {loading ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending</>
            ) : (
              <><UserPlus className="w-3.5 h-3.5" /> Invite</>
            )}
          </Button>
        </div>
        {emailError && (
          <div className="flex items-center gap-1.5 text-xs text-red-500">
            <AlertTriangle className="w-3 h-3 shrink-0" />
            {emailError}
          </div>
        )}
        <p className="text-xs text-slate-400">
          <strong>{role.charAt(0).toUpperCase() + role.slice(1)}:</strong> {ROLE_DESCRIPTIONS[role]}
        </p>
      </div>

      {/* Plan limit warning */}
      {atLimit && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            You've reached the {maxUsers}-user limit on the <strong>{plan.name}</strong> plan.
            Upgrade to add more team members.
          </span>
        </div>
      )}

      {/* Invited list */}
      {invited.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-slate-400 uppercase tracking-wider">
            Invited ({successCount})
          </Label>
          <ul className="space-y-2">
            {invited.map((inv) => (
              <li
                key={inv.email}
                className={cn(
                  'flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all',
                  inv.status === 'sending' && 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
                  inv.status === 'sent'    && 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
                  inv.status === 'queued'  && 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
                  inv.status === 'failed'  && 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
                )}
              >
                <div className="flex items-center gap-2 text-sm min-w-0 flex-1">
                  {inv.status === 'sending' && <Loader2 className="w-4 h-4 text-blue-500 animate-spin shrink-0" />}
                  {inv.status === 'sent'    && <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />}
                  {inv.status === 'queued'  && <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />}
                  {inv.status === 'failed'  && <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />}

                  <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{inv.email}</span>
                  <Badge variant="secondary" className="text-xs shrink-0">{inv.role}</Badge>

                  {inv.status === 'sent' && !inv.emailSent && (
                    <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 shrink-0">Link only</Badge>
                  )}
                  {inv.status === 'sent' && inv.emailSent && (
                    <Badge variant="outline" className="text-xs text-green-600 border-green-300 shrink-0">Email sent</Badge>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {/* Copy invite link button */}
                  {inv.acceptUrl && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => copyInviteUrl(inv.acceptUrl!)}
                            className="p-1 text-slate-400 hover:text-indigo-500 transition-colors"
                            title="Copy invite link"
                          >
                            {copiedUrl === inv.acceptUrl ? (
                              <Check className="w-3.5 h-3.5 text-green-500" />
                            ) : (
                              <Link2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">Copy invite link</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}

                  {/* Retry button for failed invites */}
                  {inv.status === 'failed' && (
                    <button
                      onClick={() => retry(inv.email)}
                      className="text-xs text-indigo-500 hover:text-indigo-700 font-medium px-1"
                    >
                      Retry
                    </button>
                  )}

                  {/* Remove button */}
                  {inv.status !== 'sending' && (
                    <button
                      onClick={() => remove(inv.email)}
                      className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                      title="Remove invite"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onBack(); }}
        >
          Back
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onNext(successCount); }}
        >
          Skip for now
        </Button>
        <Button
          type="button"
          className="flex-1 gap-2 cursor-pointer"
          disabled={loading}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('[StepTeam] Continue clicked, invited:', successCount);
            onNext(successCount);
          }}
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
          ) : successCount > 0 ? (
            <><>Continue ({successCount} invited)</> <ChevronRight className="w-4 h-4" /></>
          ) : (
            <>Continue <ChevronRight className="w-4 h-4" /></>
          )}
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Step 5 — Done
// ─────────────────────────────────────────

function StepDone({
  orgName, plan, inviteCount, slug, onGoToDashboard,
}: {
  orgName: string; plan: PlanId; inviteCount: number; slug: string;
  onGoToDashboard: () => void;
}) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const workspaceUrl = `https://2kaiaccounting.app/${slug}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(workspaceUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const quickActions = [
    {
      icon: <BarChart3 className="w-5 h-5 text-indigo-600" />,
      bg: 'bg-indigo-50 dark:bg-indigo-950/30',
      title: 'Add a transaction',
      desc: 'Record income or expenses',
      path: '/transactions',
    },
    {
      icon: <FileText className="w-5 h-5 text-emerald-600" />,
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      title: 'Create an invoice',
      desc: 'Send to a client in seconds',
      path: '/invoices',
    },
    {
      icon: <Download className="w-5 h-5 text-blue-600" />,
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      title: 'Import bank statement',
      desc: 'AI auto-categorises rows',
      path: '/bank-import',
    },
  ];

  const planInfo = PLANS[plan];

  return (
    <div className="space-y-5 py-2">
      {/* Success header */}
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-3">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          {orgName} is ready!
        </h3>
        <p className="text-slate-500 text-sm mt-1">
          Your accounting workspace is set up. Let's get to work.
        </p>
      </div>

      {/* Setup summary */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800">
        <div className="flex items-center justify-between px-4 py-2.5 text-sm">
          <span className="text-slate-500">Organization</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">{orgName}</span>
        </div>
        <div className="flex items-center justify-between px-4 py-2.5 text-sm">
          <span className="text-slate-500">Plan</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            {planInfo.name}
            {planInfo.badge && <Badge variant="secondary" className="text-xs">{planInfo.badge}</Badge>}
          </span>
        </div>
        <div className="flex items-center justify-between px-4 py-2.5 text-sm">
          <span className="text-slate-500">Team invites</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {inviteCount > 0 ? `${inviteCount} sent` : 'None (you can invite later)'}
          </span>
        </div>
        <div className="flex items-center justify-between px-4 py-2.5 text-sm">
          <span className="text-slate-500">Workspace URL</span>
          <button
            onClick={copyUrl}
            className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-mono text-xs font-medium transition-colors">
            {copied ? <><Check className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> {slug}</>}
          </button>
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Jump right in</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {quickActions.map((a) => (
            <button
              key={a.path}
              type="button"
              onClick={(e) => { 
                e.preventDefault(); 
                e.stopPropagation();
                // Mark onboarding complete before navigating
                localStorage.setItem('2k_onboarding_complete', 'true');
                const stored = JSON.parse(localStorage.getItem('2k_onboarding_org') || '{}');
                localStorage.setItem('2k_onboarding_org', JSON.stringify({ 
                  ...stored, 
                  onboardingComplete: true,
                  completedAt: new Date().toISOString()
                }));
                localStorage.removeItem('2k_onboarding_state');
                localStorage.removeItem('2k_pending_invites');
                // Small delay to ensure localStorage is written
                setTimeout(() => {
                  window.location.href = a.path;
                }, 100);
              }}
              className={cn(
                'rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-left transition-all cursor-pointer',
                'hover:border-indigo-300 hover:shadow-sm group',
                a.bg,
              )}>
              <div className="mb-2">{a.icon}</div>
              <div className="font-medium text-sm text-slate-800 dark:text-slate-200 group-hover:text-indigo-700 dark:group-hover:text-indigo-400">{a.title}</div>
              <div className="text-xs text-slate-400 mt-0.5">{a.desc}</div>
              <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-indigo-400 mt-1 transition-colors" />
            </button>
          ))}
        </div>
      </div>

      <Button 
        type="button" 
        className="w-full gap-2 cursor-pointer" 
        onClick={(e) => { 
          e.preventDefault(); 
          e.stopPropagation(); 
          console.log('[StepDone] Go to Dashboard clicked'); 
          onGoToDashboard(); 
        }}
      >
        <Users className="w-4 h-4" /> Go to Dashboard
      </Button>
    </div>
  );
}

// ─────────────────────────────────────────
// Main Onboarding page
// ─────────────────────────────────────────

export default function Onboarding() {
  const { user }   = useAuth();
  const { refresh } = useOrganization();
  const { setCurrency: setAppCurrency } = useCurrency();
  const navigate   = useNavigate();

  const [step,      setStep]    = useState(1);
  const [saving,    setSaving]  = useState(false);
  // Initialize orgId with a fallback to ensure steps always have an orgId
  const [orgId,     setOrgId]   = useState<string>(() => `local-${Date.now()}`);
  const [orgName,   setOrgName] = useState('');
  const [currency,  setCurrency]= useState('USD');

  // Full company form data collected across steps
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [timezone,    setTimezone]    = useState('UTC');
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('free');
  const [inviteCount,  setInviteCount]  = useState(0);
  const [orgSlug,      setOrgSlug]      = useState('');

  // ─── Restore onboarding state from localStorage on mount ────

  React.useEffect(() => {
    try {
      const savedState = localStorage.getItem('2k_onboarding_state');
      if (savedState) {
        const state = JSON.parse(savedState);
        // Only restore if it's for the same user
        if (state.userId === user?.id && state.step >= 1 && state.step <= 4) {
          setStep(state.step);
          if (state.orgId) setOrgId(state.orgId);
          if (state.orgName) setOrgName(state.orgName);
          if (state.orgSlug) setOrgSlug(state.orgSlug);
          if (state.currency) setCurrency(state.currency);
          if (state.timezone) setTimezone(state.timezone);
          if (state.selectedPlan) setSelectedPlan(state.selectedPlan);
          if (state.companyData) setCompanyData(state.companyData);
        }
      }
    } catch (e) {
      console.warn('Failed to restore onboarding state:', e);
    }
  }, [user?.id]);

  // ─── Save onboarding state to localStorage whenever it changes ────

  React.useEffect(() => {
    if (step > 1 && step < 5) {
      const state = {
        userId: user?.id,
        step,
        orgId,
        orgName,
        orgSlug,
        currency,
        timezone,
        selectedPlan,
        companyData,
      };
      localStorage.setItem('2k_onboarding_state', JSON.stringify(state));
    } else if (step === 5) {
      // Clear state when onboarding is complete
      localStorage.removeItem('2k_onboarding_state');
    }
  }, [step, orgId, orgName, orgSlug, currency, timezone, selectedPlan, companyData, user?.id]);

  const STEP_TITLES: Record<number, string> = {
    1: '🏢 Create your company',
    2: '⚙️ Account settings',
    3: '💳 Choose your plan',
    4: '👥 Invite your team',
    5: '🎉 You\'re all set!',
  };

  // ─── Step 1 → 2 ────────────────────────

  const handleCompany = (data: CompanyData) => {
    setCompanyData(data);
    setCurrency(data.currency);
    setOrgName(data.name);
    // Also update the global CurrencyContext so the entire app reflects this choice
    const matchedCurrency = CONTEXT_CURRENCIES.find(c => c.code === data.currency);
    if (matchedCurrency) {
      setAppCurrency(matchedCurrency);
    }
    setStep(2);
  };

  // ─── Step 2 → 3 ────────────────────────

  const handleSettings = async (tz: string) => {
    if (!companyData) return;
    setSaving(true);
    setTimezone(tz);

    const slug = companyData.name
      .toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') +
      '-' + Math.random().toString(36).slice(2, 6);
    setOrgSlug(slug);

    // Generate a local fallback ID in case Supabase isn't available
    const fallbackId = `local-${Date.now()}`;
    const userId = user?.id || 'demo-user';

    // If no authenticated user, use local storage only
    if (!user) {
      console.log('[Onboarding] No user, using local fallback');
      setOrgId(fallbackId);
      localStorage.setItem('2k_onboarding_org', JSON.stringify({
        id:       fallbackId,
        name:     companyData.name,
        slug,
        industry: companyData.industry || null,
        country:  companyData.country || null,
        currency: companyData.currency,
        timezone: tz,
        owner_id: userId,
      }));
      setSaving(false);
      setStep(3);
      return;
    }

    try {
      // 1. Create organization
      const { data: orgRow, error: orgErr } = await supabase
        .from('organizations')
        .insert({
          name:     companyData.name,
          slug,
          industry: companyData.industry || null,
          country:  companyData.country  || null,
          timezone: tz,
          currency: companyData.currency,
          owner_id: user.id,
        })
        .select()
        .single();

      if (orgErr) throw orgErr;

      const newOrgId = orgRow.id as string;
      setOrgId(newOrgId);

      // 2. Add owner as member
      await supabase.from('organization_users').insert({
        organization_id: newOrgId,
        user_id:         user.id,
        role:            'owner',
        invite_accepted: true,
        joined_at:       new Date().toISOString(),
      });

      // 3. Create free subscription
      await supabase.from('subscriptions').insert({
        organization_id: newOrgId,
        plan_id:         'free',
        status:          'active',
        billing_cycle:   'monthly',
      });

      // 4. Also store in localStorage for fallback/demo mode
      localStorage.setItem('2k_onboarding_org', JSON.stringify({
        id:       newOrgId,
        name:     companyData.name,
        slug,
        industry: companyData.industry || null,
        country:  companyData.country || null,
        currency: companyData.currency,
        timezone: tz,
        owner_id: user.id,
      }));

    } catch (err: unknown) {
      // Supabase tables may not be migrated yet — fall back to localStorage
      // so onboarding can still complete in local / demo environments.
      console.warn('Supabase workspace creation failed, using local fallback:', err);
      setOrgId(fallbackId);
      localStorage.setItem('2k_onboarding_org', JSON.stringify({
        id:       fallbackId,
        name:     companyData.name,
        slug,
        industry: companyData.industry || null,
        country:  companyData.country || null,
        currency: companyData.currency,
        timezone: tz,
        owner_id: user.id,
      }));
    } finally {
      setSaving(false);
      setStep(3); // Always advance — even on Supabase error
    }
  };

  // ─── Step 3 → 4 ────────────────────────

  const handlePlan = async (planId: PlanId) => {
    console.log('[Onboarding] handlePlan called with:', planId, 'orgId:', orgId);
    setSelectedPlan(planId);
    const isLocal = orgId.startsWith('local-') || import.meta.env.DEV;
    
    // For non-local orgs with paid plans, try to update Supabase
    if (!isLocal && planId !== 'free') {
      try {
        await supabase.from('subscriptions')
          .update({
            plan_id:       planId,
            status:        'trialing',
            trial_ends_at: new Date(Date.now() + 14 * 86400_000).toISOString(),
          })
          .eq('organization_id', orgId);
      } catch {
        console.warn('Could not update subscription in Supabase');
      }
    }
    
    // Always store plan in localStorage for local/demo orgs
    const stored = JSON.parse(localStorage.getItem('2k_onboarding_org') || '{}');
    localStorage.setItem('2k_onboarding_org', JSON.stringify({ ...stored, plan: planId }));
    
    // NOTE: Do NOT call refresh() here — it sets orgLoading=true in OrganizationContext,
    // which causes ProtectedRoute to show a spinner and unmount the Onboarding component.
    // The org context will be refreshed when onboarding completes and the user navigates
    // to the dashboard (handleGoToDashboard does a full page reload).
    
    console.log('[Onboarding] Setting step to 4');
    setStep(4);
  };

  // ─── Step 4 → 5 ────────────────────────

  const handleTeam = (count: number) => { setInviteCount(count); setStep(5); };
  // ─── Step 5 → Dashboard ─────────────

  const handleGoToDashboard = () => {
    console.log('[Onboarding] handleGoToDashboard called');
    
    // Mark onboarding as complete in localStorage for all orgs (ensures demo mode works)
    const stored = JSON.parse(localStorage.getItem('2k_onboarding_org') || '{}');
    
    // Ensure we have all necessary data
    const completeOrgData = { 
      ...stored,
      id: stored.id || orgId,
      name: stored.name || orgName,
      slug: stored.slug || orgSlug,
      currency: stored.currency || currency,
      timezone: stored.timezone || timezone,
      plan: stored.plan || selectedPlan,
      onboardingComplete: true,
      completedAt: new Date().toISOString()
    };
    
    console.log('[Onboarding] Storing complete org data:', completeOrgData);
    localStorage.setItem('2k_onboarding_org', JSON.stringify(completeOrgData));
    localStorage.setItem('2k_onboarding_complete', 'true');
    
    // Clear onboarding state (but keep org data)
    localStorage.removeItem('2k_onboarding_state');
    localStorage.removeItem('2k_pending_invites');
    
    // Small delay to ensure localStorage is written before navigation
    setTimeout(() => {
      // Refresh org context in background (don't block navigation)
      refresh().catch(() => { /* ignore errors */ });
      
      // Navigate to dashboard immediately using full page reload
      // This ensures AuthContext and OrganizationContext reload properly
      window.location.href = '/dashboard';
    }, 100);
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-3">
            <BrandLogo size="lg" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">2K AI Accounting Systems</h1>
          <p className="text-slate-500 text-sm mt-1">Set up your accounting workspace in minutes</p>
        </div>

        <StepIndicator current={step} />

        <Card className="shadow-lg border-slate-200 dark:border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{STEP_TITLES[step]}</CardTitle>
          </CardHeader>
          <CardContent>
            {step === 1 && <StepCompany onNext={handleCompany} />}
            {step === 2 && (
              saving
                ? <div className="text-center py-8 text-slate-400">Creating your workspace…</div>
                : <StepSettings onNext={handleSettings} onBack={() => setStep(1)} />
            )}
            {step === 3 && (
              <StepPlan
                orgId={orgId}
                email={user?.email ?? ''}
                currency={currency}
                onNext={handlePlan}
                onBack={() => setStep(2)}
              />
            )}
            {step === 4 && (
              <StepTeam 
                orgId={orgId} 
                userId={user?.id ?? 'demo-user'}
                orgName={orgName}
                selectedPlan={selectedPlan}
                onNext={handleTeam} 
                onBack={() => setStep(3)} 
              />
            )}
            {step === 5 && (
              <StepDone
                orgName={orgName}
                plan={selectedPlan}
                inviteCount={inviteCount}
                slug={orgSlug}
                onGoToDashboard={handleGoToDashboard}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
