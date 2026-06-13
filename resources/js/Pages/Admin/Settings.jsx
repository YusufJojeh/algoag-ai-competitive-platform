import { usePage } from '@inertiajs/react';

import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useUiLocale } from '@/lib/ui-locale';
import AdminLayout from './AdminLayout';

const copy = {
    en: {
        title: 'Settings',
        subtitle: 'Current application configuration and service readiness.',
        application: 'Application',
        runtimeLimits: 'Runtime limits',
        services: 'Services',
        name: 'Name',
        environment: 'Environment',
        debug: 'Debug',
        locale: 'Locale',
        timezone: 'Timezone',
        judgeEnabled: 'Judge enabled',
        judgeTimeout: 'Judge timeout',
        assistantAudioMax: 'Assistant audio max',
        enabled: 'enabled',
        disabled: 'disabled',
        yes: 'yes',
        no: 'no',
        seconds: 'seconds',
        mb: 'MB',
        notSet: 'not set',
    },
    ar: {
        title: 'الإعدادات',
        subtitle: 'إعدادات التطبيق الحالية وجاهزية الخدمات.',
        application: 'التطبيق',
        runtimeLimits: 'حدود التشغيل',
        services: 'الخدمات',
        name: 'الاسم',
        environment: 'البيئة',
        debug: 'التصحيح',
        locale: 'اللغة',
        timezone: 'المنطقة الزمنية',
        judgeEnabled: 'تشغيل الحكم',
        judgeTimeout: 'مهلة الحكم',
        assistantAudioMax: 'حد صوت المساعد',
        enabled: 'مفعل',
        disabled: 'معطل',
        yes: 'نعم',
        no: 'لا',
        seconds: 'ثانية',
        mb: 'م.ب',
        notSet: 'غير مضبوط',
    },
};

export default function AdminSettings() {
    const { locale } = useUiLocale();
    const t = copy[locale];
    const { settings = {} } = usePage().props;
    const app = settings.app ?? {};
    const services = settings.services ?? [];
    const limits = settings.limits ?? {};

    return (
        <AdminLayout title={t.title} subtitle={t.subtitle}>
            <section className="grid gap-5 lg:grid-cols-2">
                <Panel title={t.application}>
                    <Definition label={t.name} value={app.name} />
                    <Definition label={t.environment} value={app.env} />
                    <Definition label={t.debug} value={app.debug ? t.enabled : t.disabled} />
                    <Definition label={t.locale} value={app.locale} />
                    <Definition label={t.timezone} value={app.timezone} />
                </Panel>

                <Panel title={t.runtimeLimits}>
                    <Definition label={t.judgeEnabled} value={limits.judge_enabled ? t.yes : t.no} />
                    <Definition label={t.judgeTimeout} value={`${limits.judge_timeout_seconds ?? t.notSet} ${t.seconds}`} />
                    <Definition label={t.assistantAudioMax} value={`${limits.assistant_max_audio_mb ?? t.notSet} ${t.mb}`} />
                </Panel>
            </section>

            <section className="app-surface-muted mt-6 rounded-[28px]">
                <div className="px-5 py-4">
                    <h2 className="text-sm font-semibold text-[var(--app-foreground)]">{t.services}</h2>
                </div>
                <Separator />
                <div className="flex flex-col">
                    {services.map((service) => (
                        <div key={service.name} className="grid gap-3 border-b border-[var(--app-border)] px-5 py-4 last:border-b-0 md:grid-cols-[1fr_auto_1fr] md:items-center">
                            <p className="font-medium text-[var(--app-foreground)]">{service.name}</p>
                            <StatusBadge status={service.status} />
                            <p className="text-sm text-[var(--app-muted)] md:text-end">{service.detail}</p>
                        </div>
                    ))}
                </div>
            </section>
        </AdminLayout>
    );
}

function Panel({ title, children }) {
    return (
        <div className="app-surface-muted rounded-[28px]">
            <div className="px-5 py-4">
                <h2 className="text-sm font-semibold text-[var(--app-foreground)]">{title}</h2>
            </div>
            <Separator />
            <div className="flex flex-col">{children}</div>
        </div>
    );
}

function Definition({ label, value }) {
    return (
        <div className="flex items-center justify-between gap-4 border-b border-[var(--app-border)] px-5 py-4 text-sm last:border-b-0">
            <span className="text-[var(--app-muted)]">{label}</span>
            <span className="text-end text-[var(--app-foreground)]">{String(value ?? '')}</span>
        </div>
    );
}

function StatusBadge({ status }) {
    const healthy = ['online', 'configured'].includes(status);

    return <Badge variant={healthy ? 'success' : 'danger'}>{status}</Badge>;
}
