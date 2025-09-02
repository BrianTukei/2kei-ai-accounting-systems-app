
import { useEffect } from 'react';
import { trackSystemChange } from '@/utils/adminUtils';

// Component to track payroll actions
export default function PayrollActionTracker() {
  const trackPayrollAction = (
    actionType: "create" | "update" | "delete",
    entityId: string,
    description: string
  ) => {
    // In a real application, we would get the current user from auth context
    const currentUser = JSON.parse(localStorage.getItem('user') || '{"id":"guest","name":"Guest User"}');
    
    const actionMap = {
      "create": "CREATE" as const,
      "update": "UPDATE" as const,
      "delete": "DELETE" as const
    };
    
    return trackSystemChange(
      currentUser.id,
      actionMap[actionType],
      "payroll",
      entityId,
      description
    );
  };
  
  useEffect(() => {
    // Initialize the tracker when component is mounted
    if (typeof window !== 'undefined' && !window.payrollTracker) {
      window.payrollTracker = {
        trackCreate: (entityId: string, description: string) => 
          trackPayrollAction("create", entityId, description),
        trackUpdate: (entityId: string, description: string) => 
          trackPayrollAction("update", entityId, description),
        trackDelete: (entityId: string, description: string) => 
          trackPayrollAction("delete", entityId, description)
      };
    }
    
    return () => {
      // Clean up if component unmounts (not typically needed in this case)
    };
  }, []);
  
  // This component doesn't render anything
  return null;
}

// Add to window interface
declare global {
  interface Window {
    payrollTracker?: {
      trackCreate: (entityId: string, description: string) => any;
      trackUpdate: (entityId: string, description: string) => any;
      trackDelete: (entityId: string, description: string) => any;
    };
  }
}
