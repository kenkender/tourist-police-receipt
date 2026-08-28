import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { GOOGLE_CONFIG } from '../config/google.config';

const AuthContext = createContext(null);
const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL || '';

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

  // Helper สำหรับเช็กสิทธิ์จาก Google Sheets หรือ Admin Email List (รองรับทั้ง Email และ Display Name)
  const fetchUserRoleFromSheets = async (email, name) => {
    const cleanEmail = (email || '').toLowerCase().trim();
    const cleanName = (name || '').toLowerCase().trim();

    // 1. เช็กสิทธิ์แอดมินล่วงหน้าจาก Environment Variables (ถ้ามี VITE_ADMIN_EMAILS)
    const adminEmailsEnv = import.meta.env.VITE_ADMIN_EMAILS || 'emptyken37@gmail.com,adisorn sodchuen,adisorn,kenkender';
    const adminList = adminEmailsEnv.split(',').map(e => e.toLowerCase().trim());
    if (adminList.some(item => (cleanEmail && cleanEmail.includes(item)) || (cleanName && cleanName.includes(item)))) {
      return { role: 'admin', name: cleanName || cleanEmail.split('@')[0] };
    }

    // 2. เช็กจากตาราง users ใน Google Sheets ผ่าน Apps Script API
    if (APPS_SCRIPT_URL && (cleanEmail || cleanName)) {
      try {
        const res = await fetch(`${APPS_SCRIPT_URL}?action=getUserRole&email=${encodeURIComponent(cleanEmail)}&name=${encodeURIComponent(cleanName)}`);
        const result = await res.json();
        if (result && result.success && result.role) {
          return {
            role: result.role,
            name: result.name || cleanName || cleanEmail.split('@')[0],
          };
        }
      } catch (err) {
        console.warn('Could not query user role from Sheets:', err.message);
      }
    }

    // ค่าเริ่มต้นถ้าไม่พบในตาราง
    return { role: 'issuer', name: cleanName || cleanEmail.split('@')[0] };
  };

  // Login ด้วย Google Account
  const loginWithGoogle = useCallback(async (googleUser) => {
    setError(null);
    const { role: resolvedRole, name: resolvedName } = await fetchUserRoleFromSheets(googleUser.email, googleUser.name);

    const userData = {
      email: googleUser.email,
      name: googleUser.name || resolvedName || googleUser.email.split('@')[0],
      picture: googleUser.picture || null,
      role: resolvedRole,
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
    const userEmail = lineUser.email || `${lineUser.userId.substring(0, 8)}@line.me`;
    const { role: resolvedRole } = await fetchUserRoleFromSheets(userEmail, lineUser.displayName);

    const userData = {
      email: userEmail,
      name: lineUser.displayName || 'ผู้ใช้ LINE',
      picture: lineUser.pictureUrl || null,
      lineUserId: lineUser.userId,
      role: resolvedRole,
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
