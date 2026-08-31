/**
 * Google Apps Script — ระบบออกใบเสร็จรับเงิน & ตรวจสอบสิทธิ์ผู้ใช้
 * กองทุนสวัสดิการ กองบัญชาการตำรวจท่องเที่ยว
 * 
 * [แก้ไขสมบูรณ์แบบ]
 * 1. getNextReceiptNumber เป็น READ-ONLY 100% (ไม่แก้ไข/ไม่รันเลขมั่วเมื่อกดรีเฟรชหน้าเว็บ)
 * 2. คำนวณเลขที่ใบเสร็จแยกตาม "เลขเล่ม (bookNo)" และ "ปีงบประมาณ (fiscalYear)" จากข้อมูลที่มีอยู่จริงใน sheet
 * 3. ใช้ LockService ใน saveReceipt เพื่อป้องกันเลขซ้ำเมื่อบันทึกพร้อมกันหลายเครื่อง
 */

const SPREADSHEET_ID = '1vqpnYo_Opcwi2rpMeieAoFjni5PBkAO4J-Yqeamt8Fc';
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
    if (action === 'cancelReceipt') {
      return cancelReceiptInSheet(data, headers);
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
 * ขอเลขใบเสร็จถัดไป (READ-ONLY 100%)
 * - ไม่มีการเขียนลง Sheet ใดๆ เมื่อเรียกดูเลข (กดรีเฟรช 100 ครั้งเลขก็ไม่เปลี่ยน)
 * - คำนวณจากเลขสูงสุดที่มีจริงใน receipts sheet แยกตาม bookNo และ fiscalYear
 */
function getNextReceiptNumber(e, headers) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const fiscalYear = (e && e.parameter && e.parameter.year) ? String(e.parameter.year).trim() : getFiscalYear();
    const bookNo = (e && e.parameter && e.parameter.bookNo) ? String(e.parameter.bookNo).trim() : '1';

    let maxNumber = 0;
    const receiptsSheet = ss.getSheetByName(RECEIPTS_SHEET);
    if (receiptsSheet && receiptsSheet.getLastRow() > 1) {
      const rData = receiptsSheet.getDataRange().getValues();
      for (let i = 1; i < rData.length; i++) {
        const rno = String(rData[i][0] || '').trim();
        const rBook = String(rData[i][1] || '').trim();

        if (rno.startsWith(fiscalYear + '-') && rBook === bookNo) {
          const parts = rno.split('-');
          const num = parseInt(parts[1], 10);
          if (!isNaN(num) && num > maxNumber) maxNumber = num;
        }
      }
    }

    const nextNumber = maxNumber + 1;
    const receiptNo = fiscalYear + '-' + String(nextNumber).padStart(5, '0');

    return response({
      success: true,
      receiptNo: receiptNo,
      number: nextNumber,
      year: fiscalYear,
      bookNo: bookNo,
    }, headers);
  } catch (err) {
    return response({ success: false, error: err.message }, headers);
  }
}

/**
 * บันทึกใบเสร็จลง Google Sheets พร้อม LockService ป้องกัน race condition
 */
function saveReceipt(data, headers) {
  const lock = LockService.getScriptLock();
  const acquired = lock.tryLock(10000);

  if (!acquired) {
    return response({ success: false, error: 'ระบบกำลังประมวลผล กรุณาลองใหม่' }, headers);
  }

  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(RECEIPTS_SHEET);

    if (!sheet) {
      sheet = initReceiptsSheet(ss);
    }

    const fiscalYear = data.fiscalYear || getFiscalYear();
    const bookNo = String(data.bookNo || '1').trim();

    // 1. หาเลขสูงสุดปัจจุบันใน receipts sheet สำหรับ bookNo และ fiscalYear นี้
    let maxNumber = 0;
    const existing = sheet.getDataRange().getValues();
    for (let i = 1; i < existing.length; i++) {
      const rno = String(existing[i][0] || '').trim();
      const rBook = String(existing[i][1] || '').trim();
      if (rno.startsWith(fiscalYear + '-') && rBook === bookNo) {
        const parts = rno.split('-');
        const num = parseInt(parts[1], 10);
        if (!isNaN(num) && num > maxNumber) maxNumber = num;
      }
    }

    // 2. ถ้าผู้ส่งระบุ receiptNo มา ให้ตรวจสอบว่าซ้ำในเล่มนี้หรือไม่
    let receiptNo = data.receiptNo ? String(data.receiptNo).trim() : '';
    let isDuplicate = false;
    if (receiptNo) {
      for (let i = 1; i < existing.length; i++) {
        if (String(existing[i][0]).trim() === receiptNo &&
            String(existing[i][1]).trim() === bookNo) {
          isDuplicate = true;
          break;
        }
      }
    }

    // ถ้าซ้ำ หรือ ไม่มีเลข ให้รันเลขถัดไปให้อัตโนมัติ (maxNumber + 1)
    if (!receiptNo || isDuplicate) {
      const nextNum = maxNumber + 1;
      receiptNo = fiscalYear + '-' + String(nextNum).padStart(5, '0');
    }

    const row = [
      receiptNo,
      bookNo,
      data.date || '',
      data.receivedFrom || '',
      data.description || '',
      data.amount || 0,
      data.signerName || '',
      data.signerPosition || '',
      data.signerRank || '',
      data.issuerEmail || '',
      data.issuerName || '',
      new Date().toISOString(),
      data.status || 'ใช้งาน',
    ];

    sheet.appendRow(row);

    return response({
      success: true,
      message: 'บันทึกสำเร็จ',
      receiptNo: receiptNo,
      bookNo: bookNo,
    }, headers);

  } catch (err) {
    return response({ success: false, error: err.message }, headers);
  } finally {
    lock.releaseLock();
  }
}


/**
 * อัปเดตสถานะยกเลิกใบเสร็จในแถวเดิมบน Google Sheets (ไม่สร้างเลขใบเสร็จใหม่)
 */
function cancelReceiptInSheet(data, headers) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(RECEIPTS_SHEET);
    if (!sheet) return response({ success: true, message: 'Sheet not found' }, headers);

    const existing = sheet.getDataRange().getValues();
    const headerRow = existing[0];
    let statusColIndex = headerRow.findIndex(h => String(h).toLowerCase().trim() === 'status');

    if (statusColIndex === -1) {
      statusColIndex = headerRow.length;
      sheet.getRange(1, statusColIndex + 1).setValue('status').setFontWeight('bold').setBackground('#1e3a8a').setFontColor('#ffffff');
    }

    const targetReceiptNo = String(data.receiptNo).trim();
    const targetBookNo = String(data.bookNo || '1').trim();
    let updated = false;

    for (let i = 1; i < existing.length; i++) {
      const rowReceiptNo = String(existing[i][0]).trim();
      const rowBookNo = String(existing[i][1]).trim();

      if (rowReceiptNo === targetReceiptNo && (!targetBookNo || rowBookNo === targetBookNo)) {
        // 1. อัปเดตคอลัมน์ status เป็น 'ยกเลิก'
        sheet.getRange(i + 1, statusColIndex + 1).setValue('ยกเลิก');

        // 2. อัปเดตคอลัมน์รายการ (description - คอลัมน์ที่ 5 / E) ให้เติมคำว่า (ยกเลิก) ต่อท้ายด้วย
        const currentDesc = String(existing[i][4] || '');
        if (!currentDesc.includes('(ยกเลิก)')) {
          sheet.getRange(i + 1, 5).setValue(currentDesc ? `${currentDesc} (ยกเลิก)` : 'ยกเลิกใบเสร็จ');
        }
        updated = true;
      }
    }

    if (updated) {
      return response({ success: true, message: 'อัปเดตสถานะยกเลิกบิลเดิมเรียบร้อย' }, headers);
    }
    return response({ success: true, message: 'ไม่พบรายการใบเสร็จเดิมที่ต้องการยกเลิก' }, headers);
  } catch (err) {
    return response({ success: false, error: err.message }, headers);
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

function initReceiptsSheet(ss) {
  const sheet = ss.insertSheet(RECEIPTS_SHEET);
  const headers = [
    'receipt_no', 'book_no', 'date', 'received_from', 'description',
    'amount', 'signer_name', 'signer_position', 'signer_rank',
    'issuer_email', 'issuer_name', 'created_at', 'status'
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
