import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, ArrowRight, Sparkles } from 'lucide-react';
import { PLANS, PLAN_ORDER } from '@/lib/plans';
import type { PlanId } from '@/lib/plans';

const featureLabels: Record<string, string> = {
  hasAiAssistant: 'AI Assistant',
  hasAdvancedReports: 'Advanced Reports',
  hasPayroll: 'Payroll Management',
  hasTeamAccess: 'Team Collaboration',
};

export default function PricingSection() {
  return (
    <section id="pricing" className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 animate-on-scroll opacity-0">
            <span className="gradient-text">Invest Pennies,</span> Save Thousands
          </h2>
          <p className="text-lg text-muted-foreground animate-on-scroll opacity-0">
            Every plan pays for itself in the first month. Start free, upgrade when you're ready to dominate.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {PLAN_ORDER.map((planId: PlanId, idx) => {
            const plan = PLANS[planId];
            const isHighlighted = plan.highlighted;

            return (
              <div
                key={plan.id}
                className={`relative glass-card p-8 flex flex-col animate-on-scroll opacity-0 transition-all duration-300 hover:-translate-y-1 ${
                  isHighlighted
                    ? 'ring-2 ring-primary shadow-xl scale-[1.03]'
                    : 'hover:shadow-lg'
                }`}
                style={{ animationDelay: `${0.12 * idx}s` }}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-primary to-accent px-4 py-1 text-xs font-semibold text-white shadow-md">
                    <Sparkles className="w-3 h-3" />
                    {plan.badge}
                  </span>
                )}

                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-5">{plan.description}</p>

                <div className="mb-6">
                  <span className="text-4xl font-extrabold">
                    ${plan.priceMonthly}
                  </span>
                  <span className="text-muted-foreground">/mo</span>
                  {plan.priceAnnual > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      or ${plan.priceAnnual}/yr (save ${plan.priceMonthly * 12 - plan.priceAnnual})
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    {plan.maxUsers === -1 ? 'Unlimited' : plan.maxUsers} user{plan.maxUsers !== 1 ? 's' : ''}
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    {plan.maxInvoicesPerMonth === -1 ? 'Unlimited' : plan.maxInvoicesPerMonth} invoices/mo
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    {plan.maxAiChatsPerMonth === -1 ? 'Unlimited' : plan.maxAiChatsPerMonth} AI chats/mo
                  </li>
                  {Object.entries(featureLabels).map(([key, label]) => {
                    const has = plan[key as keyof typeof plan];
                    if (!has) return null;
                    return (
                      <li key={key} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        {label}
                      </li>
                    );
                  })}
                  {plan.trialDays > 0 && (
                    <li className="flex items-center gap-2 text-sm text-primary font-medium">
                      <Check className="w-4 h-4 text-primary shrink-0" />
                      {plan.trialDays}-day free trial
                    </li>
                  )}
                </ul>

                <Button
                  asChild
                  size="lg"
                  className={`w-full rounded-full ${
                    isHighlighted
                      ? 'bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 border-0 shadow-elegant'
                      : ''
                  }`}
                  variant={isHighlighted ? 'default' : 'outline'}
                >
                  <Link to="/auth?action=signup">
                    {plan.priceMonthly === 0 ? '🎉 Subscribe Free Now' : '🚀 Start Free Trial — No Risk'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
