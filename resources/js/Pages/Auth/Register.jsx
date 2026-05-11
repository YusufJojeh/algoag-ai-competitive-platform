import { Head, Link, useForm } from '@inertiajs/react';
import { BrainCircuit, CheckCircle2, Sparkles } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUiLocale } from '@/lib/ui-locale';

export default function Register() {
    const { locale, isRtl } = useUiLocale();
    const form = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });
    const { data, setData, processing, errors } = form;

    return (
        <>
            <Head title={locale === 'ar' ? 'إنشاء حساب' : 'Create account'} />

            <div className="app-shell-bg min-h-screen px-4 py-6 lg:px-6 lg:py-8" dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl overflow-hidden rounded-[36px] border border-[var(--app-border)] bg-slate-950/70 shadow-[0_40px_120px_rgba(2,6,23,0.5)] backdrop-blur xl:grid-cols-[1.05fr_0.95fr]">
                    <section className="relative hidden overflow-hidden border-l border-[var(--app-border)] px-10 py-10 xl:flex xl:flex-col xl:justify-between">
                        <div className="absolute inset-0 app-grid opacity-60" />
                        <div className="absolute -right-20 top-10 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />
                        <div className="absolute bottom-8 left-8 h-56 w-56 rounded-full bg-cyan-400/14 blur-3xl" />

                        <div className="relative z-10">
                            <Badge variant="violet" className="rounded-full px-4 py-1.5 text-[11px] tracking-[0.24em]">
                                {locale === 'ar' ? 'منصة تدريب تنافسية' : 'Competitive training platform'}
                            </Badge>
                            <div className="mt-8 flex items-center gap-4">
                                <div className="flex h-16 w-16 items-center justify-center rounded-[24px] border border-white/10 bg-white/6 text-cyan-200 shadow-[0_0_40px_rgba(34,211,238,0.12)]">
                                    <BrainCircuit className="h-7 w-7" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold tracking-[0.24em] text-slate-400">ALGOAG</p>
                                    <h1 className="mt-2 text-3xl font-semibold text-[var(--app-foreground)]">
                                        {locale === 'ar' ? 'أنشئ حساباً وابدأ تدريبك' : 'Create an account and start training'}
                                    </h1>
                                </div>
                            </div>
                            <p className="mt-6 max-w-xl text-base leading-8 text-[var(--app-muted-strong)]">
                                {locale === 'ar'
                                    ? 'واجهة موحدة مع المساعد نفسه: مواضيع، مسائل، جلسات تحليل، وتجربة تعلم موجهة لبناء مهارات المسابقات البرمجية.'
                                    : 'A product surface aligned with the assistant itself: topics, problems, analysis sessions, and guided learning for contest training.'}
                            </p>
                        </div>

                        <div className="relative z-10 rounded-[28px] border border-[var(--app-border)] bg-slate-950/45 p-6">
                            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--app-foreground)]">
                                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                                {locale === 'ar' ? 'ما الذي ستحصل عليه؟' : 'What do you unlock?'}
                            </div>
                            <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--app-muted)]">
                                <li>{locale === 'ar' ? 'جلسات مساعدة محفوظة لكل مسألة أو فكرة.' : 'Saved assistant sessions for each problem or idea.'}</li>
                                <li>{locale === 'ar' ? 'تصفح الموضوعات والأنماط والمسائل من واجهة واحدة.' : 'Browse topics, patterns, and problems from one interface.'}</li>
                                <li>{locale === 'ar' ? 'انتقال من التلميح إلى الحل الكامل عند الطلب فقط.' : 'Move from hinting to full solutions only when explicitly requested.'}</li>
                            </ul>
                        </div>
                    </section>

                    <section className="flex items-center justify-center px-5 py-8 sm:px-8 lg:px-12">
                        <div className="w-full max-w-xl">
                            <Badge variant="app">{locale === 'ar' ? 'مساحة تعلم متقدمة' : 'Advanced learning workspace'}</Badge>
                            <h2 className="mt-4 text-3xl font-semibold text-[var(--app-foreground)]">
                                {locale === 'ar' ? 'أنشئ الحساب للوصول إلى المساعد' : 'Create your account to access the assistant'}
                            </h2>
                            <p className="mt-3 text-sm leading-6 text-[var(--app-muted)]">
                                {locale === 'ar'
                                    ? 'كل شيء ضمن نفس الهوية البصرية للمنتج: هبوط مميز، مساحات عمل جدية، وتصفح موضوعات منظم.'
                                    : 'Everything stays inside the same product identity: premium landing, serious workspaces, and structured topic browsing.'}
                            </p>

                            <div className="mt-8 rounded-[32px] border border-[var(--app-border)] bg-slate-950/72 p-6 shadow-[0_24px_80px_rgba(2,6,23,0.42)] sm:p-8">
                                <form
                                    className="space-y-5"
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        form.post('/register');
                                    }}
                                >
                                    <div className="space-y-2">
                                        <Label htmlFor="name">{locale === 'ar' ? 'الاسم' : 'Name'}</Label>
                                        <Input id="name" type="text" value={data.name} onChange={(event) => setData('name', event.target.value)} autoComplete="name" />
                                        {errors.name && <p className="text-sm text-rose-300">{errors.name}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email">{locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}</Label>
                                        <Input id="email" type="email" value={data.email} onChange={(event) => setData('email', event.target.value)} autoComplete="username" placeholder="you@example.com" />
                                        {errors.email && <p className="text-sm text-rose-300">{errors.email}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="password">{locale === 'ar' ? 'كلمة المرور' : 'Password'}</Label>
                                        <Input id="password" type="password" value={data.password} onChange={(event) => setData('password', event.target.value)} autoComplete="new-password" />
                                        {errors.password && <p className="text-sm text-rose-300">{errors.password}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="password_confirmation">{locale === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm password'}</Label>
                                        <Input id="password_confirmation" type="password" value={data.password_confirmation} onChange={(event) => setData('password_confirmation', event.target.value)} autoComplete="new-password" />
                                    </div>

                                    <Button type="submit" variant="lavender" className="h-12 w-full rounded-2xl text-base" disabled={processing}>
                                        {processing ? (locale === 'ar' ? 'جارٍ إنشاء الحساب...' : 'Creating account...') : (locale === 'ar' ? 'إنشاء الحساب' : 'Create account')}
                                        <Sparkles className="h-4 w-4" />
                                    </Button>
                                </form>

                                <p className="mt-6 text-sm text-[var(--app-muted)]">
                                    {locale === 'ar' ? 'لديك حساب بالفعل؟' : 'Already have an account?'}{' '}
                                    <Link href="/login" className="font-semibold text-cyan-200 transition hover:text-white">
                                        {locale === 'ar' ? 'سجّل الدخول' : 'Log in'}
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
