import { Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Sarah Nakamya',
    role: 'CEO, GreenTech Solutions',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&q=80&auto=format&fit=crop',
    quote:
      '2K AI Accounting Systems completely transformed how we handle our finances. What used to take our team hours now takes minutes. The AI assistant is a game-changer.',
    rating: 5,
  },
  {
    name: 'James Ochieng',
    role: 'Founder, Savanna Logistics',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&q=80&auto=format&fit=crop',
    quote:
      'We switched from spreadsheets and never looked back. The forecasting feature alone saved us from a cash-flow crisis. Highly recommend to any growing business.',
    rating: 5,
  },
  {
    name: 'Amara Diallo',
    role: 'CFO, Horizon Retail',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&q=80&auto=format&fit=crop',
    quote:
      'The real-time reports and bank import feature cut our month-end close time in half. Our auditors love the clean, exportable statements.',
    rating: 5,
  },
  {
    name: 'Daniel Mukasa',
    role: 'Freelance Consultant',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&q=80&auto=format&fit=crop',
    quote:
      'As a solo freelancer, the Free plan gives me everything I need. Invoicing, expense tracking, and beautiful reports — all in one place.',
    rating: 5,
  },
  {
    name: 'Linda Achieng',
    role: 'Operations Manager, BuildCo',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&q=80&auto=format&fit=crop',
    quote:
      'Payroll used to be our biggest headache. Now it runs automatically each month. The team collaboration features are phenomenal too.',
    rating: 4,
  },
  {
    name: 'Patrick Tumusiime',
    role: 'Managing Director, AgroFresh',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&q=80&auto=format&fit=crop',
    quote:
      'Enterprise plan was worth every penny. Multi-business support, unlimited users, and priority AI access keep our three subsidiaries running smoothly.',
    rating: 5,
  },
];

export default function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-primary/5" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 animate-on-scroll opacity-0">
            <span className="gradient-text">Real Results</span> from Real Business Owners
          </h2>
          <p className="text-lg text-muted-foreground animate-on-scroll opacity-0">
            These business owners made the switch to 2K AI Accounting Systems — and they'll never go back. <span className="font-semibold text-foreground">Will you be next?</span>
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="glass-card glass-card-hover p-6 flex flex-col animate-on-scroll opacity-0"
              style={{ animationDelay: `${0.1 * idx}s` }}
            >
              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < t.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'
                    }`}
                  />
                ))}
              </div>

              <p className="text-sm text-muted-foreground flex-1 mb-6 leading-relaxed">
                "{t.quote}"
              </p>

              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/20"
                />
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
