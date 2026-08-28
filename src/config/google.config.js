// Google API Configuration
// กรอกค่าเหล่านี้หลังจาก Setup Google Cloud Project แล้ว (ดู docs/SETUP_GUIDE.md)

export const GOOGLE_CONFIG = {
  // Google OAuth 2.0 Client ID จาก Google Cloud Console
  CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',

  // Google Sheets API Key
  API_KEY: import.meta.env.VITE_GOOGLE_API_KEY || '',

  // Google Spreadsheet ID (จาก URL ของ Sheet)
  SPREADSHEET_ID: import.meta.env.VITE_SPREADSHEET_ID || '',

  // Google Apps Script Web App URL (สำหรับ Lock เลขใบเสร็จ)
  APPS_SCRIPT_URL: import.meta.env.VITE_APPS_SCRIPT_URL || '',

  // Scopes ที่ต้องการ
  SCOPES: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file',
  ].join(' '),

  // Discovery Doc
  DISCOVERY_DOC: 'https://sheets.googleapis.com/$discovery/rest?version=v4',
};

// LINE Login Configuration
export const LINE_CONFIG = {
  CHANNEL_ID: import.meta.env.VITE_LINE_CHANNEL_ID || '',
  LIFF_ID: import.meta.env.VITE_LIFF_ID || '',
};


// Sheet Names
export const SHEET_NAMES = {
  RECEIPTS: 'receipts',
  USERS: 'users',
  COUNTER: 'counter',
};

// ข้อมูลองค์กร (ใช้ในใบเสร็จ)
export const ORG_INFO = {
  name: 'กองทุนสวัสดิการ กองบัญชาการตำรวจท่องเที่ยว',
  address: 'ที่อยู่ 999 หมู่ 1 ถ.สุวรรณภูมิ 4 ต.หนองปรือ อ.บางพลี จว.สมุทรปราการ 10540',
  shortName: 'บช.ตำรวจท่องเที่ยว',
  defaultSigner: {
    name: 'รัชฎาพร ราชกิจ',
    rank: 'พ.ต.อ.หญิง',
    position: 'เหรัญญิก',
  },
  defaultBookNo: '2',
};

// ปีงบประมาณ (2 หลักท้ายของ พ.ศ.)
export const FISCAL_YEAR = (() => {
  const now = new Date();
  const buddhistYear = now.getFullYear() + 543;
  // ปีงบประมาณไทย เริ่ม ต.ค. - ก.ย.
  const fiscalYear = now.getMonth() >= 9 ? buddhistYear + 1 : buddhistYear;
  return String(fiscalYear).slice(-2);
})();
