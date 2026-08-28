/**
 * Google Apps Script — ระบบออกใบเสร็จรับเงิน & ตรวจสอบสิทธิ์ผู้ใช้
 * กองทุนสวัสดิการ กองบัญชาการตำรวจท่องเที่ยว
 *
 * วิธีใช้:
 * 1. เปิด script.google.com สร้าง Project ใหม่
 * 2. วาง Code นี้ลงไป
 * 3. แก้ SPREADSHEET_ID ให้ตรงกับ Sheet ของคุณ
 * 4. Deploy > New Deployment > Web App
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy URL ที่ได้ไปใส่ใน .env ของโปรเจค
 */

const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE'; // ← แก้ตรงนี้!
const COUNTER_SHEET = 'counter';
const RECEIPTS_SHEET = 'receipts';
const USERS_SHEET = 'users';

/**
 * GET request — ประมวลผลคำขอ GET
 */
function doGet(e) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  try {
    const action = e.parameter.action || 'nextNumber';

    if (action === 'nextNumber') {
      return getNextReceiptNumber(e, headers);
    }

    if (action === 'getReceipts') {
      return getAllReceipts(headers);
    }

    if (action === 'getUserRole') {
      return getUserRole(e.parameter.email, headers);
    }

    return response({ success: false, error: 'Unknown action' }, headers);
  } catch (err) {
    return response({ success: false, error: err.message }, headers);
  }
}

/**
 * POST request — บันทึกข้อมูล
 */
function doPost(e) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action || 'saveReceipt';

    if (action === 'saveReceipt') {
      return saveReceipt(data, headers);
    }

    return response({ success: false, error: 'Unknown action' }, headers);
  } catch (err) {
    return response({ success: false, error: err.message }, headers);
  }
}

/**
 * ตรวจสอบสิทธิ์การใช้งานจากแผ่นงาน users ใน Google Sheets
 */
function getUserRole(email, headers) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(USERS_SHEET);

    if (!sheet) {
      sheet = initUsersSheet(ss);
    }

    const cleanEmail = (email || '').toLowerCase().trim();
    if (!cleanEmail) {
      return response({ success: true, role: 'issuer', name: 'เจ้าหน้าที่' }, headers);
    }

    const data = sheet.getDataRange().getValues();

    // ค้นหาอีเมลในตาราง users (คอลัมน์ 1 = email, คอลัมน์ 2 = role, คอลัมน์ 3 = name)
    for (let i = 1; i < data.length; i++) {
      const userEmail = String(data[i][0]).toLowerCase().trim();
      if (userEmail === cleanEmail) {
        return response({
          success: true,
          email: cleanEmail,
          role: String(data[i][1] || 'issuer').toLowerCase().trim(),
          name: data[i][2] || cleanEmail.split('@')[0],
        }, headers);
      }
    }

    // หากไม่อยู่ในตาราง ให้สิทธิ์เริ่มต้นเป็น issuer (ผู้ออกใบเสร็จ)
    return response({
      success: true,
      email: cleanEmail,
      role: 'issuer',
      name: cleanEmail.split('@')[0],
    }, headers);

  } catch (err) {
    return response({ success: false, error: err.message, role: 'issuer' }, headers);
  }
}

/**
 * ขอเลขใบเสร็จถัดไป — ใช้ LockService เพื่อป้องกัน Race Condition
 */
function getNextReceiptNumber(e, headers) {
  const lock = LockService.getScriptLock();
  const acquired = lock.tryLock(10000); // รอสูงสุด 10 วินาที

  if (!acquired) {
    return response({ success: false, error: 'ระบบกำลังประมวลผล กรุณาลองใหม่' }, headers);
  }

  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(COUNTER_SHEET);

    if (!sheet) {
      initCounterSheet(ss);
      return getNextReceiptNumber(e, headers);
    }

    const fiscalYear = e.parameter.year || getFiscalYear();
    const data = sheet.getDataRange().getValues();

    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(fiscalYear)) {
        rowIndex = i + 1;
        break;
      }
    }

    let lastNumber = 0;

    if (rowIndex === -1) {
      sheet.appendRow([fiscalYear, 1, new Date()]);
      lastNumber = 1;
    } else {
      lastNumber = parseInt(sheet.getRange(rowIndex, 2).getValue()) + 1;
      sheet.getRange(rowIndex, 2).setValue(lastNumber);
      sheet.getRange(rowIndex, 3).setValue(new Date());
    }

    const receiptNo = `${fiscalYear}-${String(lastNumber).padStart(5, '0')}`;

    return response({
      success: true,
      receiptNo: receiptNo,
      number: lastNumber,
      year: fiscalYear,
    }, headers);

  } finally {
    lock.releaseLock();
  }
}

/**
 * บันทึกใบเสร็จลง Google Sheets
 */
function saveReceipt(data, headers) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(RECEIPTS_SHEET);

    if (!sheet) {
      initReceiptsSheet(ss);
      return saveReceipt(data, headers);
    }

    const existing = sheet.getDataRange().getValues();
    for (let i = 1; i < existing.length; i++) {
      if (String(existing[i][0]) === String(data.receiptNo) &&
          String(existing[i][1]) === String(data.bookNo)) {
        return response({ success: false, error: 'เลขที่ใบเสร็จซ้ำในระบบ' }, headers);
      }
    }

    const row = [
      data.receiptNo,
      data.bookNo,
      data.date,
      data.receivedFrom,
      data.description,
      data.amount,
      data.signerName,
      data.signerPosition,
      data.signerRank,
      data.issuerEmail,
      data.issuerName,
      new Date().toISOString(),
    ];

    sheet.appendRow(row);

    return response({ success: true, message: 'บันทึกสำเร็จ' }, headers);
  } catch (err) {
    return response({ success: false, error: err.message }, headers);
  }
}

/**
 * ดึงข้อมูลใบเสร็จทั้งหมด
 */
function getAllReceipts(headers) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(RECEIPTS_SHEET);
    if (!sheet) return response({ success: true, data: [] }, headers);

    const data = sheet.getDataRange().getValues();
    const keys = data[0];
    const receipts = [];

    for (let i = 1; i < data.length; i++) {
      const row = {};
      keys.forEach((key, j) => { row[key] = data[i][j]; });
      receipts.push(row);
    }

    return response({ success: true, data: receipts }, headers);
  } catch (err) {
    return response({ success: false, error: err.message }, headers);
  }
}

/**
 * สร้าง Users Sheet เริ่มต้น
 */
function initUsersSheet(ss) {
  const sheet = ss.insertSheet(USERS_SHEET);
  const headers = ['email', 'role', 'name'];
  sheet.getRange(1, 1, 1, 3).setValues([headers]);
  sheet.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#1e3a8a').setFontColor('#ffffff');
  return sheet;
}

/**
 * สร้าง Counter Sheet เริ่มต้น
 */
function initCounterSheet(ss) {
  const sheet = ss.insertSheet(COUNTER_SHEET);
  sheet.getRange(1, 1, 1, 3).setValues([['fiscal_year', 'last_number', 'updated_at']]);
  sheet.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#1e3a8a').setFontColor('#ffffff');
}

/**
 * สร้าง Receipts Sheet เริ่มต้น
 */
function initReceiptsSheet(ss) {
  const sheet = ss.insertSheet(RECEIPTS_SHEET);
  const headers = [
    'receipt_no', 'book_no', 'date', 'received_from', 'description',
    'amount', 'signer_name', 'signer_position', 'signer_rank',
    'issuer_email', 'issuer_name', 'created_at'
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#1e3a8a').setFontColor('#ffffff');
}

/**
 * คำนวณปีงบประมาณไทย (2 หลักท้าย พ.ศ.)
 */
function getFiscalYear() {
  const now = new Date();
  const buddhistYear = now.getFullYear() + 543;
  const fiscalYear = now.getMonth() >= 9 ? buddhistYear + 1 : buddhistYear;
  return String(fiscalYear).slice(-2);
}

/**
 * Helper สร้าง JSON Response
 */
function response(data, headers) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
