// ฟังก์ชันแปลงจำนวนเงินเป็นตัวอักษรไทย
export function bahtToText(amount) {
  if (!amount || isNaN(amount) || amount === 0) return 'ศูนย์บาทถ้วน';

  const num = Number(amount).toFixed(2);
  const [bahtStr, satangStr] = num.split('.');
  const baht = parseInt(bahtStr, 10);
  const satang = parseInt(satangStr, 10);

  const digits = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const units = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน'];

  function convertMillions(n) {
    if (n === 0) return '';
    if (n < 1000000) return convertThousands(n);
    return convertThousands(Math.floor(n / 1000000)) + 'ล้าน' + convertThousands(n % 1000000);
  }

  function convertThousands(n) {
    if (n === 0) return '';
    let result = '';
    const str = String(n).padStart(6, '0');
    for (let i = 0; i < 6; i++) {
      const d = parseInt(str[i]);
      const unit = units[5 - i];
      if (d === 0) continue;
      if (d === 1 && unit === 'สิบ') result += 'สิบ';
      else if (d === 2 && unit === 'สิบ') result += 'ยี่สิบ';
      else result += digits[d] + unit;
    }
    return result;
  }

  let result = '';
  if (baht > 0) result += convertMillions(baht) + 'บาท';
  else result += 'ศูนย์บาท';

  if (satang > 0) result += convertThousands(satang) + 'สตางค์';
  else result += 'ถ้วน';

  return result;
}

// แปลงวันที่เป็นภาษาไทย
export function toThaiDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  const months = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
    'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
    'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
}

// แปลงวันที่สั้นภาษาไทย
export function toThaiDateShort(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  const months = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.',
    'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.',
    'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
}

// Format ตัวเลขเงิน
export function formatBaht(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return '0.00';
  return Number(amount).toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Format เลขใบเสร็จ
export function formatReceiptNo(year, number) {
  return `${year}-${String(number).padStart(5, '0')}`;
}

// ดึงวันนี้ในรูป YYYY-MM-DD
export function todayISO() {
  return new Date().toISOString().split('T')[0];
}

// สร้าง Gradient สำหรับ Chart
export const CHART_COLORS = {
  primary: '#c9a84c',
  secondary: '#2d5fa6',
  success: '#10b981',
  danger: '#ef4444',
  muted: '#94a3b8',
};
