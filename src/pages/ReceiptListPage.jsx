import { useState, useMemo } from 'react';
import { useReceipts } from '../contexts/ReceiptContext';
import { useAuth } from '../contexts/AuthContext';
import { formatBaht, toThaiDateShort } from '../services/utils';
import ReceiptTemplate from '../components/receipt/ReceiptTemplate';
import CustomModal from '../components/common/CustomModal';
import { getGoogleSheetUrl } from '../config/google.config';
import {
  BookOpen, Search, RotateCcw, Printer,
  Trash2, Eye, ChevronLeft, ChevronRight, X, Table, ExternalLink,
} from 'lucide-react';

export default function ReceiptListPage() {
  const { receipts, settings, deleteReceipt } = useReceipts();
  const { isAdmin } = useAuth();
  const sheetUrl = getGoogleSheetUrl(settings?.spreadsheetUrl);

  const [search, setSearch] = useState('');
  const [selectedBookNo, setSelectedBookNo] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const PAGE_SIZE = 15;

  // รวบรวมรายชื่อเล่มที่มีในระบบทั้งหมดเพื่อใช้เป็นตัวเลือกใน Filter
  const availableBooks = useMemo(() => {
    const set = new Set();
    receipts.forEach(r => {
      if (r.bookNo) set.add(String(r.bookNo).trim());
    });
    return Array.from(set).sort((a, b) => (parseInt(a, 10) || 0) - (parseInt(b, 10) || 0));
  }, [receipts]);

  const filtered = useMemo(() => {
    let list = [...receipts];
    if (selectedBookNo) {
      list = list.filter(r => String(r.bookNo || '').trim() === String(selectedBookNo).trim());
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.receiptNo?.includes(q) ||
        r.receivedFrom?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.bookNo?.includes(q)
      );
    }
    if (startDate) list = list.filter(r => (r.createdAt || r.date) >= startDate);
    if (endDate) list = list.filter(r => (r.createdAt?.split('T')[0] || r.date) <= endDate);
    return list;
  }, [receipts, selectedBookNo, search, startDate, endDate]);

  const totalAmount = filtered.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const resetFilters = () => { setSearch(''); setSelectedBookNo(''); setStartDate(''); setEndDate(''); setPage(1); };

  const handleDeleteClick = (item) => {
    setDeleteTarget(item);
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      deleteReceipt(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  return (
    <div style={{ padding: '24px 16px', maxWidth: 1280, margin: '0 auto' }}>
      {/* Header */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#e8edf5', display: 'flex', alignItems: 'center', gap: 10 }}>
            <BookOpen size={22} style={{ color: '#c9a84c' }} />
            ทะเบียนผู้บริจาค
          </h2>
          <p style={{ fontSize: 12, color: '#6b7a99', marginTop: 4 }}>
            ค้นหา ตรวจสอบข้อมูลผู้บริจาค และสั่งพิมพ์ใบเสร็จซ้ำได้
          </p>
        </div>
        <a
          href={sheetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-success"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '9px 18px', fontSize: 13, fontWeight: 700,
            textDecoration: 'none', borderRadius: 10,
            boxShadow: '0 4px 14px rgba(16,185,129,0.2)',
          }}
          title="เปิดไปยังตารางข้อมูล Google Sheets"
        >
          <Table size={16} />
          เปิดดู Google Sheets
          <ExternalLink size={13} />
        </a>
      </div>

      {/* Filters */}
      <div className="glass-card no-print" style={{ padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr)) auto', gap: 12, alignItems: 'end' }}>
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Search size={12} style={{ color: '#c9a84c' }} />
              ค้นหา (เลขที่ / ชื่อผู้จ่าย / รายการ)
            </label>
            <input
              className="form-input"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="พิมพ์คำค้นหา..."
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <BookOpen size={12} style={{ color: '#c9a84c' }} />
              เลือกเล่มที่
            </label>
            <select
              className="form-select"
              value={selectedBookNo}
              onChange={e => { setSelectedBookNo(e.target.value); setPage(1); }}
            >
              <option value="">-- ทุกเล่ม --</option>
              {availableBooks.map(b => (
                <option key={b} value={b}>
                  เล่มที่ {b}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">ตั้งแต่วันที่</label>
            <input type="date" className="form-input" value={startDate} onChange={e => { setStartDate(e.target.value); setPage(1); }} />
          </div>
          <div className="form-group">
            <label className="form-label">ถึงวันที่</label>
            <input type="date" className="form-input" value={endDate} onChange={e => { setEndDate(e.target.value); setPage(1); }} />
          </div>
          <button className="btn btn-ghost btn-md" onClick={resetFilters} title="ล้างตัวกรอง" style={{ height: 42 }}>
            <RotateCcw size={14} /> รีเซ็ต
          </button>
        </div>
      </div>

      {/* Summary Row */}
      <div className="no-print" style={{
        display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap',
      }}>
        <div style={{ padding: '8px 16px', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: 8, fontSize: 13 }}>
          <span style={{ color: '#6b7a99' }}>รายการที่พบ: </span>
          <strong style={{ color: '#c9a84c' }}>{filtered.length} ฉบับ</strong>
        </div>
        <div style={{ padding: '8px 16px', background: 'rgba(45,95,166,0.1)', border: '1px solid rgba(45,95,166,0.25)', borderRadius: 8, fontSize: 13 }}>
          <span style={{ color: '#6b7a99' }}>ยอดรวม: </span>
          <strong style={{ color: '#e8edf5' }}>{formatBaht(totalAmount)} บาท</strong>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card no-print" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>วันที่</th>
                <th>เล่มที่/เลขที่</th>
                <th>ได้รับเงินจาก</th>
                <th>รายการ</th>
                <th style={{ textAlign: 'right' }}>จำนวนเงิน (บาท)</th>
                <th>ผู้ออก</th>
                <th style={{ textAlign: 'center' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {pageData.map(item => (
                <tr key={item.id}>
                  <td style={{ color: '#a8b5cc', fontSize: 12, whiteSpace: 'nowrap' }}>
                    {toThaiDateShort(item.createdAt?.split('T')[0] || item.date)}
                  </td>
                  <td>
                    <span className="badge badge-blue">{item.bookNo}/{item.receiptNo}</span>
                  </td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.receivedFrom || '—'}
                  </td>
                  <td style={{ color: '#a8b5cc', fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.description || '—'}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#c9a84c' }}>
                    {formatBaht(item.amount)}
                  </td>
                  <td style={{ color: '#6b7a99', fontSize: 11 }}>
                    {item.issuerEmail?.split('@')[0] || '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => setSelectedItem(item)}
                        title="ดู / พิมพ์ใบเสร็จ"
                      >
                        <Eye size={13} /> พรีวิว
                      </button>
                      {isAdmin && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteClick(item)}
                          title="ลบ"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {pageData.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#4b5a75' }}>
                    ไม่พบข้อมูลผู้บริจาค
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr style={{ background: 'rgba(201,168,76,0.05)' }}>
                <td colSpan={4} style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right', color: '#a8b5cc' }}>
                  ยอดรวมทั้งสิ้น ({filtered.length} ฉบับ):
                </td>
                <td style={{ padding: '12px 16px', fontWeight: 800, color: '#c9a84c', fontSize: 15, textAlign: 'right' }}>
                  {formatBaht(totalAmount)}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '16px', borderTop: '1px solid rgba(255,255,255,0.05)',
          }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft size={14} />
            </button>
            <span style={{ fontSize: 13, color: '#a8b5cc' }}>
              หน้า {page} / {totalPages}
            </span>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Modal Preview & Print */}
      {selectedItem && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20, overflowY: 'auto',
        }}>
          <div className="glass-card" style={{
            width: '100%', maxWidth: 850, maxHeight: '90vh', overflowY: 'auto',
            background: '#0f1f3d', padding: 24, borderRadius: 16, border: '1px solid rgba(201,168,76,0.3)',
          }}>
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, color: '#e8edf5', fontWeight: 700 }}>
                ดูใบเสร็จรับเงิน เลขที่ {selectedItem.receiptNo}
              </h3>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button className="btn btn-gold" onClick={() => window.print()}>
                  <Printer size={16} /> สั่งพิมพ์ใบเสร็จ (Print)
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelectedItem(null)}>
                  <X size={18} />
                </button>
              </div>
            </div>

            <div id="modal-receipt-area" style={{ background: '#ffffff', borderRadius: 8, overflow: 'hidden' }}>
              <ReceiptTemplate data={{ ...selectedItem, amount: Number(selectedItem.amount) }} />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <CustomModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        type="delete"
        title="ยืนยันการลบใบเสร็จ?"
        message={`คุณต้องการลบใบเสร็จเลขที่ ${deleteTarget?.receiptNo} (เล่มที่ ${deleteTarget?.bookNo || 1}) ใช่หรือไม่? การดำเนินการนี้จะลบข้อมูลออกจาก Google Sheets ด้วย`}
        details={deleteTarget ? [
          { label: 'ผู้บริจาค/ผู้ชำระ', value: deleteTarget.receivedFrom || '-' },
          { label: 'รายการ', value: deleteTarget.description || '-' },
          { label: 'จำนวนเงิน', value: `฿${formatBaht(deleteTarget.amount)}`, isBaht: true },
          { label: 'วันที่', value: deleteTarget.date || '-' },
        ] : []}
        confirmText="ยืนยันการลบข้อมูล"
        cancelText="ยกเลิก"
      />
    </div>
  );
}
