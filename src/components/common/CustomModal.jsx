import React, { useEffect } from 'react';
import {
  CheckCircle2, AlertTriangle, Trash2, HelpCircle, X, Printer, ArrowRight, FileText
} from 'lucide-react';
import { formatBaht } from '../../services/utils';

/**
 * CustomModal — ป็อปอัพโมดอลกลางหน้าจอโทนหรูหรา (แทนที่ window.confirm / alert)
 * 
 * Props:
 * - isOpen: boolean
 * - onClose: () => void
 * - onConfirm?: () => void
 * - type: 'confirm' | 'delete' | 'success' | 'info'
 * - title: string
 * - message: string | ReactNode
 * - details?: { label: string, value: string }[]
 * - confirmText?: string
 * - cancelText?: string
 * - confirmBtnStyle?: 'gold' | 'danger' | 'primary'
 * - showPrint?: boolean
 * - onPrint?: () => void
 */
export default function CustomModal({
  isOpen,
  onClose,
  onConfirm,
  type = 'confirm',
  title,
  message,
  details,
  confirmText,
  cancelText = 'ยกเลิก',
  confirmBtnStyle,
  showPrint = false,
  onPrint,
}) {
  // ปิดเมื่อกด Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // กำหนด ธีม และ Icon ตามประเภท
  let iconComponent = <HelpCircle size={32} style={{ color: '#c9a84c' }} />;
  let iconBg = 'rgba(201,168,76,0.15)';
  let iconBorder = 'rgba(201,168,76,0.3)';
  let defaultConfirmText = 'ยืนยัน';
  let defaultBtnClass = 'btn-gold';

  if (type === 'delete') {
    iconComponent = <Trash2 size={32} style={{ color: '#ef4444' }} />;
    iconBg = 'rgba(239,68,68,0.15)';
    iconBorder = 'rgba(239,68,68,0.4)';
    defaultConfirmText = 'ยืนยันการลบ';
    defaultBtnClass = 'btn-danger';
  } else if (type === 'success') {
    iconComponent = <CheckCircle2 size={36} style={{ color: '#10b981' }} />;
    iconBg = 'rgba(16,185,129,0.15)';
    iconBorder = 'rgba(16,185,129,0.4)';
    defaultConfirmText = 'ตกลง';
    defaultBtnClass = 'btn-gold';
  } else if (type === 'confirm') {
    iconComponent = <AlertTriangle size={32} style={{ color: '#c9a84c' }} />;
    iconBg = 'rgba(201,168,76,0.15)';
    iconBorder = 'rgba(201,168,76,0.4)';
    defaultConfirmText = 'ยืนยันทำรายการ';
    defaultBtnClass = 'btn-gold';
  }

  const finalConfirmText = confirmText || defaultConfirmText;
  const finalBtnClass = confirmBtnStyle === 'danger' ? 'btn-danger' : defaultBtnClass;

  return (
    <div
      className="no-print"
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(4, 10, 24, 0.82)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        padding: 16,
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 460,
          background: 'linear-gradient(145deg, #0e1e3b 0%, #081329 100%)',
          border: '1px solid rgba(201, 168, 76, 0.35)',
          borderRadius: 20,
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.75), 0 0 40px rgba(201, 168, 76, 0.1)',
          padding: '28px 24px',
          position: 'relative',
          overflow: 'hidden',
          animation: 'modalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Glow Light Effect */}
        <div style={{
          position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)',
          width: 240, height: 120,
          background: type === 'delete' ? 'rgba(239,68,68,0.2)' : type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(201,168,76,0.18)',
          filter: 'blur(50px)', pointerEvents: 'none', borderRadius: '50%',
        }} />

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 16, right: 16,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '50%', width: 32, height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#a8b5cc', cursor: 'pointer', transition: '0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#a8b5cc'; }}
        >
          <X size={16} />
        </button>

        {/* Icon Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            width: 68, height: 68, borderRadius: '50%',
            background: iconBg, border: `1px solid ${iconBorder}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16,
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          }}>
            {iconComponent}
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: '#e8edf5', margin: '0 0 6px 0', letterSpacing: '-0.01em' }}>
            {title}
          </h3>
          {message && (
            <div style={{ fontSize: 14, color: '#a8b5cc', lineHeight: 1.5, maxWidth: 380 }}>
              {message}
            </div>
          )}
        </div>

        {/* Optional Details Card */}
        {details && details.length > 0 && (
          <div style={{
            background: 'rgba(6, 15, 32, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 12, padding: '14px 16px',
            marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            {details.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                <span style={{ color: '#6b7a99' }}>{item.label}</span>
                <span style={{ color: '#e8edf5', fontWeight: 700, fontFamily: item.isBaht ? 'var(--font-thai)' : 'inherit' }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 12 }}>
          {type !== 'success' && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              style={{
                flex: 1, padding: '11px 18px', fontSize: 14, fontWeight: 600,
                borderRadius: 10, background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)', color: '#a8b5cc',
              }}
            >
              {cancelText}
            </button>
          )}

          {showPrint && onPrint && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => { onPrint(); onClose(); }}
              style={{
                flex: 1, padding: '11px 18px', fontSize: 14, fontWeight: 700,
                borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                background: 'linear-gradient(135deg, #1e4080, #2d5fa6)',
                border: '1px solid rgba(147,190,240,0.3)', color: '#fff',
              }}
            >
              <Printer size={16} />
              พิมพ์ใบเสร็จ
            </button>
          )}

          <button
            type="button"
            className={`btn ${finalBtnClass}`}
            onClick={() => {
              if (onConfirm) onConfirm();
              if (type === 'success' || !onConfirm) onClose();
            }}
            style={{
              flex: 1, padding: '11px 18px', fontSize: 14, fontWeight: 700,
              borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            }}
          >
            {finalConfirmText}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modalSlideUp {
          from {
            opacity: 0;
            transform: scale(0.92) translateY(16px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
