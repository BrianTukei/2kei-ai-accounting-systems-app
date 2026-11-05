import { useNavigate } from 'react-router-dom';
import { Crown, Sparkles, User, Check, Lock } from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';

/** Shows the current plan on the dashboard. Colours follow the plan (see --plan-accent in index.css). */
export default function PlanCard() {
  const { plan, subscription, loading } = useOrganization();
  const navigate = useNavigate();
  const Icon = plan.id === 'enterprise' ? Crown : plan.id === 'pro' ? Sparkles : User;
  const items: [string, boolean][] = [
    ['AI Assistant', plan.hasAiAssistant],
    ['Bank import', plan.hasAiAssistant],
    ['Advanced reports', plan.hasAdvancedReports],
    ['Payroll', plan.hasPayroll],
    ['Team access', plan.hasTeamAccess],
  ];
  const renews = subscription?.periodEnd ? new Date(subscription.periodEnd).toLocaleDateString() : null;

  return (
    <div className="container mx-auto px-4 mb-4">
      <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--plan-accent)', background: 'var(--plan-soft)' }}>
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
                style={{ color: 'var(--plan-accent)', border: '1px solid var(--plan-accent)' }}>
            <Icon className="h-3.5 w-3.5" /> {loading ? '…' : `${plan.name} plan`}
          </span>
          <span className="text-xs text-muted-foreground">
            {plan.id === 'free' ? 'Upgrade to unlock more' : renews ? `Renews ${renews}` : subscription?.status}
          </span>
        </div>
        <ul className="mt-3 grid grid-cols-2 gap-1 text-sm sm:grid-cols-5">
          {items.map(([name, on]) => (
            <li key={name} className="flex items-center gap-1.5" style={{ opacity: on ? 1 : 0.5 }}>
              {on ? <Check className="h-3.5 w-3.5" style={{ color: 'var(--plan-accent)' }} /> : <Lock className="h-3.5 w-3.5" />} {name}
            </li>
          ))}
        </ul>
        {plan.id !== 'enterprise' && (
          <button onClick={() => navigate('/billing')} className="mt-3 w-full rounded-lg py-2 text-sm font-medium text-white"
                  style={{ background: 'var(--plan-accent)' }}>
            {plan.id === 'free' ? 'Upgrade to Pro' : 'Upgrade to Enterprise'}
          </button>
        )}
      </div>
    </div>
  );
}