/**
 * Public "Book a Demo" form.
 * Place on marketing page or route /book-demo
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Calendar, Loader2 } from 'lucide-react';

const API_BASE =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' ? window.location.origin : '');

export default function BookDemoForm() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    company: '',
    phone: '',
    preferred_date: '',
    preferred_time: '',
    message: '',
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.email.trim()) {
      toast.error('Name and email are required');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/demo-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, source: 'web' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      setDone(true);
      toast.success('Demo request sent — we will contact you soon');
    } catch (err: any) {
      toast.error(err.message || 'Could not submit');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-xl border bg-card p-6 text-center space-y-2">
        <Calendar className="h-10 w-10 mx-auto text-primary" />
        <h3 className="text-lg font-semibold">Request received</h3>
        <p className="text-sm text-muted-foreground">
          Thanks {form.full_name}. Our team will reach out at {form.email}.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-xl border bg-card p-6 space-y-4 max-w-lg">
      <div className="flex items-center gap-2 mb-2">
        <Calendar className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Book a Demo</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        See 2K AI Accounting Systems in action. We’ll confirm a time by email.
      </p>

      <div className="grid gap-2">
        <Label htmlFor="full_name">Full name *</Label>
        <Input
          id="full_name"
          value={form.full_name}
          onChange={(e) => set('full_name', e.target.value)}
          required
          placeholder="Jane Doe"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="email">Work email *</Label>
        <Input
          id="email"
          type="email"
          value={form.email}
          onChange={(e) => set('email', e.target.value)}
          required
          placeholder="jane@company.com"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="company">Company</Label>
        <Input
          id="company"
          value={form.company}
          onChange={(e) => set('company', e.target.value)}
          placeholder="Acme Ltd"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          value={form.phone}
          onChange={(e) => set('phone', e.target.value)}
          placeholder="+256 700 000000"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label htmlFor="preferred_date">Preferred date</Label>
          <Input
            id="preferred_date"
            type="date"
            value={form.preferred_date}
            onChange={(e) => set('preferred_date', e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="preferred_time">Preferred time</Label>
          <Input
            id="preferred_time"
            value={form.preferred_time}
            onChange={(e) => set('preferred_time', e.target.value)}
            placeholder="10:00 EAT"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          value={form.message}
          onChange={(e) => set('message', e.target.value)}
          placeholder="What would you like to see in the demo?"
          rows={3}
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Sending…
          </>
        ) : (
          'Request demo'
        )}
      </Button>
    </form>
  );
}
