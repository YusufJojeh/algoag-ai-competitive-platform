import { usePage, Link } from '@inertiajs/react';

export default function Results() {
    const { problem, suggestions, benchmarkResults, recommendation, sessionId } = usePage().props;

    const resultsList = benchmarkResults ? Object.entries(benchmarkResults) : [];

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
            <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <h1 className="text-xl font-bold text-emerald-400">نتائج المحاكاة والتوصية</h1>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
                <section>
                    <h2 className="text-slate-400 text-sm font-medium mb-2">المسألة</h2>
                    <p className="text-slate-200 bg-slate-800/50 rounded-xl p-4 border border-slate-700">{problem}</p>
                </section>

                <section>
                    <h2 className="text-slate-300 font-medium mb-4">مقارنة الأداء (محاكاة)</h2>
                    <div className="overflow-x-auto rounded-xl border border-slate-600">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-800 text-slate-300 text-left">
                                    <th className="p-3">الخوارزمية / المفتاح</th>
                                    <th className="p-3">الوقت (ms)</th>
                                    <th className="p-3">الذاكرة (MB)</th>
                                    <th className="p-3">حجم n</th>
                                </tr>
                            </thead>
                            <tbody>
                                {resultsList.map(([key, r]) => (
                                    <tr key={key} className="border-t border-slate-700">
                                        <td className="p-3 font-medium text-emerald-400">{key}</td>
                                        <td className="p-3">{r.time_ms}</td>
                                        <td className="p-3">{r.memory_mb}</td>
                                        <td className="p-3">{r.n}</td>
                                        {r.error && <td className="p-3 text-red-400">{r.error}</td>}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {recommendation && (
                    <section className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5">
                        <h2 className="text-emerald-400 font-medium mb-2">التوصية النهائية</h2>
                        <p className="text-slate-200 whitespace-pre-wrap">{recommendation}</p>
                    </section>
                )}

                {sessionId && (
                    <p className="text-slate-500 text-sm">تم حفظ هذه الجلسة ويمكنك العودة إليها من الصفحة الرئيسية.</p>
                )}

                <Link
                    href="/assistant"
                    className="inline-block px-6 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium"
                >
                    مسألة جديدة
                </Link>
            </main>
        </div>
    );
}
