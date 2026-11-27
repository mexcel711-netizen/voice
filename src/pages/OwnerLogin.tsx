import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useZara } from '../context/ZaraContext';
import {
  ComingLaterBadge,
  GlassCard,
  PillButton,
  SupabaseConfigNotice,
  ZaraOrbLogo,
} from '../components/ui/Primitives';
import { PinPad } from '../components/safety/ConfirmModal';
import { masterLoginSchema, pinSchema } from '../lib/validation';
import { useToast } from '../context/ToastContext';

export default function OwnerLogin() {
  const {
    supabaseConfigured,
    authAuthenticated,
    isOwner,
    isUnlocked,
    hasPinSet,
    ownerProfile,
    signInWithMasterPassword,
    verifyPin,
    setPin,
    autostartUnlock,
  } = useZara();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const fromPath = (location.state as { from?: string } | null)?.from || '/dashboard';

  const [mode, setMode] = useState<'pin' | 'setup_pin' | 'password'>(() => {
    if (supabaseConfigured && (!authAuthenticated || !isOwner)) return 'password';
    if (!hasPinSet) return 'setup_pin';
    return 'pin';
  });

  const [pinValue, setPinValue] = useState('');
  const [confirmPinValue, setConfirmPinValue] = useState('');
  const [setupStep, setSetupStep] = useState<'enter' | 'confirm'>('enter');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [lockRemainingSec, setLockRemainingSec] = useState(0);

  // Support ?autostart=1 for non-Supabase testing convenience
  useEffect(() => {
    if (!supabaseConfigured && searchParams.get('autostart') === '1' && !isUnlocked) {
      autostartUnlock();
      navigate(fromPath, { replace: true });
    }
  }, [supabaseConfigured, searchParams, isUnlocked, autostartUnlock, navigate, fromPath]);

  // Redirect if already unlocked
  useEffect(() => {
    if (isUnlocked && (!supabaseConfigured || (authAuthenticated && isOwner))) {
      navigate(fromPath, { replace: true });
    }
  }, [isUnlocked, supabaseConfigured, authAuthenticated, isOwner, navigate, fromPath]);

  // Update lock countdown
  useEffect(() => {
    if (!ownerProfile.pin_locked_until) {
      setLockRemainingSec(0);
      return;
    }
    const tick = () => {
      const diff = Math.max(
        0,
        Math.ceil((new Date(ownerProfile.pin_locked_until!).getTime() - Date.now()) / 1000)
      );
      setLockRemainingSec(diff);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [ownerProfile.pin_locked_until]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 450);
  };

  const handlePinSubmit = async () => {
    setErrorMsg(null);
    const check = pinSchema.safeParse(pinValue);
    if (!check.success) {
      setErrorMsg(check.error.issues[0]?.message || 'Enter 6 digits.');
      triggerShake();
      return;
    }
    setBusy(true);
    try {
      const res = await verifyPin(pinValue);
      if (res.ok) {
        showToast('Welcome back, Boss.', 'success');
        navigate(fromPath, { replace: true });
      } else {
        setPinValue('');
        triggerShake();
        if (res.locked_until) {
          setErrorMsg('Too many attempts. Locked for 15 minutes — use Master Password.');
        } else {
          setErrorMsg(`Galat PIN (${res.attempts_left} attempts baqi)`);
        }
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Connection masla. Dobara koshish karein.');
    } finally {
      setBusy(false);
    }
  };

  const handleSetupPinSubmit = async () => {
    setErrorMsg(null);
    if (setupStep === 'enter') {
      const parsed = pinSchema.safeParse(pinValue);
      if (!parsed.success) {
        setErrorMsg(parsed.error.issues[0]?.message || 'Enter a 6-digit PIN.');
        triggerShake();
        return;
      }
      setSetupStep('confirm');
      return;
    }
    if (confirmPinValue !== pinValue) {
      setErrorMsg('PINs do not match. Try again.');
      setConfirmPinValue('');
      triggerShake();
      return;
    }
    setBusy(true);
    try {
      const res = await setPin(pinValue);
      if (res.ok) {
        showToast('6-digit Owner PIN saved.', 'success');
        navigate(fromPath, { replace: true });
      } else {
        setErrorMsg(res.error || 'Could not save PIN.');
      }
    } finally {
      setBusy(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const parsed = masterLoginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setErrorMsg(parsed.error.issues[0]?.message || 'Check email and password.');
      return;
    }
    setBusy(true);
    try {
      const res = await signInWithMasterPassword(email, password);
      if (!res.ok) {
        setErrorMsg(res.error || 'Authentication failed.');
        return;
      }
      showToast('Owner verified.', 'success');
      if (!hasPinSet) {
        setMode('setup_pin');
      } else {
        setMode('pin');
      }
    } finally {
      setBusy(false);
    }
  };

  const attemptsRemaining = Math.max(0, 5 - ownerProfile.pin_failed_attempts);

  return (
      <div className="space-y-4">
        <SupabaseConfigNotice compact />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Column: Art & Companion Presence */}
          <div className="lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left space-y-5">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-container-high/80 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                Single-Owner Sovereign Gate
              </span>
            </div>

            <div className="relative my-2 flex items-center justify-center">
              <div className="absolute w-40 h-40 rounded-full bg-primary-container/25 blur-3xl animate-pulse" />
              <ZaraOrbLogo size="lg" />
            </div>

            <div className="space-y-2 max-w-sm">
              <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
                Only you can command Zara.
              </h1>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                A private companion calibrated solely to your voice, habits, and presence.
              </p>
            </div>

            <div
              className="w-full max-w-sm p-4 rounded-2xl bg-surface-container-low/75 backdrop-blur-md border-l-4 border-primary text-right"
              dir="rtl"
              lang="ur"
            >
              <p className="font-urdu-headline text-xl text-primary-fixed leading-loose">
                خوش آمدید! میں آپ کی آواز سننے کی منتظر ہوں۔
              </p>
            </div>
          </div>

          {/* Right Column: Verification Card */}
          <div className="lg:col-span-7">
            <GlassCard elevated className="p-6 sm:p-8 space-y-5 relative overflow-hidden">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-primary text-[22px]">
                      verified_user
                    </span>
                    <h2 className="font-headline-md text-headline-md text-on-surface">
                      {mode === 'setup_pin'
                        ? setupStep === 'enter'
                          ? 'Set Your 6-Digit Owner PIN'
                          : 'Confirm Your 6-Digit PIN'
                        : mode === 'password'
                        ? 'Owner Master Password'
                        : 'Welcome Back, Boss'}
                    </h2>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {mode === 'setup_pin'
                      ? 'First-run setup: create a 6-digit PIN to guard laptop control & memory vault.'
                      : mode === 'password'
                      ? 'Sign in with your Supabase Owner account credentials.'
                      : 'Enter your 6-digit owner PIN to unlock laptop control and memory vault.'}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-secondary text-[20px]">lock</span>
                </div>
              </div>

              {mode === 'password' ? (
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="owner-email"
                      className="block text-label-sm text-on-surface-variant mb-1.5"
                    >
                      Owner Email
                    </label>
                    <input
                      id="owner-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="owner@domain.com"
                      className="zara-input w-full px-4 py-3 text-body-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="owner-password"
                      className="block text-label-sm text-on-surface-variant mb-1.5"
                    >
                      Master Password
                    </label>
                    <input
                      id="owner-password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter master password"
                      className="zara-input w-full px-4 py-3 text-body-sm"
                    />
                  </div>
                  {errorMsg && (
                    <p role="alert" className="text-xs text-error font-medium">
                      {errorMsg}
                    </p>
                  )}
                  <PillButton type="submit" disabled={busy} className="w-full py-3">
                    {busy ? 'Authenticating...' : 'Sign In as Owner'}
                  </PillButton>
                </form>
              ) : mode === 'setup_pin' ? (
                <div className="space-y-4">
                  <PinPad
                    value={setupStep === 'enter' ? pinValue : confirmPinValue}
                    onChange={(val) => {
                      setErrorMsg(null);
                      if (setupStep === 'enter') setPinValue(val);
                      else setConfirmPinValue(val);
                    }}
                    onSubmit={handleSetupPinSubmit}
                    disabled={busy}
                    submitLabel={setupStep === 'enter' ? 'Continue' : 'Save PIN & Enter'}
                    errorShake={shake}
                  />
                  {setupStep === 'confirm' && (
                    <button
                      type="button"
                      onClick={() => {
                        setSetupStep('enter');
                        setConfirmPinValue('');
                      }}
                      className="text-xs text-secondary hover:text-primary block mx-auto"
                    >
                      Re-enter first PIN
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {lockRemainingSec > 0 ? (
                    <div
                      role="alert"
                      className="rounded-2xl bg-error-container/50 border border-error/40 p-4 text-center space-y-2"
                    >
                      <p className="font-semibold text-error">
                        Locked for {Math.floor(lockRemainingSec / 60)}m{' '}
                        {lockRemainingSec % 60}s
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        Use Master Password below to recover session access.
                      </p>
                    </div>
                  ) : (
                    <PinPad
                      value={pinValue}
                      onChange={(val) => {
                        setErrorMsg(null);
                        setPinValue(val);
                      }}
                      onSubmit={handlePinSubmit}
                      disabled={busy}
                      submitLabel={busy ? 'Verifying...' : 'Unlock Zara'}
                      errorShake={shake}
                    />
                  )}
                </div>
              )}

              {errorMsg && mode !== 'password' && (
                <p role="alert" className="text-xs text-error text-center font-medium">
                  {errorMsg}
                </p>
              )}

              {/* Disabled Biometrics Button (Coming Later per Brief §10) */}
              <div className="pt-1">
                <button
                  type="button"
                  disabled
                  title="Coming later — Touch ID / Windows Hello requires Zara Local Agent"
                  className="w-full py-2.5 px-4 rounded-full bg-surface-container-high/50 text-on-surface-variant/60 font-label-sm flex items-center justify-center gap-2 cursor-not-allowed border border-border-subtle/40"
                >
                  <span className="material-symbols-outlined text-[18px]">fingerprint</span>
                  <span>Use Fingerprint / Windows Hello</span>
                  <ComingLaterBadge />
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border-subtle/40 text-xs">
                <span className="text-on-surface-variant">
                  {lockRemainingSec > 0
                    ? 'PIN temporarily locked'
                    : `${attemptsRemaining} attempts remaining`}
                </span>
                <div className="flex items-center gap-4">
                  {mode !== 'password' ? (
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMsg(null);
                        setMode('password');
                      }}
                      className="text-secondary hover:text-primary font-medium cursor-pointer"
                    >
                      Switch to Master Password
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMsg(null);
                        setMode(hasPinSet ? 'pin' : 'setup_pin');
                      }}
                      className="text-secondary hover:text-primary font-medium cursor-pointer"
                    >
                      Use 6-Digit PIN
                    </button>
                  )}
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
  );
}
