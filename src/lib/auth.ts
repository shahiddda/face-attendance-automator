
// Simple authentication state management for the admin functionality
import { create } from 'zustand';

interface LeaveRequest {
  id: string;
  studentId: string;
  studentName: string;
  reason: string;
  fromDate: string;
  toDate: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

interface AuthState {
  isAdmin: boolean;
  adminUsername: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  // Track approved students
  approvedStudents: string[];
  approveStudent: (studentId: string) => void;
  revokeStudentApproval: (studentId: string) => void;
  isStudentApproved: (studentId: string) => boolean;
  // Leave requests functionality
  leaveRequests: LeaveRequest[];
  requestLeave: (studentId: string, studentName: string, reason: string, fromDate: string, toDate: string) => string;
  approveLeaveRequest: (requestId: string) => void;
  rejectLeaveRequest: (requestId: string) => void;
  getStudentLeaveRequests: (studentId: string) => LeaveRequest[];
}

// This is a simple mock implementation
// In a real-world app, you would connect this to a backend service
export const useAuth = create<AuthState>((set, get) => ({
  isAdmin: false,
  adminUsername: null,
  approvedStudents: [],
  leaveRequests: [],
  
  login: async (username: string, password: string) => {
    // Mock admin credentials - in a real app, these would be validated against a database
    const validCredentials = username === 'admin' && password === 'admin123';
    
    if (validCredentials) {
      set({ isAdmin: true, adminUsername: username });
      console.log('Admin logged in:', username);
      return true;
    }
    
    return false;
  },
  
  logout: () => {
    set({ isAdmin: false, adminUsername: null });
    console.log('Admin logged out');
  },
  
  approveStudent: (studentId: string) => {
    const currentApproved = get().approvedStudents;
    if (!currentApproved.includes(studentId)) {
      set({ approvedStudents: [...currentApproved, studentId] });
      console.log('Student approved:', studentId);
    }
  },
  
  revokeStudentApproval: (studentId: string) => {
    const currentApproved = get().approvedStudents;
    set({ 
      approvedStudents: currentApproved.filter(id => id !== studentId)
    });
    console.log('Student approval revoked:', studentId);
  },
  
  isStudentApproved: (studentId: string) => {
    return get().approvedStudents.includes(studentId);
  },
  
  // Leave request functions
  requestLeave: (studentId: string, studentName: string, reason: string, fromDate: string, toDate: string) => {
    const id = `leave_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newRequest: LeaveRequest = {
      id,
      studentId,
      studentName,
      reason,
      fromDate,
      toDate,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    const currentRequests = get().leaveRequests;
    set({ leaveRequests: [...currentRequests, newRequest] });
    console.log('Leave request created:', id);
    return id;
  },
  
  approveLeaveRequest: (requestId: string) => {
    const currentRequests = get().leaveRequests;
    const updatedRequests = currentRequests.map(req => 
      req.id === requestId ? { ...req, status: 'approved' } : req
    );
    
    set({ leaveRequests: updatedRequests });
    console.log('Leave request approved:', requestId);
  },
  
  rejectLeaveRequest: (requestId: string) => {
    const currentRequests = get().leaveRequests;
    const updatedRequests = currentRequests.map(req => 
      req.id === requestId ? { ...req, status: 'rejected' } : req
    );
    
    set({ leaveRequests: updatedRequests });
    console.log('Leave request rejected:', requestId);
  },
  
  getStudentLeaveRequests: (studentId: string) => {
    return get().leaveRequests.filter(req => req.studentId === studentId);
  }
}));
