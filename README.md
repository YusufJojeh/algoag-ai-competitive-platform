# مساعد تصميم الخوارزميات مع محاكاة الأداء

نظام يساعدك على اختيار النهج الخوارزمي الأنسب: **يفهم المسألة → يقترح خوارزميات → يجرّبها → يقارنها → ينصحك بأفضل حل**.

## التقنيات

- **Backend:** Laravel 12  
- **Frontend:** React + Inertia.js  
- **AI:** Ollama (محلي)

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

# 3. تثبيت حزم الواجهة
npm install

# 4. بناء الواجهة (أو استخدم npm run dev أثناء التطوير)
npm run build
```

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

ثم افتح: [http://localhost:8000](http://localhost:8000)

## سير العمل

1. **الصفحة الرئيسية:** اكتب وصف المسألة (مثلاً: بحث في مصفوفة مرتبة، ترتيب عناصر، أقصر مسار...).
2. **اقتراح خوارزميات:** الضغط على "اقترح خوارزميات" يرسل الوصف إلى Ollama ويعرض خوارزميات مقترحة مع التعقيد الزمني والذاكري.
3. **محاكاة الأداء:** الضغط على "تشغيل محاكاة الأداء" يشغّل تنفيذاً فعلياً لخوارزميات مقابلة (في PHP) ويقيس الوقت والذاكرة.
4. **التوصية:** يتم إرسال النتائج إلى Ollama للحصول على توصية نهائية مبنية على السرعة والذاكرة وقابلية التوسع.
5. **السجل:** كل جلسة (بعد المحاكاة) تُحفظ تلقائياً في SQLite ويمكنك فتحها من قسم "آخر الجلسات" في الصفحة الرئيسية.

## قاعدة البيانات (SQLite)

المشروع يستخدم SQLite لحفظ جلسات التحليل. الجدول `algorithm_sessions` يُنشأ تلقائياً عند تشغيل:

```bash
php artisan migrate
```

ملف قاعدة البيانات: `database/database.sqlite` (يُنشأ تلقائياً إن لم يكن موجوداً).

## الاختبارات (تغطية كاملة)

### Backend (PHPUnit)
- **Unit:** `OllamaService`, `BenchmarkRunner`, `AlgorithmSession`
- **Feature:** المسارات والتحكم (Home, Suggest, Benchmark, Show Session) مع محاكاة Ollama عبر `Http::fake()`

```bash
php artisan test
```

لتقرير التغطية (يتطلب PCOV أو Xdebug):
```bash
php artisan test --coverage
```

### Frontend (Vitest + React Testing Library)
- تغطية صفحات React: `Home`, `Suggestions`, `Results` (عزل مع mock لـ Inertia)

```bash
npm run test
npm run test:coverage
```

### تشغيل كل الاختبارات
```bash
npm run test:all
```

(يشغّل `npm run test` ثم `php artisan test`.)

## الإعدادات (`.env`)

| المتغير | الوصف |
|--------|--------|
| `OLLAMA_URL` | عنوان Ollama (افتراضي: http://localhost:11434) |
| `OLLAMA_MODEL` | اسم النموذج (افتراضي: llama3.2) |

## رفع المشروع إلى GitHub

المشروع جاهز لـ Git. لرفعه إلى GitHub انظر [GITHUB.md](GITHUB.md).

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

## ترخيص

MIT
