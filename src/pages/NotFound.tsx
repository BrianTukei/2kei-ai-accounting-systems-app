
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import PageLayout from '@/components/layout/PageLayout';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <PageLayout 
      title="Page not found" 
      subtitle="Sorry, we couldn't find the page you're looking for."
      showSidebar={false}
      requireAuth={false}
      className="min-h-screen flex flex-col items-center justify-center"
    >
      <div className="w-full max-w-md text-center">
        <div className="mb-6 glass-card rounded-full w-24 h-24 flex items-center justify-center mx-auto">
          <span className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-blue-500">
            404
          </span>
        </div>
        
        <Button asChild className="rounded-full animate-fade-up">
          <a href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return to Home
          </a>
        </Button>
      </div>
    </PageLayout>
  );
};

export default NotFound;
