// Shared verdict presentation for Arena submissions.
// Maps a judge verdict string to a bilingual label and a Badge variant ("tone").

const TONES = {
    accepted: 'success',
    wrong_answer: 'danger',
    time_limit_exceeded: 'warning',
    runtime_error: 'danger',
    compilation_error: 'warning',
    unsupported_language: 'muted',
    no_tests: 'muted',
    not_run: 'muted',
    internal_error: 'danger',
    pending: 'subtle',
    running: 'subtle',
    stub_reviewed: 'subtle',
};

const LABELS = {
    en: {
        accepted: 'Accepted',
        wrong_answer: 'Wrong answer',
        time_limit_exceeded: 'Time limit exceeded',
        runtime_error: 'Runtime error',
        compilation_error: 'Compilation error',
        unsupported_language: 'Unsupported language',
        no_tests: 'No tests',
        not_run: 'Not run',
        internal_error: 'Internal error',
        pending: 'Pending',
        running: 'Running',
        stub_reviewed: 'Stub reviewed',
    },
    ar: {
        accepted: 'مقبول',
        wrong_answer: 'إجابة خاطئة',
        time_limit_exceeded: 'تجاوز حد الزمن',
        runtime_error: 'خطأ تشغيل',
        compilation_error: 'خطأ ترجمة',
        unsupported_language: 'لغة غير مدعومة',
        no_tests: 'لا اختبارات',
        not_run: 'لم يُنفَّذ',
        internal_error: 'خطأ داخلي',
        pending: 'قيد الانتظار',
        running: 'قيد التنفيذ',
        stub_reviewed: 'مراجعة تجريبية',
    },
};

export function verdictTone(verdict) {
    return TONES[verdict] ?? 'subtle';
}

export function verdictLabel(verdict, locale = 'en') {
    const table = LABELS[locale] ?? LABELS.en;
    return table[verdict] ?? verdict;
}
