import { useForm, Link } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';

export default function Home() {
    const { ollamaAvailable, recentSessions = [], recentCodeforces = [], flash, auth } = usePage().props;
    const { data, setData, post, processing, errors } = useForm({
        problem: '',
    });
    const logoutForm = useForm({});

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
            <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur">
                <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-emerald-400">مساعد تصميم الخوارزميات</h1>
                        <p className="text-slate-400 text-sm mt-1">افهم المسألة ← اقتراح خوارزميات ← محاكاة أداء ← توصية نهائية</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Link href="/problems" className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm">
                            بنك المسائل
                        </Link>
                        <Link href="/courses" className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm">
                            المسارات
                        </Link>
                        <Link href="/submissions" className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm">
                            إرسالاتي
                        </Link>
                        <Link
                            href="/solve"
                            className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium"
                        >
                            حل Codeforces
                        </Link>
                        {auth?.user?.is_admin && (
                            <Link
                                href="/admin/problems"
                                className="px-3 py-2 rounded-lg bg-amber-900/40 hover:bg-amber-800/50 text-amber-200 text-sm border border-amber-700/50"
                            >
                                إدارة المسائل
                            </Link>
                        )}
                        {auth?.user && (
                            <>
                                <span className="text-slate-500 text-xs max-w-[120px] truncate">{auth.user.name}</span>
                                <button
                                    type="button"
                                    onClick={() => logoutForm.post('/logout')}
                                    className="px-3 py-2 rounded-lg text-slate-400 hover:text-slate-200 text-sm"
                                >
                                    خروج
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8">
                {flash?.message && (
                    <div className="mb-4 p-3 rounded-lg bg-emerald-500/20 text-emerald-300 text-sm">
                        {flash.message}
                    </div>
                )}

                {!ollamaAvailable && (
                    <div className="mb-6 p-4 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-sm">
                        <strong>Ollama غير متصل.</strong> شغّل <code className="bg-slate-800 px-1 rounded">ollama serve</code> ثم حمّل نموذجاً مثل <code className="bg-slate-800 px-1 rounded">ollama pull llama3.2</code>
                    </div>
                )}

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        post('/suggest', { preserveScroll: true });
                    }}
                    className="space-y-4"
                >
                    <label className="block">
                        <span className="block text-slate-300 text-sm font-medium mb-2">صف المسألة أو المشكلة الحسابية/البرمجية</span>
                        <textarea
                            value={data.problem}
                            onChange={(e) => setData('problem', e.target.value)}
                            placeholder="مثال: لدي مصفوفة مرتبة وأريد البحث عن عنصر معيّن بأقل عدد من المقارنات..."
                            rows={5}
                            maxLength={2000}
                            className="w-full rounded-xl bg-slate-800/80 border border-slate-600 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 px-4 py-3"
                        />
                    </label>
                    {errors.problem && (
                        <p className="text-red-400 text-sm">{errors.problem}</p>
                    )}
                    {errors.ollama && (
                        <p className="text-red-400 text-sm">{errors.ollama}</p>
                    )}
                    <button
                        type="submit"
                        disabled={processing || !data.problem.trim()}
                        className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-white transition"
                    >
                        {processing ? 'جاري التحليل...' : 'اقترح خوارزميات'}
                    </button>
                </form>

                {recentCodeforces?.length > 0 && (
                    <section className="mt-10 pt-8 border-t border-slate-700">
                        <h2 className="text-slate-300 font-medium mb-3">آخر حلول Codeforces</h2>
                        <ul className="space-y-2">
                            {recentCodeforces.map((s) => (
                                <li key={`cf-${s.id}`}>
                                    <Link
                                        href={`/solve/result/${s.id}`}
                                        className="block p-3 rounded-xl bg-slate-800/60 border border-slate-600 hover:border-emerald-500/50 text-slate-200 text-sm transition"
                                    >
                                        <span className="text-slate-400 text-xs">{s.created_at}</span>
                                        <p className="mt-1">{s.problem_preview}</p>
                                        <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded ${s.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' : s.status === 'failed' ? 'bg-red-500/20 text-red-300' : 'bg-sky-500/20 text-sky-200'}`}>
                                            {s.status === 'completed' ? 'مكتمل' : s.status === 'failed' ? 'فشل' : s.status === 'pending' || s.status === 'processing' ? 'قيد المعالجة' : s.status}
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {recentSessions?.length > 0 && (
                    <section className="mt-8 pt-6 border-t border-slate-700">
                        <h2 className="text-slate-300 font-medium mb-3">آخر الجلسات (اقتراح خوارزميات)</h2>
                        <ul className="space-y-2">
                            {recentSessions.map((s) => (
                                <li key={s.id}>
                                    <Link
                                        href={`/session/${s.id}`}
                                        className="block p-3 rounded-xl bg-slate-800/60 border border-slate-600 hover:border-emerald-500/50 text-slate-200 text-sm transition"
                                    >
                                        <span className="text-slate-400 text-xs">{s.created_at}</span>
                                        <p className="mt-1">{s.problem_preview}</p>
                                        {s.recommendation_preview && (
                                            <p className="mt-1 text-slate-500 text-xs">{s.recommendation_preview}</p>
                                        )}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
            </main>
        </div>
    );
}
