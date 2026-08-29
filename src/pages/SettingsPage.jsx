import { useState } from 'react';
import { useReceipts } from '../contexts/ReceiptContext';
import { useAuth } from '../contexts/AuthContext';
import { FISCAL_YEAR, ORG_INFO } from '../config/google.config';
import { Settings, Shield, BookOpen, Hash, User, Save, Plus, Trash2, CheckCircle2, UserCheck, Table } from 'lucide-react';

function FormField({ label, icon: Icon, children, hint }) {
  return (
    <div className="form-group">
      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {Icon && <Icon size={12} style={{ color: '#c9a84c' }} />}
        {label}
      </label>
      {children}
      {hint && <div style={{ fontSize: 11, color: '#6b7a99' }}>{hint}</div>}
    </div>
  );
}

export default function SettingsPage() {
  const { settings, updateSettings, addSigner, removeSigner, setDefaultSigner } = useReceipts();
  const { isAdmin, currentUser } = useAuth();
  const [form, setForm] = useState({
    defaultBookNo: settings.defaultBookNo || '1',
    nextReceiptNo: settings.nextReceiptNo || 1,
    signerName: settings.signerName || ORG_INFO.defaultSigner.name,
    signerRank: settings.signerRank || ORG_INFO.defaultSigner.rank,
    signerPosition: settings.signerPosition || ORG_INFO.defaultSigner.position,
    fiscalYear: settings.fiscalYear || FISCAL_YEAR,
    spreadsheetUrl: settings.spreadsheetUrl || '',
  });

  // ฟอร์มเพิ่มเจ้าหน้าที่ผู้รับเงินใหม่
  const [newSigner, setNewSigner] = useState({ name: '', rank: 'พ.ต.อ.หญิง', position: 'เหรัญญิก' });
  const [saved, setSaved] = useState(false);

  if (!isAdmin) {
    return (
      <div style={{ padding: '60px 16px', maxWidth: 500, margin: '0 auto', textAlign: 'center' }}>
        <Shield size={48} style={{ color: '#4b5a75', marginBottom: 16 }} />
        <h2 style={{ fontSize: 20, color: '#e8edf5', marginBottom: 8 }}>ไม่มีสิทธิ์เข้าถึง</h2>
        <p style={{ color: '#6b7a99', fontSize: 14 }}>หน้านี้สำหรับผู้ดูแลระบบเท่านั้น</p>
      </div>
    );
  }

  const handleSaveSettings = () => {
    updateSettings({
      defaultBookNo: form.defaultBookNo,
      nextReceiptNo: Number(form.nextReceiptNo),
      signerName: form.signerName,
      signerRank: form.signerRank,
      signerPosition: form.signerPosition,
      fiscalYear: form.fiscalYear,
      spreadsheetUrl: form.spreadsheetUrl,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleAddSigner = (e) => {
    e.preventDefault();
    if (!newSigner.name.trim()) return;
    addSigner({
      name: newSigner.name.trim(),
      rank: newSigner.rank.trim(),
      position: newSigner.position.trim(),
      isDefault: false,
    });
    setNewSigner({ name: '', rank: 'พ.ต.ท.', position: 'ผู้ช่วยเหรัญญิก' });
  };

  const signers = settings.signers || [];

  return (
    <div style={{ padding: '24px 16px', maxWidth: 960, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#e8edf5', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Settings size={22} style={{ color: '#c9a84c' }} />
          ตั้งค่าระบบ
        </h2>
        <p style={{ fontSize: 12, color: '#6b7a99', marginTop: 4 }}>
          ตั้งค่าพารามิเตอร์ระบบ เลขเล่ม ลิงก์ Google Sheets และจัดการรายชื่อเจ้าหน้าที่ผู้รับเงิน (ลงนาม)
        </p>
      </div>

      <div style={{ display: 'grid', gap: 20 }}>
        {/* Receipt Number Settings */}
        <div className="glass-card" style={{ padding: '24px 28px' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#c9a84c', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Hash size={15} />
            ตั้งค่าเลขใบเสร็จ & Google Sheets
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
            <FormField label="เลขเล่มเริ่มต้น" icon={BookOpen}
              hint="เลขเล่มที่จะใช้ค่าเริ่มต้นสำหรับใบเสร็จใหม่">
              <input
                className="form-input"
                value={form.defaultBookNo}
                onChange={e => setForm(f => ({ ...f, defaultBookNo: e.target.value }))}
              />
            </FormField>
            <FormField label="เลขที่ใบเสร็จถัดไป" icon={Hash}
              hint={`รันต่อเนื่องอัตโนมัติ — ปีงบประมาณ ${form.fiscalYear}`}>
              <input
                type="number"
                className="form-input"
                value={form.nextReceiptNo}
                onChange={e => setForm(f => ({ ...f, nextReceiptNo: e.target.value }))}
                min="1"
                style={{ fontWeight: 700, color: '#c9a84c' }}
              />
            </FormField>
            <FormField label="ปีงบประมาณ (2 หลักท้าย พ.ศ.)"
              hint={`เช่น 69 = พ.ศ. 2569 — ปัจจุบัน: ${FISCAL_YEAR}`}>
              <input
                className="form-input"
                value={form.fiscalYear}
                onChange={e => setForm(f => ({ ...f, fiscalYear: e.target.value }))}
                maxLength={2}
              />
            </FormField>
          </div>

          <FormField label="ลิงก์ Google Sheets (Spreadsheet URL)" icon={Table}
            hint="วาง URL ของ Google Sheets เพื่อให้ปุ่ม 'เปิดดู Google Sheets' เปิดไปยังตารางข้อมูลของคุณได้โดยตรง">
            <input
              className="form-input"
              placeholder="https://docs.google.com/spreadsheets/d/your-sheet-id/edit"
              value={form.spreadsheetUrl}
              onChange={e => setForm(f => ({ ...f, spreadsheetUrl: e.target.value }))}
            />
          </FormField>

          <div style={{
            marginTop: 16, padding: '12px 16px',
            background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 10,
            fontSize: 13, color: '#c9a84c',
          }}>
            📄 ตัวอย่างเลขที่ใบเสร็จถัดไป: <strong>{form.fiscalYear}-{String(form.nextReceiptNo).padStart(5, '0')}</strong>
          </div>
        </div>

        {/* SIGNERS MANAGEMENT (รายชื่อผู้รับเงิน / เจ้าหน้าที่ลงนาม) */}
        <div className="glass-card" style={{ padding: '24px 28px' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#c9a84c', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
            <UserCheck size={16} />
            จัดการรายชื่อผู้รับเงิน / เจ้าหน้าที่ลงนาม
          </h3>
          <p style={{ fontSize: 12, color: '#6b7a99', marginBottom: 20 }}>
            เพิ่มหรือเลือกรายชื่อเจ้าหน้าที่ที่ได้รับมอบหมายให้ออกใบเสร็จ เพื่อใช้งานในหน้าออกใบเสร็จ
          </p>

          {/* รายชื่อปัจจุบัน */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#a8b5cc', marginBottom: 10 }}>
              รายชื่อเจ้าหน้าที่ผู้รับเงินในระบบ ({signers.length} ท่าน)
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {signers.map(s => (
                <div
                  key={s.id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: s.isDefault ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${s.isDefault ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: 10,
                    transition: '0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: s.isDefault ? '#c9a84c' : 'rgba(45,95,166,0.3)',
                      color: s.isDefault ? '#0f1f3d' : '#e8edf5',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: 14,
                    }}>
                      {s.name.slice(0, 1)}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#e8edf5', display: 'flex', alignItems: 'center', gap: 8 }}>
                        {s.rank} {s.name}
                        {s.isDefault && (
                          <span className="badge badge-gold" style={{ fontSize: 10 }}>ค่าเริ่มต้น</span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: '#6b7a99' }}>{s.position}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {!s.isDefault && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => setDefaultSigner(s.id)}
                        style={{ fontSize: 11 }}
                      >
                        <CheckCircle2 size={13} /> ตั้งเป็นค่าเริ่มต้น
                      </button>
                    )}
                    {signers.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => removeSigner(s.id)}
                        title="ลบรายชื่อ"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ฟอร์มเพิ่มเจ้าหน้าที่ใหม่ */}
          <form onSubmit={handleAddSigner} style={{
            background: 'rgba(15,31,61,0.4)', padding: 16, borderRadius: 12,
            border: '1px dashed rgba(251,191,36,0.3)',
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#c9a84c', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={14} /> เพิ่มรายชื่อเจ้าหน้าที่ผู้รับเงินใหม่
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
              <FormField label="ชื่อ-นามสกุล">
                <input
                  className="form-input"
                  placeholder="เช่น สมชาย ใจดี"
                  value={newSigner.name}
                  onChange={e => setNewSigner(s => ({ ...s, name: e.target.value }))}
                  required
                />
              </FormField>
              <FormField label="คำนำหน้าตำแหน่ง">
                <input
                  className="form-input"
                  placeholder="เช่น พ.ต.ท."
                  value={newSigner.rank}
                  onChange={e => setNewSigner(s => ({ ...s, rank: e.target.value }))}
                  required
                />
              </FormField>
              <FormField label="ตำแหน่ง">
                <input
                  className="form-input"
                  placeholder="เช่น ผู้ช่วยเหรัญญิก"
                  value={newSigner.position}
                  onChange={e => setNewSigner(s => ({ ...s, position: e.target.value }))}
                  required
                />
              </FormField>
              <button type="submit" className="btn btn-primary" style={{ height: 42 }}>
                <Plus size={16} /> เพิ่มรายชื่อ
              </button>
            </div>
          </form>
        </div>

        {/* System Info */}
        <div className="glass-card" style={{ padding: '24px 28px' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#c9a84c', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={15} />
            ข้อมูลระบบ
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
            {[
              ['ผู้ดูแลระบบปัจจุบัน', currentUser?.email],
              ['สิทธิ์', 'ผู้ดูแลระบบ (Admin)'],
              ['ปีงบประมาณปัจจุบัน', FISCAL_YEAR + ' (พ.ศ. 25' + FISCAL_YEAR + ')'],
              ['ระบบจัดเก็บข้อมูล', 'Local Storage + Google Sheets'],
            ].map(([k, v]) => (
              <div key={k} style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                <div style={{ color: '#6b7a99', fontSize: 11, marginBottom: 4 }}>{k}</div>
                <div style={{ color: '#e8edf5', fontWeight: 600 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            className="btn btn-gold btn-lg"
            onClick={handleSaveSettings}
          >
            {saved ? <><CheckCircle2 size={18} /> บันทึกเรียบร้อย!</> : <><Save size={18} /> บันทึกการตั้งค่า</>}
          </button>
        </div>
      </div>
    </div>
  );
}
