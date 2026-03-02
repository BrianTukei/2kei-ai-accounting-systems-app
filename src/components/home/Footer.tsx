
import { Link } from 'react-router-dom';
import { FileText, Lock, Mail, Phone, ArrowUpRight } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';

const Footer = () => {
  return (
    <footer className="relative py-16 border-t border-border/50 overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-gradient-to-t from-muted/30 to-transparent" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-start">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center space-x-2.5 group">
              <BrandLogo size="sm" />
              <span className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                2K AI Accounting
              </span>
            </Link>
            <p className="text-sm text-muted-foreground mt-3 max-w-xs leading-relaxed">
              AI-powered accounting for modern businesses. Smarter decisions, faster growth.
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-10">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-4">Legal</h4>
              <ul className="space-y-3">
                <li>
                  <Link to="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5 group">
                    <FileText size={13} />
                    Terms
                    <ArrowUpRight size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5 group">
                    <Lock size={13} />
                    Privacy
                    <ArrowUpRight size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Contact */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="text-sm text-muted-foreground flex items-center gap-2">
                <Phone size={13} className="text-primary/70" />
                +256753634290
              </li>
              <li className="text-sm text-muted-foreground flex items-center gap-2">
                <Mail size={13} className="text-primary/70" />
                tukeibrian5@gmail.com
              </li>
            </ul>
          </div>
        </div>
        
        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-border/30 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} 2K AI Accounting Systems. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
