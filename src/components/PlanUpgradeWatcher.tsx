import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useOrganization } from '@/contexts/OrganizationContext';

const KEY = 'pendingFeaturePath';
const RANK: Record<string, number> = { free: 0, pro: 1, enterprise: 2 };

/** Remember which locked feature the user tapped, so it opens the moment their plan upgrades. */
export const rememberFeature = (path: string) => {
  try { sessionStorage.setItem(KEY, path); } catch { /* ignore */ }
};
const takeFeature = (): string | null => {
  try { const v = sessionStorage.getItem(KEY); sessionStorage.removeItem(KEY); return v; } catch { return null; }
};

/**
 * Watches the SAVED plan. When it goes up (Free→Pro, Pro→Enterprise) it shows the success message and
 * opens the feature the user wanted. It never reacts to URL params, localStorage or demo flags.
 */
export default function PlanUpgradeWatcher() {
  const { plan, loading, subscription } = useOrganization();
  const navigate = useNavigate();
  const prev = useRef<number | null>(null);

  useEffect(() => {
    if (loading || !subscription) return;
    const rank = RANK[plan.id] ?? 0;
    if (prev.current !== null && rank > prev.current) {
      toast.success(`You're now on the ${plan.name} plan. Your new features are unlocked.`, { id: 'plan-upgraded', duration: 5000 });
      const target = takeFeature();
      navigate(target && target !== '/billing' ? target : '/dashboard', { replace: true });
    }
    prev.current = rank;
  }, [plan.id, plan.name, loading, subscription, navigate]);

  return null;
}