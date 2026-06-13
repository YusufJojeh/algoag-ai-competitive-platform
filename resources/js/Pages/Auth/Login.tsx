import { Head, Link, useForm } from '@inertiajs/react';
import { BrainCircuit, CheckCircle2, MonitorPlay, Sparkles, Waves } from 'lucide-react';

import { getLoginVisualState, type LoginVisualScenario } from '@/lib/e2e-visual';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePage } from '@inertiajs/react';
import { useUiLocale } from '@/lib/ui-locale';

type LoginPageProps = {
    e2e?: {
        scenario?: LoginVisualScenario;
    };
};

export default function Login() {
    const page = usePage<LoginPageProps>();
    const { locale, isRtl } = useUiLocale();
    const visualState = page.props.e2e?.scenario ? getLoginVisualState(page.props.e2e.scenario, locale) : null;
    const form = useForm({
        email: '',
        password: '',
        remember: false,
    });
    const { data, setData } = form;
    const processing = visualState?.processing ?? form.processing;
    const errors = visualState?.errors ?? form.errors;

    return (
        <>
            <Head title={locale === 'ar' ? 'تسجيل الدخول' : 'Log in'} />

            <div className="app-shell-bg min-h-screen px-4 py-6 lg:px-6 lg:py-8" data-testid="login-page" dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl overflow-hidden rounded-[36px] border border-[var(--app-border)] bg-slate-950/70 shadow-[0_40px_120px_rgba(2,6,23,0.5)] backdrop-blur xl:grid-cols-[1.1fr_0.9fr]">
                    <section className="relative hidden overflow-hidden border-l border-[var(--app-border)] px-10 py-10 xl:flex xl:flex-col xl:justify-between">
                        <div className="absolute inset-0 app-grid opacity-70" />
                        <div className="absolute -right-24 top-12 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />
                        <div className="absolute bottom-8 left-8 h-56 w-56 rounded-full bg-cyan-400/14 blur-3xl" />

                        <div className="relative z-10">
                            <Badge variant="app" className="rounded-full px-4 py-1.5 text-[11px] tracking-[0.2em]">
                                {locale === 'ar' ? 'مساحة عمل الصوت والرؤية' : 'AI Voice + Vision Workspace'}
                            </Badge>
                            <div className="mt-8 flex items-center gap-4">
                                <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-[var(--app-accent-soft)] text-[var(--app-accent-strong)] shadow-sm">
                                    <BrainCircuit className="h-7 w-7" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold tracking-[0.24em] text-[var(--app-muted)]">ALGOAG</p>
                                    <h1 className="mt-2 text-3xl font-semibold text-[var(--app-foreground)]">
                                        {locale === 'ar' ? 'مساعد حل المسائل الصوتي والبصري' : 'Voice and Vision problem-solving assistant'}
                                    </h1>
                                </div>
                            </div>
                            <p className="mt-6 max-w-xl text-base leading-8 text-[var(--app-muted-strong)]">
                                {locale === 'ar'
                                    ? 'مساحة عمل هادئة ومركزة لتحليل الشاشة، الاستماع للفكرة، بث الرد التعليمي، ومتابعة السياق الحي بدون ضجيج بصري.'
                                    : 'A calm focused workspace for screen analysis, idea capture, teaching replies, and live context without visual noise.'}
                            </p>
                        </div>

                        <div className="relative z-10 space-y-4">
                            <FeatureRow
                                icon={MonitorPlay}
                                title={locale === 'ar' ? 'معاينة حية للسياق' : 'Live context preview'}
                                description={locale === 'ar' ? 'شارك نافذة أو تبويباً وشاهد ما يرسله المستخدم إلى المساعد في لوحة جانبية مستقلة.' : 'Share a tab or window and review exactly what reaches the assistant in a separate side panel.'}
                            />
                            <FeatureRow
                                icon={Waves}
                                title={locale === 'ar' ? 'محادثة تعليمية محدثة' : 'Teaching conversation'}
                                description={locale === 'ar' ? 'الرد يظهر تدريجياً مع حالات واضحة للصوت، التحليل، وإعادة الاتصال عند الحاجة.' : 'Replies appear progressively with clear audio, analysis, and reconnect states.'}
                            />
                            <FeatureRow
                                icon={Sparkles}
                                title={locale === 'ar' ? 'أنماط مساعدة دقيقة' : 'Focused assistance modes'}
                                description={locale === 'ar' ? 'من التلميح وحتى تقييم التعقيد والحالات الحدية، كل وضع مصمم لحل المسائل فعلياً.' : 'From hints to complexity and edge cases, each mode is tuned for real problem solving.'}
                            />
                        </div>
                    </section>

                    <section className="flex items-center justify-center px-5 py-8 sm:px-8 lg:px-12">
                        <div className="w-full max-w-xl">
                            <div className="mb-8 xl:hidden">
                                <Badge variant="app">{locale === 'ar' ? 'مساحة عمل الصوت والرؤية' : 'AI Voice + Vision Workspace'}</Badge>
                                <h1 className="mt-4 text-3xl font-semibold text-[var(--app-foreground)]">
                                    {locale === 'ar' ? 'تسجيل الدخول إلى مساحة المساعد' : 'Log in to the assistant workspace'}
                                </h1>
                                <p className="mt-3 text-sm leading-6 text-[var(--app-muted)]">
                                    {locale === 'ar'
                                        ? 'واجهة دخول متسقة مع مساحة العمل نفسها: هادئة، عربية أولاً، وجاهزة لجلسات تحليل طويلة.'
                                        : 'A login surface aligned with the workspace itself: calm, premium, and ready for long analysis sessions.'}
                                </p>
                            </div>

                        <div className="rounded-[32px] border border-[var(--app-border)] bg-slate-950/72 p-6 shadow-[0_24px_80px_rgba(2,6,23,0.42)] sm:p-8">
                                <div className="mb-8">
                                    <p className="text-sm font-semibold text-cyan-200">{locale === 'ar' ? 'مرحباً بعودتك' : 'Welcome back'}</p>
                                    <h2 className="mt-2 text-2xl font-semibold text-[var(--app-foreground)]">
                                        {locale === 'ar' ? 'ادخل إلى بيئة التحليل التفاعلية' : 'Enter the interactive analysis environment'}
                                    </h2>
                                    <p className="mt-3 text-sm leading-6 text-[var(--app-muted)]">
                                        {locale === 'ar'
                                            ? 'سجّل الدخول للوصول إلى المساعد، الجلسات، وسياق التحليل الحي الخاص بك.'
                                            : 'Sign in to access the assistant, your sessions, and the live analysis context.'}
                                    </p>
                                </div>

                                <form
                                    className="space-y-5"
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        if (!visualState) {
                                            form.post('/login');
                                        }
                                    }}
                                >
                                    <div className="space-y-2">
                                        <Label htmlFor="email">{locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={data.email}
                                            onChange={(event) => setData('email', event.target.value)}
                                            autoComplete="username"
                                            placeholder="you@example.com"
                                        />
                                        {errors.email && <p className="text-sm text-rose-600">{errors.email}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="password">{locale === 'ar' ? 'كلمة المرور' : 'Password'}</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            value={data.password}
                                            onChange={(event) => setData('password', event.target.value)}
                                            autoComplete="current-password"
                                            placeholder="••••••••"
                                        />
                                        {errors.password && <p className="text-sm text-rose-600">{errors.password}</p>}
                                    </div>

                                    <div className="flex items-center justify-between gap-3 rounded-[22px] border border-[var(--app-border)] bg-slate-950/45 px-4 py-3">
                                        <label className="flex items-center gap-3 text-sm text-[var(--app-muted-strong)]">
                                            <Checkbox checked={data.remember} onCheckedChange={(checked) => setData('remember', checked === true)} />
                                            {locale === 'ar' ? 'تذكرني على هذا الجهاز' : 'Remember me on this device'}
                                        </label>
                                        <span className="text-xs text-[var(--app-muted)]">{locale === 'ar' ? 'جلسة آمنة ومستمرة' : 'Secure persistent session'}</span>
                                    </div>

                                    <Button type="submit" variant="lavender" className="h-12 w-full rounded-2xl text-base" disabled={processing}>
                                        {processing ? (locale === 'ar' ? 'جارٍ تسجيل الدخول...' : 'Signing in...') : (locale === 'ar' ? 'دخول إلى المساحة' : 'Enter workspace')}
                                    </Button>
                                </form>

                                <div className="mt-8 rounded-[24px] border border-[var(--app-border)] bg-slate-950/45 px-4 py-4">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-[var(--app-foreground)]">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                        {locale === 'ar' ? 'جاهز لما بعد الدخول' : 'Ready after sign-in'}
                                    </div>
                                    <p className="mt-2 text-sm leading-6 text-[var(--app-muted)]">
                                        {locale === 'ar'
                                            ? 'شاشة حية، محادثة متدفقة، ورد صوتي اختياري ضمن تجربة واحدة مترابطة.'
                                            : 'Live preview, teaching conversation, and optional spoken reply within one connected experience.'}
                                    </p>
                                </div>

                                <p className="mt-6 text-sm text-[var(--app-muted)]">
                                    {locale === 'ar' ? 'ليس لديك حساب؟' : "Don't have an account?"}{' '}
                                    <Link href="/register" className="font-semibold text-[var(--app-accent-strong)] transition hover:text-[var(--app-accent)]">
                                        {locale === 'ar' ? 'أنشئ حساباً جديداً' : 'Create a new account'}
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
}

type FeatureRowProps = {
    icon: typeof BrainCircuit;
    title: string;
    description: string;
};

function FeatureRow({ icon: Icon, title, description }: FeatureRowProps) {
    return (
        <div className="rounded-[28px] border border-[var(--app-border)] bg-slate-950/45 p-5 shadow-sm">
            <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[var(--app-accent-soft)] text-[var(--app-accent-strong)]">
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-base font-semibold text-[var(--app-foreground)]">{title}</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--app-muted)]">{description}</p>
                </div>
            </div>
        </div>
    );
}
