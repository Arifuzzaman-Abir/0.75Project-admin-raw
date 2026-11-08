import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types.ts';
import { api } from '../services/api.ts';
import { INITIAL_USERS } from '../data/initialData.ts';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  loginAsDemo: (targetRole: UserRole, wing?: string) => Promise<void>;
  loginWithEmail: (email: string) => Promise<{ success: boolean; message?: string }>;
  loginWithCredentials: (username: string, email: string, role: UserRole) => Promise<{ success: boolean; message?: string }>;
  registerUser: (data: {
    name?: string;
    username?: string;
    email: string;
    role?: UserRole;
    studentId?: string;
    department?: string;
    semester?: string;
  }) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Pre-seed default with Administrator or Student so the user can immediately experience the site
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('cuec_current_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.name === 'Prof. Dr. A. K. M. Rahman' || parsed.id === 'usr-admin-1') {
          return INITIAL_USERS[0];
        }
        return parsed;
      } catch (e) {
        // fallback
      }
    }
    // Default logged in as Administrator for instant evaluation of administrative & controller dashboard features
    return INITIAL_USERS[0];
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('cuec_current_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('cuec_current_user');
    }
  }, [user]);

  const loginAsDemo = async (targetRole: UserRole, wing?: string) => {
    let selected: User | undefined;
    if (targetRole === 'administrator') {
      selected = INITIAL_USERS.find(u => u.role === 'administrator');
    } else if (targetRole === 'controller') {
      if (wing === 'cultural' || wing === 'events_and_clubs') {
        selected = INITIAL_USERS.find(u => u.role === 'controller' && u.clubAffiliation === 'events_and_clubs');
      } else {
        selected = INITIAL_USERS.find(u => u.role === 'controller' && u.clubAffiliation === 'computer_club');
      }
    } else {
      selected = INITIAL_USERS.find(u => u.role === 'user');
    }

    if (selected) {
      setUser(selected);
    }
  };

  const loginWithEmail = async (email: string) => {
    try {
      const res = await api.login(email);
      if (res.success && res.user) {
        setUser(res.user);
        return { success: true };
      }
      return { success: false, message: res.message || 'Login failed.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Server error.' };
    }
  };

  const loginWithCredentials = async (username: string, email: string, role: UserRole) => {
    try {
      const res = await api.login({ username, email, role });
      if (res.success && res.user) {
        setUser(res.user);
        return { success: true };
      }
      return { success: false, message: res.message || 'Login failed.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Server error.' };
    }
  };

  const registerUser = async (data: {
    name?: string;
    username?: string;
    email: string;
    role?: UserRole;
    studentId?: string;
    department?: string;
    semester?: string;
  }) => {
    try {
      const res = await api.register(data);
      if (res.success && res.user) {
        setUser(res.user);
        return { success: true };
      }
      return { success: false, message: res.message || 'Registration failed.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Server error.' };
    }
  };

  const logout = () => {
    setUser(null);
  };

  const refreshUser = async () => {
    if (!user) return;
    try {
      const res = await api.getUsers(user.id);
      if (res.success) {
        const found = res.users.find(u => u.id === user.id || u.studentId === user.studentId);
        if (found) setUser(found);
      }
    } catch (e) {
      // ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'user',
        isAuthenticated: !!user,
        loginAsDemo,
        loginWithEmail,
        loginWithCredentials,
        registerUser,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
