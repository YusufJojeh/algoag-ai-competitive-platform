import type { AssistantMode, StreamStatus, ThreadMessage, WorkspaceEvent } from '@/lib/assistant-workspace';
import type { UiLocale } from '@/lib/ui-locale';

export type LoginVisualScenario = 'default' | 'error' | 'submitting';
export type AssistantVisualScenarioName =
    | 'empty'
    | 'preview'
    | 'transcript-ready'
    | 'analyzing'
    | 'streaming'
    | 'completed'
    | 'failed'
    | 'audio-ready'
    | 'history';

export type AssistantVisualScenario = {
    name: AssistantVisualScenarioName;
    mode: AssistantMode;
    status: StreamStatus;
    isUsingPolling: boolean;
    sessionId: number | null;
    currentRequestMessageId: number | null;
    transcript: string;
    language: string;
    isRecording: boolean;
    hasAudioBlob: boolean;
    isFallbackMode: boolean;
    isSharing: boolean;
    previewSrc: string | null;
    messages: ThreadMessage[];
    currentPartialText: string;
    audioUrl: string | null;
    error: string | null;
    events: WorkspaceEvent[];
};

export type LoginVisualState = {
    processing: boolean;
    errors: {
        email?: string;
        password?: string;
    };
};

const AUDIO_DATA_URI =
    'data:audio/wav;base64,UklGRlQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YTAAAAAA';
function getVisualPreviewDataUri(locale: UiLocale) {
    const previewSvg = locale === 'ar'
        ? `
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="800" viewBox="0 0 1280 800" fill="none">
  <rect width="1280" height="800" fill="#F6F1FF"/>
  <rect x="44" y="40" width="1192" height="720" rx="28" fill="#FFFFFF" stroke="#E5DCF8"/>
  <rect x="76" y="86" width="286" height="628" rx="20" fill="#F8F4FF" stroke="#EEE7FF"/>
  <rect x="394" y="86" width="494" height="628" rx="20" fill="#FCFBFF" stroke="#EEE7FF"/>
  <rect x="920" y="86" width="284" height="628" rx="20" fill="#F9F6FF" stroke="#EEE7FF"/>
  <rect x="108" y="122" width="222" height="58" rx="18" fill="#8B7BF6" fill-opacity="0.12"/>
  <text x="128" y="157" font-family="Arial, sans-serif" font-size="24" fill="#382E66">جلسة تدريب حيّة</text>
  <rect x="108" y="212" width="222" height="48" rx="16" fill="#FFFFFF" stroke="#E8E0FA"/>
  <text x="126" y="242" font-family="Arial, sans-serif" font-size="20" fill="#675F87">حل مسألة Two Pointers</text>
  <rect x="426" y="122" width="430" height="120" rx="22" fill="#F6F1FF" stroke="#EEE7FF"/>
  <text x="454" y="162" font-family="Arial, sans-serif" font-size="28" fill="#2B2446">فكرتي: أبدأ بمؤشرين وأتجنب إعادة الحساب</text>
  <text x="454" y="204" font-family="Arial, sans-serif" font-size="20" fill="#6C6489">المساعد: جيد، لكن انتبه لحالة تكرار الحدود والمقارنة النهائية.</text>
  <rect x="426" y="278" width="430" height="168" rx="22" fill="#FFFFFF" stroke="#EEE7FF"/>
  <text x="454" y="322" font-family="Arial, sans-serif" font-size="22" fill="#382E66">Problem Statement</text>
  <text x="454" y="362" font-family="Arial, sans-serif" font-size="18" fill="#6C6489">Given a sorted array, return whether there exists a pair with target sum.</text>
  <rect x="454" y="394" width="278" height="12" rx="6" fill="#DCD2FA"/>
  <rect x="454" y="422" width="336" height="12" rx="6" fill="#E9E1FD"/>
  <rect x="454" y="450" width="214" height="12" rx="6" fill="#E9E1FD"/>
  <rect x="952" y="122" width="220" height="240" rx="18" fill="#FFFFFF" stroke="#EEE7FF"/>
  <rect x="976" y="148" width="172" height="120" rx="14" fill="#F2EEFF"/>
  <text x="982" y="305" font-family="Arial, sans-serif" font-size="20" fill="#382E66">الالتقاط الحي</text>
  <text x="982" y="336" font-family="Arial, sans-serif" font-size="16" fill="#6C6489">frame.jpg · fixture ثابت</text>
  <rect x="952" y="390" width="220" height="74" rx="18" fill="#F6F1FF" stroke="#EEE7FF"/>
  <text x="976" y="433" font-family="Arial, sans-serif" font-size="18" fill="#382E66">يتم التحليل</text>
  <text x="976" y="458" font-family="Arial, sans-serif" font-size="15" fill="#6C6489">مطابقة النمط + مراجعة النص</text>
  <rect x="952" y="494" width="220" height="74" rx="18" fill="#EEF9F3" stroke="#D2F0DE"/>
  <text x="976" y="537" font-family="Arial, sans-serif" font-size="18" fill="#227653">الصوت جاهز</text>
  <text x="976" y="562" font-family="Arial, sans-serif" font-size="15" fill="#5B7B6A">tts.mp3</text>
</svg>
`
        : `
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="800" viewBox="0 0 1280 800" fill="none">
  <rect width="1280" height="800" fill="#F6F1FF"/>
  <rect x="44" y="40" width="1192" height="720" rx="28" fill="#FFFFFF" stroke="#E5DCF8"/>
  <rect x="76" y="86" width="286" height="628" rx="20" fill="#F8F4FF" stroke="#EEE7FF"/>
  <rect x="394" y="86" width="494" height="628" rx="20" fill="#FCFBFF" stroke="#EEE7FF"/>
  <rect x="920" y="86" width="284" height="628" rx="20" fill="#F9F6FF" stroke="#EEE7FF"/>
  <rect x="108" y="122" width="222" height="58" rx="18" fill="#8B7BF6" fill-opacity="0.12"/>
  <text x="128" y="157" font-family="Arial, sans-serif" font-size="24" fill="#382E66">Live coaching session</text>
  <rect x="108" y="212" width="222" height="48" rx="16" fill="#FFFFFF" stroke="#E8E0FA"/>
  <text x="126" y="242" font-family="Arial, sans-serif" font-size="20" fill="#675F87">Two Pointers walkthrough</text>
  <rect x="426" y="122" width="430" height="120" rx="22" fill="#F6F1FF" stroke="#EEE7FF"/>
  <text x="454" y="162" font-family="Arial, sans-serif" font-size="28" fill="#2B2446">Idea: start with two pointers</text>
  <text x="454" y="204" font-family="Arial, sans-serif" font-size="20" fill="#6C6489">Assistant: watch duplicate boundaries and the final comparison.</text>
  <rect x="426" y="278" width="430" height="168" rx="22" fill="#FFFFFF" stroke="#EEE7FF"/>
  <text x="454" y="322" font-family="Arial, sans-serif" font-size="22" fill="#382E66">Problem Statement</text>
  <text x="454" y="362" font-family="Arial, sans-serif" font-size="18" fill="#6C6489">Given a sorted array, return whether there exists a pair with target sum.</text>
  <rect x="454" y="394" width="278" height="12" rx="6" fill="#DCD2FA"/>
  <rect x="454" y="422" width="336" height="12" rx="6" fill="#E9E1FD"/>
  <rect x="454" y="450" width="214" height="12" rx="6" fill="#E9E1FD"/>
  <rect x="952" y="122" width="220" height="240" rx="18" fill="#FFFFFF" stroke="#EEE7FF"/>
  <rect x="976" y="148" width="172" height="120" rx="14" fill="#F2EEFF"/>
  <text x="982" y="305" font-family="Arial, sans-serif" font-size="20" fill="#382E66">Live Capture</text>
  <text x="982" y="336" font-family="Arial, sans-serif" font-size="16" fill="#6C6489">frame.jpg · stable fixture</text>
  <rect x="952" y="390" width="220" height="74" rx="18" fill="#F6F1FF" stroke="#EEE7FF"/>
  <text x="976" y="433" font-family="Arial, sans-serif" font-size="18" fill="#382E66">Analyzing</text>
  <text x="976" y="458" font-family="Arial, sans-serif" font-size="15" fill="#6C6489">pattern match + transcript review</text>
  <rect x="952" y="494" width="220" height="74" rx="18" fill="#EEF9F3" stroke="#D2F0DE"/>
  <text x="976" y="537" font-family="Arial, sans-serif" font-size="18" fill="#227653">Audio Ready</text>
  <text x="976" y="562" font-family="Arial, sans-serif" font-size="15" fill="#5B7B6A">tts.mp3</text>
</svg>
`;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(previewSvg)}`;
}

export const VISUAL_PREVIEW_DATA_URI = getVisualPreviewDataUri('ar');

function getBaseEvents(locale: UiLocale): WorkspaceEvent[] {
    return [
        {
            id: 'event-01',
            title: locale === 'ar' ? 'بدأت مشاركة الشاشة' : 'Screen sharing started',
            description: locale === 'ar'
                ? 'المعاينة الحية تعرض نافذة المسألة والمحرر ضمن إطار ثابت للاختبارات البصرية.'
                : 'The live preview shows the problem window and editor inside a stable visual test frame.',
            tone: 'success',
            createdAt: '10:00',
        },
        {
            id: 'event-02',
            title: locale === 'ar' ? 'تم تجهيز النص' : 'Transcript prepared',
            description: locale === 'ar'
                ? 'تم تثبيت النص واللغة لتجنب أي تغيّر بين تشغيل وآخر.'
                : 'Transcript and language are frozen to avoid drift across runs.',
            tone: 'accent',
            createdAt: '10:01',
        },
    ];
}

const scenarioFactory = (locale: UiLocale): Record<AssistantVisualScenarioName, AssistantVisualScenario> => {
    const baseEvents = getBaseEvents(locale);
    const previewSrc = getVisualPreviewDataUri(locale);

    return {
    empty: {
        name: 'empty',
        mode: 'check',
        status: 'idle',
        isUsingPolling: false,
        sessionId: null,
        currentRequestMessageId: null,
        transcript: '',
        language: locale === 'ar' ? 'ar-SA' : 'en-US',
        isRecording: false,
        hasAudioBlob: false,
        isFallbackMode: false,
        isSharing: false,
        previewSrc: null,
        messages: [],
        currentPartialText: '',
        audioUrl: null,
        error: null,
        events: [
            {
                id: 'event-empty',
                title: locale === 'ar' ? 'المساحة جاهزة' : 'Workspace ready',
                description: locale === 'ar'
                    ? 'حالة مرجعية فارغة لاكتشاف الكسور البصرية في اللوحة الثلاثية.'
                    : 'Empty reference state for catching visual regressions in the three-panel shell.',
                tone: 'neutral',
                createdAt: '10:00',
            },
        ],
    },
    preview: {
        name: 'preview',
        mode: 'hint',
        status: 'idle',
        isUsingPolling: false,
        sessionId: 41,
        currentRequestMessageId: null,
        transcript: '',
        language: locale === 'ar' ? 'ar-SA' : 'en-US',
        isRecording: false,
        hasAudioBlob: false,
        isFallbackMode: false,
        isSharing: true,
        previewSrc,
        messages: [],
        currentPartialText: '',
        audioUrl: null,
        error: null,
        events: baseEvents,
    },
    'transcript-ready': {
        name: 'transcript-ready',
        mode: 'check',
        status: 'idle',
        isUsingPolling: false,
        sessionId: 41,
        currentRequestMessageId: null,
        transcript: locale === 'ar'
            ? 'أظن أن الحل الصحيح هو استخدام مؤشرين من الطرفين لأن المصفوفة مرتبة أصلاً.'
            : 'I think the correct solution is to use two pointers from both ends because the array is already sorted.',
        language: locale === 'ar' ? 'ar-SA' : 'en-US',
        isRecording: false,
        hasAudioBlob: false,
        isFallbackMode: false,
        isSharing: true,
        previewSrc,
        messages: [],
        currentPartialText: '',
        audioUrl: null,
        error: null,
        events: baseEvents,
    },
    analyzing: {
        name: 'analyzing',
        mode: 'check',
        status: 'analyzing',
        isUsingPolling: false,
        sessionId: 41,
        currentRequestMessageId: 901,
        transcript: locale === 'ar'
            ? 'سأقارن مجموع الطرفين وأحرك المؤشر المناسب في كل خطوة.'
            : 'I will compare the sum at both ends and move the correct pointer on each step.',
        language: locale === 'ar' ? 'ar-SA' : 'en-US',
        isRecording: false,
        hasAudioBlob: false,
        isFallbackMode: false,
        isSharing: true,
        previewSrc,
        messages: [
            {
                id: 'user-analyzing',
                role: 'user',
                content: locale === 'ar'
                    ? 'سأقارن مجموع الطرفين وأحرك المؤشر المناسب في كل خطوة.'
                    : 'I will compare the sum at both ends and move the correct pointer on each step.',
                mode: 'check',
            },
        ],
        currentPartialText: '',
        audioUrl: null,
        error: null,
        events: [
            {
                id: 'event-analyzing-01',
                title: locale === 'ar' ? 'قيد تحليل النمط' : 'Pattern analysis in progress',
                description: locale === 'ar'
                    ? 'المساعد يطابق الفكرة الحالية مع نمط Two Pointers ويقارنها بقيود الإدخال.'
                    : 'The assistant is matching the current idea against the Two Pointers pattern and the input constraints.',
                tone: 'warning',
                createdAt: '10:02',
            },
            ...baseEvents,
        ],
    },
    streaming: {
        name: 'streaming',
        mode: 'wrong',
        // Presentational-only scene name. 'streaming' is not a backend StreamStatus,
        // but the committed visual snapshot was generated with this exact runtime
        // value (consumers treat any non-'idle' status as an active/busy stream and
        // getStatusMeta falls back to neutral meta). Keep the value verbatim so the
        // snapshot stays byte-identical; cast through unknown to satisfy the union.
        status: 'streaming' as unknown as StreamStatus,
        isUsingPolling: false,
        sessionId: 42,
        currentRequestMessageId: 902,
        transcript: locale === 'ar'
            ? 'لماذا لا يكفي أن أتحرك دائماً بالمؤشر الأيسر فقط؟'
            : 'Why is it not enough to move only the left pointer every time?',
        language: locale === 'ar' ? 'ar-SA' : 'en-US',
        isRecording: false,
        hasAudioBlob: false,
        isFallbackMode: false,
        isSharing: true,
        previewSrc,
        messages: [
            {
                id: 'user-streaming',
                role: 'user',
                content: locale === 'ar'
                    ? 'لماذا لا يكفي أن أتحرك دائماً بالمؤشر الأيسر فقط؟'
                    : 'Why is it not enough to move only the left pointer every time?',
                mode: 'wrong',
            },
        ],
        currentPartialText: locale === 'ar'
            ? 'لأنك إذا حرّكت مؤشراً واحداً بلا مقارنة بالمجموع الحالي فقد تتجاوز الحالة الصحيحة أو تفقد شرط الرتابة...'
            : 'If you move only one pointer without comparing the current sum, you can skip the valid case or lose the monotonic property...',
        audioUrl: null,
        error: null,
        events: [
            {
                id: 'event-streaming-01',
                title: locale === 'ar' ? 'يتم بث الرد' : 'Reply is streaming',
                description: locale === 'ar'
                    ? 'النص يتدفق بشكل حتمي لاكتشاف أي كسور في message cards أو المسافات الرأسية.'
                    : 'Text streams deterministically to catch regressions in message cards and vertical spacing.',
                tone: 'accent',
                createdAt: '10:03',
            },
            ...baseEvents,
        ],
    },
    completed: {
        name: 'completed',
        mode: 'summarize',
        status: 'completed',
        isUsingPolling: false,
        sessionId: 43,
        currentRequestMessageId: 903,
        transcript: locale === 'ar' ? 'لخص لي الخطوة التالية فقط.' : 'Summarize only the next step for me.',
        language: locale === 'ar' ? 'ar-SA' : 'en-US',
        isRecording: false,
        hasAudioBlob: false,
        isFallbackMode: false,
        isSharing: true,
        previewSrc,
        messages: [
            {
                id: 'user-completed',
                role: 'user',
                content: locale === 'ar' ? 'لخص لي الخطوة التالية فقط.' : 'Summarize only the next step for me.',
                mode: 'summarize',
            },
            {
                id: 'assistant-completed',
                role: 'assistant',
                content: locale === 'ar'
                    ? 'ابدأ بتعريف مؤشرين عند طرفي المصفوفة، ثم كرر مقارنة المجموع مع الهدف وتحريك المؤشر المناسب حتى يتقاطع المؤشران.'
                    : 'Start by placing two pointers at both ends of the array, then keep comparing the sum to the target and move the correct pointer until they meet.',
                mode: 'summarize',
            },
        ],
        currentPartialText: '',
        audioUrl: null,
        error: null,
        events: [
            {
                id: 'event-completed-01',
                title: locale === 'ar' ? 'اكتمل الرد' : 'Reply completed',
                description: locale === 'ar'
                    ? 'الرد النصي النهائي جاهز، ويمكن للمستخدم متابعة سؤال جديد أو طلب تلميح إضافي.'
                    : 'The final text reply is ready, and the user can continue with a new question or ask for another hint.',
                tone: 'success',
                createdAt: '10:04',
            },
            ...baseEvents,
        ],
    },
    failed: {
        name: 'failed',
        mode: 'complexity',
        status: 'failed',
        isUsingPolling: true,
        sessionId: 44,
        currentRequestMessageId: 904,
        transcript: locale === 'ar' ? 'هل التعقيد الحالي جيد؟' : 'Is the current complexity good enough?',
        language: locale === 'ar' ? 'ar-SA' : 'en-US',
        isRecording: false,
        hasAudioBlob: false,
        isFallbackMode: true,
        isSharing: true,
        previewSrc,
        messages: [
            {
                id: 'user-failed',
                role: 'user',
                content: locale === 'ar' ? 'هل التعقيد الحالي جيد؟' : 'Is the current complexity good enough?',
                mode: 'complexity',
            },
        ],
        currentPartialText: '',
        audioUrl: null,
        error: locale === 'ar'
            ? 'تعذر إكمال التحليل حالياً. حاول مرة أخرى بعد إعادة الاتصال.'
            : 'The analysis could not be completed right now. Try again after reconnecting.',
        events: [
            {
                id: 'event-failed-01',
                title: locale === 'ar' ? 'تعذر إكمال الدورة الحالية' : 'Current run failed',
                description: locale === 'ar'
                    ? 'حالة فشل ثابتة لاكتشاف مشاكل الألوان والحدود والتنبيه في RTL.'
                    : 'Stable failure state for catching alert, border, and color regressions in both directions.',
                tone: 'danger',
                createdAt: '10:05',
            },
            ...baseEvents,
        ],
    },
    'audio-ready': {
        name: 'audio-ready',
        mode: 'full',
        status: 'completed',
        isUsingPolling: false,
        sessionId: 45,
        currentRequestMessageId: 905,
        transcript: locale === 'ar' ? 'اعرض الحل الكامل.' : 'Show the full solution.',
        language: locale === 'ar' ? 'ar-SA' : 'en-US',
        isRecording: false,
        hasAudioBlob: false,
        isFallbackMode: false,
        isSharing: true,
        previewSrc,
        messages: [
            {
                id: 'user-audio',
                role: 'user',
                content: locale === 'ar' ? 'اعرض الحل الكامل.' : 'Show the full solution.',
                mode: 'full',
            },
            {
                id: 'assistant-audio',
                role: 'assistant',
                content: locale === 'ar'
                    ? 'الحل يعتمد على مؤشرين. ابدأ من الطرفين، ثم حرّك المؤشر الأيسر إذا كان المجموع أصغر من الهدف، أو المؤشر الأيمن إذا كان أكبر.'
                    : 'The solution uses two pointers. Start from both ends, move the left pointer if the sum is smaller than the target, or move the right pointer if it is larger.',
                mode: 'full',
                audioUrl: AUDIO_DATA_URI,
            },
        ],
        currentPartialText: '',
        audioUrl: AUDIO_DATA_URI,
        error: null,
        events: [
            {
                id: 'event-audio-01',
                title: locale === 'ar' ? 'الرد الصوتي جاهز' : 'Audio reply ready',
                description: locale === 'ar'
                    ? 'ملف صوتي ثابت يتيح لقطات بصرية مستقرة لمشغل الصوت.'
                    : 'Stable audio file that keeps the player visuals deterministic.',
                tone: 'success',
                createdAt: '10:06',
            },
            ...baseEvents,
        ],
    },
    history: {
        name: 'history',
        mode: 'edge_cases',
        status: 'completed',
        isUsingPolling: false,
        sessionId: 46,
        currentRequestMessageId: 906,
        transcript: locale === 'ar' ? 'نبّهني إلى الحالات الحدية.' : 'Warn me about the edge cases.',
        language: locale === 'ar' ? 'ar-SA' : 'en-US',
        isRecording: false,
        hasAudioBlob: false,
        isFallbackMode: false,
        isSharing: true,
        previewSrc,
        messages: [
            {
                id: 'user-history-01',
                role: 'user',
                content: locale === 'ar'
                    ? 'أفكر في استخدام Binary Search لكن المثال يحتوي على تكرارات كثيرة.'
                    : 'I am thinking about Binary Search, but the sample contains many duplicates.',
                mode: 'check',
            },
            {
                id: 'assistant-history-01',
                role: 'assistant',
                content: locale === 'ar'
                    ? 'راجع أولاً هل السؤال يطلب فهرساً واحداً أم مجرد وجود الحل، لأن التكرارات تغير أسلوب الإرجاع.'
                    : 'First check whether the problem wants one index pair or only existence, because duplicates change the return strategy.',
                mode: 'check',
            },
            {
                id: 'user-history-02',
                role: 'user',
                content: locale === 'ar'
                    ? 'الآن أريد فقط الحالات الحدية قبل الكتابة.'
                    : 'Now I only want the edge cases before I start coding.',
                mode: 'edge_cases',
            },
            {
                id: 'assistant-history-02',
                role: 'assistant',
                content: locale === 'ar'
                    ? 'اختبر مصفوفة بطول 0 أو 1، كل العناصر متساوية، الهدف أصغر من أصغر مجموع، والهدف أكبر من أكبر مجموع ممكن.'
                    : 'Test arrays of length 0 or 1, all elements equal, a target smaller than the minimum possible sum, and a target larger than the maximum possible sum.',
                mode: 'edge_cases',
            },
        ],
        currentPartialText: '',
        audioUrl: null,
        error: null,
        events: [
            {
                id: 'event-history-01',
                title: locale === 'ar' ? 'تم تحديد جلسة سابقة' : 'Previous session selected',
                description: locale === 'ar'
                    ? 'هذه الحالة تغطي الخيط الطويل، بطاقات الرسائل، وخلاصة الحالة الحالية.'
                    : 'This state covers long threads, message cards, and the current status summary.',
                tone: 'neutral',
                createdAt: '10:07',
            },
            ...baseEvents,
        ],
    },
    };
};

export function getAssistantVisualScenario(
    scenarioName: AssistantVisualScenarioName,
    locale: UiLocale = 'ar',
    modeOverride?: AssistantMode | null
): AssistantVisualScenario {
    const scenario = scenarioFactory(locale)[scenarioName];
    const activeMode = modeOverride ?? scenario.mode;

    return {
        ...scenario,
        mode: activeMode,
        messages: scenario.messages.map((message) => ({
            ...message,
            mode: modeOverride ? activeMode : message.mode,
        })),
        events: scenario.events.map((event) => ({ ...event })),
    };
}

export function getLoginVisualState(scenario: LoginVisualScenario, locale: UiLocale = 'ar'): LoginVisualState {
    if (scenario === 'error') {
        return {
            processing: false,
            errors: {
                email: locale === 'ar' ? 'بيانات الدخول غير صحيحة.' : 'These credentials do not match our records.',
            },
        };
    }

    if (scenario === 'submitting') {
        return {
            processing: true,
            errors: {},
        };
    }

    return {
        processing: false,
        errors: {},
    };
}
