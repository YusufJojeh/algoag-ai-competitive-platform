from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor


OUTPUT_PATH = r"C:\xampp\htdocs\algoag\docs\algoag-specification-ar.docx"


def set_rtl(paragraph, align=WD_ALIGN_PARAGRAPH.RIGHT):
    paragraph.alignment = align
    p_pr = paragraph._p.get_or_add_pPr()
    bidi = p_pr.find(qn("w:bidi"))
    if bidi is None:
        bidi = OxmlElement("w:bidi")
        p_pr.append(bidi)


def add_run(paragraph, text, *, size, bold=False, color=None):
    run = paragraph.add_run(text)
    run.bold = bold
    run.font.name = "Arial"
    run._element.rPr.rFonts.set(qn("w:eastAsia"), "Arial")
    run.font.size = Pt(size)
    if color:
        run.font.color.rgb = RGBColor.from_string(color)
    return run


def title(doc, text):
    p = doc.add_paragraph()
    set_rtl(p)
    add_run(p, text, size=22, bold=True, color="0F172A")
    return p


def subtitle(doc, text):
    p = doc.add_paragraph()
    set_rtl(p)
    add_run(p, text, size=14, bold=True, color="334155")
    return p


def note(doc, text, size=10, color="475569"):
    p = doc.add_paragraph()
    set_rtl(p)
    add_run(p, text, size=size, color=color)
    return p


def section(doc, text):
    p = doc.add_paragraph()
    set_rtl(p)
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(6)
    add_run(p, text, size=16, bold=True, color="0F172A")
    return p


def body(doc, text):
    p = doc.add_paragraph()
    set_rtl(p)
    p.paragraph_format.line_spacing = 1.25
    add_run(p, text, size=11)
    return p


def bullet(doc, text):
    p = doc.add_paragraph()
    set_rtl(p)
    p.paragraph_format.line_spacing = 1.2
    add_run(p, f"• {text}", size=11)
    return p


def labeled_bullet(doc, label, text):
    p = doc.add_paragraph()
    set_rtl(p)
    p.paragraph_format.line_spacing = 1.2
    add_run(p, "• ", size=11)
    add_run(p, f"{label}: ", size=11, bold=True, color="1D4ED8")
    add_run(p, text, size=11)
    return p


def build():
    doc = Document()
    sec = doc.sections[0]
    sec.top_margin = Inches(0.67)
    sec.bottom_margin = Inches(0.67)
    sec.left_margin = Inches(0.71)
    sec.right_margin = Inches(0.71)

    title(doc, "وثيقة مواصفات نظام ALGOAG")
    subtitle(doc, "منصة تدريب خوارزميات مع مساعد برمجي بصري وصوتي ومسار تحليل وحل تنافسي")
    note(doc, "نسخة مواصفات مبنية على قراءة بنية المشروع والواجهات والمسارات والخدمات المنفذة في الكود الحالي.")
    note(doc, "التاريخ: 13 مايو 2026 | النطاق: Laravel / Inertia / React / Assistant / Content Library / Codeforces / Local Judge")

    section(doc, "1. الملخص التنفيذي")
    body(doc, "ALGOAG منصة تعليمية وتدريبية تجمع بين أكثر من منتج داخل نظام واحد: مساعد ذكاء اصطناعي متعدد الوسائط، واجهة اقتراح خوارزميات ومحاكاة Benchmark، مسار حل مسائل Codeforces، مكتبة أنماط عامة، بنك مسائل، دورات، وإرسالات، إضافة إلى لوحة إدارة للمسائل. التطبيق مبني على Laravel في الخلفية وReact + Inertia في الواجهة، ويستخدم Jobs وبثًا لحظيًا أو polling احتياطيًا لتقديم تجربة تفاعلية أثناء التحليل.")
    bullet(doc, "المستخدم المسجل يستطيع استخدام المساعد النصي/الصوتي/البصري، حفظ الجلسات، والعودة إلى نتائج سابقة.")
    bullet(doc, "النظام يوفر مسارًا منفصلًا لاقتراح الخوارزميات ثم مقارنة نتائجها وإخراج توصية نهائية محفوظة.")
    bullet(doc, "النظام يوفر أيضًا مسار Codeforces يعالج الطلبات في الخلفية ويعرض حالة التنفيذ والنتيجة التفصيلية.")
    bullet(doc, "المكتبة التعليمية تتضمن أنماطًا، مسائل، دورات، ودروسًا، مع فصل واضح بين المحتوى العام والمحتوى المحمي.")
    bullet(doc, "هناك ضوابط تشغيلية وأمنية تمنع تفعيل التحكيم المحلي الحقيقي في الإنتاج دون إعداد صريح.")

    section(doc, "2. نطاق النظام")
    labeled_bullet(doc, "الواجهة العامة", "صفحة هبوط تسويقية متقدمة، وروابط وصول إلى التسجيل أو صفحة المساعد، ومكتبة أنماط عامة قابلة للتصفح دون مصادقة.")
    labeled_bullet(doc, "المستخدم المسجل", "الدخول إلى المساعد، اقتراح الخوارزميات، Benchmark، حل Codeforces، بنك المسائل، الدورات، والإرسالات الشخصية.")
    labeled_bullet(doc, "الإدارة", "لوحة CRUD للمسائل محمية للمشرف فقط.")
    labeled_bullet(doc, "المحتوى الخارجي", "فهرسة وتحميل أنماط ومسائل من بنية محتوى JSON/Markdown ضمن content/cp.")
    labeled_bullet(doc, "ما ليس ضمن النطاق الحالي", "لا توجد منصة sandbox إنتاجية كاملة للإرسالات العامة، ولا دعم شامل متعدد اللغات للتحكيم الحقيقي خارج القيود الحالية.")

    section(doc, "3. البنية التقنية")
    labeled_bullet(doc, "الخلفية", "Laravel 12 وPHP 8.2 مع Controllers وForm Requests وPolicies وJobs وEvents وServices وActions.")
    labeled_bullet(doc, "الواجهة", "React 18 مع Inertia.js وVite وTailwind CSS 4 ومكونات Radix UI وLucide وFramer Motion.")
    labeled_bullet(doc, "الذكاء الاصطناعي", "المساعد يدعم مزودًا افتراضيًا عبر OpenAI مع مزودات بديلة مثل Gemini وOllama حسب الإعدادات.")
    labeled_bullet(doc, "الصوت والرؤية", "Whisper STT للصوت وOpenAI TTS للصوت الناتج، مع Ollama كخيار محلي للرؤية/النماذج.")
    labeled_bullet(doc, "البث اللحظي", "Laravel Echo مع Reverb أو Pusher، وإذا لم تتوفر بيئة realtime ينتقل العميل إلى polling تلقائيًا.")
    labeled_bullet(doc, "الاختبارات", "PHPUnit وVitest وPlaywright functional + visual عبر عدة دقات شاشة ولغتين.")

    section(doc, "4. الأدوار والصلاحيات")
    labeled_bullet(doc, "زائر", "يشاهد صفحة الهبوط العامة ويتصفح مكتبة الأنماط فقط.")
    labeled_bullet(doc, "مستخدم مسجل", "يصل إلى المساعد ونتائجه وجلساته وحل Codeforces وبنك المسائل والدورات والإرسالات.")
    labeled_bullet(doc, "مشرف", "يمتلك جميع صلاحيات المستخدم المسجل بالإضافة إلى إدارة المسائل من خلال لوحة الإدارة.")
    labeled_bullet(doc, "سياسات الوصول", "كل سجل حساس مثل جلسة مساعد أو نتيجة Codeforces أو إرسال مرتبط بصاحبه ويمر عبر Policies قبل العرض أو التعديل.")

    section(doc, "5. وحدات المنتج الرئيسية")
    labeled_bullet(doc, "المساعد الذكي", "صفحة Assistant تتعامل مع النص والصوت والتقاط الشاشة، وتعرض thread رسائل وحالة العمل ولوحة سياق جانبية.")
    labeled_bullet(doc, "اقتراح الخوارزميات", "واجهة Home تستقبل وصف المشكلة وتطلب اقتراحات، ثم ترسل suggestions إلى Benchmark workflow لإنتاج توصية.")
    labeled_bullet(doc, "حل Codeforces", "واجهة مستقلة لاستقبال نص المسألة واللغة المطلوبة، ثم Queue ومعالجة خلفية ونتيجة تفصيلية.")
    labeled_bullet(doc, "مكتبة الأنماط", "فهرس عام لأنماط الخوارزميات مع فلاتر وبحث ووسوم وصفحات تفصيلية وروابط canonical.")
    labeled_bullet(doc, "بنك المسائل", "عرض المسائل مع الصعوبة والوسوم وحدود الزمن والذاكرة.")
    labeled_bullet(doc, "الدورات", "عرض الدورات والدروس المرتبطة بها.")
    labeled_bullet(doc, "الإرسالات", "حفظ إرسالات المستخدم وإظهار حكمها الحالي وبياناتها الوصفية.")
    labeled_bullet(doc, "لوحة الإدارة", "إدارة المسائل عبر create/update/delete/list للمشرف.")

    section(doc, "6. تدفق المساعد الذكي")
    bullet(doc, "المستخدم يكتب نصًا أو يسجل صوتًا، ويمكنه تشغيل مشاركة الشاشة ثم التقاط frame محدث قبل الإرسال.")
    bullet(doc, "الواجهة تولد client_request_id وتجمع transcript وaudio وframe وmode وlanguage وربما session_id داخل FormData.")
    bullet(doc, "الخادم يستقبل الطلب عبر /assistant/analyze، ويتحقق من عدم التكرار على مستوى المستخدم، ثم يحفظ الرسالة الأولى بحالة queued.")
    bullet(doc, "إذا لم تكن هناك جلسة قائمة، ينشئ النظام AssistantSession جديدة ويربطها بالمستخدم واللغة والعنوان المشتق من النص.")
    bullet(doc, "تتم جدولة ProcessAnalysisJob في الخلفية لمعالجة الرسالة.")
    bullet(doc, "العميل يشترك بقناة realtime للمستخدم؛ وإذا تعذر ذلك يستخدم polling على endpoint حالة الرسالة.")
    bullet(doc, "أثناء التنفيذ تعرض الواجهة حالات مثل queued وtranscribing وanalyzing وtts_generating، ثم completed أو failed أو cancelled.")
    bullet(doc, "عند توفر صوت الرد، ينتج النظام signed URL مؤقتًا للوصول إلى ملف MP3 الخاص بالمستخدم فقط.")

    section(doc, "7. أوضاع المساعد والبيانات الداخلة")
    body(doc, "الكود يثبت أن الرسائل تخزن mode صراحة وأن هناك تطبيعًا للأوضاع عبر ModePrompts. المواصفة التشغيلية للمساعد تفترض وجود أنماط استخدام موجهة مثل فحص الفكرة، التلخيص، التحقق، تقدير التعقيد، أو اكتشاف الحالات الحدية. كما أن إدخال المساعد قد يكون نصيًا فقط، صوتيًا فقط، أو مرفقًا بسياق بصري من الشاشة.")
    labeled_bullet(doc, "المدخلات المدعومة", "transcript، audio blob، frame image، language، mode، client_request_id، session_id.")
    labeled_bullet(doc, "السجلات المحفوظة", "المحتوى النصي، مسار الصوت المرفوع، مسار الصورة، hash للإطار عند توفره، وحالة التنفيذ.")
    labeled_bullet(doc, "المخرجات", "partial_text أثناء التنفيذ، full_text النهائي، audio_url اختياري، ورسالة خطأ آمنة للمستخدم إذا فشل التدفق.")

    section(doc, "8. تدفق اقتراح الخوارزميات وBenchmark")
    bullet(doc, "واجهة Home تعرض توافر Ollama وآخر جلسات المستخدم وآخر محاولات Codeforces.")
    bullet(doc, "الطلب /suggest يأخذ وصف المشكلة ويرسله إلى SuggestAlgorithmsAction عبر OllamaService.")
    bullet(doc, "النتيجة تعرض في صفحة Suggestions مع الاقتراحات نفسها وحالة توافر Ollama.")
    bullet(doc, "الطلب /benchmark يأخذ المشكلة والاقتراحات ويشغّل RunBenchmarkWorkflowAction.")
    bullet(doc, "صفحة Results تعرض benchmarkResults والتوصية recommendation ورابط sessionId للرجوع لاحقًا.")

    section(doc, "9. تدفق حل Codeforces")
    bullet(doc, "المستخدم يدخل نص المسألة من صفحة /solve ويختار اللغة، مع تحقق من صلاحية create على CodeforcesSolution.")
    bullet(doc, "إذا لم يكن Ollama متاحًا، ترفض العملية برسالة واضحة للمستخدم.")
    bullet(doc, "الطلب يمر عبر QueueCodeforcesSolutionAction ثم ProcessCodeforcesSolutionJob.")
    bullet(doc, "صفحة النتيجة تعرض parsed_problem والكود المولد والشرح والاختبارات المولدة وrun_results وحالة التنفيذ.")
    bullet(doc, "هناك endpoint منفصل لحالة الحل /solve/result/{id}/status لتحديث الواجهة أثناء المعالجة.")

    section(doc, "10. المحتوى التعليمي والإدارة")
    labeled_bullet(doc, "الأنماط", "PatternController يعرض فهرسًا عامًا مع q وstatus وtag وper_page، ويعيد تفاصيل pattern ومحتوى متعلقًا به.")
    labeled_bullet(doc, "المسائل", "ProblemController يعرض قائمة المسائل وتفاصيل كل مسألة بعد التحقق من السياسات.")
    labeled_bullet(doc, "الدورات", "CourseController يعرض قائمة الدورات ثم lessons المرتبطة بها.")
    labeled_bullet(doc, "الإرسالات", "SubmissionController يخزن الإرسال بحكم stub_reviewed افتراضيًا ويعرض آخر 50 سجلًا للمستخدم.")
    labeled_bullet(doc, "لوحة الإدارة", "ProblemAdminController يوفر إنشاء وتعديل وحذف المسائل للمشرف ضمن /admin/problems.")

    section(doc, "11. البيانات الرئيسية")
    labeled_bullet(doc, "users", "حسابات المستخدمين مع حقل is_admin.")
    labeled_bullet(doc, "assistant_sessions / assistant_messages", "الجلسات والرسائل والمرفقات والحالات والصوت النهائي.")
    labeled_bullet(doc, "algorithm_sessions", "نتائج اقتراح الخوارزميات وBenchmark والتوصية.")
    labeled_bullet(doc, "codeforces_solutions", "نص المسألة والمخرجات والشرح والاختبارات والحالة.")
    labeled_bullet(doc, "problems / tags / problem_tag", "المسائل التقليدية وتصنيفاتها.")
    labeled_bullet(doc, "courses / lessons", "المحتوى التعليمي المنظم.")
    labeled_bullet(doc, "submissions", "إرسالات المستخدمين على المسائل.")
    labeled_bullet(doc, "content_index_problems / content_index_patterns", "فهرسة المحتوى الخارجي المعتمد على JSON.")
    labeled_bullet(doc, "judge_runs", "سجل تشغيلات وحدة التنفيذ عندما يستخدم التحكيم الفعلي.")

    section(doc, "12. الأمان والحماية التشغيلية")
    bullet(doc, "المسارات العامة محدودة، بينما جميع الوحدات التشغيلية تعتمد auth مع سياسات وصول خاصة بالسجلات.")
    bullet(doc, "ملفات الصوت والصور تحفظ داخل تخزين خاص local وليس public.")
    bullet(doc, "روابط ملفات الصوت النهائية موقعة signed ومؤقتة، مع تحقق إضافي من ملكية الجلسة.")
    bullet(doc, "الإنتاج يفرض throttling أعلى على الطلبات الحساسة، بينما local/testing أخف لتفادي هشاشة اختبارات E2E.")
    bullet(doc, "تشغيل judge الحقيقي محجوب افتراضيًا، ولا يسمح به في الإنتاج دون sandbox driver أو تجاوز مقصود بإعداد صريح.")
    bullet(doc, "الفشل في الوظائف الخلفية لا يعرض تفاصيل الاستثناء للمستخدم بل رسالة آمنة فقط.")

    section(doc, "13. وحدة التحكيم المحلي")
    body(doc, "يوجد داخل المشروع LocalProcessJudge كقاضٍ محلي حقيقي مخصص حاليًا لحلول Python 3 فقط. ينفذ الكود في مجلد مؤقت عشوائي، ويفحص syntax أولًا، ثم يشغّل مجموعة الاختبارات ويعيد verdict مثل accepted أو wrong_answer أو runtime_error أو time_limit_exceeded.")
    bullet(doc, "هذه الوحدة ليست مفعلة افتراضيًا للإنتاج بسبب مخاطر تنفيذ الكود بدون عزل كافٍ.")
    bullet(doc, "إعدادات judge.php تسمح بضبط time_limit_seconds وsandbox_driver وخيار الحماية الخاص بالإنتاج.")
    bullet(doc, "الإرسالات العامة في المسارات العادية ما تزال تسجل بحكم stub ولا تمر بهذا القاضي افتراضيًا.")

    section(doc, "14. الترجمة وتجربة الاستخدام")
    bullet(doc, "المنصة تحتوي على دعم فعلي للعربية والإنجليزية في الواجهة، مع مراعاة RTL في أجزاء رئيسية من التجربة.")
    bullet(doc, "التعرف على الكلام يضبط اللغة حسب locale ويرسل ar أو en إلى الخادم.")
    bullet(doc, "الاختبارات البصرية تغطي العربية والإنجليزية وعلى mobile وtablet وlaptop وdesktop.")
    bullet(doc, "صفحة الهبوط مصممة كواجهة تسويقية غنية وليست shell تقليدي لتطبيق SaaS.")

    section(doc, "15. متطلبات التشغيل والنشر")
    bullet(doc, "المشروع يتطلب PHP 8.2+ وComposer وNode.js وبيئة Laravel قابلة لتشغيل queues وVite.")
    bullet(doc, "يمكن تشغيل بيئة التطوير عبر مسارات منفصلة أو عبر composer dev الذي يشغل server وreverb وqueue وvite معًا.")
    bullet(doc, "هناك إعدادات منفصلة لـ OpenAI وGemini وOllama وReverb/Pusher وretention وjudge داخل ملفات config والبيئة.")
    bullet(doc, "التحقق الأساسي قبل التسليم يعتمد على php artisan test وnpm run test وPlaywright visual/functional عند الحاجة.")

    section(doc, "16. معايير القبول الحالية")
    bullet(doc, "يجب أن يتمكن المستخدم المسجل من بدء جلسة مساعد جديدة أو الاستمرار في جلسة سابقة دون خلط ملكية البيانات.")
    bullet(doc, "يجب أن تعمل الواجهة حتى عند غياب البث اللحظي عبر polling fallback.")
    bullet(doc, "يجب أن تظهر نتيجة Codeforces أو رسائل الفشل بشكل صريح مع حماية الوصول لصاحب السجل فقط.")
    bullet(doc, "يجب أن تكون مكتبة الأنماط العامة قابلة للتصفح دون تسجيل، مع بقاء المحتوى التشغيلي الداخلي محميًا.")
    bullet(doc, "يجب أن تبقى اختبارات الواجهة ثنائية اللغة جزءًا من معيار القبول لأي تعديل بصري مهم.")

    section(doc, "17. ملاحظات مستقبلية")
    bullet(doc, "توسيع judge الحقيقي ليعمل داخل sandbox فعلي متعدد اللغات بدل الاعتماد المحدود الحالي.")
    bullet(doc, "رفع نضج المساعد من مستوى التحليل الحالي إلى أدوات أعمق، مع المحافظة على الحماية ومنع أي كتابة مباشرة قبل إطار موافقات واضح.")
    bullet(doc, "إضافة طبقة إدارة تحرير للمحتوى الخارجي بدل الاعتماد الكامل على ملفات content فقط.")
    bullet(doc, "تحسين observability والقياسات حول queue wait time ووقت التحليل ومعدلات الفشل واستهلاك المزودات.")

    body(doc, "نهاية الوثيقة")
    doc.save(OUTPUT_PATH)


if __name__ == "__main__":
    build()
