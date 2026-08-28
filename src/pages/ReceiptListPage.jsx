import { useState, useMemo } from 'react';
import { useReceipts } from '../contexts/ReceiptContext';
import { useAuth } from '../contexts/AuthContext';
import { formatBaht, toThaiDateShort } from '../services/utils';
import ReceiptTemplate from '../components/receipt/ReceiptTemplate';
import {
  BookOpen, Search, RotateCcw, Printer,
  Trash2, Eye, ChevronLeft, ChevronRight, X,
} from 'lucide-react';

export default function ReceiptListPage() {
  const { receipts, deleteReceipt } = useReceipts();
  const { isAdmin } = useAuth();

  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState(null);
  const PAGE_SIZE = 15;

  const filtered = useMemo(() => {
    let list = [...receipts];
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
  }, [receipts, search, startDate, endDate]);

  const totalAmount = filtered.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const resetFilters = () => { setSearch(''); setStartDate(''); setEndDate(''); setPage(1); };

  const handleDelete = (item) => {
    if (confirm(`ยืนยันลบใบเสร็จเลขที่ ${item.receiptNo}?`)) {
      deleteReceipt(item.id);
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
      </div>

      {/* Filters */}
      <div className="glass-card no-print" style={{ padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
          <div className="form-group">
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
            <label className="form-label">ตั้งแต่วันที่</label>
            <input type="date" className="form-input" value={startDate} onChange={e => { setStartDate(e.target.value); setPage(1); }} />
          </div>
          <div className="form-group">
            <label className="form-label">ถึงวันที่</label>
            <input type="date" className="form-input" value={endDate} onChange={e => { setEndDate(e.target.value); setPage(1); }} />
          </div>
          <button className="btn btn-ghost" onClick={resetFilters} style={{ marginBottom: 0 }}>
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
                          onClick={() => handleDelete(item)}
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
    </div>
  );
}
