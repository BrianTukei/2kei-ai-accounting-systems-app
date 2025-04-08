
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
    
    return trackSystemChange(
      currentUser.id,
      currentUser.name,
      actionType,
      "payroll",
      entityId,
      description
    );
  };
  
  // Create a singleton-like functionality to expose methods without rendering
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
