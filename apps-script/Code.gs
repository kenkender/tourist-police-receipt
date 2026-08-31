/**
 * Google Apps Script — ระบบออกใบเสร็จรับเงิน & ตรวจสอบสิทธิ์ผู้ใช้
 * กองทุนสวัสดิการ กองบัญชาการตำรวจท่องเที่ยว
 * 
 * [แก้ไขใหม่] แยกชุดเลขที่ใบเสร็จตาม "เลขเล่ม (bookNo)" และ "ปีงบประมาณ (fiscalYear)"
 * - เล่มที่ 1: 69-00001, 69-00002, ...
 * - เล่มที่ 2: 69-00001, ... 69-00014, 69-00015, ...
 */

const SPREADSHEET_ID = '1vqpnYo_Opcwi2rpMeieAoFjni5PBkAO4J-Yqeamt8Fc';
const COUNTER_SHEET = 'counter';
const RECEIPTS_SHEET = 'receipts';
const USERS_SHEET = 'users';

function doGet(e) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  try {
    const action = e ? e.parameter.action : 'nextNumber';

    if (action === 'nextNumber') {
      return getNextReceiptNumber(e, headers);
    }
    if (action === 'getReceipts') {
      return getAllReceipts(headers);
    }
    if (action === 'getUserRole') {
      const email = e ? e.parameter.email : '';
      const name = e ? e.parameter.name : '';
      return getUserRole(email, name, headers);
    }

    return response({ success: false, error: 'Unknown action' }, headers);
  } catch (err) {
    return response({ success: false, error: err.message }, headers);
  }
}

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
    if (action === 'deleteReceipt') {
      return deleteReceiptFromSheet(data, headers);
    }

    return response({ success: false, error: 'Unknown action' }, headers);
  } catch (err) {
    return response({ success: false, error: err.message }, headers);
  }
}

/**
 * ขอเลขใบเสร็จถัดไป — แยกตามเลขเล่ม (bookNo) และ ปีงบประมาณ (fiscalYear)
 * - สแกนหาเลขสูงสุดที่มีใน receipts sheet สำหรับ bookNo นี้ก่อนเสมอ
 * - ใช้ LockService ป้องกัน Race Condition
 */
function getNextReceiptNumber(e, headers) {
  const lock = LockService.getScriptLock();
  const acquired = lock.tryLock(10000);

  if (!acquired) {
    return response({ success: false, error: 'ระบบกำลังประมวลผล กรุณาลองใหม่' }, headers);
  }

  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const fiscalYear = (e && e.parameter && e.parameter.year) ? String(e.parameter.year).trim() : getFiscalYear();
    const bookNo = (e && e.parameter && e.parameter.bookNo) ? String(e.parameter.bookNo).trim() : '1';

    // ─── 1. หาเลขสูงสุดจาก receipts sheet สำหรับ (fiscalYear, bookNo) เดียวกัน ───────
    let maxFromReceipts = 0;
    const receiptsSheet = ss.getSheetByName(RECEIPTS_SHEET);
    if (receiptsSheet && receiptsSheet.getLastRow() > 1) {
      const rData = receiptsSheet.getDataRange().getValues();
      for (let i = 1; i < rData.length; i++) {
        const rno = String(rData[i][0] || '').trim();
        const rBook = String(rData[i][1] || '').trim();

        if (rno.startsWith(fiscalYear + '-') && rBook === bookNo) {
          const parts = rno.split('-');
          const num = parseInt(parts[1], 10);
          if (!isNaN(num) && num > maxFromReceipts) maxFromReceipts = num;
        }
      }
    }

    // ─── 2. หาเลขจาก counter sheet สำหรับ (fiscalYear, bookNo) ───────────────
    let maxFromCounter = 0;
    let counterRowIndex = -1;
    let counterSheet = ss.getSheetByName(COUNTER_SHEET);
    if (!counterSheet) {
      initCounterSheet(ss);
      counterSheet = ss.getSheetByName(COUNTER_SHEET);
    }
    const cData = counterSheet.getDataRange().getValues();
    const hasBookCol = cData[0] && cData[0].length >= 4 && String(cData[0][1]).toLowerCase() === 'book_no';

    if (hasBookCol) {
      for (let i = 1; i < cData.length; i++) {
        if (String(cData[i][0]).trim() === fiscalYear && String(cData[i][1]).trim() === bookNo) {
          counterRowIndex = i + 1;
          maxFromCounter = parseInt(cData[i][2], 10) || 0;
          break;
        }
      }
    } else {
      const targetKey = fiscalYear + '_' + bookNo;
      for (let i = 1; i < cData.length; i++) {
        const key = String(cData[i][0]).trim();
        if (key === targetKey || (bookNo === '1' && key === fiscalYear)) {
          counterRowIndex = i + 1;
          maxFromCounter = parseInt(cData[i][1], 10) || 0;
          break;
        }
      }
    }

    // ─── 3. nextNumber = MAX(receipts, counter) + 1 ───────────────────────────
    const currentMax = Math.max(maxFromReceipts, maxFromCounter);
    const nextNumber = currentMax + 1;

    // ─── 4. อัปเดต counter sheet ──────────────────────────────────────────────
    if (hasBookCol) {
      if (counterRowIndex === -1) {
        counterSheet.appendRow([fiscalYear, bookNo, nextNumber, new Date()]);
      } else {
        counterSheet.getRange(counterRowIndex, 3).setValue(nextNumber);
        counterSheet.getRange(counterRowIndex, 4).setValue(new Date());
      }
    } else {
      const targetKey = fiscalYear + '_' + bookNo;
      if (counterRowIndex === -1) {
        counterSheet.appendRow([targetKey, nextNumber, new Date()]);
      } else {
        counterSheet.getRange(counterRowIndex, 1).setValue(targetKey);
        counterSheet.getRange(counterRowIndex, 2).setValue(nextNumber);
        counterSheet.getRange(counterRowIndex, 3).setValue(new Date());
      }
    }

    const receiptNo = fiscalYear + '-' + String(nextNumber).padStart(5, '0');

    return response({
      success: true,
      receiptNo: receiptNo,
      number: nextNumber,
      year: fiscalYear,
      bookNo: bookNo,
    }, headers);

  } finally {
    lock.releaseLock();
  }
}

/**
 * ลบรายการใบเสร็จออกจาก Google Sheets
 */
function deleteReceiptFromSheet(data, headers) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(RECEIPTS_SHEET);
    if (!sheet) return response({ success: true, message: 'Sheet not found' }, headers);

    const existing = sheet.getDataRange().getValues();
    for (let i = existing.length - 1; i >= 1; i--) {
      const rowReceiptNo = String(existing[i][0]).trim();
      const rowBookNo = String(existing[i][1]).trim();

      if (rowReceiptNo === String(data.receiptNo).trim() &&
          (!data.bookNo || rowBookNo === String(data.bookNo).trim())) {
        sheet.deleteRow(i + 1);
        return response({ success: true, message: 'ลบข้อมูลใน Sheets เรียบร้อย' }, headers);
      }
    }
    return response({ success: true, message: 'ไม่พบรายการที่ต้องการลบใน Sheets' }, headers);
  } catch (err) {
    return response({ success: false, error: err.message }, headers);
  }
}

/**
 * ตรวจสอบสิทธิ์การใช้งาน
 */
function getUserRole(email, name, headers) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(USERS_SHEET);
    if (!sheet) sheet = initUsersSheet(ss);

    const cleanEmail = (email || '').toLowerCase().trim();
    const cleanName = (name || '').toLowerCase().trim();
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      const rowEmail = String(data[i][0] || '').toLowerCase().trim();
      const rowRole = String(data[i][1] || 'issuer').toLowerCase().trim();
      const rowName = String(data[i][2] || '').toLowerCase().trim();

      const isMatch = (cleanEmail && (rowEmail === cleanEmail || rowName === cleanEmail)) ||
                      (cleanName && (rowEmail === cleanName || rowName === cleanName));

      if (isMatch) {
        return response({
          success: true,
          email: cleanEmail,
          role: rowRole,
          name: data[i][2] || cleanName || cleanEmail.split('@')[0],
        }, headers);
      }
    }

    return response({
      success: true,
      email: cleanEmail,
      role: 'issuer',
      name: cleanName || cleanEmail.split('@')[0],
    }, headers);
  } catch (err) {
    return response({ success: false, error: err.message, role: 'issuer' }, headers);
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

    // ตรวจสอบเลขซ้ำเฉพาะในเล่มเดียวกัน (receiptNo + bookNo)
    const existing = sheet.getDataRange().getValues();
    for (let i = 1; i < existing.length; i++) {
      if (String(existing[i][0]).trim() === String(data.receiptNo).trim() &&
          String(existing[i][1]).trim() === String(data.bookNo).trim()) {
        return response({ success: false, error: 'เลขที่ใบเสร็จซ้ำในเล่มนี้' }, headers);
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

function initUsersSheet(ss) {
  const sheet = ss.insertSheet(USERS_SHEET);
  sheet.getRange(1, 1, 1, 3).setValues([['email', 'role', 'name']]);
  sheet.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#1e3a8a').setFontColor('#ffffff');
  return sheet;
}

function initCounterSheet(ss) {
  const sheet = ss.insertSheet(COUNTER_SHEET);
  sheet.getRange(1, 1, 1, 4).setValues([['fiscal_year', 'book_no', 'last_number', 'updated_at']]);
  sheet.getRange(1, 1, 1, 4).setFontWeight('bold').setBackground('#1e3a8a').setFontColor('#ffffff');
}

function initReceiptsSheet(ss) {
  const sheet = ss.insertSheet(RECEIPTS_SHEET);
  const headers = [
    'receipt_no', 'book_no', 'date', 'received_from', 'description',
    'amount', 'signer_name', 'signer_position', 'signer_rank',
    'issuer_email', 'issuer_name', 'created_at'
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#1e3a8a').setFontColor('#ffffff');
  return sheet;
}

function getFiscalYear() {
  const now = new Date();
  const buddhistYear = now.getFullYear() + 543;
  const fiscalYear = now.getMonth() >= 9 ? buddhistYear + 1 : buddhistYear;
  return String(fiscalYear).slice(-2);
}

function response(data, headers) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
