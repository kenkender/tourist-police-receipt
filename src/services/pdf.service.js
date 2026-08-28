import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toThaiDate, formatBaht, bahtToText } from './utils';
import { ORG_INFO } from '../config/google.config';

// สร้าง PDF จาก HTML Element (ใบเสร็จ)
export async function generateReceiptPDF(elementId, receipt, options = {}) {
  const element = document.getElementById(elementId);
  if (!element) throw new Error('ไม่พบ element สำหรับสร้าง PDF');

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

  // ต้นฉบับ
  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight / 2);

  // สำเนา (ถ้าต้องการ)
  if (!options.originalOnly) {
    if (pdfHeight / 2 > pdf.internal.pageSize.getHeight()) {
      pdf.addPage();
    }
    pdf.addImage(imgData, 'PNG', 0, pdfHeight / 2, pdfWidth, pdfHeight / 2);
  }

  const filename = `ใบเสร็จ_${receipt.receiptNo || 'unknown'}_${receipt.createdAt?.split('T')[0] || 'date'}.pdf`;
  pdf.save(filename);
}

// Export Dashboard เป็น PNG
export async function exportDashboardAsImage(elementId, filename = 'dashboard.png') {
  const element = document.getElementById(elementId);
  if (!element) throw new Error('ไม่พบ element');

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#0f1f3d',
    logging: false,
  });

  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

// Export รายการเป็น CSV
export function exportReceiptsToCSV(receipts, filename = 'ทะเบียนใบเสร็จ.csv') {
  const headers = [
    'เลขที่ใบเสร็จ', 'เล่มที่', 'วันที่', 'ได้รับเงินจาก',
    'รายการ', 'จำนวนเงิน (บาท)', 'ผู้ออกใบเสร็จ', 'วันเวลาที่บันทึก',
  ];

  const rows = receipts.map(r => [
    r.receiptNo || '',
    r.bookNo || '',
    toThaiDate(r.createdAt?.split('T')[0] || r.date),
    r.receivedFrom || '',
    r.description || '',
    formatBaht(r.amount),
    r.issuerEmail || '',
    r.createdAt ? new Date(r.createdAt).toLocaleString('th-TH') : '',
  ]);

  const BOM = '\uFEFF'; // สำหรับ Excel รองรับภาษาไทย
  const csvContent = BOM + [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
