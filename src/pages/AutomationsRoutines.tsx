import React, { useMemo, useState } from 'react';
import {
  EmptyState,
  GlassCard,
  ModalShell,
  PillButton,
  RiskBadge,
  ToggleSwitch,
} from '../components/ui/Primitives';
import { useToast } from '../context/ToastContext';
import { useZara } from '../context/ZaraContext';
import { formatTimeAgo } from '../lib/format';
import { COMMAND_CATALOG } from '../lib/safety';
import { automationSchema } from '../lib/validation';
import type { AutomationKind, AutomationStep, CommandType } from '../types/db';

const TAB_OPTIONS: Array<{ kind: AutomationKind; label: string; icon: string }> = [
  { kind: 'voice_command', label: 'Custom Voice Commands', icon: 'record_voice_over' },
  { kind: 'routine', label: 'Daily Routines & Modes', icon: 'schedule' },
  { kind: 'hardware_trigger', label: 'Hardware Event Triggers', icon: 'bolt' },
];

export default function AutomationsRoutines() {
  const {
    automations,
    automationRuns,
    createAutomation,
    updateAutomation,
    deleteAutomation,
    runAutomation,
    openConfirmModal,
  } = useZara();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<AutomationKind>('voice_command');
  const [builderOpen, setBuilderOpen] = useState(false);
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);

  // Builder form state
  const [kind, setKind] = useState<AutomationKind>('voice_command');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerPhrase, setTriggerPhrase] = useState('');
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [triggerEvent, setTriggerEvent] = useState('battery_below_20');
  const [requiresConfirm, setRequiresConfirm] = useState(false);
  const [steps, setSteps] = useState<AutomationStep[]>([
    { order: 1, command_type: 'open_app', params: { name: 'VS Code' } },
  ]);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const filteredAutomations = useMemo(
    () => automations.filter((a) => a.kind === activeTab),
    [activeTab, automations]
  );

  const openBuilder = () => {
    setKind(activeTab);
    setName('');
    setDescription('');
    setTriggerPhrase('');
    setScheduleTime('09:00');
    setTriggerEvent('battery_below_20');
    setRequiresConfirm(false);
    setSteps([{ order: 1, command_type: 'open_app', params: { name: '' } }]);
    setFormError(null);
    setBuilderOpen(true);
  };

  const addStep = () => {
    setSteps((prev) => [
      ...prev,
      { order: prev.length + 1, command_type: 'focus_mode_toggle', params: { enabled: true } },
    ]);
  };

  const removeStep = (idx: number) => {
    setSteps((prev) =>
      prev
        .filter((_, i) => i !== idx)
        .map((step, i) => ({ ...step, order: i + 1 }))
    );
  };

  const updateStepCommand = (idx: number, commandType: CommandType) => {
    const defaults: Partial<Record<CommandType, Record<string, unknown>>> = {
      open_app: { name: 'VS Code' },
      close_app: { name: 'Slack' },
      set_volume: { percent: 45 },
      set_brightness: { percent: 60 },
      focus_mode_toggle: { enabled: true },
      night_shift_toggle: { enabled: true },
      open_url: { url: 'https://localhost:3000' },
      media_control: { action: 'play_pause' },
      run_terminal: { command: 'git status' },
      search_files: { query: '' },
    };
    setSteps((prev) =>
      prev.map((s, i) =>
        i === idx
          ? { ...s, command_type: commandType, params: defaults[commandType] ?? {} }
          : s
      )
    );
  };

  const updateStepParam = (idx: number, key: string, raw: string) => {
    setSteps((prev) =>
      prev.map((s, i) => {
        if (i !== idx) return s;
        let parsed: unknown = raw;
        if (key === 'percent') parsed = Number(raw) || 0;
        if (key === 'enabled' || key === 'muted') parsed = raw === 'true';
        return { ...s, params: { ...s.params, [key]: parsed } };
      })
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const payload = {
      kind,
      name,
      description,
      trigger_phrase: kind === 'voice_command' ? triggerPhrase : null,
      schedule_time: kind === 'routine' ? scheduleTime : null,
      trigger_event: kind === 'hardware_trigger' ? triggerEvent : null,
      steps,
    };
    const result = automationSchema.safeParse(payload);
    if (!result.success) {
      setFormError(result.error.issues[0]?.message || 'Please check automation fields.');
      return;
    }
    setSaving(true);
    try {
      await createAutomation({
        kind,
        name: result.data.name,
        description: result.data.description,
        trigger_phrase: result.data.trigger_phrase ?? null,
        schedule_time: result.data.schedule_time ?? null,
        schedule_days: [1, 2, 3, 4, 5],
        trigger_event: result.data.trigger_event ?? null,
        steps: result.data.steps.map((st) => ({
          order: st.order,
          command_type: st.command_type as CommandType,
          params: st.params,
        })),
        requires_confirmation: requiresConfirm,
        is_enabled: true,
      });
      setBuilderOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const latestRunFor = (automationId: string) =>
    automationRuns.find((r) => r.automation_id === automationId);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-primary font-semibold">
            Workflow Orchestrator
          </p>
          <h1 className="font-headline-lg text-headline-lg text-on-surface flex flex-wrap items-baseline gap-3">
            <span>Automations &amp; Routines</span>
            <span className="urdu-rtl text-xl text-primary-fixed-dim" dir="rtl" lang="ur">
              خودکار معمولات اور کمانڈز
            </span>
          </h1>
          <p className="text-body-sm text-on-surface-variant mt-1">
            Chain approved laptop actions into voice triggers, scheduled routines, and hardware hooks.
          </p>
        </div>

        <PillButton onClick={openBuilder}>
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          New Automation
        </PillButton>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-on-surface-variant">Total Automations</p>
            <p className="text-2xl font-bold text-on-surface mt-0.5">{automations.length}</p>
          </div>
          <span className="material-symbols-outlined text-primary text-[28px]">account_tree</span>
        </GlassCard>
        <GlassCard className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-on-surface-variant">Active Enabled</p>
            <p className="text-2xl font-bold text-on-surface mt-0.5">
              {automations.filter((a) => a.is_enabled).length}
            </p>
          </div>
          <span className="material-symbols-outlined text-emerald-400 text-[28px]">play_circle</span>
        </GlassCard>
        <GlassCard className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-on-surface-variant">Recorded Runs</p>
            <p className="text-2xl font-bold text-on-surface mt-0.5">{automationRuns.length}</p>
          </div>
          <span className="material-symbols-outlined text-secondary text-[28px]">history</span>
        </GlassCard>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {TAB_OPTIONS.map((tab) => {
          const active = activeTab === tab.kind;
          const count = automations.filter((a) => a.kind === tab.kind).length;
          return (
            <button
              key={tab.kind}
              type="button"
              onClick={() => setActiveTab(tab.kind)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all cursor-pointer ${
                active
                  ? 'bg-primary/20 text-primary border border-primary/50 shadow-[0_0_16px_rgba(244,84,163,0.22)]'
                  : 'bg-surface-container-high/60 text-on-surface-variant hover:text-on-surface border border-border-subtle'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
              <span>{tab.label}</span>
              <span className="px-2 py-0.5 text-xs rounded-full bg-surface-container-lowest/70">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Automation Cards */}
      {filteredAutomations.length === 0 ? (
        <EmptyState
          icon="bolt"
          title="No automations in this category yet"
          subtitle="Create a custom Urdu/English voice trigger, daily work routine, or hardware event hook using safe catalog actions."
          actionLabel="Create Automation"
          onAction={openBuilder}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredAutomations.map((auto) => {
            const lastRun = latestRunFor(auto.id);
            const showReport = expandedRunId === auto.id && lastRun;
            return (
              <GlassCard key={auto.id} className="p-5 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-headline-sm text-headline-sm text-on-surface truncate">
                        {auto.name}
                      </h3>
                      {auto.requires_confirmation && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] bg-amber-500/15 text-tertiary border border-tertiary/30">
                          Confirm Before Run
                        </span>
                      )}
                    </div>
                    {auto.description && (
                      <p className="text-body-sm text-on-surface-variant mt-1">
                        {auto.description}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      {auto.trigger_phrase && (
                        <span className="px-2.5 py-1 rounded-full bg-primary/15 text-primary border border-primary/25">
                          Say: &ldquo;{auto.trigger_phrase}&rdquo;
                        </span>
                      )}
                      {auto.schedule_time && (
                        <span className="px-2.5 py-1 rounded-full bg-secondary/15 text-secondary border border-secondary/25">
                          Daily at {auto.schedule_time}
                        </span>
                      )}
                      {auto.trigger_event && (
                        <span className="px-2.5 py-1 rounded-full bg-tertiary/15 text-tertiary border border-tertiary/25">
                          Trigger: {auto.trigger_event}
                        </span>
                      )}
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={auto.is_enabled}
                    onChange={(next) => void updateAutomation(auto.id, { is_enabled: next })}
                    label={`Toggle ${auto.name}`}
                  />
                </div>

                {/* Steps sequence */}
                <div className="space-y-1.5 bg-surface-container-lowest/50 rounded-2xl p-3 border border-border-subtle/50">
                  <p className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
                    Action Sequence ({auto.steps.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {auto.steps.map((step) => {
                      const meta = COMMAND_CATALOG.find((c) => c.command_type === step.command_type);
                      return (
                        <div
                          key={`${auto.id}-step-${step.order}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-high text-xs text-on-surface border border-border-subtle"
                        >
                          <span className="text-primary font-mono">{step.order}.</span>
                          <span>{meta?.display_action ?? step.command_type}</span>
                          {Object.keys(step.params ?? {}).length > 0 && (
                            <span className="text-on-surface-variant font-mono">
                              ({Object.values(step.params).join(', ')})
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border-subtle/60">
                  <span className="text-xs text-on-surface-variant">
                    Runs: {auto.run_count} · Last: {formatTimeAgo(auto.last_run_at)}
                  </span>
                  <div className="flex items-center gap-2">
                    <PillButton
                      variant="secondary"
                      className="!px-3.5 !py-1.5 !min-h-[34px] text-xs"
                      onClick={async () => {
                        await runAutomation(auto.id, true);
                        setExpandedRunId(auto.id);
                      }}
                    >
                      <span className="material-symbols-outlined text-[15px]">science</span>
                      Dry Test
                    </PillButton>
                    <PillButton
                      variant="primary"
                      className="!px-3.5 !py-1.5 !min-h-[34px] text-xs"
                      disabled={!auto.is_enabled}
                      onClick={() => void runAutomation(auto.id, false)}
                    >
                      <span className="material-symbols-outlined text-[15px]">play_arrow</span>
                      Run Now
                    </PillButton>
                    <button
                      type="button"
                      aria-label={`Delete ${auto.name}`}
                      onClick={() =>
                        openConfirmModal({
                          title: 'Delete Automation',
                          description: `Remove "${auto.name}" permanently?`,
                          method: 'manual',
                          riskLevel: 'low',
                          onConfirm: async () => {
                            await deleteAutomation(auto.id);
                            showToast('Automation deleted.', 'info');
                          },
                        })
                      }
                      className="p-2 rounded-full text-on-surface-variant hover:text-error hover:bg-error-container/20 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>

                {showReport && (
                  <div className="rounded-xl bg-surface-container-lowest/80 border border-secondary/30 p-3 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-secondary">
                        Last {lastRun.mode === 'dry_run' ? 'Dry-Run Preflight' : 'Live Execution'} Report
                      </span>
                      <span className="uppercase text-[10px] px-2 py-0.5 rounded-full bg-surface-container-high">
                        {lastRun.status}
                      </span>
                    </div>
                    <pre className="text-[11px] text-on-surface-variant overflow-x-auto whitespace-pre-wrap font-mono">
                      {JSON.stringify(lastRun.details, null, 2)}
                    </pre>
                  </div>
                )}
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Visual Automation Builder Modal */}
      <ModalShell
        isOpen={builderOpen}
        onClose={() => setBuilderOpen(false)}
        title="Automation Visual Builder"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && (
            <div className="rounded-xl bg-error-container/40 border border-error/40 px-3.5 py-2 text-xs text-error">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-on-surface-variant mb-1">Type</label>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as AutomationKind)}
                className="zara-input w-full px-3.5 py-2.5 text-sm"
              >
                <option value="voice_command">Custom Voice Command</option>
                <option value="routine">Daily Routine / Mode</option>
                <option value="hardware_trigger">Hardware Event Trigger</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-on-surface-variant mb-1">Routine Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Coding Mode"
                className="zara-input w-full px-3.5 py-2.5 text-sm"
              />
            </div>
          </div>

          {kind === 'voice_command' && (
            <div>
              <label className="block text-xs text-on-surface-variant mb-1">
                Voice Trigger Phrase (Urdu / Roman Urdu / English)
              </label>
              <input
                type="text"
                value={triggerPhrase}
                onChange={(e) => setTriggerPhrase(e.target.value)}
                placeholder='e.g. "Zara coding mode on karo"'
                className="zara-input w-full px-3.5 py-2.5 text-sm"
              />
            </div>
          )}

          {kind === 'routine' && (
            <div>
              <label className="block text-xs text-on-surface-variant mb-1">Schedule Time</label>
              <input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="zara-input w-full px-3.5 py-2.5 text-sm"
              />
            </div>
          )}

          {kind === 'hardware_trigger' && (
            <div>
              <label className="block text-xs text-on-surface-variant mb-1">Hardware Event</label>
              <select
                value={triggerEvent}
                onChange={(e) => setTriggerEvent(e.target.value)}
                className="zara-input w-full px-3.5 py-2.5 text-sm"
              >
                <option value="battery_below_20">Battery drops below 20%</option>
                <option value="charger_connected">Charger connected</option>
                <option value="idle_15_min">Laptop idle for 15 minutes</option>
                <option value="headphones_connected">Headphones connected</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs text-on-surface-variant mb-1">Description (Optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opens IDE, enables focus mode, dims display slightly"
              className="zara-input w-full px-3.5 py-2.5 text-sm"
            />
          </div>

          {/* Steps Builder */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-on-surface uppercase tracking-wider">
                Catalog Action Steps
              </label>
              <button
                type="button"
                onClick={addStep}
                className="text-xs text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">add</span>
                Add Step
              </button>
            </div>

            {steps.map((step, idx) => {
              const catalogItem = COMMAND_CATALOG.find((c) => c.command_type === step.command_type);
              const paramKeys = Object.keys(catalogItem?.param_schema ?? {});
              return (
                <div
                  key={idx}
                  className="rounded-xl bg-surface-container-low border border-border-subtle p-3 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-primary w-6">#{idx + 1}</span>
                    <select
                      value={step.command_type}
                      onChange={(e) => updateStepCommand(idx, e.target.value as CommandType)}
                      className="zara-input flex-1 px-3 py-2 text-xs"
                    >
                      {COMMAND_CATALOG.map((cmd) => (
                        <option key={cmd.command_type} value={cmd.command_type}>
                          {cmd.display_action} — {cmd.description}
                        </option>
                      ))}
                    </select>
                    {catalogItem && <RiskBadge risk={catalogItem.default_risk} />}
                    {steps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStep(idx)}
                        className="p-1.5 text-on-surface-variant hover:text-error cursor-pointer"
                        aria-label="Remove step"
                      >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    )}
                  </div>

                  {paramKeys.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-7">
                      {paramKeys.map((pk) => (
                        <input
                          key={pk}
                          type="text"
                          value={String(step.params?.[pk] ?? '')}
                          onChange={(e) => updateStepParam(idx, pk, e.target.value)}
                          placeholder={`${pk} (${String(catalogItem?.param_schema[pk])})`}
                          className="zara-input px-3 py-1.5 text-xs"
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="inline-flex items-center gap-2 text-xs text-on-surface-variant cursor-pointer">
              <input
                type="checkbox"
                checked={requiresConfirm}
                onChange={(e) => setRequiresConfirm(e.target.checked)}
                className="accent-primary"
              />
              Ask owner confirmation before running routine
            </label>
            <div className="flex items-center gap-2">
              <PillButton variant="ghost" onClick={() => setBuilderOpen(false)}>
                Cancel
              </PillButton>
              <PillButton type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Automation'}
              </PillButton>
            </div>
          </div>
        </form>
      </ModalShell>
    </div>
  );
}
