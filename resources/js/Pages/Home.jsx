import { useForm, Link } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';

export default function Home() {
    const { ollamaAvailable, recentSessions = [], flash } = usePage().props;
    const { data, setData, post, processing, errors } = useForm({
        problem: '',
    });

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
            <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <h1 className="text-xl font-bold text-emerald-400">مساعد تصميم الخوارزميات</h1>
                    <p className="text-slate-400 text-sm mt-1">افهم المسألة ← اقتراح خوارزميات ← محاكاة أداء ← توصية نهائية</p>
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

                {recentSessions?.length > 0 && (
                    <section className="mt-10 pt-8 border-t border-slate-700">
                        <h2 className="text-slate-300 font-medium mb-3">آخر الجلسات</h2>
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
