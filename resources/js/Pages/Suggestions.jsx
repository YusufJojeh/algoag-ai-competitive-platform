import { useForm } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';

export default function Suggestions() {
    const { problem, suggestions, ollamaAvailable } = usePage().props;
    const { post, processing } = useForm(
        { problem, suggestions },
        { preserveState: true }
    );

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
            <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <h1 className="text-xl font-bold text-emerald-400">اقتراحات الخوارزميات</h1>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
                <section>
                    <h2 className="text-slate-400 text-sm font-medium mb-2">المسألة</h2>
                    <p className="text-slate-200 bg-slate-800/50 rounded-xl p-4 border border-slate-700">{problem}</p>
                </section>

                <section>
                    <h2 className="text-slate-300 font-medium mb-4">خوارزميات مقترحة</h2>
                    <ul className="space-y-4">
                        {suggestions?.map((algo, i) => (
                            <li
                                key={i}
                                className="bg-slate-800/60 rounded-xl border border-slate-600 p-4"
                            >
                                <div className="font-medium text-emerald-400">{algo.name}</div>
                                <div className="text-slate-400 text-sm mt-1">
                                    وقت: {algo.complexity_time} | ذاكرة: {algo.complexity_space}
                                </div>
                                <p className="text-slate-300 text-sm mt-2">{algo.description}</p>
                                <p className="text-slate-500 text-xs mt-1">متى تكون الأنسب: {algo.when_best}</p>
                            </li>
                        ))}
                    </ul>
                </section>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        post('/benchmark', { preserveScroll: true });
                    }}
                >
                    <button
                        type="submit"
                        disabled={processing}
                        className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 font-medium text-white"
                    >
                        {processing ? 'جاري تشغيل المحاكاة...' : 'تشغيل محاكاة الأداء والمقارنة'}
                    </button>
                </form>
            </main>
        </div>
    );
}
