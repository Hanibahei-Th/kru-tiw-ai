# ครูติว AI

แอปพลิเคชันมือถือสำหรับติวการบ้านนักเรียนไทยระดับชั้น ป.4–ม.3 ในวิชาคณิตศาสตร์ วิทยาศาสตร์ และภาษาอังกฤษ
ถ่ายภาพการบ้าน เลือกวิชา แล้วรับคำแนะนำวิธีคิดทีละขั้นตอนเป็นภาษาไทย

ออกแบบตามหลัก **Socratic method** — AI จะไม่เฉลยคำตอบสุดท้าย แต่ชี้แนวทางให้เด็กคิดและลงมือทำเอง

## ฟีเจอร์

- **ติวการบ้านด้วยภาพ** — ถ่ายจากกล้องหรือเลือกจากคลังภาพ ระบบย่อภาพอัตโนมัติก่อนส่งวิเคราะห์
- **เลือกวิชาได้ 3 วิชา** — คณิตศาสตร์ วิทยาศาสตร์ ภาษาอังกฤษ
- **คำอธิบายทีละขั้น** — 3–5 ขั้นตอน พร้อมประโยคให้กำลังใจปิดท้าย
- **ประวัติย้อนหลัง** — เก็บภาพย่อ วิชา และขั้นตอนไว้ดูซ้ำ
- **ตั้งค่า API Key ส่วนตัว** — ใส่ Gemini API Key ของตนเองได้ พร้อมปุ่มทดสอบการเชื่อมต่อ

## เทคโนโลยี

| ชั้นระบบ | เทคโนโลยี |
| --- | --- |
| แอปพลิเคชัน | Expo SDK 55 + React Native |
| ภาษา | TypeScript |
| การนำทาง | expo-router |
| การจัดสไตล์ | NativeWind v4 (Tailwind CSS) |
| ไอคอน | lucide-react-native |
| ฐานข้อมูล | Supabase (PostgreSQL + RLS) |
| ไฟล์ภาพ | Supabase Storage |
| ประมวลผล AI | Supabase Edge Function (Deno) + Gemini 2.5 Flash |

## เริ่มต้นใช้งาน

```bash
# ติดตั้ง dependencies
pnpm install

# คัดลอกไฟล์ environment แล้วเติมค่าของโปรเจกต์คุณ
cp .env.example .env

# เริ่ม development server
pnpm start
```

### ตัวแปรสภาพแวดล้อม

| ตัวแปร | คำอธิบาย |
| --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | URL ของโปรเจกต์ Supabase |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | anon key สำหรับฝั่งแอป |
| `SUPABASE_PROJECT_ID` | reference id ของโปรเจกต์ |
| `EXPO_PUBLIC_APP_ID` | รหัสแอปบนแพลตฟอร์ม |

## ฐานข้อมูล

ตาราง `homework_history` เก็บประวัติการถาม พร้อมเปิดใช้ Row Level Security

| คอลัมน์ | ชนิด | คำอธิบาย |
| --- | --- | --- |
| `id` | uuid | รหัสหลัก |
| `device_id` | text | รหัสอุปกรณ์ |
| `subject` | text | `math` / `sci` / `eng` |
| `image_url` | text | URL ภาพใน Storage |
| `steps` | jsonb | ขั้นตอนคำอธิบาย |
| `hint` | text | ประโยคให้กำลังใจ |
| `created_at` | timestamptz | เวลาบันทึก |

Storage bucket `homework_images` เป็นแบบสาธารณะ จำกัดไฟล์ 1 MiB และรับเฉพาะ `image/jpeg`, `image/png`, `image/webp`

## ระบบหลังบ้าน

Edge Function `explainHomework` รับภาพการบ้าน ส่งให้ Gemini วิเคราะห์ แล้วคืนขั้นตอนคำอธิบายพร้อมบันทึกประวัติ

```bash
# deploy ฟังก์ชัน
supabase functions deploy explainHomework

# ตั้งคีย์สำรองของแอป (ไม่บังคับ)
supabase secrets set GEMINI_API_KEY=<your-key>
```

**การเลือกคีย์**

1. ถ้าผู้ใช้บันทึกคีย์ส่วนตัวไว้ → เรียก Google Gemini โดยตรงด้วยคีย์ของผู้ใช้
2. ถ้าไม่มีคีย์ของผู้ใช้ → เรียกผ่าน AI Gateway ของแพลตฟอร์ม (`INTEGRATIONS_API_KEY`)

คีย์ของผู้ใช้ถูกเก็บใน SecureStore ของอุปกรณ์เท่านั้น ไม่ถูกบันทึกลงฐานข้อมูล

## โครงสร้างโปรเจกต์

```
src/
  app/
    _layout.tsx              โครงหลักของแอป
    index.tsx                หน้าเริ่มต้น
    (tabs)/_layout.tsx       แถบแท็บ 3 แท็บ
    (tabs)/home.tsx          หน้าติวการบ้าน
    (tabs)/history.tsx       หน้าประวัติ
    (tabs)/settings.tsx      หน้าตั้งค่า API Key
  components/
    StepCard.tsx             การ์ดแสดงขั้นตอน
    HistoryCard.tsx          การ์ดรายการประวัติ
    SubjectPicker.tsx        ตัวเลือกวิชา
  lib/
    apiKey.ts                จัดเก็บและอ่านคีย์ในเครื่อง
    image.ts                 ย่อภาพก่อนส่ง
    upload.ts                อัปโหลดภาพขึ้น Storage
    device.ts                รหัสอุปกรณ์
    subjects.ts              รายการวิชาและสี
    functionError.ts         อ่านข้อความผิดพลาดจากฟังก์ชัน
  db/api.ts                  คำสั่งฐานข้อมูล
supabase/
  functions/explainHomework/index.ts
  migrations/
docs/prd.md                  เอกสารความต้องการ
```

## เอกสารเพิ่มเติม

- [`docs/prd.md`](docs/prd.md) — เอกสารความต้องการฉบับเต็ม

## หมายเหตุ

- แอปไม่มีการเข้าสู่ระบบ ข้อมูลจึงแยกตามรหัสอุปกรณ์
- นโยบาย RLS ปัจจุบันอนุญาตให้อ่านประวัติได้ทั้งหมด เหมาะกับต้นแบบ ควรปรับก่อนใช้งานจริงในวงกว้าง
- ทุกครั้งที่กดอธิบายจะมีการเรียก AI หนึ่งครั้ง ซึ่งมีค่าใช้จ่าย
