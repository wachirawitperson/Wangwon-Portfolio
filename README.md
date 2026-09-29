# Wangwon Portfolio (แฟ้มสะสมงานนักเรียน โรงเรียนบ้านวังวน)

> เว็บแอปพลิเคชันสร้างแฟ้มสะสมผลงาน (Portfolio) นักเรียนแบบอัตโนมัติจากไฟล์รูปภาพ สำหรับคุณครูโรงเรียนบ้านวังวน

---

## 🎯 วัตถุประสงค์ของโครงการ (Project Purpose)

**Wangwon Portfolio** ออกแบบมาเพื่อเป็นเครื่องมือเฉพาะทางสำหรับครูประจำชั้นและครูผู้สอน โรงเรียนบ้านวังวน ในการรวบรวมภาพถ่ายกิจกรรมและผลงานของนักเรียน แปลงเป็นเอกสาร PDF แฟ้มสะสมผลงานที่สวยงาม มีมาตรฐานเดียวกันทั้งโรงเรียน โดยไม่ต้องมีความรู้ด้านการแต่งภาพหรือการจัดหน้าขั้นสูง

### ลำดับขั้นตอนการทำงานหลัก (Main Workflow)
1. คุณครูกรอกข้อมูลพื้นฐานของนักเรียน (คำนำหน้า, ชื่อ, นามสกุล, ระดับชั้น, เลขที่, ปีการศึกษา)
2. ระบบเตรียมหน้าปกหน้า (Front Cover) ให้อัตโนมัติใน **หน้า 1 (ล็อคตำแหน่ง)**
3. คุณครูเลือกไฟล์รูปภาพกิจกรรม/ผลงานของนักเรียน (รองรับ JPG, PNG, WEBP, HEIC)
4. คุณครูจัดเรียงลำดับรูปภาพ หมุนภาพตามต้องการ
5. คุณครูเลือกใส่ลายน้ำชื่อโรงเรียน (ตัวเลือกเสริม)
6. ระบบเตรียมหน้าปกหลัง (Back Cover) ให้อัตโนมัติใน **หน้าสุดท้าย (ล็อคตำแหน่ง)**
7. คุณครูตรวจสอบความเรียบร้อยผ่านพรีวิว
8. ระบบสร้างไฟล์ PDF พร้อมตั้งชื่อไฟล์ภาษาไทยอย่างถูกต้อง เช่น `ด.ช.สมชาย_ใจดี.pdf`
9. ตัวเลือกเสริม: ส่งออกเป็นแพ็กเกจ ZIP ที่มีทั้งไฟล์ PDF และไฟล์ภาพผลงานที่เปลี่ยนชื่อตามลำดับ เช่น `ด.ช.สมชาย_ใจดี_01.jpg`

---

## 🛡️ ความเป็นส่วนตัวและความปลอดภัยของข้อมูลนักเรียน

รูปภาพนักเรียนประมวลผลในเบราว์เซอร์ของคุณ และไม่ถูกอัปโหลดเพื่อประมวลผล:

- **ประมวลผลรูปในเครื่อง • ไม่อัปโหลดรูปนักเรียน**: รูปภาพผลงานและข้อมูลนักเรียนประมวลผลในเว็บเบราว์เซอร์ของคุณ และไม่ถูกอัปโหลดเพื่อประมวลผลบนเซิร์ฟเวอร์
- **No Account Required**: ใช้งานได้ทันที ไม่ต้องมีบัญชีผู้ใช้หรือเข้าสู่ระบบ
- **Local File Safety**: ไม่มีการแก้ไขหรือเขียนทับไฟล์รูปภาพต้นฉบับในเครื่องของคุณครู

---

## 🧱 โครงสร้างสถาปัตยกรรม (Project Architecture)

โครงสร้างโฟลเดอร์ถูกออกแบบให้เป็นระเบียบ เป็นสัดส่วน และไม่รวมโค้ดไว้ในไฟล์เดียว (Modular Architecture):

```text
Wangwon-Portfolio/
├── index.html                  # โครงสร้างหน้าเว็บหลักตามหลัก Semantic HTML5
├── README.md                   # เอกสารประกอบโครงการ
├── package.json                # ข้อมูลโปรเจกต์และชุดคำสั่งทดสอบ
├── playwright.config.js        # การตั้งค่าระบบทดสอบอัตโนมัติ Playwright
│
├── styles/                     # สไตล์ชีตแบบแยกส่วน (Modular CSS & Design System)
│   ├── tokens.css              # Design Tokens: สี, ตัวพิมพ์, ระยะห่าง, รัศมี, เงา, แอนิเมชัน
│   ├── base.css                # CSS Reset, ตัวพิมพ์ภาษาไทย (Prompt/Noto Sans Thai/Sarabun), Reduced Motion
│   ├── layout.css              # ส่วนหัว (Header), Hero Intro ขนาดกะทัดรัด, Main Container, Toolbar ด้านล่าง
│   ├── forms.css               # ฟอร์มคอนโทรล: Input, Select, Segmented Control, Custom Checkbox
│   ├── workspace.css           # พื้นที่ทำงาน: ปกหน้า (ล็อค), ปกหลัง (ล็อค), พื้นที่รูปภาพว่าง, สเปกการ์ดภาพ
│   ├── components.css          # ระบบปุ่ม (Buttons), ป้ายสถานะ (Badges), Modal Dialogs, Toast Notifications
│   └── responsive.css          # Responsive Breakpoints: Desktop (1440/1280), Tablet (1024/768), Mobile (390/375)
│
├── src/                        # ซอร์สโค้ด JavaScript (ES Modules)
│   ├── app.js                  # ตัวเริ่มการทำงานของแอปพลิเคชัน (Bootstrap & Modal Bindings)
│   │
│   ├── core/                   # ระบบแกนกลางทั่วไป
│   │   ├── state.js            # Reactive Pub/Sub State Store
│   │   ├── filename-utils.js   # ระบบตั้งชื่อไฟล์ภาษาไทยอย่างปลอดภัย
│   │   ├── file-utils.js       # ตัวจัดการตรวจสอบประเภทไฟล์และขนาด
│   │   ├── image-utils.js      # ตัวคำนวณการจัดวาง Fit/Fill และการหมุนภาพ
│   │   └── storage.js          # โครงสร้างเตรียมการบันทึกงานร่าง (Draft Recovery)
│   │
│   ├── portfolio/              # ตรรกะงานแฟ้มสะสมงาน
│   │   ├── portfolio-state.js  # โมเดลข้อมูล PortfolioProject (Single Source of Truth)
│   │   ├── cover-manager.js    # กฎการล็อคปกหน้า (หน้า 1) และปกหลัง (หน้าสุดท้าย)
│   │   ├── image-manager.js    # ตัวจัดการรูปภาพผลงานนักเรียน (หน้ากลาง)
│   │   ├── watermark.js        # โครงสร้างระบบลายน้ำ 9 ตำแหน่ง
│   │   ├── pdf-generator.js    # โครงสร้างสร้างเอกสาร PDF (pdf-lib)
│   │   └── package-export.js   # โครงสร้างส่งออกชุดไฟล์ ZIP
│   │
│   └── ui/                     # ส่วนประกอบส่วนติดต่อผู้ใช้ (UI Components)
│       ├── student-form.js     # ฟอร์มข้อมูลนักเรียนพร้อม Live Filename Preview
│       ├── workspace.js        # พื้นที่ทำงานจัดลำดับหน้าเอกสาร
│       ├── image-card.js       # การ์ดแสดงผลรูปภาพและปุ่มคำสั่งหมุน/ลบ
│       ├── settings-panel.js   # แผงตั้งค่าขนาดกระดาษและลายน้ำแบบ Segmented Control
│       ├── preview.js          # ระบบแสดงตัวอย่างและปุ่มสร้างเอกสาร
│       ├── modal.js            # รากฐาน Accessible Modal Dialog (Focus Trap, ESC key, ARIA)
│       └── notifications.js    # ระบบแจ้งเตือนแบบเข้าถึงได้ (Accessible Toast: Success, Info, Warning, Error)
│
├── assets/                     # ทรัพยากรภาพและไอคอน
│   ├── logo/
│   ├── covers/
│   └── icons/
│
├── scripts/
│   └── serve.js                # Local HTTP Server สำหรับการทดสอบและรันในเครื่อง
│
└── tests/                      # ชุดการทดสอบอัตโนมัติ (Automated Browser Tests)
    ├── fixtures/
    ├── screenshots/            # ภาพถ่ายหน้าจอทดสอบความเข้ากันได้ของอุปกรณ์ (Visual QA)
    └── portfolio.spec.js       # Playwright Test Suite (34 automated tests)
```

---

## 💻 การติดตั้งและเริ่มใช้งานในเครื่อง (Local Development)

### ข้อกำหนดเบื้องต้น
- [Node.js](https://nodejs.org/) (เวอร์ชัน 18 ขึ้นไป)

### 1. เริ่มรันเว็บเซิร์ฟเวอร์
```bash
npm start
```
เปิดเบราว์เซอร์ไปที่: `http://localhost:3000`

### 2. รันการทดสอบอัตโนมัติ (Playwright Tests)
```bash
npm test
```

---

## 🧪 การทดสอบคุณภาพ (QA & Verification)

ในระยะที่ 4 (Phase 4: Image Import + HEIC + Validation) ระบบมีชุดทดสอบอัตโนมัติรวม 78 รายการ (Desktop Chromium และ Mobile Chrome) ผ่าน Playwright ครอบคลุม:
1. การโหลดหน้าเว็บสมบูรณ์ ปราศจากข้อผิดพลาด JavaScript
2. ส่วนหัว (Header), ชื่อระบบ, และเครื่องหมายความเป็นส่วนตัวแสดงผลตามข้อกำหนด
3. ฟอร์มข้อมูลนักเรียนพร้อมระบบเปลี่ยนชื่อไฟล์สด (Live Filename) และ Inline Validation
4. ปกหน้า (Front Cover) ล็อคอยู่ที่หน้า 1 และปกหลัง (Back Cover) ล็อคอยู่ที่หน้าสุดท้าย
5. ลำดับเลขหน้าของภาพผลงานนักเรียนเริ่มต้นที่ **หน้า 2** เสมอ
6. ระบบนำเข้าไฟล์ภาพผลงานนักเรียนแบบ Local-first:
   - นำเข้าผ่าน File Picker (เลือกหลายไฟล์พร้อมกัน)
   - นำเข้าผ่าน Drag-and-Drop พร้อม Visual Feedback (`.is-dragover`)
   - นำเข้าผ่าน Clipboard Paste (Ctrl/Cmd+V) นอกช่องกรอกข้อความ
7. รองรับฟอร์แมตมาตรฐานครบถ้วน: JPG, PNG, WebP, BMP, HEIC/HEIF
8. การแปลงไฟล์ภาพ HEIC/HEIF ในตัว พร้อมระบบ Safe Fallback
9. ระบบตรวจสอบและแจ้งเตือนภาพความละเอียดต่ำ (Low-resolution Warning Badge) สำหรับภาพขนาด <1200px longest edge
10. ระบบตรวจจับภาพซ้ำ (Duplicate Detection Fingerprint) พร้อม Modal Dialog สรุปรายการ ให้เลือกระหว่าง "ข้ามภาพที่ซ้ำ" หรือ "นำเข้ารูปซ้ำทั้งหมด"
11. การจัดการ Memory และ Object URL อัตโนมัติ (`URL.revokeObjectURL`) เมื่อเริ่มทำแฟ้มใหม่ (Reset Project)
12. ยืนยัน Zero External Requests ปลอดภัย 100% ต่อรูปภาพและข้อมูลนักเรียน

---

## 📜 ลิขสิทธิ์ (License)

สงวนลิขสิทธิ์สำหรับใช้งานภายใน โรงเรียนบ้านวังวน (Ban Wangwon School)
เผยแพร่ภายใต้สัญญาอนุญาต MIT License
