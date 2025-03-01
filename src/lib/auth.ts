
// Simple authentication state management for the admin functionality
import { create } from 'zustand';

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
}

// This is a simple mock implementation
// In a real-world app, you would connect this to a backend service
export const useAuth = create<AuthState>((set, get) => ({
  isAdmin: false,
  adminUsername: null,
  approvedStudents: [],
  
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
  }
}));
