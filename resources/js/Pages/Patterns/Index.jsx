import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

import AppLayout from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useUiLocale } from '@/lib/ui-locale';

export default function PatternsIndex() {
    const { patterns = [], pagination = {}, filters = {}, filter_tags = [], meta = {} } = usePage().props;
    const { locale, isRtl } = useUiLocale();

    const [q, setQ] = useState(filters.q ?? '');
    const debounceRef = useRef(null);

    useEffect(() => {
        setQ(filters.q ?? '');
    }, [filters.q]);

    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    const navigateWithFilters = (next) => {
        router.get('/patterns', next, { preserveState: true, replace: true });
    };

    const onQChange = (value) => {
        setQ(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            navigateWithFilters({
                q: value,
                status: filters.status,
                tag: filters.tag,
                page: 1,
            });
        }, 350);
    };

    const onStatusChange = (e) => {
        navigateWithFilters({
            q: filters.q,
            status: e.target.value,
            tag: filters.tag,
            page: 1,
        });
    };

    const onTagChange = (e) => {
        navigateWithFilters({
            q: filters.q,
            status: filters.status,
            tag: e.target.value,
            page: 1,
        });
    };

    const goPage = (page) => {
        router.get(
            '/patterns',
            { q: filters.q, status: filters.status, tag: filters.tag, page },
            { preserveState: true }
        );
    };

    return (
        <AppLayout
            currentPath="/patterns"
            badge={locale === 'ar' ? 'مكتبة الموضوعات' : 'Topic explorer'}
            title={locale === 'ar' ? 'استكشف الأنماط والموضوعات الأساسية' : 'Explore the core topics and patterns'}
            description={locale === 'ar'
                ? 'واجهة موضوعات متصلة بالمساعد نفسه: مرشحات سريعة، إشارات النمط، وروابط مباشرة للانتقال من التعلم إلى حل المسائل.'
                : 'A topic surface connected to the assistant itself: fast filters, pattern signals, and direct links from learning into problem solving.'}
            actions={(
                <>
                    <Button asChild variant="soft" size="sm">
                        <Link href="/assistant">{locale === 'ar' ? 'افتح المساعد' : 'Open assistant'}</Link>
                    </Button>
                    <Button asChild variant="surface" size="sm">
                        <Link href="/problems">{locale === 'ar' ? 'المسائل' : 'Problems'}</Link>
                    </Button>
                </>
            )}
            contentClassName="px-6 py-6"
        >
            <Head>
                <title>{meta.title}</title>
                <meta name="description" content={meta.description} />
            </Head>
            <div className="mx-auto max-w-5xl space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="grid gap-4 rounded-[30px] border border-[var(--app-border)] bg-slate-950/45 p-5 lg:grid-cols-[minmax(0,1fr)_auto]">
                    <div className="relative flex-1 min-w-[200px]">
                        <input
                            type="search"
                            value={q}
                            onChange={(e) => onQChange(e.target.value)}
                            placeholder={locale === 'ar' ? 'ابحث بالاسم أو الوصف أو الإشارات...' : 'Search by name, summary, or signals...'}
                            className="w-full rounded-2xl border border-[var(--app-border)] bg-slate-950/55 px-4 py-3 text-sm text-[var(--app-foreground)] outline-none transition-colors placeholder:text-[var(--app-muted)] focus:border-[var(--app-border-strong)]"
                            aria-label={locale === 'ar' ? 'بحث' : 'Search'}
                        />
                        {q && (
                            <button
                                type="button"
                                onClick={() => onQChange('')}
                                className={`absolute top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 ${isRtl ? 'left-3' : 'right-3'}`}
                            >
                                ✕
                            </button>
                        )}
                    </div>
                    <div className="flex w-full gap-2 sm:w-auto">
                        <select
                            value={filters.status ?? 'published'}
                            onChange={onStatusChange}
                            className="flex-1 rounded-2xl border border-[var(--app-border)] bg-slate-950/55 px-3 py-3 text-sm text-[var(--app-foreground)] outline-none focus:border-[var(--app-border-strong)] sm:flex-none"
                        >
                            <option value="published">{locale === 'ar' ? 'منشور' : 'Published'}</option>
                            <option value="draft">{locale === 'ar' ? 'مسودة' : 'Draft'}</option>
                            <option value="review">{locale === 'ar' ? 'مراجعة' : 'Review'}</option>
                            <option value="deprecated">{locale === 'ar' ? 'مهجور' : 'Deprecated'}</option>
                            <option value="all">{locale === 'ar' ? 'الكل' : 'All'}</option>
                        </select>
                        <select
                            value={filters.tag ?? ''}
                            onChange={onTagChange}
                            className="min-w-[140px] flex-1 rounded-2xl border border-[var(--app-border)] bg-slate-950/55 px-3 py-3 text-sm text-[var(--app-foreground)] outline-none focus:border-[var(--app-border-strong)] sm:flex-none"
                        >
                            <option value="">{locale === 'ar' ? 'كل الوسوم' : 'All tags'}</option>
                            {filter_tags.map((t) => (
                                <option key={t} value={t}>
                                    {t}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-3 px-1">
                    <p className="text-xs text-slate-400">
                        {locale === 'ar' ? `عرض ${pagination.total} موضوعاً` : `Showing ${pagination.total} topics`}
                    </p>
                    {(q || filters.tag || filters.status !== 'published') && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setQ('');
                                navigateWithFilters({ q: '', status: 'published', tag: '', page: 1 });
                            }}
                        >
                            {locale === 'ar' ? 'إعادة ضبط المرشحات' : 'Reset filters'}
                        </Button>
                    )}
                </div>

                {patterns.length === 0 ? (
                    <div className="rounded-[30px] border border-dashed border-[var(--app-border)] bg-slate-950/35 px-6 py-14 text-center">
                        <p className="text-lg font-semibold text-[var(--app-foreground)]">{locale === 'ar' ? 'لا توجد موضوعات مطابقة حالياً' : 'No matching topics found'}</p>
                        <p className="mt-2 text-sm text-[var(--app-muted)]">
                            {locale === 'ar'
                                ? 'غيّر كلمات البحث أو الوسوم أو حالة النشر للعثور على نمط آخر.'
                                : 'Adjust the query, tags, or publication state to find another pattern.'}
                        </p>
                    </div>
                ) : (
                    <ul className="grid gap-4 lg:grid-cols-2">
                        {patterns.map((p) => (
                            <li key={p.pattern_id}>
                                <Link
                                    href={p.href}
                                    className="block h-full rounded-[28px] border border-[var(--app-border)] bg-slate-950/45 p-5 transition hover:border-[var(--app-border-strong)] hover:bg-slate-950/60"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <span className="text-base font-semibold text-cyan-200">{p.title?.ar || p.title?.en}</span>
                                            <span className="mt-2 block text-sm leading-6 text-[var(--app-muted)]">{p.summary?.ar || p.summary?.en}</span>
                                        </div>
                                        <Badge variant="subtle">{p.pattern_id}</Badge>
                                    </div>
                                    {p.analytics_tags?.length > 0 && (
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {p.analytics_tags.map((t) => (
                                                <Badge key={t} variant="subtle" className="tracking-normal">{t}</Badge>
                                            ))}
                                        </div>
                                    )}
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}

                {pagination.last_page > 1 && (
                    <nav className="flex items-center justify-center gap-2 pt-4" aria-label={locale === 'ar' ? 'ترقيم الصفحات' : 'Pagination'}>
                        <button
                            type="button"
                            disabled={pagination.current_page <= 1}
                            onClick={() => goPage(pagination.current_page - 1)}
                            className="rounded-2xl border border-[var(--app-border)] bg-slate-950/55 px-4 py-2 disabled:opacity-40"
                        >
                            {locale === 'ar' ? 'السابق' : 'Previous'}
                        </button>
                        <span className="text-sm text-slate-400">
                            {pagination.current_page} / {pagination.last_page}
                        </span>
                        <button
                            type="button"
                            disabled={pagination.current_page >= pagination.last_page}
                            onClick={() => goPage(pagination.current_page + 1)}
                            className="rounded-2xl border border-[var(--app-border)] bg-slate-950/55 px-4 py-2 disabled:opacity-40"
                        >
                            {locale === 'ar' ? 'التالي' : 'Next'}
                        </button>
                    </nav>
                )}
            </div>
        </AppLayout>
    );
}
