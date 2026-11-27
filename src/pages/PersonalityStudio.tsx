import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useZara } from '../context/ZaraContext';
import { GlassCard, PillButton } from '../components/ui/Primitives';
import { apiService } from '../services/api.service';
import { buildZaraSystemInstruction } from '../lib/prompt';
import { personaInstructionsSchema } from '../lib/validation';
import { containsUrduScript } from '../lib/rtl';
import { useToast } from '../context/ToastContext';
import type { FlirtLevel, FormalityMode, LanguageStyle, RegionalDialect } from '../types/db';

const NICKNAME_OPTIONS = ['Boss', 'Jaan', 'Sartaj', 'Sir'];

export default function PersonalityStudio() {
  const { persona, updatePersona, resetPersonaDefaults, openConfirmModal } = useZara();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [draft, setDraft] = useState(persona);
  const [newTag, setNewTag] = useState('');
  const [sandboxPrompt, setSandboxPrompt] = useState('');
  const [sandboxReply, setSandboxReply] = useState<string | null>(null);
  const [sandboxBusy, setSandboxBusy] = useState(false);
  const [instrError, setInstrError] = useState<string | null>(null);

  const hasUnsaved = JSON.stringify(draft) !== JSON.stringify(persona);

  const handleSave = async () => {
    const valid = personaInstructionsSchema.safeParse(draft.custom_instructions);
    if (!valid.success) {
      setInstrError(valid.error.issues[0]?.message || 'Too long');
      return;
    }
    setInstrError(null);
    await updatePersona(draft);
    showToast('Persona profile saved.', 'success');
  };

  const handleReset = () => {
    openConfirmModal({
      title: 'Reset Persona to Default?',
      description: 'This restores Zara default personality traits and directives.',
      method: 'manual',
      riskLevel: 'low',
      onConfirm: async () => {
        await resetPersonaDefaults();
        setDraft((prev) => ({
          ...prev,
          assistant_name: 'Zara',
          owner_nickname: 'Boss',
          playfulness: 70,
          romance: 60,
          teasing: 60,
          caring: 80,
          seriousness: 30,
          humor: 70,
          shyness: 30,
          flirt_level: 'playful',
          custom_instructions: '',
        }));
      },
    });
  };

  const handleSandboxTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sandboxPrompt.trim()) return;
    setSandboxBusy(true);
    try {
      const instruction = buildZaraSystemInstruction({ persona: draft });
      const res = await apiService.sendLiveChat({
        message: sandboxPrompt,
        systemInstruction: instruction,
        sandboxPersona: true,
      });
      if (res.ok) {
        setSandboxReply(res.replyText);
      } else {
        setSandboxReply(res.error || 'Could not generate preview.');
      }
    } catch (err) {
      setSandboxReply(err instanceof Error ? err.message : 'Preview request failed.');
    } finally {
      setSandboxBusy(false);
    }
  };

  const traitSliders: Array<{ key: keyof typeof draft; label: string; urdu?: string }> = [
    { key: 'playfulness', label: 'Playfulness & Naughty Banter' },
    { key: 'romance', label: 'Romance & Sweetness (Non-Explicit)' },
    { key: 'teasing', label: 'Teasing & Sarcasm' },
    { key: 'caring', label: 'Caring & Emotional Support' },
    { key: 'humor', label: 'Wit & Humor' },
    { key: 'seriousness', label: 'Seriousness & Focus' },
    { key: 'shyness', label: 'Shyness & Modesty', urdu: 'حیا اور شرم' },
  ];

  return (
      <div className="space-y-6 pb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold">
              Personality Studio
            </h1>
            <p className="text-body-sm text-on-surface-variant">
              Tune Zara’s traits, nickname preference, dialect, and dignified romantic warmth.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {hasUnsaved && (
              <span className="text-xs text-tertiary font-semibold px-3 py-1 rounded-full bg-tertiary/10">
                Unsaved changes
              </span>
            )}
            <PillButton variant="secondary" onClick={handleReset}>
              Reset to Default
            </PillButton>
            <PillButton onClick={handleSave}>Save Persona Profile</PillButton>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 7 Cols: Identity, Sliders, Flirt, Style */}
          <div className="lg:col-span-7 space-y-6">
            <GlassCard className="p-6 space-y-4">
              <h2 className="font-headline-sm text-on-surface">Companion Identity & Nickname</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="assistant-name" className="block text-xs text-on-surface-variant mb-1">
                    Assistant Name
                  </label>
                  <input
                    id="assistant-name"
                    type="text"
                    value={draft.assistant_name}
                    onChange={(e) => setDraft({ ...draft, assistant_name: e.target.value })}
                    className="zara-input w-full px-3.5 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="owner-nick" className="block text-xs text-on-surface-variant mb-1">
                    How Zara Addresses You
                  </label>
                  <input
                    id="owner-nick"
                    type="text"
                    value={draft.owner_nickname}
                    onChange={(e) => setDraft({ ...draft, owner_nickname: e.target.value })}
                    className="zara-input w-full px-3.5 py-2.5 text-sm"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {NICKNAME_OPTIONS.map((nick) => (
                  <button
                    key={nick}
                    type="button"
                    onClick={() => setDraft({ ...draft, owner_nickname: nick })}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium cursor-pointer ${
                      draft.owner_nickname === nick
                        ? 'bg-primary-container text-on-primary-container font-semibold'
                        : 'bg-surface-container-high text-on-surface-variant'
                    }`}
                  >
                    {nick}
                  </button>
                ))}
              </div>
            </GlassCard>

            <GlassCard className="p-6 space-y-4">
              <h2 className="font-headline-sm text-on-surface">7 Personality Traits</h2>
              {traitSliders.map(({ key, label, urdu }) => {
                const val = Number(draft[key]);
                return (
                  <div key={String(key)} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-on-surface font-medium">
                        {label}{' '}
                        {urdu && (
                          <span className="urdu-rtl text-on-surface-variant ml-1" dir="rtl" lang="ur">
                            ({urdu})
                          </span>
                        )}
                      </span>
                      <span className="text-primary font-bold">{val}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      aria-label={label}
                      value={val}
                      onChange={(e) =>
                        setDraft({ ...draft, [key]: Number(e.target.value) })
                      }
                      className="zara-slider"
                    />
                  </div>
                );
              })}
            </GlassCard>

            <GlassCard className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-headline-sm text-on-surface">Flirt Balance Matrix</h2>
                <span className="text-xs text-tertiary flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px]">lock</span>
                  Hard Guardrail Active
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(
                  [
                    ['off', 'Off', 'Pure Assistant'],
                    ['light', 'Light', 'Gentle warmth'],
                    ['playful', 'Playful', 'Recommended'],
                    ['romantic', 'Romantic', 'Sweet & devoted'],
                  ] as Array<[FlirtLevel, string, string]>
                ).map(([lvl, title, sub]) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setDraft({ ...draft, flirt_level: lvl })}
                    className={`p-3 rounded-xl text-center space-y-0.5 cursor-pointer border ${
                      draft.flirt_level === lvl
                        ? 'bg-primary-container/25 border-primary text-primary'
                        : 'bg-surface-container-high/60 border-transparent text-on-surface-variant'
                    }`}
                  >
                    <p className="text-xs font-bold">{title}</p>
                    <p className="text-[11px] opacity-80">{sub}</p>
                  </button>
                ))}
              </div>
              <p className="text-xs text-primary-fixed-dim flex items-center gap-1.5 bg-primary/5 p-3 rounded-xl">
                <span className="material-symbols-outlined text-[15px]">verified_user</span>
                Romantic aur sweet, kabhi explicit nahi — server system prompt strictly enforces dignified non-explicit warmth.
              </p>
            </GlassCard>

            <GlassCard className="p-6 space-y-4">
              <h2 className="font-headline-sm text-on-surface">Language, Dialect & Instructions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="lang-style" className="block text-xs text-on-surface-variant mb-1">
                    Language Style
                  </label>
                  <select
                    id="lang-style"
                    value={draft.language_style}
                    onChange={(e) =>
                      setDraft({ ...draft, language_style: e.target.value as LanguageStyle })
                    }
                    className="zara-input w-full px-3 py-2 text-xs"
                  >
                    <option value="roman_urdu_mix">Roman Urdu + English Mix</option>
                    <option value="urdu_script">Urdu Script (Nastaliq)</option>
                    <option value="english">English</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="reg-dialect" className="block text-xs text-on-surface-variant mb-1">
                    Regional Dialect
                  </label>
                  <select
                    id="reg-dialect"
                    value={draft.regional_dialect}
                    onChange={(e) =>
                      setDraft({ ...draft, regional_dialect: e.target.value as RegionalDialect })
                    }
                    className="zara-input w-full px-3 py-2 text-xs"
                  >
                    <option value="standard">Standard Cultured</option>
                    <option value="urban_hybrid">Urban Hybrid</option>
                    <option value="lahori">Lahori Cadence</option>
                    <option value="karachi">Karachite Tone</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="formality-mode" className="block text-xs text-on-surface-variant mb-1">
                    Formality
                  </label>
                  <select
                    id="formality-mode"
                    value={draft.formality}
                    onChange={(e) =>
                      setDraft({ ...draft, formality: e.target.value as FormalityMode })
                    }
                    className="zara-input w-full px-3 py-2 text-xs"
                  >
                    <option value="casual">Casual & Warm</option>
                    <option value="mixed">Mixed</option>
                    <option value="formal_polite">Formal Polite</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="custom-instr" className="block text-xs text-on-surface-variant mb-1">
                  Custom Instructions ({draft.custom_instructions.length}/4000)
                </label>
                <textarea
                  id="custom-instr"
                  rows={3}
                  value={draft.custom_instructions}
                  onChange={(e) => setDraft({ ...draft, custom_instructions: e.target.value })}
                  placeholder="Describe conversational preferences, reminders style, or boundaries..."
                  className="zara-input w-full p-3 text-sm"
                />
                {instrError && <p className="text-xs text-error mt-1">{instrError}</p>}
              </div>

              <div className="space-y-2">
                <span className="text-xs text-on-surface-variant">Contextual Directive Tags</span>
                <div className="flex flex-wrap gap-2">
                  {draft.directive_tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high text-xs text-on-surface"
                    >
                      {tag}
                      <button
                        type="button"
                        aria-label={`Remove ${tag}`}
                        onClick={() =>
                          setDraft({
                            ...draft,
                            directive_tags: draft.directive_tags.filter((t) => t !== tag),
                          })
                        }
                        className="text-outline hover:text-error cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add directive tag..."
                    className="zara-input flex-1 px-3 py-2 text-xs"
                  />
                  <PillButton
                    variant="secondary"
                    onClick={() => {
                      if (!newTag.trim()) return;
                      setDraft({
                        ...draft,
                        directive_tags: [...draft.directive_tags, newTag.trim()],
                      });
                      setNewTag('');
                    }}
                  >
                    Add Tag
                  </PillButton>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Right 5 Cols: Persona Sandbox */}
          <div className="lg:col-span-5 space-y-6">
            <GlassCard elevated className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-headline-sm text-on-surface">Persona Sandbox</h2>
                <button
                  type="button"
                  onClick={() => navigate('/talk')}
                  className="text-xs text-primary hover:underline cursor-pointer"
                >
                  Open Live Voice
                </button>
              </div>
              <p className="text-xs text-on-surface-variant">
                Test how Zara replies with your unsaved trait sliders before saving.
              </p>

              <form onSubmit={handleSandboxTest} className="space-y-3">
                <label htmlFor="sandbox-input" className="sr-only">
                  Sandbox test prompt
                </label>
                <input
                  id="sandbox-input"
                  type="text"
                  value={sandboxPrompt}
                  onChange={(e) => setSandboxPrompt(e.target.value)}
                  placeholder="Say something (e.g., 'Zara aaj bohat thak gaya hoon')..."
                  className="zara-input w-full px-3.5 py-2.5 text-sm"
                />
                <PillButton type="submit" disabled={sandboxBusy || !sandboxPrompt.trim()} className="w-full">
                  {sandboxBusy ? 'Generating preview...' : 'Generate Sample Reply'}
                </PillButton>
              </form>

              {sandboxReply && (
                <div className="p-4 rounded-2xl bg-surface-container/80 border border-primary/25">
                  <p className="text-[11px] text-primary font-semibold mb-1">
                    {draft.assistant_name} Preview
                  </p>
                  <p
                    className={
                      containsUrduScript(sandboxReply)
                        ? 'urdu-rtl text-urdu-body text-primary-fixed text-right'
                        : 'text-body-sm text-on-surface'
                    }
                    dir={containsUrduScript(sandboxReply) ? 'rtl' : 'ltr'}
                  >
                    {sandboxReply}
                  </p>
                </div>
              )}
            </GlassCard>
          </div>
        </div>
      </div>
  );
}
