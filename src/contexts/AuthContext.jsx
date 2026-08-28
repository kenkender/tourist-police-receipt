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

  // Login ด้วย Email + Password
  const loginWithCredentials = useCallback(async (email, password, role = 'issuer') => {
    setError(null);
    const cleanEmail = (email || '').trim();
    if (!cleanEmail) {
      throw new Error('กรุณากรอกอีเมลผู้ใช้งาน');
    }
    const matchedDemo = DEMO_USERS.find(
      u => u.email.toLowerCase() === cleanEmail.toLowerCase()
    );
    
    const userData = {
      email: cleanEmail,
      name: matchedDemo ? matchedDemo.name : cleanEmail.split('@')[0],
      role: matchedDemo ? matchedDemo.role : role,
      provider: 'email',
      loginTime: new Date().toISOString(),
    };
    setCurrentUser(userData);
    sessionStorage.setItem('tp_current_user', JSON.stringify(userData));
    return userData;
  }, []);


  // Login ด้วย Google Account
  const loginWithGoogle = useCallback(async (googleUser) => {
    setError(null);
    const userData = {
      email: googleUser.email,
      name: googleUser.name || googleUser.email.split('@')[0],
      picture: googleUser.picture || null,
      role: googleUser.role || 'issuer',
      provider: 'google',
      loginTime: new Date().toISOString(),
    };
    setCurrentUser(userData);
    sessionStorage.setItem('tp_current_user', JSON.stringify(userData));
    return userData;
  }, []);

  // Login ด้วย LINE Profile
  const loginWithLine = useCallback(async (lineUser) => {
    setError(null);
    const userData = {
      email: lineUser.email || `${lineUser.userId.substring(0, 8)}@line.me`,
      name: lineUser.displayName || 'ผู้ใช้ LINE',
      picture: lineUser.pictureUrl || null,
      lineUserId: lineUser.userId,
      role: lineUser.role || 'issuer',
      provider: 'line',
      loginTime: new Date().toISOString(),
    };
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
    loginWithGoogle,
    loginWithLine,
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
