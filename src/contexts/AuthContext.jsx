import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { GOOGLE_CONFIG } from '../config/google.config';

const AuthContext = createContext(null);

// Demo users สำหรับทดสอบก่อน connect Google Sheets
const DEMO_USERS = [
  { email: 'admin@touristpolice.go.th', password: 'admin1234', role: 'admin', name: 'ผู้ดูแลระบบ' },
  { email: 'officer1@touristpolice.go.th', password: 'officer1234', role: 'issuer', name: 'เจ้าหน้าที่ 1' },
  { email: 'auditor@touristpolice.go.th', password: 'auditor1234', role: 'auditor', name: 'ผู้ตรวจสอบ' },
];

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // โหลด user จาก sessionStorage เมื่อ refresh หน้า
  useEffect(() => {
    try {
      const savedUser = sessionStorage.getItem('tp_current_user');
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }
    } catch (e) {
      sessionStorage.removeItem('tp_current_user');
    } finally {
      setLoading(false);
    }
  }, []);

  // Login ด้วย Email + Password (Demo Mode)
  const loginWithCredentials = useCallback(async (email, password) => {
    setError(null);
    const user = DEMO_USERS.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!user) {
      throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }
    const userData = { email: user.email, name: user.name, role: user.role, loginTime: new Date().toISOString() };
    setCurrentUser(userData);
    sessionStorage.setItem('tp_current_user', JSON.stringify(userData));
    return userData;
  }, []);

  // Logout
  const logout = useCallback(() => {
    setCurrentUser(null);
    sessionStorage.removeItem('tp_current_user');
  }, []);

  // ตรวจสอบสิทธิ์
  const hasRole = useCallback((role) => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    return currentUser.role === role;
  }, [currentUser]);

  const getRoleName = useCallback((role) => {
    const roles = {
      admin: 'ผู้ดูแลระบบ',
      issuer: 'ผู้ออกใบเสร็จ',
      auditor: 'ผู้ตรวจสอบ',
    };
    return roles[role] || role;
  }, []);

  const value = {
    currentUser,
    loading,
    error,
    loginWithCredentials,
    logout,
    hasRole,
    getRoleName,
    isAuthenticated: !!currentUser,
    isAdmin: currentUser?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
