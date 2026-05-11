import { Link, useForm, usePage } from '@inertiajs/react';

export default function AdminProblemsEdit() {
    const { problem } = usePage().props;
    const { data, setData, put, processing, errors } = useForm({
        title: problem.title,
        slug: problem.slug,
        statement: problem.statement,
        difficulty: problem.difficulty,
        time_limit_ms: problem.time_limit_ms,
        memory_limit_mb: problem.memory_limit_mb,
    });

    const submit = (e) => {
        e.preventDefault();
        put(`/admin/problems/${problem.id}`);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans" dir="rtl">
            <header className="border-b border-slate-700/50 px-4 py-4 max-w-3xl mx-auto flex justify-between items-center">
                <h1 className="text-xl font-bold text-amber-400">تعديل المسألة</h1>
                <Link href="/admin/problems" className="text-slate-400 text-sm hover:text-slate-200">
                    رجوع
                </Link>
            </header>
            <main className="max-w-3xl mx-auto px-4 py-8">
                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="block text-slate-400 text-sm mb-1">العنوان</label>
                        <input
                            className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                        />
                        {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
                    </div>
                    <div>
                        <label className="block text-slate-400 text-sm mb-1">المعرّف (slug)</label>
                        <input
                            className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 font-mono text-sm"
                            dir="ltr"
                            value={data.slug}
                            onChange={(e) => setData('slug', e.target.value)}
                        />
                        {errors.slug && <p className="text-red-400 text-xs mt-1">{errors.slug}</p>}
                    </div>
                    <div>
                        <label className="block text-slate-400 text-sm mb-1">النص</label>
                        <textarea
                            className="w-full min-h-[160px] rounded-lg bg-slate-900 border border-slate-600 px-3 py-2"
                            value={data.statement}
                            onChange={(e) => setData('statement', e.target.value)}
                        />
                        {errors.statement && <p className="text-red-400 text-xs mt-1">{errors.statement}</p>}
                    </div>
                    <div>
                        <label className="block text-slate-400 text-sm mb-1">الصعوبة</label>
                        <select
                            className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2"
                            value={data.difficulty}
                            onChange={(e) => setData('difficulty', e.target.value)}
                        >
                            <option value="easy">easy</option>
                            <option value="medium">medium</option>
                            <option value="hard">hard</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-slate-400 text-sm mb-1">حد الزمن (ms)</label>
                            <input
                                type="number"
                                className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2"
                                value={data.time_limit_ms}
                                onChange={(e) => setData('time_limit_ms', Number(e.target.value))}
                            />
                            {errors.time_limit_ms && <p className="text-red-400 text-xs mt-1">{errors.time_limit_ms}</p>}
                        </div>
                        <div>
                            <label className="block text-slate-400 text-sm mb-1">الذاكرة (MB)</label>
                            <input
                                type="number"
                                className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2"
                                value={data.memory_limit_mb}
                                onChange={(e) => setData('memory_limit_mb', Number(e.target.value))}
                            />
                            {errors.memory_limit_mb && <p className="text-red-400 text-xs mt-1">{errors.memory_limit_mb}</p>}
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={processing}
                        className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-medium disabled:opacity-50"
                    >
                        حفظ التعديلات
                    </button>
                </form>
            </main>
        </div>
    );
}
