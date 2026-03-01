
import { Link } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';

export default function Terms() {
  return (
    <PageLayout 
      title="Terms of Service" 
      subtitle={`Last updated: ${new Date().toLocaleDateString()}`}
      showSidebar={false}
      requireAuth={false}
    >
      
      <div className="space-y-6 text-slate-700">
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
          <p>
            By accessing or using 2K AI Accounting Systems, you agree to be bound by these Terms of Service. If you disagree 
            with any part of the terms, you may not access the service.
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
          <p>
            2K AI Accounting Systems provides personal finance management tools to help users track expenses, income, and generate 
            financial reports. The service is provided "as is" and "as available" without warranties of any kind.
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-3">3. User Accounts</h2>
          <p>
            When you create an account with us, you must provide accurate and complete information. You are responsible 
            for safeguarding the password and for all activities that occur under your account.
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-3">4. Data Privacy</h2>
          <p>
            Our data practices are outlined in our <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>. 
            By using 2K AI Accounting Systems, you agree to our collection and use of information in accordance with this policy.
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-3">5. Termination</h2>
          <p>
            We may terminate or suspend access to our service immediately, without prior notice, for conduct that 
            we determine to be in violation of these Terms or otherwise harmful to the service or other users.
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-3">6. Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. We will provide notice of any significant changes 
            by posting the new Terms on this page and updating the "last updated" date.
          </p>
        </section>
      </div>
    </PageLayout>
  );
}
