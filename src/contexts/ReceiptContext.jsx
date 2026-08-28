import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { FISCAL_YEAR, GOOGLE_CONFIG, ORG_INFO } from '../config/google.config';
import { useAuth } from './AuthContext';

const ReceiptContext = createContext(null);

const STORAGE_KEY = 'tp_receipts_v2';
const SETTINGS_KEY = 'tp_settings_v2';

const DEFAULT_SIGNERS = [
  { id: 'signer-1', name: 'รัชฎาพร ราชกิจ', rank: 'พ.ต.อ.หญิง', position: 'เหรัญญิก', isDefault: true },
  { id: 'signer-2', name: 'อนุรักษ์ รักษาวงศ์', rank: 'พ.ต.อ.', position: 'รองผู้บังคับการ', isDefault: false },
  { id: 'signer-3', name: 'วิชัย มั่นคง', rank: 'พ.ต.ท.', position: 'ผู้ช่วยเหรัญญิก', isDefault: false },
];

function loadFromStorage(key, defaultValue) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function ReceiptProvider({ children }) {
  const { currentUser } = useAuth();

  const [receipts, setReceipts] = useState(() =>
    loadFromStorage(STORAGE_KEY, [])
  );

  const [settings, setSettings] = useState(() => {
    const loaded = loadFromStorage(SETTINGS_KEY, null);
    if (loaded) {
      if (!loaded.signers || loaded.signers.length === 0) {
        loaded.signers = DEFAULT_SIGNERS;
      }
      return loaded;
    }
    return {
      defaultBookNo: '1',
      nextReceiptNo: 1,
      fiscalYear: FISCAL_YEAR,
      signerName: ORG_INFO.defaultSigner.name,
      signerRank: ORG_INFO.defaultSigner.rank,
      signerPosition: ORG_INFO.defaultSigner.position,
      signers: DEFAULT_SIGNERS,
    };
  });

  const lockRef = useRef(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(receipts));
  }, [receipts]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try { setReceipts(JSON.parse(e.newValue)); } catch {}
      }
      if (e.key === SETTINGS_KEY && e.newValue) {
        try { setSettings(JSON.parse(e.newValue)); } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const getNextReceiptNumber = useCallback(async () => {
    const latestReceipts = loadFromStorage(STORAGE_KEY, receipts);
    const latestSettings = loadFromStorage(SETTINGS_KEY, settings);
    const year = latestSettings.fiscalYear || FISCAL_YEAR;

    let maxNumber = 0;
    latestReceipts.forEach(r => {
      if (r.receiptNo && r.receiptNo.startsWith(`${year}-`)) {
        const parts = r.receiptNo.split('-');
        const num = parseInt(parts[1], 10);
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      }
    });

    const nextNo = Math.max(maxNumber + 1, latestSettings.nextReceiptNo || 1);
    const formatted = `${year}-${String(nextNo).padStart(5, '0')}`;
    return { number: nextNo, formatted, year };
  }, [receipts, settings]);

  const createReceipt = useCallback(async (formData) => {
    if (lockRef.current) {
      throw new Error('ระบบกำลังประมวลผลการบันทึก กรุณารอสักครู่');
    }
    lockRef.current = true;

    try {
      const latestReceipts = loadFromStorage(STORAGE_KEY, receipts);
      const latestSettings = loadFromStorage(SETTINGS_KEY, settings);
      const year = latestSettings.fiscalYear || FISCAL_YEAR;

      let maxNumber = 0;
      latestReceipts.forEach(r => {
        if (r.receiptNo && r.receiptNo.startsWith(`${year}-`)) {
          const parts = r.receiptNo.split('-');
          const num = parseInt(parts[1], 10);
          if (!isNaN(num) && num > maxNumber) maxNumber = num;
        }
      });

      const finalNumber = Math.max(maxNumber + 1, latestSettings.nextReceiptNo || 1);
      const finalReceiptNo = `${year}-${String(finalNumber).padStart(5, '0')}`;

      const newReceipt = {
        id: `REC-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        ...formData,
        receiptNo: finalReceiptNo,
        issuerEmail: currentUser?.email || 'system',
        issuerName: currentUser?.name || 'ระบบ',
        createdAt: new Date().toISOString(),
        status: 'active',
      };

      const updatedReceipts = [newReceipt, ...latestReceipts];
      setReceipts(updatedReceipts);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedReceipts));

      const nextNo = finalNumber + 1;
      const updatedSettings = { ...latestSettings, nextReceiptNo: nextNo };
      setSettings(updatedSettings);
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updatedSettings));

      const scriptUrl = GOOGLE_CONFIG.APPS_SCRIPT_URL;
      if (scriptUrl) {
        fetch(scriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({
            action: 'saveReceipt',
            ...newReceipt,
          }),
        }).catch(err => {
          console.warn('Google Sheets sync notice:', err);
        });
      }

      const nextFormatted = `${year}-${String(nextNo).padStart(5, '0')}`;
      return { receipt: newReceipt, nextReceiptNo: nextFormatted };
    } finally {
      lockRef.current = false;
    }
  }, [receipts, currentUser, settings]);

  const deleteReceipt = useCallback((id) => {
    setReceipts(prev => {
      const updated = prev.filter(r => r.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateSettings = useCallback((newSettings) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // เพิ่มผู้รับเงินใหม่
  const addSigner = useCallback((signer) => {
    setSettings(prev => {
      const newSigners = [...(prev.signers || []), { ...signer, id: `signer-${Date.now()}` }];
      const updated = { ...prev, signers: newSigners };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // ลบผู้รับเงิน
  const removeSigner = useCallback((id) => {
    setSettings(prev => {
      const newSigners = (prev.signers || []).filter(s => s.id !== id);
      const updated = { ...prev, signers: newSigners };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // ตั้งเป็น Default Signer
  const setDefaultSigner = useCallback((id) => {
    setSettings(prev => {
      const newSigners = (prev.signers || []).map(s => ({
        ...s,
        isDefault: s.id === id,
      }));
      const target = newSigners.find(s => s.id === id);
      const updated = {
        ...prev,
        signers: newSigners,
        signerName: target ? target.name : prev.signerName,
        signerRank: target ? target.rank : prev.signerRank,
        signerPosition: target ? target.position : prev.signerPosition,
      };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const checkDuplicate = useCallback((bookNo, receiptNo) => {
    return receipts.some(r => r.bookNo === bookNo && r.receiptNo === receiptNo);
  }, [receipts]);

  const stats = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = today.slice(0, 7);

    const todayReceipts = receipts.filter(r => r.createdAt?.startsWith(today));
    const monthReceipts = receipts.filter(r => r.createdAt?.startsWith(thisMonth));

    return {
      total: receipts.length,
      totalAmount: receipts.reduce((s, r) => s + (Number(r.amount) || 0), 0),
      todayCount: todayReceipts.length,
      todayAmount: todayReceipts.reduce((s, r) => s + (Number(r.amount) || 0), 0),
      monthCount: monthReceipts.length,
      monthAmount: monthReceipts.reduce((s, r) => s + (Number(r.amount) || 0), 0),
    };
  }, [receipts]);

  const getDailySummaries = useCallback(() => {
    const map = {};
    receipts.forEach(r => {
      const day = r.createdAt?.split('T')[0] || r.date;
      if (!day) return;
      if (!map[day]) map[day] = { date: day, count: 0, amount: 0 };
      map[day].count++;
      map[day].amount += Number(r.amount) || 0;
    });
    return Object.values(map).sort((a, b) => b.date.localeCompare(a.date));
  }, [receipts]);

  const value = {
    receipts,
    settings,
    createReceipt,
    deleteReceipt,
    updateSettings,
    addSigner,
    removeSigner,
    setDefaultSigner,
    checkDuplicate,
    getNextReceiptNumber,
    stats,
    getDailySummaries,
  };

  return <ReceiptContext.Provider value={value}>{children}</ReceiptContext.Provider>;
}

export function useReceipts() {
  const ctx = useContext(ReceiptContext);
  if (!ctx) throw new Error('useReceipts must be used within ReceiptProvider');
  return ctx;
}
