import React from 'react';
import { BookOpen, Printer, X, CheckCircle, Shield, FileText, UserCheck, RefreshCw, Key } from 'lucide-react';
import { PoliceEmblem } from '../layout/Navbar';

export default function UserManualModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const handlePrintManual = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(6,15,32,0.85)', backdropFilter: 'blur(8px)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, overflowY: 'auto',
    }}>
      <div className="glass-card modal-box" style={{
        width: '100%', maxWidth: 900, maxHeight: '92vh', overflowY: 'auto',
        background: '#0f1f3d', padding: '24px 32px', borderRadius: 20,
        border: '1px solid rgba(201,168,76,0.3)',
      }}>
        {/* Header - No Print */}
        <div className="no-print" style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '1px solid rgba(201,168,76,0.2)', paddingBottom: 16, marginBottom: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <PoliceEmblem size={36} />
            <div>
              <h3 style={{ fontSize: 18, color: '#e8edf5', fontWeight: 800, margin: 0 }}>
                คู่มือการใช้งานระบบออกใบเสร็จรับเงินออนไลน์
              </h3>
              <div style={{ fontSize: 11, color: '#c9a84c' }}>
                กองทุนสวัสดิการ กองบัญชาการตำรวจท่องเที่ยว
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button className="btn btn-gold" onClick={handlePrintManual}>
              <Printer size={16} /> สั่งพิมพ์ / บันทึกคู่มือเป็น PDF
            </button>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable Manual Content Container */}
        <div id="printable-user-manual" style={{
          background: '#ffffff', color: '#0f172a', borderRadius: 12,
          padding: '32px 40px', fontFamily: "'Sarabun', sans-serif", fontSize: 14, lineHeight: 1.6,
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        }}>
          {/* Document Header */}
          <div style={{ textAlign: 'center', borderBottom: '2px solid #1e3a8a', paddingBottom: 16, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
              <PoliceEmblem size={64} />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1e3a8a', margin: '4px 0' }}>
              คู่มือการใช้งานระบบออกใบเสร็จรับเงินออนไลน์
            </h1>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#334155', margin: '2px 0' }}>
              กองทุนสวัสดิการ กองบัญชาการตำรวจท่องเที่ยว
            </h2>
            <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
              เว็บไซต์ระบบ: <strong>https://tourist-police-receipt.vercel.app</strong>
            </p>
          </div>

          {/* Section 1: วิธีเข้าสู่ระบบ */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e3a8a', borderLeft: '4px solid #c9a84c', paddingLeft: 10, marginBottom: 12 }}>
              1. วิธีการเข้าสู่ระบบ (System Login)
            </h3>
            <ol style={{ paddingLeft: 20, margin: 0 }}>
              <li style={{ marginBottom: 6 }}>
                เปิดเว็บเบราว์เซอร์ (Google Chrome, Safari หรือ Microsoft Edge) แล้วไปที่ <strong>https://tourist-police-receipt.vercel.app</strong>
              </li>
              <li style={{ marginBottom: 6 }}>
                คลิกปุ่ม <strong>"เข้าสู่ระบบด้วย Google (Gmail)"</strong> หรือ <strong>"เข้าสู่ระบบด้วย LINE"</strong>
              </li>
              <li style={{ marginBottom: 6 }}>
                เลือกบัญชีผู้ใช้ของคุณเพื่อยืนยันตัวตน ระบบจะตรวจสอบสิทธิ์ให้อัตโนมัติ:
                <ul style={{ paddingLeft: 20, marginTop: 4 }}>
                  <li><strong>ผู้ออกใบเสร็จ (Issuer):</strong> สามารถออกใบเสร็จ ค้นหา พิมพ์ใบเสร็จ และดูรายงานได้</li>
                  <li><strong>ผู้ดูแลระบบ (Admin):</strong> มีสิทธิ์เพิ่ม/ลบรายชื่อเจ้าหน้าที่ลงนาม และจัดการผู้ใช้งานในระบบได้</li>
                </ul>
              </li>
            </ol>
          </div>

          {/* Section 2: การออกใบเสร็จใหม่ */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e3a8a', borderLeft: '4px solid #c9a84c', paddingLeft: 10, marginBottom: 12 }}>
              2. ขั้นตอนการออกใบเสร็จรับเงิน (Issue New Receipt)
            </h3>
            <ol style={{ paddingLeft: 20, margin: 0 }}>
              <li style={{ marginBottom: 6 }}>
                กดเมนู <strong>"ออกใบเสร็จ"</strong> ที่แถบเมนูด้านบน
              </li>
              <li style={{ marginBottom: 6 }}>
                <strong>กรอกข้อมูลใบเสร็จ:</strong>
                <ul>
                  <li><strong>เล่มที่:</strong> ระบบตั้งค่าเริ่มต้นเป็น `1` (สามารถแก้ไขได้)</li>
                  <li><strong>เลขที่ใบเสร็จ:</strong> ระบบล็อครันเลขอัตโนมัติป้องกันการกรอกซ้ำ (เช่น `69-00001`)</li>
                  <li><strong>วันที่ออกใบเสร็จ:</strong> ระบบเลือกวันที่ปัจจุบันให้อัตโนมัติ</li>
                </ul>
              </li>
              <li style={{ marginBottom: 6 }}>
                <strong>กรอกข้อมูลผู้บริจาค / ผู้ชำระเงิน:</strong>
                <ul>
                  <li>เลือก <strong>ยศ / คำนำหน้า</strong> (เรียงจากยศตำรวจสูงสุดลงไปยศต่ำสุด เช่น พล.ต.อ., พ.ต.อ., ด.ต., นาย, Ms.)</li>
                  <li>กรอก <strong>ชื่อ</strong> และ <strong>นามสกุล</strong> ผู้บริจาค</li>
                </ul>
              </li>
              <li style={{ marginBottom: 6 }}>
                <strong>เลือกรายการ และ กรอกจำนวนเงิน:</strong>
                <ul>
                  <li>เลือกประเภทการรับเงินบริจาค หรือพิมพ์ระบุเอง</li>
                  <li>กรอก <strong>จำนวนเงิน (บาท)</strong> ระบบจะแปลงเป็นตัวอักษรให้อัตโนมัติ (เช่น <i>สี่พันบาทถ้วน</i>)</li>
                </ul>
              </li>
              <li style={{ marginBottom: 6 }}>
                <strong>เลือกเจ้าหน้าที่ลงนาม (ผู้รับเงิน):</strong>
                <ul>
                  <li>เลือกรายชื่อผู้รับเงินจาก Dropdown (เช่น <i>พ.ต.อ.หญิง รัชฎาพร ราชกิจ - เหรัญญิก</i>)</li>
                </ul>
              </li>
              <li style={{ marginBottom: 6 }}>
                กดปุ่มสีทอง <strong>"บันทึกใบเสร็จ (ล้างฟอร์ม & รันเลขถัดไป)"</strong>
                <br />
                <span style={{ fontSize: 12, color: '#059669' }}>
                  ✓ ข้อมูลจะถูกบันทึกลงฐานข้อมูล Google Sheets อัตโนมัติ และระบบจะรันเลขที่ใบเสร็จถัดไปให้อัตโนมัติทันที
                </span>
              </li>
            </ol>
          </div>

          {/* Section 3: การพรีวิว สั่งพิมพ์ และเซฟเป็น PDF */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e3a8a', borderLeft: '4px solid #c9a84c', paddingLeft: 10, marginBottom: 12 }}>
              3. การสั่งพิมพ์ใบเสร็จ และ บันทึกเป็น PDF (Print & Export PDF)
            </h3>
            <ol style={{ paddingLeft: 20, margin: 0 }}>
              <li style={{ marginBottom: 6 }}>
                เมื่อกรอกข้อมูลเรียบร้อย สามารถตรวจทานความถูกต้องได้จาก <strong>"ตัวอย่างแบบฟอร์มใบเสร็จ"</strong> ด้านขวา
              </li>
              <li style={{ marginBottom: 6 }}>
                คลิกปุ่ม <strong>"สั่งพิมพ์ใบเสร็จ (Print)"</strong> หน้าต่างพิมพ์ของเบราว์เซอร์จะเปิดขึ้นมา
              </li>
              <li style={{ marginBottom: 6 }}>
                <strong>กรณีต้องการเซฟเป็นไฟล์ PDF:</strong>
                <ul style={{ paddingLeft: 20, marginTop: 4 }}>
                  <li>ในช่องเครื่องพิมพ์ (Destination) ให้เปลี่ยนเป็น <strong>"บันทึกเป็น PDF" (Save as PDF)</strong></li>
                  <li>กดปุ่ม <strong>"บันทึก" (Save)</strong> เลือกรอบที่ต้องการเก็บไฟล์ในเครื่องคอมพิวเตอร์</li>
                </ul>
              </li>
              <li style={{ marginBottom: 6 }}>
                <strong>กรณีต้องการพิมพ์ออกกระดาษ A4:</strong>
                <ul style={{ paddingLeft: 20, marginTop: 4 }}>
                  <li>เลือกชื่อเครื่องพิมพ์ แล้วกดปุ่ม <strong>"พิมพ์" (Print)</strong></li>
                  <li>ใบเสร็จ 1 แผ่นกระดาษ A4 จะมีทั้ง <strong>ต้นฉบับ (ORIGINAL)</strong> และ <strong>สำเนา (COPY)</strong> พร้อมรอยตัดแบ่ง</li>
                </ul>
              </li>
            </ol>
          </div>

          {/* Section 4: ทะเบียนผู้บริจาคและการถอยเลข */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e3a8a', borderLeft: '4px solid #c9a84c', paddingLeft: 10, marginBottom: 12 }}>
              4. ทะเบียนผู้บริจาคและการจัดการรายการ (Donor Registry)
            </h3>
            <ul style={{ paddingLeft: 20, margin: 0 }}>
              <li style={{ marginBottom: 6 }}>
                กดเมนู <strong>"ทะเบียนผู้บริจาค"</strong> เพื่อค้นหา ดูประวัติ หรือพิมพ์ใบเสร็จย้อนหลัง
              </li>
              <li style={{ marginBottom: 6 }}>
                <strong>ระบบถอยคืนเลขที่ใบเสร็จอัตโนมัติ (Auto-rollback):</strong> หากท่านกดลบรายการใบเสร็จที่ไม่ต้องการออก ระบบจะปรับลดเลขที่ใบเสร็จรันถัดไปถอยหลังกลับมาให้อัตโนมัติ เพื่อป้องกันไม่ให้เลขที่ใบเสร็จข้ามลำดับ
              </li>
              <li style={{ marginBottom: 6 }}>
                การลบรายการบนหน้าเว็บ จะทำการลบแถวข้อมูลใน <strong>Google Sheets</strong> ออกให้อัตโนมัติในเบื้องหลัง
              </li>
            </ul>
          </div>

          {/* Footer of Manual */}
          <div style={{
            marginTop: 32, borderTop: '1px solid #e2e8f0', paddingTop: 16,
            display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b',
          }}>
            <div>จัดทำโดย: กองทุนสวัสดิการ กองบัญชาการตำรวจท่องเที่ยว</div>
            <div>ฉบับอัปเดตล่าสุด: ปีงบประมาณ 2569</div>
          </div>
        </div>
      </div>
    </div>
  );
}
