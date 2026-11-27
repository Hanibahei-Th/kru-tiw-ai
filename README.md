# ครูติว AI

<p align="center">
  <img src="assets/icon.png" alt="ไอคอนแอปครูติว AI" width="160" />
</p>

<p align="center">
  แอปช่วยนักเรียนไทยคิดวิธีทำการบ้านทีละขั้นจากภาพ<br />
  เน้นชวนคิดแบบ Socratic ไม่เฉลยคำตอบสุดท้าย
</p>

> โปรเจกต์นี้สร้างด้วย Expo SDK 55, React Native และ TypeScript รองรับ Android, iOS และ Web

## สารบัญ

- [ความสามารถ](#ความสามารถ)
- [ภาพรวมระบบ](#ภาพรวมระบบ)
- [เทคโนโลยี](#เทคโนโลยี)
- [เริ่มพัฒนา](#เริ่มพัฒนา)
- [ตั้งค่า Supabase](#ตั้งค่า-supabase)
- [ตั้งค่า Gemini](#ตั้งค่า-gemini)
- [รันแอป](#รันแอป)
- [สร้างไฟล์สำหรับ Store ด้วย EAS](#สร้างไฟล์สำหรับ-store-ด้วย-eas)
- [โครงสร้างโปรเจกต์](#โครงสร้างโปรเจกต์)
- [ข้อมูลและความปลอดภัย](#ข้อมูลและความปลอดภัย)
- [การแก้ปัญหาเบื้องต้น](#การแก้ปัญหาเบื้องต้น)
- [สถานะและข้อจำกัด](#สถานะและข้อจำกัด)

## ความสามารถ

- ถ่ายภาพการบ้านด้วยกล้องหรือเลือกภาพจากคลังรูป
- ย่อภาพก่อนส่งวิเคราะห์ โดยใช้ภาพ JPEG สำหรับคำขอ AI
- เลือกวิชาได้ 3 วิชา: คณิตศาสตร์, วิทยาศาสตร์ และภาษาอังกฤษ
- รับคำแนะนำเป็นภาษาไทยทีละขั้น พร้อมคำใบ้ให้กำลังใจ
- ดูและลบประวัติการถามที่ผูกกับบัญชีผู้ใช้ (ใช้ guest ได้โดยไม่ต้องสมัคร)
- ใช้แบบ guest ได้ 10 ครั้งต่อวัน; สมัคร/เข้าสู่ระบบเพื่อใช้ต่อ โดยสมาชิกมีโควตาเริ่มต้น 50 ครั้งต่อวัน
- ตั้ง Gemini API Key ส่วนตัวและทดสอบคีย์ได้
- ใช้ธีมสีพาสเทล พร้อมรองรับการตั้งค่าโหมดสว่าง/มืดของระบบ

## ภาพรวมระบบ

```text
Expo / React Native app
   ├── Supabase Storage: เก็บภาพการบ้าน
   ├── Supabase Database: เก็บประวัติแบบผูกกับบัญชีและนับโควตารายวัน
   └── Supabase Edge Function: explainHomework
          ├── Gemini API โดยตรง เมื่อผู้ใช้ตั้ง API Key ส่วนตัว
          └── AI Gateway เมื่อไม่ได้ตั้งคีย์ส่วนตัว
```

เมื่อผู้ใช้ส่งภาพ แอปอัปโหลดภาพไปยัง Storage แล้วเรียก Edge Function เพื่อรับคำอธิบาย จากนั้น Edge Function บันทึกข้อมูลประวัติลง `homework_history` และส่งคำตอบกลับมาให้แอป

## เทคโนโลยี

| ส่วน | เทคโนโลยี |
| --- | --- |
| แอป | Expo SDK 55, React Native 0.83, React 19 |
| ภาษา | TypeScript |
| Routing | Expo Router |
| สไตล์ | NativeWind v4, Tailwind CSS |
| UI และไอคอน | React Native primitives, lucide-react-native |
| ฐานข้อมูลและ Storage | Supabase, PostgreSQL, Supabase Storage |
| Backend | Supabase Edge Functions (Deno) |
| AI | Gemini 2.5 Flash |
| Build | EAS Build |

## เริ่มพัฒนา

### สิ่งที่ต้องมี

- Node.js 22.13.0 ขึ้นไป
- pnpm 11.28.9 ตาม `packageManager` ใน `package.json`
- Git
- Expo account สำหรับ EAS Build
- Supabase project สำหรับฟังก์ชัน ประวัติ และ Storage

ติดตั้ง pnpm ผ่าน Corepack แล้วติดตั้ง dependencies:

```bash
corepack enable
corepack prepare pnpm@11.28.9 --activate
pnpm install --frozen-lockfile
```

ไฟล์ `pnpm-workspace.yaml` มี checksum สำหรับ config dependency ของ Miaoda DevKit ซึ่งจำเป็นต่อการติดตั้งแบบ frozen และ EAS Build

## ตั้งค่า Supabase

1. สร้าง Supabase project แล้วคัดลอก URL และ anon key จาก Project Settings → API.
2. สร้างไฟล์ `.env` จากตัวอย่าง แล้วกรอกค่าจริง:

   ```bash
   cp .env.example .env
   ```

   ตัวแปรที่แอปอ่านตอน build:

   | ตัวแปร | ใช้ทำอะไร |
   | --- | --- |
   | `EXPO_PUBLIC_SUPABASE_URL` | URL ของ Supabase project |
   | `EXPO_PUBLIC_SUPABASE_ANON_KEY` | anon/publishable key สำหรับแอป |
   | `EXPO_PUBLIC_SENTRY_DSN` | ไม่บังคับ; ส่งรายงานข้อผิดพลาดไป Sentry |

   ตัวแปรที่ขึ้นต้นด้วย `EXPO_PUBLIC_` จะถูกรวมอยู่ใน bundle ของแอป จึงห้ามใส่ service-role key หรือ secret key ในตัวแปรกลุ่มนี้

3. ติดตั้ง Supabase CLI และล็อกอิน จากนั้นเชื่อมโปรเจกต์และ apply migration:

   ```bash
   supabase login
   supabase link --project-ref <project-ref>
   supabase db push
   ```

4. เปิด Anonymous Sign-ins ที่ Authentication → Sign In / Providers; migration จะตั้ง bucket `homework_images` เป็น private และจำกัดสิทธิ์ตามบัญชีให้อัตโนมัติ
5. ตั้งค่า email confirmation/SMTP และ URL สำหรับยืนยันอีเมลตามโดเมนแอปของโปรเจกต์
6. Deploy Edge Function หลัง apply migration:
   ```bash
   supabase functions deploy explainHomework
   ```

แอปมี fallback URL และ anon key สำหรับ placeholder เพื่อให้ config ไม่ว่าง แต่จะเชื่อม backend จริงไม่ได้หากยังไม่ได้กำหนดค่า Supabase

## ตั้งค่า Gemini

มีสองทางเลือก:

- **คีย์ส่วนตัวของผู้ใช้:** ผู้ใช้ใส่ Gemini API Key ในหน้า Settings ของแอป คีย์จะเก็บใน SecureStore บนอุปกรณ์ (เว็บใช้ localStorage) และส่งให้ Edge Function เมื่อเรียก AI
- **คีย์ของระบบ:** ตั้ง `INTEGRATIONS_API_KEY` เป็น secret ของ Supabase Edge Function เพื่อให้เรียก AI Gateway เมื่อผู้ใช้ไม่ได้ตั้งคีย์ส่วนตัว:

  ```bash
  supabase secrets set INTEGRATIONS_API_KEY=<gateway-key>
  ```

ห้ามเก็บ Gemini key, gateway key, Supabase service-role key หรือ Apple/Google signing credential ใน Git หรือใน `.env` ที่เผยแพร่สู่สาธารณะ

## รันแอป

เริ่ม Metro/Expo development server:

```bash
pnpm start
```

คำสั่งทางลัด:

```bash
pnpm android
pnpm ios
pnpm web
```

โปรเจกต์ใช้ `expo-dev-client` หากทดสอบบนอุปกรณ์จริงอาจต้องติดตั้ง development build ก่อน การรัน `pnpm ios` บน Linux ไม่สามารถเปิด iOS Simulator ได้; ใช้ EAS cloud build เพื่อสร้างแอป iOS

## สร้างไฟล์สำหรับ Store ด้วย EAS

ล็อกอินและตรวจ project:

```bash
npx eas-cli@latest login
npx eas-cli@latest project:info
```

ใน repository มี `eas.json` กำหนด production profile แล้ว:

```bash
# Android App Bundle (.aab) สำหรับ Google Play
npx eas-cli@latest build --platform android --profile production

# iOS archive (.ipa) สำหรับ App Store Connect
npx eas-cli@latest build --platform ios --profile production
```

- Android production profile สร้าง `.aab` และเพิ่ม `versionCode` อัตโนมัติ
- iOS production profile ต้องใช้ Apple Developer Program และ distribution signing credentials
- iOS bundle ID ปัจจุบันคือ `com.tatsana.pn.krutiwai`
- Android application ID ปัจจุบันคือ `com.miaoda.krutewai`
- ดาวน์โหลดไฟล์เมื่อ build สำเร็จจากลิงก์ artifact ใน EAS dashboard หรือผลลัพธ์ CLI

หาก EAS ถามเรื่อง encryption ให้ตอบตามลักษณะการเข้ารหัสที่แอปใช้จริงและข้อกำหนดของ Apple ห้ามเปลี่ยน declaration โดยไม่ตรวจสอบก่อน

## โครงสร้างโปรเจกต์

```text
src/
  app/
    _layout.tsx                 Root layout และ StatusBar
    (tabs)/
      _layout.tsx               แถบนำทางด้านล่าง
      home.tsx                  ถ่าย/เลือกรูป เลือกวิชา และขอคำอธิบาย
      history.tsx               โหลดและลบประวัติ
      settings.tsx              ตั้งค่าและทดสอบ Gemini API Key
  client/supabase.ts            Supabase client
  components/
    HistoryCard.tsx             การ์ดประวัติและคำอธิบาย
    StepCard.tsx                การ์ดขั้นตอนคำแนะนำ
    SubjectPicker.tsx           ตัวเลือกวิชา
  db/api.ts                     คำสั่งอ่าน/ลบประวัติ
  lib/
    apiKey.ts                   จัดเก็บคีย์ใน SecureStore/localStorage
    device.ts                   สร้าง/อ่านรหัสอุปกรณ์
    image.ts                    เตรียมและย่อภาพ
    subjects.ts                 วิชาและสีประจำวิชา
    upload.ts                   อัปโหลดภาพไป Supabase Storage
  global.css                    สีธีมสว่างและมืด
  types/                        TypeScript และฐานข้อมูล
supabase/
  functions/explainHomework/    ตรวจภาพและเรียก Gemini
  migrations/                   โครงสร้างตารางและ RLS policies
docs/prd.md                     เอกสารความต้องการผลิตภัณฑ์
assets/                         ไอคอนและ favicon
app.json                        Expo app configuration
eas.json                       EAS build profiles
pnpm-workspace.yaml             pnpm catalog และ config dependency
```

## ข้อมูลและความปลอดภัย

- ตาราง `homework_history` เก็บ `device_id`, `subject`, `image_url`, `steps`, `hint` และ `created_at`
- แอปสร้าง anonymous auth session ให้ guest; สมัครสมาชิกด้วยอีเมล/รหัสผ่านเพื่อผูก session เดิมและรักษาประวัติไว้
- โควตา AI ตรวจบน Edge Function และฐานข้อมูล: guest 10 ครั้ง/วัน, สมาชิก 50 ครั้ง/วัน (UTC)
- ภาพเก็บใน private bucket `homework_images`; ใช้ signed URL ชั่วคราวเพื่อแสดงประวัติ
- RLS จำกัดประวัติและไฟล์ตาม `auth.uid()`; แถวเก่าที่มีเพียง device ID จะยังอยู่แต่ไม่มีเจ้าของที่ยืนยันได้ จึงไม่แสดงในบัญชีใหม่
- API key ส่วนตัวเก็บใน SecureStore บนอุปกรณ์ ไม่เก็บในฐานข้อมูล
- `.env`, `node_modules`, native build folders และไฟล์ชั่วคราวถูกละเว้นด้วย `.gitignore`
- ต้องเปิด Anonymous Sign-ins ใน Supabase Authentication เพื่อให้ guest session ทำงาน และตั้งค่า email confirmation/SMTP ตามนโยบายของโปรเจกต์

## การแก้ปัญหาเบื้องต้น

### EAS แจ้งว่าไม่มี Expo project

อยู่ใน root ของโปรเจกต์ Expo ที่มี `app.json`, `package.json`, `pnpm-workspace.yaml` และ `src/` แล้วตรวจ `npx eas-cli@latest project:info` อย่ารันจากโฟลเดอร์ server หรือโฟลเดอร์ดาวน์โหลดที่เป็นคนละโปรเจกต์

### EAS ติดตั้ง dependencies ไม่ผ่าน

ตรวจว่าใช้ Node 22.13.0 ขึ้นไป, pnpm 11.28.9 และ lockfile ตรงกับ workspace config:

```bash
node --version
pnpm --version
pnpm install --frozen-lockfile
```

### แอปเปิดแต่เรียก backend ไม่ได้

ตรวจ `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, การ deploy `explainHomework`, Edge Function secrets และ Storage bucket/policies

## สถานะและข้อจำกัด

- มี production AAB build ผ่าน EAS; ดู build history ที่ [Expo project](https://expo.dev/accounts/tatsana.pn/projects/krutew-ai)
- การส่งขึ้น Google Play Console และ App Store Connect ต้องทำในบัญชีของเจ้าของแอป และยังต้องกรอก store listing, ภาพหน้าจอ, privacy details และข้อมูลตามที่แต่ละ store ขอ
- ยังไม่มีภาพ screenshot ใน README นี้; ไอคอนด้านบนเป็น asset จาก repository
- ดูข้อกำหนดผลิตภัณฑ์เพิ่มเติมได้ที่ [`docs/prd.md`](docs/prd.md)
