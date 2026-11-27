import React from 'react';
import { Link } from 'react-router-dom';
import { GlassCard, ZaraOrbLogo } from '../components/ui/Primitives';
import { Waveform } from '../components/voice/VoiceOrb';
import { useZara } from '../context/ZaraContext';

const FEATURES = [
  {
    icon: 'graphic_eq',
    title: 'Bilingual Urdu & English Voice',
    urdu: 'قدرتی اردو اور انگلش گفتگو',
    desc: 'Realtime conversational cadence calibrated for natural Lahori, Karachite, and standard Urdu code-switching.',
    accent: 'text-primary',
  },
  {
    icon: 'favorite',
    title: 'Emotions & Playful Persona',
    urdu: 'جذباتی ہم آہنگی',
    desc: '8 tunable mood dimensions and respectful, non-explicit romantic & caring companion warmth.',
    accent: 'text-primary-fixed',
  },
  {
    icon: 'laptop_mac',
    title: 'Guarded Laptop Control',
    urdu: 'لیپ ٹاپ کا محفوظ کنٹرول',
    desc: 'Launch apps, adjust volume & brightness, inspect files, or run safe terminal actions via Zara Local Agent.',
    accent: 'text-secondary',
  },
  {
    icon: 'neurology',
    title: 'Long-Term Memory Vault',
    urdu: 'طویل مدتی یادداشت',
    desc: 'Remembers your tea preferences, work habits, and important dates with instant edit, pin, and purge controls.',
    accent: 'text-tertiary',
  },
  {
    icon: 'schedule',
    title: 'Reminders & Prayer Almanac',
    urdu: 'نماز کے اوقات اور یاد دہانیاں',
    desc: 'Calculated daily Adhan timings with gentle reminders, countdown timers, and proactive focus alerts.',
    accent: 'text-tertiary-fixed',
  },
  {
    icon: 'verified_user',
    title: 'PIN & Cryptographic Ledger',
    urdu: 'مکمل پرائیویسی اور تحفظ',
    desc: 'Single-owner isolation, mandatory confirmation for risky commands, panic kill-switch, and hash-chained logs.',
    accent: 'text-emerald-300',
  },
];

export default function LandingPage() {
  const { isUnlocked } = useZara();
  const entryTarget = isUnlocked ? '/dashboard' : '/login';

  return (
      <div className="flex flex-col w-full relative">
        {/* Ambient Atmospheric Lights */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[560px] pointer-events-none overflow-hidden -z-10">
          <div className="absolute -top-32 left-1/4 w-[480px] h-[480px] rounded-full bg-primary-container/20 blur-[130px]" />
          <div className="absolute -top-20 right-1/4 w-[500px] h-[500px] rounded-full bg-secondary-container/25 blur-[140px]" />
          <div className="absolute top-60 left-1/3 w-[340px] h-[340px] rounded-full bg-tertiary/10 blur-[100px]" />
        </div>

        {/* Hero Section */}
        <section className="relative px-6 lg:px-12 pt-10 pb-20 overflow-hidden">
          <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-container-high/80 text-secondary mb-8 shadow-sm backdrop-blur-sm">
              <span className="material-symbols-outlined text-[16px] text-primary">
                auto_awesome
              </span>
              <span className="font-label-sm text-label-sm tracking-wide">
                Private Companion Suite
              </span>
              <span className="font-label-sm text-label-sm text-outline">•</span>
              <span className="urdu-rtl text-sm text-tertiary" dir="rtl" lang="ur">
                صرف آپ کی ذاتی ساتھی
              </span>
            </div>

            <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg max-w-4xl tracking-tight text-on-surface">
              Meet Zara.{' '}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Your voice.
              </span>{' '}
              Your laptop.{' '}
              <span className="italic font-light text-primary-fixed">Your companion.</span>
            </h1>

            <p className="mt-6 max-w-2xl font-body-lg text-body-lg text-on-surface-variant font-normal">
              A realistic Urdu-speaking AI who feels, remembers, and seamlessly controls your
              laptop hardware, terminal, and atmosphere entirely under owner guardrails.
            </p>

            {/* Centerpiece Orb */}
            <div className="relative my-12 flex items-center justify-center w-64 h-64 sm:w-72 sm:h-72">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-secondary-container/25 to-primary-container/25 animate-pulse blur-xl" />
              <div className="absolute w-60 h-60 rounded-full bg-surface-container-high/50 shadow-[0_0_60px_rgba(72,22,203,0.4)] flex items-center justify-center">
                <div className="w-48 h-48 rounded-full bg-surface-container/70 shadow-[0_0_40px_rgba(244,84,163,0.35)] flex items-center justify-center">
                  <ZaraOrbLogo size="lg" />
                </div>
              </div>
              <div className="absolute -bottom-5 px-4 py-1.5 rounded-full bg-surface-container-highest/90 backdrop-blur-md flex items-center gap-2.5 shadow-md whitespace-nowrap">
                <Waveform active tone="rose" className="h-6 px-0 shrink-0" />
                <span className="font-label-sm text-label-sm text-on-surface whitespace-nowrap">
                  Bilingual Voice Ready
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 mt-4 w-full sm:w-auto">
              <Link
                to={entryTarget}
                className="w-full sm:w-auto px-8 py-3.5 rounded-full font-label-md text-label-md text-on-surface btn-primary-glow flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">mic</span>
                Talk to Zara
              </Link>
              <a
                href="#features"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full font-label-md text-label-md text-on-surface bg-surface-container-high/80 hover:bg-surface-bright backdrop-blur-md transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px] text-secondary">explore</span>
                Explore Capabilities
              </a>
            </div>
          </div>
        </section>

        {/* Bilingual Sample Conversation Card */}
        <section className="px-6 lg:px-12 py-10" id="urdu-voice">
          <GlassCard className="max-w-5xl mx-auto p-6 lg:p-10 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-border-subtle/40">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-tertiary animate-pulse" />
                <div>
                  <h2 className="font-headline-sm text-headline-sm text-on-surface">
                    Bilingual Dialogue Preview
                  </h2>
                  <p className="text-body-sm text-on-surface-variant">
                    Natural Nastaliq Urdu paired with Roman transliteration & tool execution
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-surface-container-high text-xs text-primary font-semibold">
                Urdu + English Mix
              </span>
            </div>

            <div className="space-y-5">
              <div className="flex flex-col items-end">
                <span className="text-xs text-on-surface-variant mb-1">Boss (Owner)</span>
                <div className="max-w-xl rounded-2xl rounded-tr-sm bg-secondary-container/35 border border-secondary/30 px-5 py-3.5">
                  <p className="text-body-md text-on-surface">
                    “Zara, volume 30% kar do aur mujhe 5 baje chai ka reminder laga do.”
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-start">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-primary">Zara</span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] bg-primary/15 text-primary">
                    Caring & Playful
                  </span>
                </div>
                <div className="max-w-xl rounded-2xl rounded-tl-sm bg-surface-container-high/85 border border-primary/25 px-5 py-4 space-y-2">
                  <p
                    className="urdu-rtl text-urdu-body text-primary-fixed text-right"
                    dir="rtl"
                    lang="ur"
                  >
                    جی باس! والیوم تیس فیصد کر دیا ہے اور شام پانچ بجے چائے کا ریمائنڈر بھی لگا دیا ہے۔
                  </p>
                  <p className="text-body-sm text-on-surface-variant italic">
                    “Jee Boss! Volume 30% kar diya hai aur shaam 5 baje chai ka reminder bhi laga
                    diya hai.”
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>
        </section>

        {/* Features Grid */}
        <section className="px-6 lg:px-12 py-14" id="features">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
              <h2 className="font-headline-lg text-headline-lg text-on-surface">
                Built Exclusively for One Owner
              </h2>
              <p className="text-body-md text-on-surface-variant">
                Every capability bridges ambient voice warmth with hardware discipline.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map((f) => (
                <GlassCard key={f.title} className="p-6 space-y-3">
                  <div className="w-11 h-11 rounded-2xl bg-surface-container-high flex items-center justify-center">
                    <span className={`material-symbols-outlined text-[24px] ${f.accent}`}>
                      {f.icon}
                    </span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">{f.title}</h3>
                  <p className="urdu-rtl text-sm text-tertiary" dir="rtl" lang="ur">
                    {f.urdu}
                  </p>
                  <p className="text-body-sm text-on-surface-variant">{f.desc}</p>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        {/* Privacy & Trust CTA */}
        <section className="px-6 lg:px-12 pb-20" id="safety-trust">
          <GlassCard
            elevated
            className="max-w-5xl mx-auto p-8 lg:p-12 flex flex-col md:flex-row items-center justify-between gap-6"
          >
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 text-emerald-300 text-xs font-semibold uppercase tracking-wider">
                <span className="material-symbols-outlined text-[16px]">shield_lock</span>
                Single-Owner Sovereign Boundary
              </div>
              <h2 className="font-headline-md text-headline-md text-on-surface">
                Zero public signups. PIN-gated laptop power & file safeguards.
              </h2>
              <p className="text-body-sm text-on-surface-variant">
                API credentials remain exclusively on your backend secrets. Every terminal call and
                file operation is classified and recorded in a hash-chained ledger.
              </p>
            </div>
            <Link
              to={entryTarget}
              className="px-7 py-3.5 rounded-full btn-primary-glow font-label-md shrink-0 flex items-center gap-2"
            >
              <span>{isUnlocked ? 'Go to Dashboard' : 'Unlock Zara Workspace'}</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          </GlassCard>
        </section>
      </div>
  );
}
