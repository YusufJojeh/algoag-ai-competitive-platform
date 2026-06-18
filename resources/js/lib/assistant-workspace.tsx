import type { LucideIcon } from 'lucide-react';
import {
    Activity,
    AlarmClockCheck,
    AudioLines,
    BrainCircuit,
    ChartColumnBig,
    CircleHelp,
    CircleX,
    Lightbulb,
    MessageSquareQuote,
    PlayCircle,
    SearchCheck,
    Sparkles,
    TriangleAlert,
    Trophy,
} from 'lucide-react';

import type { UiLocale } from '@/lib/ui-locale';

export type AssistantMode =
    | 'auto'
    | 'topic_explanation'
    | 'topic_recommendation'
    | 'hint'
    | 'idea_check'
    | 'logic_critique'
    | 'edge_cases'
    | 'complexity'
    | 'full_solution'
    | 'step_by_step_solution'
    | 'approach_compare'
    | 'common_mistakes'
    | 'solve'
    | 'generate_code'
    | 'generate_tests'
    | 'verify_code'
    | 'debug_wrong_answer'
    | 'check'
    | 'wrong'
    | 'full'
    | 'summarize'
    | 'next_step';
export type StreamStatus = 'idle' | 'queued' | 'transcribing' | 'analyzing' | 'tts_generating' | 'completed' | 'failed' | 'cancelled';

export type ThreadMessage = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    mode?: AssistantMode;
    audioUrl?: string | null;
};

export type TimelineTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

export type WorkspaceEvent = {
    id: string;
    title: string;
    description: string;
    tone: TimelineTone;
    createdAt: string;
};

const modeBase = {
    auto: { icon: Sparkles, ar: { label: 'تلقائي حسب كلامي', shortLabel: 'تلقائي', description: 'يفهم من سياق كلامك إن كنت تطلب تحققاً، تصحيح WA، تحليل TLE، تلميحاً أو غيره.' }, en: { label: 'Auto (from my words)', shortLabel: 'Auto', description: 'Detects from your words whether you want an idea check, WA debug, TLE analysis, a hint, or more.' } },
    topic_explanation: { icon: BrainCircuit, ar: { label: 'اشرح الموضوع', shortLabel: 'الموضوع', description: 'اشرح النمط أو الفكرة الأساسية للمسألة تعليمياً.' }, en: { label: 'Explain the topic', shortLabel: 'Topic', description: 'Explain the underlying topic or pattern in a teaching-first way.' } },
    topic_recommendation: { icon: Sparkles, ar: { label: 'رشّح الموضوعات', shortLabel: 'ترشيح', description: 'استخرج الموضوعات أو الوسوم الأكثر احتمالاً من نص المسألة.' }, en: { label: 'Recommend topics', shortLabel: 'Recommend', description: 'Infer the most likely topics or tags from the visible problem.' } },
    hint: { icon: Lightbulb, ar: { label: 'أعطني تلميحاً', shortLabel: 'تلميح', description: 'توجيه خفيف بدون كشف المسار الكامل.' }, en: { label: 'Give me a hint', shortLabel: 'Hint', description: 'Light guidance without revealing the full path.' } },
    idea_check: { icon: SearchCheck, ar: { label: 'تحقق من فكرتي', shortLabel: 'تحقق', description: 'راجع صحة الفكرة الحالية وحدد ما ينقصها.' }, en: { label: 'Check my idea', shortLabel: 'Check', description: 'Review the current idea and point out what is missing.' } },
    logic_critique: { icon: CircleX, ar: { label: 'اشرح لماذا المنطق خاطئ', shortLabel: 'منطق خاطئ', description: 'وضّح نقطة الانكسار في الحل أو الفرضية.' }, en: { label: 'Explain why the logic is wrong', shortLabel: 'Critique', description: 'Point out where the reasoning breaks down.' } },
    edge_cases: { icon: TriangleAlert, ar: { label: 'نبّهني إلى الحالات الحدية', shortLabel: 'حالات حدية', description: 'استخرج الحالات التي قد تكسر الفكرة.' }, en: { label: 'Warn me about edge cases', shortLabel: 'Edge cases', description: 'Surface the tricky cases that can break the idea.' } },
    complexity: { icon: ChartColumnBig, ar: { label: 'قيّم التعقيد', shortLabel: 'التعقيد', description: 'قيّم الزمن والذاكرة والتنازلات.' }, en: { label: 'Evaluate complexity', shortLabel: 'Complexity', description: 'Assess time, memory, and the trade-offs.' } },
    full_solution: { icon: BrainCircuit, ar: { label: 'اعرض الحل الكامل', shortLabel: 'حل كامل', description: 'قدّم الحل الكامل فقط عند الطلب الصريح.' }, en: { label: 'Show the full solution', shortLabel: 'Full solve', description: 'Provide the full solution only when explicitly requested.' } },
    step_by_step_solution: { icon: MessageSquareQuote, ar: { label: 'اشرح الحل خطوة بخطوة', shortLabel: 'خطوة بخطوة', description: 'حوّل الحل إلى مسار تعليمي مرتب.' }, en: { label: 'Explain step by step', shortLabel: 'Step by step', description: 'Turn the solution into a clear learning sequence.' } },
    approach_compare: { icon: Activity, ar: { label: 'قارن بين مقاربتين', shortLabel: 'مقارنة', description: 'وازن بين أكثر من فكرة أو خوارزمية محتملة.' }, en: { label: 'Compare approaches', shortLabel: 'Compare', description: 'Compare multiple plausible approaches.' } },
    common_mistakes: { icon: CircleHelp, ar: { label: 'اعرض الأخطاء الشائعة', shortLabel: 'أخطاء شائعة', description: 'نبّه إلى الفخاخ المتكررة لهذا الموضوع أو الحل.' }, en: { label: 'Show common mistakes', shortLabel: 'Mistakes', description: 'Highlight common mistakes for this topic or solution.' } },
    solve: { icon: BrainCircuit, ar: { label: 'حلّ المسألة', shortLabel: 'حل', description: 'حلّل المسألة وأنشئ الملخص والخوارزمية والكود الكامل.' }, en: { label: 'Solve the problem', shortLabel: 'Solve', description: 'Analyze the problem, generate algorithm and full solution code.' } },
    generate_code: { icon: Sparkles, ar: { label: 'أنشئ الكود', shortLabel: 'كود', description: 'أنشئ حلاً برمجياً كاملاً بلغة Python 3.' }, en: { label: 'Generate code', shortLabel: 'Code', description: 'Generate a complete Python 3 solution for the problem.' } },
    generate_tests: { icon: Activity, ar: { label: 'أنشئ اختبارات', shortLabel: 'اختبارات', description: 'أنشئ حالات اختبار شاملة للمسألة.' }, en: { label: 'Generate tests', shortLabel: 'Tests', description: 'Generate comprehensive test cases for the problem.' } },
    verify_code: { icon: SearchCheck, ar: { label: 'تحقق من الكود', shortLabel: 'تحقق', description: 'راجع الكود وحدد الأخطاء وحالات الحافة.' }, en: { label: 'Verify code', shortLabel: 'Verify', description: 'Review the code and identify bugs and missing edge cases.' } },
    debug_wrong_answer: { icon: CircleX, ar: { label: 'اشرح الإجابة الخاطئة', shortLabel: 'خطأ WA', description: 'ابحث عن الخطأ المنطقي الذي يسبب إجابة خاطئة.' }, en: { label: 'Debug wrong answer', shortLabel: 'Debug WA', description: 'Find the logic bug causing a wrong answer verdict.' } },
} as const;

type CanonicalAssistantMode = keyof typeof modeBase;

const modeAliases: Record<string, keyof typeof modeBase> = {
    check: 'idea_check',
    wrong: 'logic_critique',
    full: 'full_solution',
    summarize: 'step_by_step_solution',
    next_step: 'step_by_step_solution',
    // Ensure legacy/alias modes resolve correctly
};

const modeAliasBase = {
    wrong: { icon: CircleX, ar: { label: 'الإجابة الخاطئة', shortLabel: 'إجابة خاطئة', description: 'حلل سبب نتيجة Wrong Answer واربطها بمدخل مضاد واضح.' }, en: { label: 'Wrong answer', shortLabel: 'Wrong answer', description: 'Analyze why the current attempt gets a Wrong Answer and tie it to a concrete counterexample.' } },
    summarize: { icon: MessageSquareQuote, ar: { label: 'لخّص الخطوة التالية', shortLabel: 'تلخيص', description: 'حوّل الرد إلى ملخص قصير يركز على الخطوة التالية فقط.' }, en: { label: 'Summarize', shortLabel: 'Summarize', description: 'Condense the reply into the next useful step only.' } },
    next_step: { icon: AlarmClockCheck, ar: { label: 'الخطوة التالية', shortLabel: 'التالي', description: 'اعط خطوة واحدة قابلة للتنفيذ بدون كشف الحل الكامل.' }, en: { label: 'Next step', shortLabel: 'Next step', description: 'Give one actionable next step without revealing the full solution.' } },
} as const;

const statusBase = {
    idle: { tone: 'neutral', icon: Sparkles, ar: { label: 'جاهز', description: 'المساحة جاهزة لاستقبال السياق الحالي.' }, en: { label: 'Ready', description: 'The workspace is ready for the next context.' } },
    queued: { tone: 'neutral', icon: AlarmClockCheck, ar: { label: 'في الانتظار', description: 'تم إرسال الطلب ويجري وضعه في طابور التنفيذ.' }, en: { label: 'Queued', description: 'The request was submitted and is waiting in the queue.' } },
    transcribing: { tone: 'accent', icon: AudioLines, ar: { label: 'تحويل الصوت', description: 'يتم استخراج النص من الصوت المرسل.' }, en: { label: 'Transcribing audio', description: 'Text is being extracted from the uploaded audio.' } },
    analyzing: { tone: 'warning', icon: BrainCircuit, ar: { label: 'تحليل السياق', description: 'يجري تحليل الصورة والنص ومطابقة النمط المناسب.' }, en: { label: 'Analyzing context', description: 'The image, transcript, and likely pattern are being analyzed.' } },
    tts_generating: { tone: 'accent', icon: PlayCircle, ar: { label: 'تجهيز الصوت', description: 'يتم إنشاء نسخة صوتية من الرد الحالي.' }, en: { label: 'Generating audio', description: 'An audio version of the current reply is being generated.' } },
    completed: { tone: 'success', icon: SearchCheck, ar: { label: 'اكتمل', description: 'الرد النصي أصبح جاهزاً ويمكن المتابعة.' }, en: { label: 'Completed', description: 'The text reply is ready and the session can continue.' } },
    failed: { tone: 'danger', icon: CircleX, ar: { label: 'فشل', description: 'حدث تعثر أثناء دورة التحليل الحالية.' }, en: { label: 'Failed', description: 'The current analysis cycle hit an error.' } },
    cancelled: { tone: 'warning', icon: Activity, ar: { label: 'أُلغي', description: 'تم إيقاف الطلب قبل اكتمال المعالجة.' }, en: { label: 'Cancelled', description: 'The request was stopped before processing completed.' } },
} as const;

export function getAssistantModes(locale: UiLocale = 'ar') {
    return (Object.entries(modeBase) as Array<[CanonicalAssistantMode, typeof modeBase[CanonicalAssistantMode]]>).map(([id, meta]) => ({
        id,
        icon: meta.icon,
        ...meta[locale],
    }));
}

export function getModeMeta(mode: AssistantMode, locale: UiLocale = 'ar') {
    if (mode in modeAliasBase) {
        const aliasMode = mode as keyof typeof modeAliasBase;

        return {
            id: aliasMode,
            icon: modeAliasBase[aliasMode].icon,
            ...modeAliasBase[aliasMode][locale],
        };
    }

    const normalizedMode = (modeAliases[mode] ?? mode) as keyof typeof modeBase;

    const allModes = getAssistantModes(locale);

    return allModes.find((item) => item.id === normalizedMode)
        ?? allModes.find((item) => item.id === 'idea_check')!;
}

export function getAssistantModeSelectGroups(locale: UiLocale = 'ar') {
    const groupLabels = locale === 'ar'
        ? {
              primary: 'الأنماط الأساسية',
              learning: 'تعلم وتحليل',
              production: 'حل وبرمجة',
              focused: 'طلبات مركزة',
          }
        : {
              primary: 'Primary modes',
              learning: 'Learning and analysis',
              production: 'Solve and code',
              focused: 'Focused requests',
          };

    const build = (modes: AssistantMode[]) => modes.map((mode) => getModeMeta(mode, locale));

    return [
        {
            id: 'primary',
            label: groupLabels.primary,
            modes: build(['auto', 'hint', 'idea_check', 'debug_wrong_answer', 'complexity', 'edge_cases']),
        },
        {
            id: 'learning',
            label: groupLabels.learning,
            modes: build(['topic_explanation', 'topic_recommendation', 'logic_critique', 'full_solution', 'step_by_step_solution', 'approach_compare', 'common_mistakes']),
        },
        {
            id: 'production',
            label: groupLabels.production,
            modes: build(['solve', 'generate_code', 'generate_tests', 'verify_code']),
        },
        {
            id: 'focused',
            label: groupLabels.focused,
            modes: build(['wrong', 'summarize', 'next_step']),
        },
    ];
}

export function getStatusMeta(status: StreamStatus, locale: UiLocale = 'ar') {
    const meta = statusBase[status] ?? statusBase.idle;

    return {
        icon: meta.icon,
        tone: meta.tone as TimelineTone,
        ...meta[locale],
    };
}

export function getSidebarPrimaryItems(locale: UiLocale = 'ar') {
    const items = [
        { id: 'assistant', label: locale === 'ar' ? 'المساعد' : 'Assistant', href: '/assistant', icon: BrainCircuit, available: true },
        { id: 'solve', label: 'Codeforces', href: '/solve', icon: PlayCircle, available: true },
        { id: 'patterns', label: locale === 'ar' ? 'الموضوعات' : 'Topics', href: '/patterns', icon: Lightbulb, available: true },
        { id: 'problems', label: locale === 'ar' ? 'المسائل' : 'Problems', href: '/problems', icon: Activity, available: true },
        { id: 'arena', label: locale === 'ar' ? 'الساحة' : 'Arena', href: '/arena', icon: Trophy, available: true },
        { id: 'courses', label: locale === 'ar' ? 'المسارات' : 'Courses', href: '/courses', icon: CircleHelp, available: true },
        { id: 'submissions', label: locale === 'ar' ? 'الإرسالات' : 'Submissions', href: '/submissions', icon: MessageSquareQuote, available: true },
    ];

    const order = ['problems', 'arena', 'assistant', 'solve', 'patterns', 'courses', 'submissions'];

    return order.map((id) => items.find((item) => item.id === id)!);
}

export function formatLanguageLabel(language: string, locale: UiLocale = 'ar') {
    if (language === 'ar-SA') {
        return locale === 'ar' ? 'العربية' : 'Arabic';
    }

    return 'English';
}
