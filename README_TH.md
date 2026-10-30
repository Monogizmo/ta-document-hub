# HR Document Hub — AI CV Matcher (Prototype)

ชุดไฟล์นี้ต่อยอดจาก `index.html.html` ที่แนบมา โดยเพิ่มเมนู **AI CV Matcher** สำหรับเลือก JD 1 ไฟล์และ CV หลายไฟล์ เพื่อวิเคราะห์หลักฐานตามเกณฑ์งาน พร้อม Summary, Strengths, Missing Information และ Interview Suggestions

## ในชุดนี้มีอะไรบ้าง

- `index.html` — หน้า HR Document Hub เดิมที่เพิ่มหน้า AI CV Matcher
- `worker.js` — Cloudflare Worker ทำหน้าที่เป็น Backend และเรียก OpenAI Responses API
- `wrangler.toml` — ค่าเริ่มต้นสำหรับ Deploy Worker
- `README_TH.md` — คู่มือติดตั้งและข้อจำกัด
- `tests/worker-smoke-test.mjs` — ทดสอบ Worker ด้วย Mock OpenAI response (ไม่เรียก API จริง)

## Architecture

1. Browser อ่านข้อความจาก JD และ CV ด้วย PDF.js (PDF) และ JSZip (DOCX)
2. ผู้ใช้ยืนยันก่อนส่งข้อความออกจาก Browser
3. Browser ส่งข้อความ JD + CV ทีละคนไปยัง Cloudflare Worker
4. Worker ตรวจ Access Code, ขนาดข้อมูล และเกณฑ์น้ำหนัก
5. Worker เรียก OpenAI Responses API ด้วย `store: false` และ Structured Outputs (JSON Schema)
6. Worker ส่ง JSON กลับ Browser โดยไม่เขียนข้อมูลลง Database หรือ Log
7. Browser คำนวณ Evidence Match Score จากน้ำหนักที่ HR กำหนด และแสดงผลรายคน

**Batch ใน Prototype นี้หมายถึงเลือก CV หลายไฟล์แล้วกดวิเคราะห์ครั้งเดียว แต่ระบบจะเรียก AI ทีละคนตามลำดับ** เพื่อลดปัญหา Rate Limit และแยกข้อผิดพลาดรายคนได้ง่าย

## 1. เตรียม OpenAI API Key

1. สร้าง API Key ใน OpenAI Platform Project ที่องค์กรอนุมัติ
2. ตรวจสอบ Billing / Project limits ก่อนทดลอง เพราะการวิเคราะห์ CV แต่ละไฟล์มีค่าใช้จ่ายตาม Token ที่ใช้
3. ห้ามนำ API Key ไปใส่ใน `index.html`, JavaScript ฝั่ง Browser, GitHub Repository หรือช่อง Shared Access Code

ค่า Model ตั้งต้นใน `wrangler.toml` คือ `gpt-6-luna` เพื่อให้เหมาะกับงานปริมาณหลาย CV และสามารถเปลี่ยนเป็น Model ID ที่ Project มีสิทธิ์ใช้งานได้ โดยตั้งค่า `OPENAI_MODEL` ในไฟล์นี้

## 2. Deploy Cloudflare Worker

ต้องติดตั้ง Node.js และ Wrangler และ Login เข้า Cloudflare ก่อน

```bash
npx wrangler login
```

เปิด Terminal ในโฟลเดอร์นี้ ติดตั้ง Wrangler แล้ว Login:

```bash
npm install
npx wrangler login
```

สร้าง Secrets:

```bash
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put APP_ACCESS_CODE
```

- `OPENAI_API_KEY` คือ API Key จริงของ OpenAI เก็บใน Worker Secret เท่านั้น
- `APP_ACCESS_CODE` คือรหัสร่วมสำหรับ Prototype ให้ผู้ใช้กรอกในหน้าเว็บ (ไม่ใช่ API Key) ควรใช้รหัสสุ่มยาวและไม่ใช้ซ้ำกับบัญชีอื่น
- Worker มี Rate Limiting binding ตั้งต้น 30 requests / 60 วินาทีต่อรหัสร่วม (เป็นการจำกัดแบบ Approximate ตาม Cloudflare) หาก `namespace_id` นี้ถูกใช้แล้วใน Cloudflare Account ของคุณ ให้เปลี่ยนเป็นเลขจำนวนเต็มที่ยังไม่ซ้ำ และใช้ Wrangler 4.36.0 ขึ้นไป

ตรวจสอบ `wrangler.toml` ก่อน Deploy:

```toml
[vars]
ALLOWED_ORIGINS = "https://monogizmo.github.io,http://localhost:5500,http://127.0.0.1:5500"
OPENAI_MODEL = "gpt-6-luna"
```

`ALLOWED_ORIGINS` ต้องตรงกับ Origin ของเว็บที่ใช้งานจริงทุกตัวอักษร ถ้าเปลี่ยนโดเมน GitHub Pages หรือใช้ Custom Domain ต้องแก้ค่านี้ด้วย

Deploy:

```bash
npx wrangler deploy
```

หลัง Deploy จะได้ URL ประมาณ `https://hr-document-hub-ai.<account>.workers.dev`

ทดลอง Health Check:

```text
https://<ชื่อ-worker>.<account>.workers.dev/health
```

ผลที่คาดหวังคือ JSON ที่มี `ok: true`

## 3. เผยแพร่หน้าเว็บ

1. นำ `index.html` จากชุดนี้ไปแทน `index.html` ใน Repository ของ GitHub Pages
2. Commit และ Push ตามขั้นตอนของ Repository เดิม
3. เปิดเว็บ แล้วไปที่เมนู **AI CV Matcher**
4. กรอก Worker URL และ Shared Access Code ที่ผู้ดูแลระบบให้
5. เลือก JD 1 ไฟล์ และ CV หลายไฟล์ แล้วกำหนด Criteria ให้ Weight รวม 100%
6. ยืนยันการอนุญาตส่งข้อมูล แล้วกด Analyze

**สำคัญ:** Worker URL เป็นข้อมูลสาธารณะได้ แต่ OpenAI API Key ต้องอยู่ใน Worker Secret เท่านั้น

## 4. ขอบเขตของรุ่นนี้

- JD: PDF หรือ DOCX, ไม่เกิน 10 MB, ข้อความไม่เกิน 25,000 ตัวอักษร
- CV: PDF หรือ DOCX, สูงสุด 15 ไฟล์ต่อ Batch, ไม่เกิน 8 MB ต่อไฟล์ และไม่เกิน 45,000 ตัวอักษรต่อ CV
- PDF ต้องมี Text Layer; PDF ที่เป็นภาพสแกนยังไม่รองรับ OCR และจะแสดงข้อความแจ้งเตือน
- รองรับ DOCX ไม่รองรับ DOC รุ่นเก่า, XLSX หรือรูปภาพโดยตรง
- ผลวิเคราะห์และไฟล์อยู่ในหน่วยความจำ Browser เท่านั้น รีเฟรชหรือปิดหน้าเว็บแล้วผลจะหาย
- Export CSV ทำบน Browser และไม่ได้ส่งไฟล์ผลลัพธ์ไปเก็บใน Backend
- Worker ไม่ใช้ Database, R2, KV หรือการบันทึกไฟล์
- ระบบไม่ส่งชื่อไฟล์ของ CV ไปให้ AI แต่ใช้ Candidate 01, Candidate 02 ฯลฯ
- ระบบพยายามปกปิดอีเมล เบอร์โทร เลขประจำตัว และบรรทัดข้อมูลส่วนตัวที่รู้จัก แต่เป็นเพียง Best-effort ไม่สามารถรับประกันว่าจะลบชื่อ ที่อยู่ หรือข้อมูลส่วนบุคคลทั้งหมดได้

## 5. ความหมายของ Score

คะแนนคำนวณใน Browser ไม่ได้ให้ AI คิดคะแนนแบบอิสระ:

- `evidenced` = ได้ 100% ของน้ำหนักเกณฑ์
- `partial` = ได้ 50% ของน้ำหนักเกณฑ์
- `not_stated` = ได้ 0% เพราะ CV ไม่แสดงหลักฐานในเกณฑ์นั้น (ไม่ได้หมายความว่าผู้สมัครไม่มีทักษะ)
- `unclear` = ไม่นำมาคิดในตัวหาร และแสดงน้ำหนักที่ต้องตรวจสอบเพิ่มเติม

`Evidence Match Score` คือคะแนนหลักฐานที่ปรากฏในเอกสารเทียบกับเกณฑ์งาน ไม่ใช่คะแนนคุณค่าของผู้สมัคร ไม่ใช่ความน่าจะเป็นว่าจะทำงานได้ และห้ามใช้เป็นเกณฑ์ปฏิเสธหรือคัดออกโดยอัตโนมัติ

`Assessment coverage` คือสัดส่วนน้ำหนักของเกณฑ์ที่ AI ประเมินได้ (ไม่นับ `unclear`) จึงควรอ่าน Score คู่กับ Coverage และหลักฐานอ้างอิงเสมอ

## 6. Data Privacy และ Security — อ่านก่อนใช้ CV จริง

- เมื่อใช้ AI CV Matcher ข้อความที่ดึงจาก JD/CV จะถูกส่งออกจาก Browser ไปยัง Worker และ OpenAI API ไม่ใช่ Local Processing เหมือน PDF Tools ทั่วไป
- Worker ใช้ `store: false` ใน Responses API และไม่บันทึก CV/JD ลง Database หรือ Log
- `store: false` ไม่ได้แปลว่า OpenAI ไม่มีการเก็บข้อมูลใด ๆ: เอกสาร OpenAI ระบุว่า Abuse Monitoring Logs อาจเก็บข้อมูลลูกค้าสูงสุด 30 วันโดยทั่วไป เว้นแต่ได้รับอนุมัติการควบคุมการเก็บข้อมูลแบบอื่น เช่น Zero Data Retention ซึ่งมีคุณสมบัติและการอนุมัติแยกต่างหาก
- ก่อนนำ CV จริงมาใช้ ต้องให้ HR/DPO/Legal ตรวจสอบฐานการประมวลผล Privacy Notice ข้อตกลงผู้ให้บริการ และการอนุมัติจากองค์กร
- ใช้ Synthetic / Dummy CV ในการ Demo และ QA ก่อน
- ห้ามนำชื่อ รูปถ่าย วันเกิด อายุ เพศ ศาสนา สุขภาพ ความพิการ สถานภาพครอบครัว หรือข้อมูลอ่อนไหวมาเป็นเกณฑ์วิเคราะห์
- ให้ AI วิเคราะห์หลักฐานตามเกณฑ์งานเท่านั้น และให้ HR เป็นผู้ตรวจสอบ/ตัดสินใจทุกครั้ง
- Shared Access Code เป็นเพียง Gate เบื้องต้นสำหรับ Prototype ไม่ใช่ระบบยืนยันตัวตนพนักงานที่แข็งแรง ผู้มีสิทธิ์ใช้งานสามารถเห็นรหัสใน Browser DevTools ได้
- ก่อนใช้ภายในองค์กรจริง แนะนำให้ป้องกัน Worker ด้วย Cloudflare Access/SSO, เพิ่ม Rate Limiting ฝั่ง Cloudflare, จำกัดผู้ใช้ และกำหนดงบประมาณ/Usage Limit ของ OpenAI Project
- ปัจจุบัน CORS allowlist ช่วยจำกัด Browser Origin แต่ CORS ไม่ใช่ระบบ Authentication และไม่ป้องกันการเรียกจากเครื่องมือ Server-to-Server
- Rate Limiting binding เป็นขีดจำกัดแบบ Approximate แยกตาม Cloudflare Location ไม่ใช่ Quota แบบ Strict ทั่วโลก หากต้องการโควตาเข้มงวดต่อบัญชี/ผู้ใช้ ให้พัฒนาร่วมกับ Durable Objects หรือระบบ Auth/Quota ขององค์กร

## 7. ทดสอบก่อนใช้จริง

1. เริ่มด้วย JD และ CV สมมติที่ไม่มีข้อมูลบุคคลจริง
2. ทดสอบ PDF ที่มี Text Layer ภาษาไทยและอังกฤษ
3. ทดสอบ DOCX ภาษาไทย รวมถึงเอกสารที่มีตารางและ Bullet
4. ทดสอบ PDF สแกน เพื่อให้แน่ใจว่าระบบแจ้งว่าไม่รองรับ OCR แทนการส่งข้อความว่าง
5. ทดสอบ CV ที่มี Email / Phone / เลขประจำตัว เพื่อทบทวนผลการปกปิด
6. ทดสอบน้ำหนักเกณฑ์รวมไม่เท่ากับ 100 และชื่อเกณฑ์ซ้ำ
7. ทดสอบ Worker URL ผิด, Access Code ผิด, Rate Limit, OpenAI API Key ผิด/ไม่มีเครดิต
8. ให้ Recruiter เปรียบเทียบผล AI กับการอ่าน CV ด้วยตนเอง และตรวจว่า AI ไม่สร้างประสบการณ์หรือหลักฐานที่ไม่มีในเอกสาร
9. ทดสอบ CV หลายรูปแบบและหลายภาษาเพื่อประเมินความสม่ำเสมอของผลลัพธ์

## 8. สิ่งที่ยังไม่ได้ทำ / ยังไม่ได้ยืนยัน

- ยังไม่ได้ Deploy Worker จริง เพราะต้องใช้ Cloudflare Account, OpenAI API Key และการตั้งค่าของเจ้าของระบบ
- ยังไม่ได้เรียก OpenAI API จริงจากชุดนี้ การทดสอบ Worker ใช้ Mock Response เท่านั้น
- ยังไม่ได้ทดสอบกับ CV จริงหรือไฟล์จากองค์กร
- ยังไม่มี OCR สำหรับ PDF สแกน
- ยังไม่มีระบบ Login / SSO แบบรายบุคคลหรือ Audit Trail
- มี Rate Limiting binding ขั้นต้นใน Worker แล้ว แต่ยังไม่มี Login/SSO รายบุคคลหรือโควตาแบบ Strict ทั่วโลก

