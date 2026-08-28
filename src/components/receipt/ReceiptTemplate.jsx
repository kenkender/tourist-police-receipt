import { useRef } from 'react';
import { toThaiDate, formatBaht, bahtToText } from '../../services/utils';
import { ORG_INFO } from '../../config/google.config';
import { PoliceEmblem } from '../layout/Navbar';

// Template ใบเสร็จย่อย (ต้นฉบับ / สำเนา) — ออกแบบความสูงให้ลงตัวพอดี 2 ใบใน 1 A4
function ReceiptCopy({ data, copyType }) {
  const { bookNo, receiptNo, date, receivedFrom, description, amount, signerName, signerRank, signerPosition } = data;

  return (
    <div style={{
      background: '#ffffff',
      color: '#000000',
      border: '1.5px solid #1e3a8a',
      borderRadius: 6,
      padding: '16px 20px',
      fontFamily: "'Sarabun', sans-serif",
      fontSize: 13,
      position: 'relative',
      boxSizing: 'border-box',
    }}>
      {/* Copy label */}
      <div style={{
        position: 'absolute', top: 8, right: 12,
        fontSize: 10, fontWeight: 700, color: '#475569',
        border: '1px solid #94a3b8',
        padding: '1px 6px', borderRadius: 4,
        background: '#f8fafc',
      }}>
        {copyType}
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ flexShrink: 0 }}>
          <PoliceEmblem size={56} />
        </div>
        <div style={{ flex: 1, textAlign: 'center', paddingLeft: 4 }}>
          <h1 style={{
            fontSize: 18, fontWeight: 800, color: '#1e3a8a',
            letterSpacing: 0.5, marginBottom: 2, margin: 0,
          }}>
            ใบเสร็จรับเงิน
          </h1>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: '2px 0' }}>
            {ORG_INFO.name}
          </h2>
          <p style={{ fontSize: 10, color: '#475569', margin: 0, lineHeight: 1.3 }}>
            {ORG_INFO.address}
          </p>
        </div>
        <div style={{ width: 56, flexShrink: 0 }} />
      </div>

      {/* ข้อมูลใบเสร็จ (เล่มที่/เลขที่/วันที่) */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        padding: '6px 0',
        borderTop: '1px solid #1e3a8a',
        borderBottom: '1px solid #1e3a8a',
        marginBottom: 10,
        fontSize: 12,
      }}>
        <div>
          <span style={{ fontWeight: 700, color: '#334155' }}>เล่มที่ : </span>
          <span style={{ fontWeight: 700, paddingLeft: 2 }}>{bookNo || '—'}</span>
        </div>
        <div>
          <span style={{ fontWeight: 700, color: '#334155' }}>เลขที่ : </span>
          <span style={{ fontWeight: 800, color: '#1e3a8a', fontSize: 13, paddingLeft: 2 }}>
            {receiptNo || '—'}
          </span>
        </div>
        <div>
          <span style={{ fontWeight: 700, color: '#334155' }}>วันที่ : </span>
          <span style={{ fontWeight: 700, paddingLeft: 2 }}>{toThaiDate(date)}</span>
        </div>
      </div>

      {/* ได้รับเงินจาก */}
      <div style={{
        display: 'flex', alignItems: 'flex-end',
        borderBottom: '1px dotted #94a3b8',
        paddingBottom: 4, marginBottom: 10, gap: 4, fontSize: 12,
      }}>
        <span style={{ fontWeight: 700, color: '#334155', whiteSpace: 'nowrap' }}>ได้รับเงินจาก :</span>
        <span style={{ flex: 1, fontWeight: 600, paddingLeft: 4, minHeight: 20, color: '#0f172a' }}>
          {receivedFrom || '...................................................................'}
        </span>
      </div>

      {/* ตารางรายการ */}
      <table style={{
        width: '100%', borderCollapse: 'collapse',
        fontSize: 12, marginBottom: 8,
      }}>
        <thead>
          <tr style={{ background: '#eff6ff' }}>
            <th style={{ border: '1px solid #1e3a8a', padding: '4px 6px', textAlign: 'center', width: 40 }}>ลำดับ</th>
            <th style={{ border: '1px solid #1e3a8a', padding: '4px 6px', textAlign: 'left' }}>รายการ</th>
            <th style={{ border: '1px solid #1e3a8a', padding: '4px 6px', textAlign: 'center', width: 110 }}>จำนวนเงิน (บาท)</th>
            <th style={{ border: '1px solid #1e3a8a', padding: '4px 6px', textAlign: 'center', width: 40 }}>สต.</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #1e3a8a', padding: '6px', textAlign: 'center' }}>1</td>
            <td style={{ border: '1px solid #1e3a8a', padding: '6px' }}>{description || ''}</td>
            <td style={{ border: '1px solid #1e3a8a', padding: '6px', textAlign: 'right', fontWeight: 700 }}>
              {formatBaht(amount).split('.')[0]}
            </td>
            <td style={{ border: '1px solid #1e3a8a', padding: '6px', textAlign: 'center' }}>
              {formatBaht(amount).split('.')[1] || '00'}
            </td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #1e3a8a', padding: '4px', textAlign: 'center', color: '#cbd5e1' }}>2</td>
            <td style={{ border: '1px solid #1e3a8a', padding: '4px' }}></td>
            <td style={{ border: '1px solid #1e3a8a', padding: '4px' }}></td>
            <td style={{ border: '1px solid #1e3a8a', padding: '4px' }}></td>
          </tr>
          <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
            <td colSpan={2} style={{ border: '1px solid #1e3a8a', padding: '5px 6px', textAlign: 'right' }}>รวมทั้งสิ้น</td>
            <td style={{ border: '1px solid #1e3a8a', padding: '5px 6px', textAlign: 'right', color: '#1e3a8a', fontSize: 13 }}>
              {formatBaht(amount).split('.')[0]}
            </td>
            <td style={{ border: '1px solid #1e3a8a', padding: '5px 6px', textAlign: 'center' }}>
              {formatBaht(amount).split('.')[1] || '00'}
            </td>
          </tr>
        </tbody>
      </table>

      {/* จำนวนเงินตัวอักษร */}
      <div style={{
        display: 'flex', alignItems: 'flex-end',
        borderBottom: '1px dotted #94a3b8',
        paddingBottom: 4, marginBottom: 12, gap: 4, fontSize: 12,
      }}>
        <span style={{ fontWeight: 700, color: '#334155', whiteSpace: 'nowrap' }}>จำนวนเงิน (ตัวอักษร) :</span>
        <span style={{ flex: 1, fontWeight: 700, color: '#1e3a8a', paddingLeft: 4 }}>
          ({bahtToText(amount)})
        </span>
      </div>

      {/* ลายเซ็น */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 2 }}>
        <div style={{ textAlign: 'center', width: 220 }}>
          <div style={{ fontSize: 11, marginBottom: 2 }}>
            ลงชื่อ {signerRank}
          </div>
          <div style={{
            height: 36, borderBottom: '1px solid #94a3b8',
            marginBottom: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: '#cbd5e1', fontSize: 11, fontStyle: 'italic' }}>( ลายมือชื่อ )</span>
          </div>
          <div style={{ fontSize: 12, fontWeight: 600 }}>({signerName || '—'})</div>
          <div style={{ fontSize: 11, color: '#475569', marginTop: 1 }}>{signerPosition || ''}</div>
        </div>
      </div>
    </div>
  );
}

// Exported component สำหรับ preview และ PDF — ควบคุมความสูง A4 1 หน้ากระดาษพอดี
export default function ReceiptTemplate({ data, id = 'receipt-template' }) {
  return (
    <div id={id} className="receipt-print-wrapper" style={{
      background: '#ffffff',
      width: '100%',
      maxWidth: '210mm',
      margin: '0 auto',
      boxSizing: 'border-box',
      padding: '8mm 10mm',
    }}>
      {/* ต้นฉบับ */}
      <div>
        <ReceiptCopy data={data} copyType="ต้นฉบับ (ORIGINAL)" />
      </div>

      {/* เส้นรอยปรอสำหรับตัดแบ่ง */}
      <div style={{
        margin: '12px 0',
        borderTop: '1.5px dashed #94a3b8',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        <span style={{
          background: '#ffffff', padding: '0 10px',
          fontSize: 9, color: '#64748b', position: 'absolute', top: -7,
        }}>✂️ ตัดตามรอยประ</span>
      </div>

      {/* สำเนา */}
      <div>
        <ReceiptCopy data={data} copyType="สำเนา (COPY)" />
      </div>
    </div>
  );
}
