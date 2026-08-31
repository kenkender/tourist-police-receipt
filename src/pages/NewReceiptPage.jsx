import { useState, useEffect, useRef } from 'react';
import { useReceipts } from '../contexts/ReceiptContext';
import { useAuth } from '../contexts/AuthContext';
import { ALL_PREFIX_GROUPS, DONATION_TYPES } from '../config/ranks';
import { ORG_INFO, FISCAL_YEAR } from '../config/google.config';
import { formatBaht, bahtToText, toThaiDate, todayISO } from '../services/utils';
import ReceiptTemplate from '../components/receipt/ReceiptTemplate';
import CustomModal from '../components/common/CustomModal';
import {
  FilePlus, Save, Printer, ChevronDown,
  AlertCircle, CheckCircle, User, BookOpen, Calendar,
  Hash, DollarSign, FileText, PenTool, Lock, UserCheck,
} from 'lucide-react';

function DonorPrefixSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const filtered = ALL_PREFIX_GROUPS.map(group => ({
    ...group,
    items: group.items.filter(item =>
      !search || item.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(g => g.items.length > 0);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: '10px 14px',
          background: 'rgba(15,31,61,0.6)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 'var(--radius-md)',
          color: value ? 'var(--text-primary)' : 'var(--text-muted)',
          fontFamily: 'var(--font-thai)', fontSize: 14, cursor: 'pointer',
          transition: 'var(--transition)',
        }}
      >
        <span>{value || 'เลือกยศ / คำนำหน้า...'}</span>
        <ChevronDown size={16} style={{ color: '#c9a84c', transform: open ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '110%', left: 0, right: 0, zIndex: 50,
          background: '#0f1f3d',
          border: '1px solid rgba(201,168,76,0.3)',
          borderRadius: 12,
          boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
          maxHeight: 320, overflowY: 'auto',
          animation: 'slideUp 0.2s ease',
        }}>
          <div style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <input
              className="form-input"
              style={{ padding: '7px 12px', fontSize: 13 }}
              placeholder="ค้นหายศ / คำนำหน้า..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          {filtered.map(group => (
            <div key={group.group}>
              <div style={{
                padding: '6px 12px', fontSize: 10, fontWeight: 700,
                color: '#c9a84c', letterSpacing: '0.1em', textTransform: 'uppercase',
                background: 'rgba(201,168,76,0.05)',
              }}>
                {group.group}
              </div>
              {group.items.map(item => (
                <button
                  key={item}
                  type="button"
                  onClick={() => { onChange(item); setOpen(false); setSearch(''); }}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '8px 16px', fontSize: 13,
                    background: value === item ? 'rgba(45,95,166,0.3)' : 'transparent',
                    color: value === item ? '#e8edf5' : '#a8b5cc',
                    border: 'none', cursor: 'pointer',
                    fontFamily: 'var(--font-thai)',
                    transition: '0.1s',
                  }}
                  onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.06)'}
                  onMouseLeave={e => e.target.style.background = value === item ? 'rgba(45,95,166,0.3)' : 'transparent'}
                >
                  {item}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FormField({ label, required, icon: Icon, children, error, hint }) {
  return (
    <div className="form-group">
      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {Icon && <Icon size={12} style={{ color: '#c9a84c' }} />}
        {label}
        {required && <span className="required">*</span>}
      </label>
      {children}
      {hint && <span style={{ fontSize: 11, color: '#6b7a99', marginTop: 2 }}>{hint}</span>}
      {error && (
        <span className="form-error">
          <AlertCircle size={12} /> {error}
        </span>
      )}
    </div>
  );
}

function Toast({ msg, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24,
      zIndex: 'var(--z-toast)',
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '14px 22px',
      background: type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
      border: `1px solid ${type === 'success' ? 'rgba(16,185,129,0.5)' : 'rgba(239,68,68,0.5)'}`,
      borderRadius: 12, backdropFilter: 'blur(16px)',
      color: type === 'success' ? '#6ee7b7' : '#fca5a5',
      fontSize: 14, fontWeight: 600,
      boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
      animation: 'slideUp 0.3s ease',
    }}>
      {type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
      {msg}
    </div>
  );
}

export default function NewReceiptPage() {
  const { createReceipt, settings, getNextReceiptNumber } = useReceipts();
  const signers = settings.signers || [];
  const defaultSigner = signers.find(s => s.isDefault) || signers[0] || ORG_INFO.defaultSigner;

  const [form, setForm] = useState({
    bookNo: settings.defaultBookNo || '1',
    receiptNo: 'กำลังคำนวณ...',
    date: todayISO(),
    prefix: '',
    firstName: '',
    lastName: '',
    receivedFrom: '',
    description: DONATION_TYPES[0],
    amount: '',
    selectedSignerId: defaultSigner.id || 'custom',
    signerName: defaultSigner.name || ORG_INFO.defaultSigner.name,
    signerRank: defaultSigner.rank || ORG_INFO.defaultSigner.rank,
    signerPosition: defaultSigner.position || ORG_INFO.defaultSigner.position,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Modal States
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [successModalData, setSuccessModalData] = useState(null);
  const [errorModalData, setErrorModalData] = useState(null);

  const refreshNextNumber = (targetBookNo) => {
    const bNo = targetBookNo || form.bookNo || '1';
    getNextReceiptNumber(bNo).then(({ formatted }) => {
      setForm(f => ({ ...f, receiptNo: formatted }));
    });
  };

  // รีเฟรชเลขที่ใบเสร็จตามเล่มที่เลือก (bookNo) ทุกครั้งที่มีการเปลี่ยนเล่ม
  useEffect(() => {
    if (form.bookNo) {
      refreshNextNumber(form.bookNo);
    }
  }, [form.bookNo]);

  useEffect(() => {
    const parts = [form.prefix, form.firstName, form.lastName].filter(Boolean);
    setForm(f => ({ ...f, receivedFrom: parts.join(' ') }));
  }, [form.prefix, form.firstName, form.lastName]);

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));

  // เมื่อเลือกผู้รับเงินจาก Dropdown -> ใส่ชื่อ/ตำแหน่งให้อัตโนมัติ
  const handleSelectSigner = (signerId) => {
    if (signerId === 'custom') {
      setForm(f => ({ ...f, selectedSignerId: 'custom' }));
      return;
    }
    const target = signers.find(s => s.id === signerId);
    if (target) {
      setForm(f => ({
        ...f,
        selectedSignerId: signerId,
        signerName: target.name,
        signerRank: target.rank,
        signerPosition: target.position,
      }));
    }
  };

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'กรุณากรอกชื่อผู้รับเงิน / ผู้บริจาค';
    if (form.amount === '' || form.amount === null || form.amount === undefined || isNaN(form.amount) || Number(form.amount) < 0) e.amount = 'กรุณากรอกจำนวนเงินให้ถูกต้อง';
    if (!form.description) e.description = 'กรุณากรอกรายการ';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // เมื่อผู้ใช้กดปุ่มบันทึก -> เปิด Confirmation Modal ก่อน
  const handleSaveClick = () => {
    if (!validate()) return;
    setShowConfirmModal(true);
  };

  // ดำเนินการบันทึกจริงเมื่อยืนยันใน Modal
  const executeSave = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    try {
      const result = await createReceipt({
        ...form,
        amount: Number(form.amount),
        fiscalYear: FISCAL_YEAR,
      });

      const savedReceipt = result.receipt;
      const nextNo = result.nextReceiptNo;
      const currentBookNo = form.bookNo;

      // แสดง Success Modal กลางหน้าจอ
      setSuccessModalData({
        receiptNo: savedReceipt.receiptNo,
        bookNo: currentBookNo,
        receivedFrom: savedReceipt.receivedFrom,
        amount: savedReceipt.amount,
        nextNo: nextNo,
      });

      // ล้างฟอร์ม — คงค่า bookNo ที่ผู้ใช้กำลังใช้งานอยู่ไว้
      const activeDefault = signers.find(s => s.isDefault) || signers[0] || ORG_INFO.defaultSigner;
      setForm({
        bookNo: currentBookNo,  // ← คงค่าเดิม
        receiptNo: nextNo,
        date: todayISO(),
        prefix: '',
        firstName: '',
        lastName: '',
        receivedFrom: '',
        description: DONATION_TYPES[0],
        amount: '',
        selectedSignerId: activeDefault.id || 'custom',
        signerName: activeDefault.name || ORG_INFO.defaultSigner.name,
        signerRank: activeDefault.rank || ORG_INFO.defaultSigner.rank,
        signerPosition: activeDefault.position || ORG_INFO.defaultSigner.position,
      });
      setErrors({});

      // โหลดเลขที่ถัดไปสำหรับเล่มนี้จาก Sheets ใหม่
      setTimeout(() => refreshNextNumber(currentBookNo), 2000);

    } catch (err) {
      setErrorModalData(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      refreshNextNumber(form.bookNo);
    } finally {
      setLoading(false);
    }
  };

  const handleDirectPrint = () => {
    window.print();
  };

  const receiptData = { ...form, amount: Number(form.amount) || 0 };

  return (
    <div style={{ padding: '24px 16px', maxWidth: 1280, margin: '0 auto' }}>
      {/* Header */}
      <div className="no-print" style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 24, flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#e8edf5', display: 'flex', alignItems: 'center', gap: 10 }}>
            <FilePlus size={22} style={{ color: '#c9a84c' }} />
            ระบบออกใบเสร็จรับเงิน
          </h2>
          <p style={{ fontSize: 12, color: '#6b7a99', marginTop: 4 }}>
            กรอกข้อมูลผู้รับเงิน รายการ และเลือกเจ้าหน้าที่ลงนาม ระบบจะอัปเดตใบเสร็จให้อัตโนมัติ
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            className="btn btn-gold btn-lg"
            onClick={handleSaveClick}
            disabled={loading}
            style={{ padding: '12px 24px', fontSize: 15, fontWeight: 700 }}
          >
            <Save size={18} />
            {loading ? 'กำลังบันทึกข้อมูล...' : 'บันทึกใบเสร็จ (ล้างฟอร์ม & รันเลขถัดไป)'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
        {/* FORM CARD */}
        <div className="glass-card no-print" style={{ padding: '24px 28px' }}>
          {/* Row 1: เล่มที่ / เลขที่ / วันที่ */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 20 }}>
            <FormField label="เล่มที่ (Book No.)" icon={BookOpen}>
              <input
                className="form-input"
                value={form.bookNo}
                onChange={e => setField('bookNo', e.target.value)}
              />
            </FormField>

            <FormField
              label="เลขที่ใบเสร็จ"
              required
              icon={Hash}
              hint="🔒 รันให้อัตโนมัติ ป้องกันการกรอกซ้ำ"
            >
              <div style={{ position: 'relative' }}>
                <input
                  className="form-input"
                  value={form.receiptNo}
                  readOnly
                  style={{
                    fontWeight: 800, color: '#c9a84c', background: 'rgba(201,168,76,0.08)',
                    border: '1px solid rgba(201,168,76,0.3)', cursor: 'not-allowed',
                  }}
                />
                <Lock size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#c9a84c' }} />
              </div>
            </FormField>

            <FormField label="วันที่ออกใบเสร็จ" icon={Calendar}>
              <input
                type="date"
                className="form-input"
                value={form.date}
                onChange={e => setField('date', e.target.value)}
              />
            </FormField>
          </div>

          {/* Row 2: ผู้บริจาค */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: '#c9a84c', fontWeight: 700, marginBottom: 10, letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
              <User size={12} />
              ข้อมูลผู้บริจาค / ผู้ชำระเงิน
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              <FormField label="ยศ / คำนำหน้า" required>
                <DonorPrefixSelect value={form.prefix} onChange={v => setField('prefix', v)} />
              </FormField>
              <FormField label="ชื่อ" required error={errors.firstName}>
                <input
                  className="form-input"
                  value={form.firstName}
                  onChange={e => setField('firstName', e.target.value)}
                  placeholder="กรอกชื่อ"
                />
              </FormField>
              <FormField label="นามสกุล">
                <input
                  className="form-input"
                  value={form.lastName}
                  onChange={e => setField('lastName', e.target.value)}
                  placeholder="กรอกนามสกุล"
                />
              </FormField>
            </div>
            {form.receivedFrom && (
              <div style={{
                marginTop: 8, padding: '8px 14px',
                background: 'rgba(201,168,76,0.08)', borderRadius: 8,
                border: '1px solid rgba(201,168,76,0.2)',
                fontSize: 13, color: '#c9a84c', display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <CheckCircle size={14} />
                ชื่อในใบเสร็จ: <strong>{form.receivedFrom}</strong>
              </div>
            )}
          </div>

          {/* Row 3: รายการ / จำนวนเงิน */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 20 }}>
            <FormField label="รายการ (Description)" required icon={FileText} error={errors.description}>
              <div>
                <select
                  className="form-select"
                  value={DONATION_TYPES.includes(form.description) ? form.description : '__custom__'}
                  onChange={e => {
                    if (e.target.value !== '__custom__') setField('description', e.target.value);
                  }}
                  style={{ marginBottom: 6 }}
                >
                  {DONATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  <option value="__custom__">— กรอกเอง —</option>
                </select>
                <input
                  className="form-input"
                  value={form.description}
                  onChange={e => setField('description', e.target.value)}
                  placeholder="หรือกรอกรายละเอียดเอง..."
                />
              </div>
            </FormField>

            <FormField label="จำนวนเงิน (บาท)" required icon={DollarSign} error={errors.amount}>
              <input
                type="number"
                className="form-input"
                value={form.amount}
                onChange={e => setField('amount', e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                style={{ fontWeight: 800, fontSize: 18, color: '#c9a84c' }}
              />
              {form.amount !== '' && form.amount !== null && !isNaN(form.amount) && Number(form.amount) >= 0 && (
                <div style={{ fontSize: 11, color: '#6b7a99', marginTop: 4 }}>
                  ({bahtToText(Number(form.amount))})
                </div>
              )}
            </FormField>
          </div>

          {/* Row 4: ผู้รับเงิน / ลายเซ็น */}
          <div>
            <div style={{ fontSize: 12, color: '#c9a84c', fontWeight: 700, marginBottom: 10, letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
              <UserCheck size={14} />
              ข้อมูลผู้รับเงิน / เจ้าหน้าที่ลงนาม
            </div>

            {/* Dropdown เลือกรายชื่อผู้รับเงิน */}
            <div style={{ marginBottom: 14 }}>
              <FormField label="เลือกรายชื่อผู้รับเงินจากตั้งค่าระบบ">
                <select
                  className="form-select"
                  value={form.selectedSignerId}
                  onChange={e => handleSelectSigner(e.target.value)}
                  style={{ fontWeight: 700, color: '#c9a84c', background: 'rgba(15,31,61,0.8)' }}
                >
                  {signers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.rank} {s.name} ({s.position}) {s.isDefault ? '★ ค่าเริ่มต้น' : ''}
                    </option>
                  ))}
                  <option value="custom">— กรอกข้อมูลลงนามเอง —</option>
                </select>
              </FormField>
            </div>

            {/* รายละเอียดผู้ลงนาม */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              <FormField label="ชื่อผู้รับเงิน (ลงนาม)">
                <input
                  className="form-input"
                  value={form.signerName}
                  onChange={e => setField('signerName', e.target.value)}
                />
              </FormField>
              <FormField label="ตำแหน่ง">
                <input
                  className="form-input"
                  value={form.signerPosition}
                  onChange={e => setField('signerPosition', e.target.value)}
                />
              </FormField>
              <FormField label="คำนำหน้าตำแหน่ง">
                <input
                  className="form-input"
                  value={form.signerRank}
                  onChange={e => setField('signerRank', e.target.value)}
                  placeholder="พ.ต.อ.หญิง"
                />
              </FormField>
            </div>
          </div>
        </div>

        {/* PREVIEW & PRINT CARD */}
        <div className="glass-card" style={{ padding: '20px 24px' }}>
          <div className="no-print" style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 16, flexWrap: 'wrap', gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="badge badge-blue">ตัวอย่างแบบฟอร์มใบเสร็จ</span>
              <span style={{ fontSize: 11, color: '#6b7a99' }}>
                (ชื่อผู้รับเงินและตำแหน่งจะเปลี่ยนตามที่เลือกทันที)
              </span>
            </div>
            <button
              className="btn btn-gold"
              onClick={handleDirectPrint}
              title="สั่งพิมพ์ออกเครื่องพิมพ์โดยตรง"
            >
              <Printer size={16} /> สั่งพิมพ์ใบเสร็จ (Print)
            </button>
          </div>

          {/* Receipt Preview Area */}
          <div id="receipt-pdf-area" style={{ background: '#f8fafc', borderRadius: 8, overflow: 'hidden' }}>
            <ReceiptTemplate data={receiptData} />
          </div>
        </div>
      </div>

      {/* MODALS */}
      {/* 1. Modal ยืนยันก่อนบันทึก */}
      <CustomModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={executeSave}
        type="confirm"
        title="ยืนยันการบันทึกใบเสร็จ?"
        message="กรุณาตรวจสอบความถูกต้องของข้อมูลก่อนบันทึกลงในระบบ"
        details={[
          { label: 'เล่มที่ / เลขที่', value: `${form.bookNo} / ${form.receiptNo}` },
          { label: 'ได้รับเงินจาก', value: form.receivedFrom || '-' },
          { label: 'รายการ', value: form.description },
          { label: 'จำนวนเงิน', value: `฿${formatBaht(form.amount)}`, isBaht: true },
          { label: 'ผู้ลงนาม', value: `${form.signerRank} ${form.signerName}` },
        ]}
        confirmText="ยืนยันบันทึกข้อมูล"
        cancelText="ยกเลิก / แก้ไข"
      />

      {/* 2. Modal แจ้งเตือนเมื่อบันทึกสำเร็จ */}
      <CustomModal
        isOpen={!!successModalData}
        onClose={() => setSuccessModalData(null)}
        type="success"
        title="บันทึกใบเสร็จสำเร็จแล้ว!"
        message="ระบบทำการบันทึกข้อมูลลง Google Sheets เรียบร้อยแล้ว"
        details={successModalData ? [
          { label: 'เล่มที่ / เลขที่', value: `${successModalData.bookNo} / ${successModalData.receiptNo}` },
          { label: 'ผู้บริจาค', value: successModalData.receivedFrom },
          { label: 'จำนวนเงิน', value: `฿${formatBaht(successModalData.amount)}`, isBaht: true },
          { label: 'ฉบับถัดไป', value: successModalData.nextNo },
        ] : []}
        confirmText="ตกลง"
        showPrint={true}
        onPrint={handleDirectPrint}
      />

      {/* 3. Modal แจ้งเตือนข้อผิดพลาด */}
      <CustomModal
        isOpen={!!errorModalData}
        onClose={() => setErrorModalData(null)}
        type="delete"
        title="ไม่สามารถบันทึกข้อมูลได้"
        message={errorModalData}
        confirmText="ตกลง / ลองใหม่"
        confirmBtnStyle="gold"
      />
    </div>
  );
}
