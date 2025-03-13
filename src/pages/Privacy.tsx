
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Privacy() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link to="/" className="flex items-center gap-2">
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </Button>
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-slate-500">Last updated: {new Date().toLocaleDateString()}</p>
      </div>
      
      <div className="space-y-6 text-slate-700">
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
          <p>
            When you use 2KÉI Ledgery, we collect information that you provide directly to us, such as personal 
            details, financial data, and account credentials. We also automatically collect certain information 
            about your device and how you interact with our services.
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
          <p>
            We use the information we collect to provide, maintain, and improve our services, to process your 
            transactions, to send you technical notices and support messages, and to respond to your comments 
            and questions.
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-3">3. Data Storage</h2>
          <p>
            Your financial data is stored locally on your device. We use industry-standard security measures 
            to protect your information, but no method of transmission over the Internet or electronic storage 
            is 100% secure.
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-3">4. Sharing Your Information</h2>
          <p>
            We do not sell, trade, or otherwise transfer your personally identifiable information to outside 
            parties. This does not include trusted third parties who assist us in operating our website, 
            conducting our business, or servicing you.
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-3">5. Your Rights</h2>
          <p>
            You have the right to access, update, or delete your personal information at any time through 
            your account settings. If you wish to delete your account, please contact us for assistance.
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-3">6. Changes to This Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting 
            the new Privacy Policy on this page and updating the "last updated" date.
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-3">7. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at:
            <br />
            Email: tukeibrian5@gmail.com
            <br />
            Phone: +256753634290
          </p>
        </section>
      </div>
    </div>
  );
}
