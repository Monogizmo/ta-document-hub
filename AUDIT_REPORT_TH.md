# รายงานตรวจสอบ HR Document Hub — Help Center + Document Scanner

วันที่ตรวจ: 30 ตุลาคม 2026  
ไฟล์ที่ตรวจ: `index.html` รุ่น Local Document Processing พร้อม Help Center และ Document Scanner

## 1. สรุปผล

- เพิ่มคำอธิบาย วัตถุประสงค์ วิธีใช้งาน และข้อจำกัดในหน้าเครื่องมือครบตามรายการ Tool Catalog ที่ตรวจพบ (35 รายการ)
- ตรวจการเชื่อมโยง Tool Catalog, View และ Help Guide: ไม่พบรายการเครื่องมือที่ไม่มี View หรือไม่มีคำอธิบายในชุดที่ตรวจ
- ตรวจ Action และ File Upload Handler ที่ปรากฏในหน้าเครื่องมือ: ไม่พบปุ่ม/Upload Control ที่ไม่มี Handler ใน registry ที่ตรวจ
- แก้ Route ID ของ AI CV Matcher ให้เมนูหลักและหมวด HR ใช้ `aiMatcher` สอดคล้องกัน
- แก้ `extName()` ที่ถูกเรียกใช้ใน Local CV Matcher และ HTML to PDF
- แก้ Global Wipe ให้ล้างข้อมูล Local CV Matcher ด้วย
- เพิ่ม/ปรับ Document Scanner และแก้เพดานนำเข้าให้ตรงกันที่ 20 หน้า

**ข้อสรุป:** โค้ดและโครงสร้างการผูกเมนูได้รับการตรวจในระดับ Static/Browser Harness แล้ว แต่ยังไม่สามารถยืนยันว่าทุก Function ใช้งานได้สมบูรณ์กับไฟล์จริงทุกชนิดหรือทุกอุปกรณ์ได้ การทดสอบจริงด้วย PDF/DOCX หลายแบบและกล้องมือถือยังจำเป็นก่อนใช้งาน Production

## 2. รายการตรวจเชิงเทคนิค

| รายการตรวจ | ผล | ขอบเขต/หมายเหตุ |
|---|---|---|
| JavaScript Syntax | ผ่าน | Extract Inline Scripts และตรวจด้วย `node --check` |
| Tool Catalog → View | ผ่าน | เครื่องมือ 35 รายการที่ตรวจมี View หรือ Planned View |
| Tool Catalog → Help Guide | ผ่าน | ไม่พบ Tool Key ที่ไม่มี Help Guide |
| UI Action → Handler | ผ่าน | ปุ่ม `data-a` ที่แสดงในหน้าฟังก์ชันมี Action ใน `A[tool]` |
| File Upload → Handler | ผ่าน | `data-tool` ที่แสดงในหน้าฟังก์ชันมี Handler ใน `ADD[tool]` |
| AI CV Matcher route | แก้ไขแล้ว | ใช้ ID เดียวกันในเมนูหลักและ Tool Card |
| `extName()` helper | แก้ไขแล้ว | ใช้แยกนามสกุลไฟล์ใน Local Matcher/HTML to PDF |
| Local CV Matcher logic | ผ่านตัวอย่าง | ทดสอบการจับคู่คำตามเกณฑ์และคำนวณคะแนนตามน้ำหนัก; เป็น Keyword Matching ไม่ใช่ AI |
| Scanner image presets | ผ่านใน Browser Harness | สร้างภาพตัวอย่างด้วย Canvas สำหรับ 7 Presets |
| Scanner crop/rotate | ผ่านในภาพตัวอย่าง | ทดสอบการแปลงภาพตัวอย่างและขนาดภาพผลลัพธ์ |
| Scanner multi-page flow | ผ่านแบบจำลอง | ทดสอบ flow รวมหลายหน้าโดยใช้ jsPDF Stub; ไม่ใช่การยืนยันไฟล์ PDF ด้วย jsPDF จริง |
| Mobile layout 390px | ผ่านการเรนเดอร์ | หน้า Scanner แสดงผลโดยไม่มี horizontal overflow ใน Headless Chromium |
| กล้องมือถือ/Webcam จริง | ยังไม่ทดสอบ | ต้องทดสอบบนอุปกรณ์จริงและผ่าน HTTPS พร้อมอนุญาตสิทธิ์กล้อง |
| PDF/DOCX จริงกับ Dependencies CDN | ยังไม่ยืนยันครบ | ต้องทดสอบใน Browser จริงพร้อม PDF.js, pdf-lib, jsPDF, JSZip, Mammoth และ Tesseract ตามเครื่องมือ |

## 3. Document Scanner — สเปกในรุ่นนี้

- แหล่งภาพ: กล้องมือถือ/Webcam หรือเลือกภาพจากอุปกรณ์
- รูปแบบภาพนำเข้า: JPEG, PNG, WebP
- จำนวนหน้า: สูงสุด 20 หน้า
- ขนาดรูปนำเข้า: สูงสุด 10 MB ต่อรูป
- Presets: Original, Enhance, Grayscale, Black & White, Clean, Photocopy, Soft Scan
- ปรับ Crop: บน/ขวา/ล่าง/ซ้ายเป็นเปอร์เซ็นต์
- Rotate: ทีละ 90 องศา
- Page management: เลือกหน้า, เรียงลำดับ, ลบหน้า
- Output: PDF A4 หรือ Letter, คุณภาพ High/Standard/Small
- Processing: Canvas และ jsPDF ภายใน Browser

### ข้อจำกัด Scanner

- ต้องเปิดใน Secure Context (โดยทั่วไป HTTPS หรือ localhost) และได้รับ Permission จากผู้ใช้
- ไม่มีการตรวจขอบกระดาษอัตโนมัติหรือ Perspective Correction; ใช้การตัดขอบด้วยมือ
- ไฟล์ HEIC/HEIF ไม่ได้รับประกันการรองรับ
- ภาพเอียง เบลอ มีเงา หรือสะท้อนแสง อาจให้ผลลัพธ์ที่อ่านไม่ชัด
- การส่งออก PDF ด้วย jsPDF จริงและการตรวจ PDF บน Device จริงยังต้องทดสอบ

## 4. ข้อจำกัด/ความเสี่ยงที่ยังคงอยู่

1. **Protect / Unlock PDF:** ใช้ RC4 แบบเก่าและแปลงหน้าเป็นภาพ ไม่เหมาะกับเอกสารความลับหรือความเสี่ยงสูง
2. **Redact PDF:** หน้าที่ทำกรอบจะถูก Rasterize แต่ Metadata, Attachments, Bookmarks หรือหน้าอื่นอาจยังมีข้อมูล ห้ามถือเป็น Secure Redaction โดยไม่ทดสอบเครื่องมือเฉพาะทาง
3. **Sign PDF:** เป็นการวางภาพลายเซ็น ไม่ใช่ Digital Signature ที่ยืนยันตัวบุคคล
4. **Fill PDF Form / Prepare a Form:** AcroForm มีข้อจำกัดกับ XFA และ Unicode/Thai Font
5. **Crop PDF:** เปลี่ยน CropBox/พื้นที่แสดงผล ไม่ได้ลบเนื้อหาจริงนอกกรอบ
6. **Watermark:** เป็นการวางองค์ประกอบบนหน้า ไม่ใช่การปกปิดข้อมูล
7. **Local CV Matcher:** จับคู่คำตามกฎและคำค้น ไม่เข้าใจความหมายเชิงบริบท ไม่ใช่ AI และไม่ควรใช้จัดอันดับหรือตัดผู้สมัคร
8. **OCR:** ผลลัพธ์ภาษาไทย ตัวเลข ตาราง และภาพคุณภาพต่ำอาจผิดพลาด รุ่นนี้ส่งออก TXT ไม่ใช่ Searchable PDF
9. **PDF to DOCX:** ดึง Text Layer เท่านั้น ไม่รักษา Layout ตาราง รูปภาพ หรือคอลัมน์
10. **HR Templates:** เอกสารที่เรนเดอร์จาก Canvas อาจเป็นภาพใน PDF ทำให้ค้น/เลือกข้อความไม่ได้ และต้องตรวจเนื้อหาก่อนเผยแพร่
11. **CDN:** Dependencies, Font และ OCR Language Data บางส่วนยังโหลดจาก CDN จึงไม่ใช่ Offline/No-CDN 100%

## 5. Future Plan

- Word/Excel/PowerPoint to PDF ผ่าน Office/LibreOffice Engine ที่องค์กรอนุมัติ
- PDF to Office แบบคง Layout ตาราง รูปภาพ และคอลัมน์
- OCR Searchable PDF พร้อม Text Layer
- Auto Edge Detection และ Perspective Correction สำหรับ Scanner
- ฝัง Unicode Font สำหรับฟอร์มภาษาไทย
- Secure PDF Encryption ด้วยมาตรฐานปัจจุบัน แทน RC4
- Secure Redaction ที่ลบเนื้อหา Metadata/Attachments อย่างครบถ้วนและตรวจสอบได้
- Bundle Libraries, Fonts และ OCR Language Data ไว้ใน Hosting ภายในองค์กร
- ทดสอบ E2E บน Chrome/Edge/Safari และอุปกรณ์มือถือจริง

## 6. Test Checklist สำหรับผู้ใช้ก่อน Production

- [ ] Scanner: อนุญาตกล้องและถ่ายด้วยกล้องหลังบน iOS/Android
- [ ] Scanner: Webcam บน Chrome/Edge
- [ ] Scanner: ปฏิเสธ Permission / ไม่มีกล้อง / สลับกล้อง
- [ ] Scanner: 1, 2 และ 20 หน้า; ปฏิเสธหน้าที่ 21
- [ ] Scanner: รูป 10 MB และเกิน 10 MB
- [ ] Scanner: ทุก Preset, Crop, Rotate, Reorder, Delete
- [ ] Scanner: สร้าง A4/Letter และเปิด PDF ตรวจทุกหน้า
- [ ] Checker: PDF จาก Word, PDF สแกน, PDF มีรหัสผ่าน, ชื่อไฟล์ไทย/ซ้ำ/ยาว
- [ ] Merge/Split/Organize/Compress: PDF จริงหลายแบบ
- [ ] Forms/Fill: AcroForm ภาษาอังกฤษและไทย
- [ ] OCR: เอกสารไทย/อังกฤษและภาพที่มีความละเอียดต่างกัน
- [ ] AI CV Matcher (Local): CV ไทย/อังกฤษ มี/ไม่มี Text Layer และตรวจความถูกต้องของหลักฐาน
- [ ] Compare: PDF มี Text Layer และเอกสารที่จัดหน้าใหม่
- [ ] Redact: ค้นหาข้อความ/คัดลอก/ตรวจ Metadata/Attachments หลังส่งออก

## 7. Privacy Note

การประมวลผลเนื้อหาไฟล์ในเครื่องมือเหล่านี้เกิดใน Browser และไม่มีการเรียก AI API/Backend ในรุ่นนี้ อย่างไรก็ตามหน้าเว็บยังโหลดไลบรารีและ OCR Language Data จาก CDN ตามการใช้งาน การใช้งานเอกสารผู้สมัครจริงควรเป็นไปตามนโยบายองค์กร และควรโฮสต์ Dependencies ภายในองค์กรก่อนหากต้องการลดการเชื่อมต่อภายนอก
