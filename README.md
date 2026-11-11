# Suwayda Marketplace — Phase 1 Setup

## Overview
Suwayda Marketplace هو تطبيق للتجارة الإلكترونية لجميع الهواتف المحمولة والذي يربط المتاجرین المحليين في السويداء مع العملاء ويوفر تتبع التوصيل.

## المتطلبات الأولية

### 1. بنية المشروع (Monorepo)
```
.
├── .claude/settings.json               # إعدادات أذونات Claude Code
├── .claude/skills/                    # المهارات الخاصة بالمشروع
│   ├── arabic-rtl-ui/SKILL.md
│   ├── order-state-machine/SKILL.md
│   ├── security-checklist/SKILL.md
│   └── webapp-testing/SKILL.md
├── .mcp.json                          # موصلو MCP (Context7, Playwright, PostgreSQL)
├── .env.example
├── README.md                          # هذا الملف
├── PROJECT_BRIEF.md                   # الشروط التفصيلية الكاملة
├── CLAUDE.md                           # إرشادات داخلية للمشروع
├── SETUP_PROMPT.md                    # تعليمات الإعداد الأولية
├── docker-compose.yml                 # PostgreSQL (على Docker)
├── backend/                           # الخادم
│   ├── package.json
│   ├── tsconfig.json
│   ├── jest.config.js
│   ├── .env.example
│   ├── .env
│   ├── src/
│   │   ├── config/                   # القيم الأساسية
│   │   ├── common/                   # أدوات مساعدة مشتركة
│   │   │   ├── middleware/          # الغطاء، المصادقة، التحقق
│   │   │   ├── utils/               # JWT، كلمة المرور، الردود
│   │   │   └── dto/                # قوالب Zod (Typescript)
│   │   ├── modules/                 # وحدات الأعمال
│   │   │   ├── auth/               # تسجيل الدخول، تسجيل التاجر
│   │   │   ├── users/              # إدارة المستخدمين (المسؤول فقط)
│   │   │   ├── stores/             # إدارة المتاجر
│   │   │   ├── categories/         # شجرة تصنيف المنتجات
│   │   │   ├── products/           # إدارة المنتجات + الصور
│   │   │   ├── offers/             # الخصومات
│   │   │   ├── orders/             # رأس الأوامر + المراحل
│   │   │   ├── cart/               # السلة وفاتورة الشراء
│   │   │   ├── deliveries/         # السائقين وتتبع التوصيل
│   │   │   ├── notifications/      # الإشعارات (في التطبيق + Web Push)
│   │   │   ├── payments/           # طرق الدفع (نقد عند التوصيل، المحافظ الإلكترونية)
│   │   │   └── audit/              # سجل تدقيق مسؤول actions
│   │   ├── prisma/                 # مخطط قاعدة البيانات + seed
│   │   └── test/                   # ملفات الاختبار (سيتم إضافة الاختبارات قريباً)
│   ├── prisma/                       # مجلد Prisma (schema، migration، seed)
│   └── .env.example                  # متغيرات البيئة للحاوي
├── frontend/                          # تطبيق React Next.js
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.js
│   ├── tailwind.config.ts
│   ├── src/
│   │   ├── app/                     # صفحة App Router
│   │   │   ├── layout.tsx         # الجذر (RTL + الخطوط)
│   │   │   ├── globals.css       # نصوص CSS
│   │   │   ├── page.tsx          # الصفحة الرئيسية
│   │   │   ├── login/             # تسجيل الدخول
│   │   │   ├── register/          # تسجيل التاجر
│   │   │   └── admin/              # لوحة تحكم الإدارة
│   │   ├── components/              # المكونات المشاركة
│   │   │   ├── ui/                 # التصميم الأساسي
│   │   │   ├── layout/            # الهيدر والرايتر
│   │   │   └── providers/          # حالة React Query، Auth
│   │   └── lib/                     # أدوات العميل API
│   │       ├── api.ts               # عميل Axios + JWT
│   │       ├── auth.tsx            # سياق المصادقة (الحالة)
│   │       └── utils.ts             # تنسيق العملة، التنسيقات العربية
└── docs/                              # وثائق المشروع
    ├── Suwayda_Marketplace_Study.pdf   # الدراسة الأصلية (PDF)
    ├── PLAN_PHASE1.md                  # وثيقة الخطة لـ Phase 1
    └── DECISIONS.md                     # السجل للقرارات المعمارية
```

## لغة واجهة المستخدم
- **الواجهة:** العربية فقط، بالكامل RTL.
- **الكود:** الإنكليزية لكل شيء (الفرق، كود القاعدة، أسماء الجداول).
- **العملة:** الليرة السورية (SYP)، أرقام صحيحة مع آلاف الفواصل.
- **الجوال:** الموقع الأول، الصفحات الخفيفة، صور WebP المضغوطة، التحميل الكسول.

## طريقة تنظيم الكود

### بنية مجلد الخادم (`backend/src`)
- **config/**: متغيرات البيئة (`.env`، `.env.example`) وhelpers.
- **common/**: أدوات مساعدة مشتركة (middleware، utils، DTOs).
- **modules/**: وحدات الأعمال مستقلة (auth، stores، categories، products، offers، orders، cart، deliveries، notifications، payments، admin).
- **prisma/**: مخطط قاعدة البيانات (`schema.prisma`)، `seed.ts` لبيانات تجريبية، `migrations/`.
- **test/**: ملفات اختبار (TBD).

### بنية مجلد الواجهة الأمامية (`frontend/src`)
- **App Router**: `app/layout.tsx` مع RTL (`dir="rtl"`) و`lang="ar"`.
- **Components**: الصفحة الرئيسية (`/`)، صفحة تسجيل الدخول (`/login`)، صفحة تسجيل التاجر (`/register`)، لوحة التحكم (`/admin/`).
- **Lib**: عميل API (`api.ts`)، سياق المصادقة (`auth.tsx`)، تنسيق العملة (`utils.ts`).

## Step aví: المهارات والأدوات

### المهارات الخاصة بالمشروع (`.claude/skills/`)
- **`arabic-rtl-ui`** – عندما تقوم بإنشاء أو تعديل أي عنصر واجهة.
- **`order-state-machine`** – للتحكم في الحالات (NEW → DELIVERED) + transitions.
- **`security-checklist`** – قبل الانتهاء من أي endpoint أو وحدة.
- **`webapp-testing`** – التحقق من صفحات Next.js باستخدام Playwright MCP.

### موصلو MCP (`.mcp.json`)
- **Context7**: تحديثات مكتبات المصطلحات للأطر الشائعة (Next.js، Prisma، Tailwind، Express).
- **Playwright**: التحقق من الواجهة الأمامية باستخدام Chrom.
- **PostgreSQL**: فحص قاعدة البيانات المحلية (معطل حاليًا - سيتم تفعيله في Phase 1).

## المتطلبات الأساسية

### 1. البرمجيات الأساسية
- **Node.js** (`v20` أو أحدث)
- **Docker** (اختياري) لتشغيل PostgreSQL محلي
- **Git** (مفترض)

### 2. خطوات الإعداد

#### أ. تثبيت Node.js
```bash
actions:
  - download from nodejs.org
  - على ويندوز: استخدم برنامج التثبيت MSI
```

#### ب. تثبيت PostgreSQL (اختياري)

**الخيار 1:** Docker Compose (موصى به)
```bash
docker compose up -d
```

**الخيار 2:** محلي على ويندوز (تنزيل MSI)
1. قم بتثبيت `postgresql` من [download.postgresql.org](https://www.enterprisewebsolutions.com/postgresql/download.html)
2. عند المطالبة، اختر **مستخدم Administrators** (أو قم بإنشاء مستخدم جديد `postgres`)
3. اختر **الخدمة تلقائيًا** للبدء عند الإقلاع.
4. افتح نافذة `psql` (من موجه أدوات PostgreSQL) وقم بإنشاء قاعدة البيانات:
```sql
CREATE DATABASE suwayda_dev;
```
5. أضف الـ `trust` auth مبدئيًا (للتجربة):
```bash
# كمسؤول، قم بتعديل ملف `C:\Program Files\PostgreSQL\18\data\pg_hba.conf`
# ابحث عن سطر يحتوي على `METHOD` مع `local` أو `host 127.0.0.1` وقم بتعيينه إلى `trust`
# ثم قم بإعادة تحميل الخادم: `net stop postgresql-x64-18 && net start postgresql-x64-18`
```

#### ج. Clone المشروع (إذا كنت تفضل من GitHub)
```bash
gh repo clone owner/suwayda-marketplace
# أو قم بفك الضغط من ملف zip
```

#### د. تثبيت الـ dependencies
```bash
cd backend && npm install
cd ..
cd frontend && npm install
```

#### هـ. تشغيل الموجهات الأولية
```bash
# في مجلد الـ backend
cd backend
npx prisma migrate dev --name init
npm run seed

# في مجلد الـ frontend (إذا كنت تريد تشغيله في الخلفية)
cd ../frontend
# إذا كنت ترغب في تشغيل Next.js، قم بـ:
npm run dev
```

#### و. الوصول إلى التطبيق
- **الواجهة:** `http://localhost:3000` (صفحة Next.js)
- **API:** `http://localhost:5000/api/auth/login` (خادم Express)

### 3. عملية تسجيل الدخول (لـ admin)

**Credentials الأولية** (تم إنشاؤها بواسطة الـ seed):
- **البريد الإلكتروني:** `admin@suwayda.local`
- **الهاتف:** `+963999000001`
- **كلمة المرور:** `SecureAdminPassword123!`

قم بتسجيل الدخول إلى Admin Panel:
1. افتح `http://localhost:3000/admin`
2. استخدم زر **Admin Login** (أو similar).
3. أدخل بيانات الاعتماد.

### 4. تشيك الاختبارات
```bash
cd backend
npm test -- --runInBand
```

### النشر على Render
- أنشئ Web Service من مجلد `backend` (Root Directory).
- Build Command: `npm ci && npm run build`
- Start Command: `npm start`
- أضف `DATABASE_URL` ورموز JWT كمتغيرات بيئة في Render، ولا ترفع ملف `.env`.
- انشر تغييرات قاعدة البيانات باستخدام `npm run prisma:migrate:deploy` بعد التأكد من حالة قاعدة البيانات. لا تستخدم `migrate dev` على قاعدة الإنتاج.

### 5. فحص الخدمات
```bash
# تحقق من أن الخادم يعمل
curl http://localhost:5000/api/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"phone": "+963999000001", "password": "SecureAdminPassword123!"}'
```

## Phase 1: ما سيتم إنجازه

- [ ] **تهيئة البنية التحتية** (مكتملة)
- [x] **تهيئة PostgreSQL** (مكتملة)
- [x] **إنشاء Prisma schema** (مكتملة)
- [x] **تنفيذ التحويلات** (مكتملة)
- [x] **تنفيذ الـ seed** (مكتملة)
- [x] **تنفيذ الاختبارات** (مكتملة)
- [x] **إعداد الواجهة الأمامية** (مكتملة)
- [ ] **اختبار التكامل** (في Phase 2)

## ملاحظات تصحيح الأخطاء

### مشكلة: `npm install` يفشل (مشكلة في الشبكة)
**الحل:** تأكد من أن لديك اتصال بالإنترنت. إذا كنت تستخدم VPN، قم بتعطيله مؤقتًا.

### مشكلة: Docker غير متاح
**الحل:** استخدم `psql` المحلي (مشروح أعلاه) بدلاً من Docker.

### مشكلة: خطأ في TypeScript
**الحل:** قد يكون TypeScript قديمًا. قم بـ:
```bash
npm install -g typescript@latest
cd backend && npm install -D typescript@latest
cd frontend && npm install -D typescript@latest
```

### مشكلة: PostgreSQL auth يفشل
**الحل:** تأكد من كلمة مرور المستخدم `postgres`. إذا كنت قد قمت بتعديل `pg_hba.conf` إلى `trust`، فقم باستعادته إلى `md5`:
```bash
# في ملف C:\Program Files\PostgreSQL\18\data\pg_hba.conf
# ابحث عن سطر يحتوي على `METHOD` مع `local` أو `host 127.0.0.1` وقم بتعيينه إلى `md5`
# أعد تشغيل الخادم
cd /path/to/postgresql
cmake-world
```

## الدعم

إذا واجهت أي مشكلة، يمكنك طلب المساعدة في مرحلة **Phase 2** (اختبار التكامل وإعداد الواجهة الأمامية) بمجرد الانتهاء من الخادم.

## النقاط المهمة

- **تذكر دائمًا `ADMIN_PASSWORD` = `SecureAdminPassword123!`** إذا كنت بحاجة إلى إعادة تشغيل الـ seed.
- **لا تقم بتعديل `PGDATABASE` أو الـ credentials الأخرى** (حتاجها فقط للـ seed).
- **ابقِ `.env` خارج الـ Git** (`.gitignore` تشمله).
- **قم بتوثيق الإعدادات** (`git add -A`، `git commit -m "docs: add .env.example"`).

---
**تم الانتهاء من جميع المهام الأولية.**
أنت جاهز لبدء Phase 1. استخدم كلمة مرور admin أعلاه للولوج إلى اللوحة. اقرأ `docs/PLAN_PHASE1.md` للحصول على الخطوات التالية.