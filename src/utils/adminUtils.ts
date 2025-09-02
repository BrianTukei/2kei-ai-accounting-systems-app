
import { v4 as uuidv4 } from 'uuid';
import { SystemChangeLog, UserComplaint } from '@/types/PayrollData';

// Track system changes
export const trackSystemChange = (
  adminId: string,
  action: "CREATE" | "UPDATE" | "DELETE",
  entityType: "employee" | "payroll" | "user" | "setting",
  entityId: string,
  description: string
) => {
  try {
    const changeLog: SystemChangeLog = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      adminId,
      action,
      entityType,
      entityId,
      description
    };
    
    const existingLogs = localStorage.getItem('systemChangeLogs');
    const logs = existingLogs ? JSON.parse(existingLogs) : [];
    
    logs.unshift(changeLog); // Add to beginning of array
    
    // Limit to 500 most recent logs
    if (logs.length > 500) {
      logs.splice(500);
    }
    
    localStorage.setItem('systemChangeLogs', JSON.stringify(logs));
    console.log(`System change logged: ${action} ${entityType} by ${adminId}`);
    
    return changeLog;
  } catch (error) {
    console.error('Error tracking system change:', error);
    return null;
  }
};

// Submit user complaint
export const submitUserComplaint = (
  userId: string,
  userName: string,
  userEmail: string,
  subject: string,
  message: string,
  category: "payroll" | "user-access" | "technical" | "billing" | "other" = "other",
  priority: "low" | "medium" | "high" | "critical" = "medium"
) => {
  try {
    const complaint: UserComplaint = {
      id: uuidv4(),
      userId,
      userName,
      userEmail,
      subject,
      message,
      status: "new",
      priority,
      category,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const existingComplaints = localStorage.getItem('userComplaints');
    const complaints = existingComplaints ? JSON.parse(existingComplaints) : [];
    
    complaints.unshift(complaint);
    
    localStorage.setItem('userComplaints', JSON.stringify(complaints));
    console.log(`User complaint submitted by ${userName}: ${subject}`);
    
    // Notify admin (in a real app, this would send an email or notification)
    console.log(`ADMIN NOTIFICATION: New ${priority} priority complaint submitted by ${userName}`);
    
    return complaint;
  } catch (error) {
    console.error('Error submitting user complaint:', error);
    return null;
  }
};

// Update complaint status
export const updateComplaintStatus = (
  complaintId: string,
  newStatus: "new" | "in-progress" | "resolved" | "closed",
  adminId: string,
  resolution?: string
) => {
  try {
    const existingComplaints = localStorage.getItem('userComplaints');
    if (!existingComplaints) return null;
    
    const complaints = JSON.parse(existingComplaints);
    const complaintIndex = complaints.findIndex((c: UserComplaint) => c.id === complaintId);
    
    if (complaintIndex === -1) return null;
    
    complaints[complaintIndex].status = newStatus;
    complaints[complaintIndex].updatedAt = new Date().toISOString();
    complaints[complaintIndex].assignedTo = adminId;
    
    if (newStatus === "resolved" || newStatus === "closed") {
      complaints[complaintIndex].resolution = resolution || "Issue resolved";
      complaints[complaintIndex].resolutionDate = new Date().toISOString();
    }
    
    localStorage.setItem('userComplaints', JSON.stringify(complaints));
    
    return complaints[complaintIndex];
  } catch (error) {
    console.error('Error updating complaint status:', error);
    return null;
  }
};

// Get all system changes
export const getSystemChanges = () => {
  try {
    const existingLogs = localStorage.getItem('systemChangeLogs');
    return existingLogs ? JSON.parse(existingLogs) : [];
  } catch (error) {
    console.error('Error getting system changes:', error);
    return [];
  }
};

// Get all user complaints
export const getUserComplaints = () => {
  try {
    const existingComplaints = localStorage.getItem('userComplaints');
    return existingComplaints ? JSON.parse(existingComplaints) : [];
  } catch (error) {
    console.error('Error getting user complaints:', error);
    return [];
  }
};

// Initialize system tracking storage
export const initializeAdminStorage = () => {
  if (!localStorage.getItem('systemChangeLogs')) {
    localStorage.setItem('systemChangeLogs', JSON.stringify([]));
  }
  
  if (!localStorage.getItem('userComplaints')) {
    localStorage.setItem('userComplaints', JSON.stringify([]));
  }
};
