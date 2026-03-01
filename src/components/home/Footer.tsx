
import { Link } from 'react-router-dom';
import { FileText, Lock } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';

const Footer = () => {
  return (
    <footer className="bg-background py-12 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0">
            <Link to="/" className="flex items-center space-x-2">
              <BrandLogo size="sm" />
              <span className="font-semibold text-lg text-foreground">2K AI Accounting Systems</span>
            </Link>
            <p className="text-sm text-muted-foreground mt-2">
              © {new Date().getFullYear()} 2K AI Accounting Systems. All rights reserved.
            </p>
          </div>
          
          <div className="flex space-x-8">
            <Link to="/terms" className="text-muted-foreground hover:text-primary text-sm flex items-center gap-1 transition-colors">
              <FileText size={14} />
              Terms
            </Link>
            <Link to="/privacy" className="text-muted-foreground hover:text-primary text-sm flex items-center gap-1 transition-colors">
              <Lock size={14} />
              Privacy
            </Link>
            <div className="text-muted-foreground text-sm flex flex-col items-end">
              <span className="font-semibold text-foreground">Contact</span>
              <span>Phone: +256753634290</span>
              <span>Email: tukeibrian5@gmail.com</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
