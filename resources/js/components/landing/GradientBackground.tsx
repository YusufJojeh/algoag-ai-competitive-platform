export default function GradientBackground() {
    return (
        <>
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_24%),radial-gradient(circle_at_80%_10%,rgba(139,92,246,0.2),transparent_28%),linear-gradient(180deg,#020617_0%,#0f172a_42%,#020617_100%)]" />
            <div className="landing-noise pointer-events-none absolute inset-0 opacity-50" />
        </>
    );
}
