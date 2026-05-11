import { Link, useForm, usePage } from '@inertiajs/react';

export default function AdminProblemsIndex() {
    const { problems = [], flash } = usePage().props;
    const deleteForm = useForm({});

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans" dir="rtl">
            <header className="border-b border-slate-700/50 px-4 py-4 max-w-4xl mx-auto flex justify-between items-center">
                <h1 className="text-xl font-bold text-amber-400">إدارة المسائل</h1>
                <div className="flex gap-2">
                    <Link href="/admin/problems/create" className="px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-sm">
                        مسألة جديدة
                    </Link>
                    <Link href="/" className="text-slate-400 text-sm hover:text-slate-200">
                        الرئيسية
                    </Link>
                </div>
            </header>
            <main className="max-w-4xl mx-auto px-4 py-8">
                {flash?.message && (
                    <p className="mb-4 p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-sm">
                        {flash.message}
                    </p>
                )}
                {problems.length === 0 ? (
                    <p className="text-slate-500">لا توجد مسائل.</p>
                ) : (
                    <ul className="space-y-2">
                        {problems.map((p) => (
                            <li
                                key={p.id}
                                className="flex flex-wrap items-center justify-between gap-2 p-4 rounded-xl bg-slate-800/60 border border-slate-600"
                            >
                                <div>
                                    <span className="text-emerald-300 font-medium">{p.title}</span>
                                    <span className="block text-slate-500 text-xs mt-1">{p.slug} · {p.difficulty}</span>
                                </div>
                                <div className="flex gap-2">
                                    <Link
                                        href={`/admin/problems/${p.id}/edit`}
                                        className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm"
                                    >
                                        تعديل
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (confirm('حذف هذه المسألة؟')) {
                                                deleteForm.delete(`/admin/problems/${p.id}`);
                                            }
                                        }}
                                        className="px-3 py-1.5 rounded-lg bg-red-900/50 hover:bg-red-800/60 text-sm text-red-200"
                                    >
                                        حذف
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </main>
        </div>
    );
}
