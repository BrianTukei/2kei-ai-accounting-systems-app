
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-white py-12 border-t border-slate-200">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">L</span>
              </div>
              <span className="font-semibold text-lg">Ledgerly</span>
            </Link>
            <p className="text-sm text-slate-500 mt-2">
              © {new Date().getFullYear()} Ledgerly. All rights reserved.
            </p>
          </div>
          
          <div className="flex space-x-8">
            <Link to="#" className="text-slate-600 hover:text-primary text-sm">
              Terms
            </Link>
            <Link to="#" className="text-slate-600 hover:text-primary text-sm">
              Privacy
            </Link>
            <div className="text-slate-600 text-sm flex flex-col items-end">
              <span className="font-semibold">Contact</span>
              <span>Phone: +256 7536342</span>
              <span>Email: tukeibrian5@gmail.com</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
