# مساعد تصميم الخوارزميات مع محاكاة الأداء

نظام يساعدك على اختيار النهج الخوارزمي الأنسب: **يفهم المسألة → يقترح خوارزميات → يجرّبها → يقارنها → ينصحك بأفضل حل**. يتضمن أيضاً **حلّال نصوص مسائل أسلوب Codeforces** (عبر Ollama في الخلفية)، و**بنك مسائل ومسارات وإرسالات** (واجهة أساسية مع حكم تجريبي بدون تنفيذ معزول).

## التقنيات

- **Backend:** Laravel 12  
- **Frontend:** React + Inertia.js  
- **AI:** Ollama (محلي)
- **مصادقة:** جلسات Laravel (تسجيل / دخول / خروج)
- **طوابير:** دعم `QUEUE_CONNECTION=database` لمعالجة حل Codeforces في الخلفية

## المتطلبات

- PHP 8.2+
- Composer
- Node.js 18+
- [Ollama](https://ollama.ai) مثبّت ويعمل محلياً

## التثبيت

```bash
# 1. تثبيت حزم PHP
composer install

# 2. نسخ البيئة وتوليد المفتاح
copy .env.example .env
php artisan key:generate

# 3. قاعدة البيانات والبيانات الأولية (مسائل/مسارات/مستخدم تجريبي)
php artisan migrate
php artisan db:seed

# 4. تثبيت حزم الواجهة
npm install

# 5. بناء الواجهة (أو استخدم npm run dev أثناء التطوير)
npm run build
```

**مستخدم تجريبي (بعد seed):** البريد `demo@example.com` وكلمة المرور `password`.

## تشغيل Ollama

```bash
ollama serve
ollama pull llama3.2
```

(يمكن تغيير النموذج عبر `OLLAMA_MODEL` في `.env`.)

## تشغيل التطبيق

```bash
# طرفية 1: الخادم
php artisan serve

# طرفية 2 (أثناء التطوير): Vite
npm run dev
```

ثم افتح: [http://localhost:8000](http://localhost:8000) — ستُوجَّه لتسجيل الدخول إن لم تكن مسجّلاً.

## طابور المهام (حل Codeforces)

- افتراضياً في `.env.example`: `QUEUE_CONNECTION=sync` (تنفيذ بعد إرسال الاستجابة في نفس العملية).
- للإنتاج أو لتفريغ طلبات HTTP بسرعة: عيّن `QUEUE_CONNECTION=database`، نفّذ `php artisan migrate` (جدول `jobs`)، وشغّل:

```bash
php artisan queue:work
```

## سير العمل

1. **تسجيل الدخول أو إنشاء حساب** — الجلسات وحلول Codeforces مرتبطة بالمستخدم.
2. **الصفحة الرئيسية:** اكتب وصف المسألة ثم **اقترح خوارزميات** (Ollama).
3. **محاكاة الأداء:** تشغيل مقاييس PHP محلية ومقارنة النتائج.
4. **التوصية:** Ollama يلخّص التوصية؛ تُحفظ الجلسة في `algorithm_sessions`.
5. **حل Codeforces:** من الرابط في الرأس — لصق نص المسألة؛ تُصفّ الطلبات في **Job** وتُحدَّث الصفحة تلقائياً عند الانتهاء.
6. **بنك المسائل / المسارات / إرسالاتي:** روابط في الرأس؛ الإرسال يُسجَّل مع **حكم تجريبي** (لا تنفيذ كود معزول).

## قاعدة البيانات (SQLite)

- جداول رئيسية: `users`, `algorithm_sessions`, `codeforces_solutions`, `jobs` (للطابور)، `tags`, `problems`, `problem_tag`, `courses`, `lessons`, `submissions`.
- ملف SQLite: `database/database.sqlite`

## الاختبارات

### Backend (PHPUnit)

```bash
php artisan test
```

### Frontend (Vitest)

```bash
npm run test
```

### الكل

```bash
npm run test:all
```

## الإعدادات (`.env`)

| المتغير | الوصف |
|--------|--------|
| `OLLAMA_URL` | عنوان Ollama (افتراضي: http://localhost:11434) |
| `OLLAMA_MODEL` | اسم النموذج (افتراضي: llama3.2) |
| `QUEUE_CONNECTION` | `sync` أو `database` (مع `php artisan queue:work`) |

## رفع المشروع إلى GitHub

انظر [GITHUB.md](GITHUB.md).

## ترخيص

MIT
