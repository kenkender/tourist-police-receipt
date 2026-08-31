import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { FISCAL_YEAR, GOOGLE_CONFIG, ORG_INFO } from '../config/google.config';
import { useAuth } from './AuthContext';

export const ReceiptContext = createContext(null);


const STORAGE_KEY = 'tp_receipts_v2';
const SETTINGS_KEY = 'tp_settings_v2';
const SYNC_INTERVAL_MS = 30000; // polling ทุก 30 วินาที

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

/**
 * แปลง row จาก Google Sheets (snake_case) เป็น format ของ app (camelCase)
 */
function mapSheetRowToReceipt(row) {
  const rawStatus = String(row.status || row.Status || '').trim();
  const rawDesc = String(row.description || '').trim();
  const isCancelled = rawStatus === 'ยกเลิก' || rawStatus.toLowerCase() === 'cancelled' || rawDesc.includes('(ยกเลิก)');

  return {
    // ใช้ receipt_no + book_no เป็น id เพื่อให้ merge กับ localStorage ได้
    id: `SHEET-${String(row.receipt_no)}-${String(row.book_no)}`,
    receiptNo: String(row.receipt_no || ''),
    bookNo: String(row.book_no || ''),
    date: row.date || '',
    receivedFrom: row.received_from || '',
    description: row.description || '',
    amount: Number(row.amount) || 0,
    signerName: row.signer_name || '',
    signerPosition: row.signer_position || '',
    signerRank: row.signer_rank || '',
    issuerEmail: row.issuer_email || '',
    issuerName: row.issuer_name || '',
    createdAt: row.created_at || new Date().toISOString(),
    status: isCancelled ? 'ยกเลิก' : 'ใช้งาน',
  };
}

export function ReceiptProvider({ children }) {
  const { currentUser } = useAuth();

  // โหลด receipts จาก localStorage เป็น initial state (จะถูก overwrite โดย Sheets sync เร็วๆ นี้)
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

  // สถานะ sync
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [syncError, setSyncError] = useState(null);

  const lockRef = useRef(false);
  const syncTimerRef = useRef(null);

  // บันทึก settings ลง localStorage เมื่อเปลี่ยน
  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  // ─── Core: ดึงข้อมูลทั้งหมดจาก Google Sheets ─────────────────────────────
  const syncFromSheets = useCallback(async (silent = false) => {
    const scriptUrl = GOOGLE_CONFIG.APPS_SCRIPT_URL;
    if (!scriptUrl) return false;

    if (!silent) setIsSyncing(true);
    setSyncError(null);

    try {
      const res = await fetch(`${scriptUrl}?action=getReceipts`, {
        method: 'GET',
        cache: 'no-store',
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Sheets ตอบกลับผิดพลาด');

      const map = new Map();
      (json.data || [])
        .filter(row => row.receipt_no) // กรองแถวว่าง
        .forEach(row => {
          const item = mapSheetRowToReceipt(row);
          const key = `${item.bookNo}-${item.receiptNo}`;
          if (!map.has(key)) {
            map.set(key, item);
          } else {
            const existing = map.get(key);
            // หากมีแถวใดแถวหนึ่ง (เช่น แถวใหม่ที่เพิ่งเพิ่มเข้ามา) มีสถานะเป็น "ยกเลิก" ให้ยึดถือว่าใบเสร็จนี้ถูกยกเลิกแล้ว
            if (item.status === 'ยกเลิก') {
              existing.status = 'ยกเลิก';
              if (item.description && item.description.includes('(ยกเลิก)')) {
                existing.description = item.description;
              }
            }
          }
        });

      const mapped = Array.from(map.values())
        // เรียงจากใหม่สุดไปเก่าสุด
        .sort((a, b) => b.receiptNo.localeCompare(a.receiptNo));

      setReceipts(mapped);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
      setLastSyncTime(new Date());
      return true;
    } catch (err) {
      console.warn('[Sync] ดึงข้อมูลจาก Sheets ล้มเหลว:', err.message);
      setSyncError(err.message);
      return false;
    } finally {
      if (!silent) setIsSyncing(false);
    }
  }, []);

  // ─── Sync ครั้งแรกเมื่อ mount ─────────────────────────────────────────────
  useEffect(() => {
    syncFromSheets();
  }, [syncFromSheets]);

  // ─── Polling ทุก 30 วินาที ─────────────────────────────────────────────────
  useEffect(() => {
    const startPolling = () => {
      syncTimerRef.current = setInterval(() => {
        syncFromSheets(true); // silent = ไม่แสดง loading spinner
      }, SYNC_INTERVAL_MS);
    };

    // เริ่ม polling เมื่อ tab กลับมา focus
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncFromSheets(true); // sync ทันทีเมื่อกลับมา
      }
    };

    startPolling();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (syncTimerRef.current) clearInterval(syncTimerRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [syncFromSheets]);

  // ─── คำนวณเลขใบเสร็จถัดไป แยกตามเลขเล่ม (bookNo) ─────────────────────────
  const getNextReceiptNumber = useCallback(async (bookNo = '1') => {
    const latestSettings = loadFromStorage(SETTINGS_KEY, settings);
    const year = latestSettings.fiscalYear || FISCAL_YEAR;
    const targetBook = String(bookNo || '1').trim();

    // 1. ลองดึงจาก Sheets ก่อน (ส่งปีงบประมาณและเลขเล่ม)
    const scriptUrl = GOOGLE_CONFIG.APPS_SCRIPT_URL;
    if (scriptUrl) {
      try {
        const res = await fetch(`${scriptUrl}?action=nextNumber&year=${year}&bookNo=${encodeURIComponent(targetBook)}`, {
          method: 'GET',
          cache: 'no-store',
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.receiptNo) {
            return {
              number: json.number,
              formatted: json.receiptNo,
              year,
              bookNo: targetBook,
            };
          }
        }
      } catch {
        // fallback ไปใช้ local
      }
    }

    // 2. Fallback: คำนวณจาก local state โดยกรองเฉพาะเล่ม (bookNo) เดียวกัน
    const latestReceipts = loadFromStorage(STORAGE_KEY, receipts);
    let maxNumber = 0;
    latestReceipts.forEach(r => {
      const rBook = String(r.bookNo || '').trim();
      if (r.receiptNo && r.receiptNo.startsWith(`${year}-`) && rBook === targetBook) {
        const parts = r.receiptNo.split('-');
        const num = parseInt(parts[1], 10);
        if (!isNaN(num) && num > maxNumber) maxNumber = num;
      }
    });
    const nextNo = maxNumber + 1;
    return {
      number: nextNo,
      formatted: `${year}-${String(nextNo).padStart(5, '0')}`,
      year,
      bookNo: targetBook,
    };
  }, [receipts, settings]);

  // ─── บันทึกใบเสร็จใหม่ ─────────────────────────────────────────────────────
  const createReceipt = useCallback(async (formData) => {
    if (lockRef.current) {
      throw new Error('ระบบกำลังประมวลผลการบันทึก กรุณารอสักครู่');
    }
    lockRef.current = true;

    try {
      const scriptUrl = GOOGLE_CONFIG.APPS_SCRIPT_URL;
      const latestSettings = loadFromStorage(SETTINGS_KEY, settings);
      const year = latestSettings.fiscalYear || FISCAL_YEAR;
      const targetBook = String(formData.bookNo || '1').trim();

      let finalReceiptNo;
      let finalNumber;

      if (scriptUrl) {
        // ─── ขอเลขที่ใบเสร็จจาก Server สำหรับเล่ม (bookNo) นี้ พร้อม Lock ป้องกัน race condition ───
        try {
          const res = await fetch(`${scriptUrl}?action=nextNumber&year=${year}&bookNo=${encodeURIComponent(targetBook)}`, {
            method: 'GET',
            cache: 'no-store',
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json = await res.json();
          if (!json.success) throw new Error(json.error || 'ขอเลขที่ใบเสร็จล้มเหลว');
          finalReceiptNo = json.receiptNo;
          finalNumber = json.number;
        } catch (err) {
          throw new Error(`ไม่สามารถขอเลขที่ใบเสร็จได้: ${err.message}`);
        }
      } else {
        // Fallback: คำนวณเลขจาก local โดยกรองเฉพาะเล่มเดียวกัน
        const latestReceipts = loadFromStorage(STORAGE_KEY, receipts);
        let maxNumber = 0;
        latestReceipts.forEach(r => {
          const rBook = String(r.bookNo || '').trim();
          if (r.receiptNo && r.receiptNo.startsWith(`${year}-`) && rBook === targetBook) {
            const num = parseInt(r.receiptNo.split('-')[1], 10);
            if (!isNaN(num) && num > maxNumber) maxNumber = num;
          }
        });
        finalNumber = maxNumber + 1;
        finalReceiptNo = `${year}-${String(finalNumber).padStart(5, '0')}`;
      }

      const newReceipt = {
        id: `SHEET-${finalReceiptNo}-${formData.bookNo}`,
        ...formData,
        receiptNo: finalReceiptNo,
        issuerEmail: currentUser?.email || 'system',
        issuerName: currentUser?.name || 'ระบบ',
        createdAt: new Date().toISOString(),
        status: 'active',
      };

      // ─── บันทึกลง local state ก่อนเพื่อ UX ที่ดี ───────────────────────────
      setReceipts(prev => {
        const updated = [newReceipt, ...prev.filter(r => r.receiptNo !== finalReceiptNo)];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });

      // ─── ส่งไป Google Sheets (fire-and-forget) ─────────────────────────────
      if (scriptUrl) {
        fetch(scriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({
            action: 'saveReceipt',
            ...newReceipt,
          }),
        }).then(() => {
          // sync กลับหลังบันทึก 2 วินาที เพื่อให้ Sheets อัปเดตก่อน
          setTimeout(() => syncFromSheets(true), 2000);
        }).catch(err => {
          console.warn('[Save] Google Sheets sync notice:', err);
        });
      }

      const nextNo = finalNumber + 1;
      const nextFormatted = `${year}-${String(nextNo).padStart(5, '0')}`;
      return { receipt: newReceipt, nextReceiptNo: nextFormatted };
    } finally {
      lockRef.current = false;
    }
  }, [receipts, currentUser, settings, syncFromSheets]);

  // ─── ลบใบเสร็จ ─────────────────────────────────────────────────────────────
  const deleteReceipt = useCallback((id) => {
    setReceipts(prev => {
      const target = prev.find(r => r.id === id);
      const updated = prev.filter(r => r.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      const scriptUrl = GOOGLE_CONFIG.APPS_SCRIPT_URL;
      if (target && scriptUrl) {
        fetch(scriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({
            action: 'deleteReceipt',
            receiptNo: target.receiptNo,
            bookNo: target.bookNo,
          }),
        }).then(() => {
          setTimeout(() => syncFromSheets(true), 2000);
        }).catch(err => {
          console.warn('[Delete] Sheets sync notice:', err);
        });
      }

      return updated;
    });
  }, [syncFromSheets]);

  // ─── ยกเลิกใบเสร็จ ─────────────────────────────────────────────────────────
  const cancelReceipt = useCallback((id) => {
    setReceipts(prev => {
      const target = prev.find(r => r.id === id);
      if (!target) return prev;

      const cancelDesc = target.description
        ? (target.description.includes('(ยกเลิก)') ? target.description : `${target.description} (ยกเลิก)`)
        : 'ยกเลิกใบเสร็จ';

      const updated = prev.map(r => r.id === id ? { ...r, status: 'ยกเลิก', description: cancelDesc } : r);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      const scriptUrl = GOOGLE_CONFIG.APPS_SCRIPT_URL;
      if (scriptUrl) {
        const payload = {
          receiptNo: target.receiptNo,
          bookNo: target.bookNo,
          date: target.date,
          receivedFrom: target.receivedFrom,
          description: cancelDesc,
          amount: target.amount,
          signerName: target.signerName,
          signerPosition: target.signerPosition,
          signerRank: target.signerRank,
          issuerEmail: target.issuerEmail,
          issuerName: target.issuerName,
          status: 'ยกเลิก',
        };

        // 1. เรียก action: cancelReceipt (สำหรับ Apps Script เวอร์ชันใหม่)
        fetch(scriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({ action: 'cancelReceipt', ...payload }),
        }).catch(err => console.warn('[Cancel] notice:', err));

        // 2. เรียก action: saveReceipt พร้อม status 'ยกเลิก' (การันตีเพิ่มแถวใหม่ลง Google Sheets 100% แม้เป็น Apps Script เดิม)
        fetch(scriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({ action: 'saveReceipt', ...payload }),
        }).then(() => {
          setTimeout(() => syncFromSheets(true), 2000);
        }).catch(err => console.warn('[Cancel-Save] notice:', err));
      }

      return updated;
    });
  }, [syncFromSheets]);

  const updateSettings = useCallback((newSettings) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const addSigner = useCallback((signer) => {
    setSettings(prev => {
      const newSigners = [...(prev.signers || []), { ...signer, id: `signer-${Date.now()}` }];
      const updated = { ...prev, signers: newSigners };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeSigner = useCallback((id) => {
    setSettings(prev => {
      const newSigners = (prev.signers || []).filter(s => s.id !== id);
      const updated = { ...prev, signers: newSigners };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

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

    // คำนวณเฉพาะใบเสร็จที่ไม่อยู่ในสถานะ "ยกเลิก"
    const validReceipts = receipts.filter(r => r.status !== 'ยกเลิก' && r.status !== 'cancelled');
    const todayReceipts = validReceipts.filter(r => r.createdAt?.startsWith(today));
    const monthReceipts = validReceipts.filter(r => r.createdAt?.startsWith(thisMonth));

    return {
      total: receipts.length,
      activeCount: validReceipts.length,
      totalAmount: validReceipts.reduce((s, r) => s + (Number(r.amount) || 0), 0),
      todayCount: todayReceipts.length,
      todayAmount: todayReceipts.reduce((s, r) => s + (Number(r.amount) || 0), 0),
      monthCount: monthReceipts.length,
      monthAmount: monthReceipts.reduce((s, r) => s + (Number(r.amount) || 0), 0),
    };
  }, [receipts]);

  const getDailySummaries = useCallback(() => {
    const map = {};
    const validReceipts = receipts.filter(r => r.status !== 'ยกเลิก' && r.status !== 'cancelled');
    validReceipts.forEach(r => {
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
    isSyncing,
    lastSyncTime,
    syncError,
    syncFromSheets,
    createReceipt,
    deleteReceipt,
    cancelReceipt,
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

// ใช้ในกรณีที่ไม่แน่ใจว่าอยู่ใน Provider หรือไม่ (เช่น Navbar ก่อน login)
export function useReceiptsOptional() {
  return useContext(ReceiptContext);
}
