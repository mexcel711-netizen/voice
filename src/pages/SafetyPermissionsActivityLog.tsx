import React, { useMemo, useState } from 'react';
import { PinPad } from '../components/safety/ConfirmModal';
import {
  ComingLaterBadge,
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
import { activityLedgerToCsv } from '../lib/safety';
import type { ActivityStatus, PermissionMode, SafetyLevel } from '../types/db';

const STATUS_TABS: Array<{ id: 'all' | ActivityStatus; label: string }> = [
  { id: 'all', label: 'All Events' },
  { id: 'executed', label: 'Executed' },
  { id: 'blocked', label: 'Blocked / Rejected' },
  { id: 'awaiting_confirmation', label: 'Awaiting Confirmation' },
];

const PERMISSION_DESC: Record<string, string> = {
  files_read_write: '~/Projects, ~/Documents, ~/Downloads, ~/Desktop',
  terminal_shell: 'Workspace shell commands & git hooks',
  screen_observation: 'Context screenshot upon ask',
  browser_automation: 'Open URL & desktop media control',
  power_control: 'Sleep, restart, shutdown',
  apps_control: 'Launch or close installed applications',
  system_settings: 'Volume, brightness, night shift, focus mode',
  messaging: 'WhatsApp, Slack & email dispatch',
};

export default function SafetyPermissionsActivityLog() {
  const {
    settings,
    permissionRules,
    askBeforeRules,
    activityLog,
    commands,
    updateSettings,
    panicStop,
    panicResume,
    updatePermissionRule,
    updateAskBeforeRule,
    confirmCommand,
    cancelCommand,
    openConfirmModal,
  } = useZara();
  const { showToast } = useToast();

  const [statusFilter, setStatusFilter] = useState<'all' | ActivityStatus>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7d'>('all');
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Panic resume PIN modal
  const [resumeOpen, setResumeOpen] = useState(false);
  const [resumePin, setResumePin] = useState('');
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [resuming, setResuming] = useState(false);

  const filteredLog = useMemo(() => {
    const nowMs = Date.now();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    return activityLog.filter((entry) => {
      if (statusFilter !== 'all' && entry.status !== statusFilter) return false;
      if (dateFilter === 'today') {
        if (new Date(entry.created_at).getTime() < startOfToday.getTime()) return false;
      } else if (dateFilter === '7d') {
        if (nowMs - new Date(entry.created_at).getTime() > 7 * 24 * 60 * 60 * 1000) return false;
      }
      return true;
    });
  }, [activityLog, dateFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredLog.length / pageSize));
  const pagedLog = filteredLog.slice((page - 1) * pageSize, page * pageSize);

  const counts = useMemo(
    (): Record<'all' | ActivityStatus, number> => ({
      all: activityLog.length,
      executed: activityLog.filter((a) => a.status === 'executed').length,
      blocked: activityLog.filter((a) => a.status === 'blocked').length,
      awaiting_confirmation: activityLog.filter((a) => a.status === 'awaiting_confirmation').length,
      failed: activityLog.filter((a) => a.status === 'failed').length,
    }),
    [activityLog]
  );

  const handleExportCsv = () => {
    const csv = activityLedgerToCsv(filteredLog);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zara-activity-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Activity ledger exported as CSV.', 'success');
  };

  const handlePanicResume = async () => {
    setResuming(true);
    setResumeError(null);
    try {
      const res = await panicResume(resumePin);
      if (!res.ok) {
        setResumeError(res.error || 'PIN verification failed.');
        return;
      }
      setResumeOpen(false);
      setResumePin('');
    } finally {
      setResuming(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header + Emergency Kill-Switch */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-primary font-semibold">
            Hardware &amp; Security Guardrails
          </p>
          <h1 className="font-headline-lg text-headline-lg text-on-surface flex flex-wrap items-baseline gap-3">
            <span>Safety, Permissions &amp; Activity Log</span>
            <span className="urdu-rtl text-xl text-primary-fixed-dim" dir="rtl" lang="ur">
              حفاظت، اجازت نامے اور لاگ بک
            </span>
          </h1>
          <p className="text-body-sm text-on-surface-variant mt-1">
            Physical mic switch, tiered command confirmation rules, and hash-chained activity ledger.
          </p>
        </div>

        {settings.panic_active ? (
          <PillButton
            variant="primary"
            className="shrink-0"
            onClick={() => {
              setResumePin('');
              setResumeError(null);
              setResumeOpen(true);
            }}
          >
            <span className="material-symbols-outlined text-[18px]">lock_open</span>
            Resume System (Owner PIN)
          </PillButton>
        ) : (
          <PillButton
            variant="danger"
            className="shrink-0 !rounded-2xl !px-5 !py-3"
            onClick={() =>
              openConfirmModal({
                title: 'Engage Emergency Panic Kill-Switch?',
                description:
                  'This immediately mutes Zara microphone, cancels queued laptop commands, and requires Owner PIN to resume.',
                method: 'manual',
                riskLevel: 'critical',
                onConfirm: async () => {
                  await panicStop();
                },
              })
            }
          >
            <span className="material-symbols-outlined text-[20px]">power_settings_new</span>
            <span className="text-left leading-tight">
              <span className="block text-xs font-bold uppercase tracking-wider">
                Emergency Panic Kill-Switch
              </span>
              <span className="block text-[11px] font-normal opacity-90">
                Cuts mic &amp; cancels queued commands
              </span>
            </span>
          </PillButton>
        )}
      </div>

      {/* Top 3 Hardware / Protocol Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="p-5 flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined">mic</span>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                settings.mic_enabled
                  ? 'bg-emerald-500/15 text-emerald-300'
                  : 'bg-error-container/50 text-error'
              }`}
            >
              {settings.mic_enabled ? 'Mic Enabled' : 'Mic Muted'}
            </span>
          </div>
          <div>
            <h2 className="font-semibold text-on-surface">Physical Microphone State</h2>
            <p className="text-xs text-on-surface-variant mt-1">
              Blocks all voice triggers and audio capture when switched off.
            </p>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-border-subtle/50">
            <span className="text-xs text-on-surface-variant">Capture Stream</span>
            <ToggleSwitch
              checked={settings.mic_enabled}
              disabled={settings.panic_active}
              onChange={(next) => void updateSettings({ mic_enabled: next })}
              label="Toggle Physical Microphone"
            />
          </div>
        </GlassCard>

        <GlassCard className="p-5 flex flex-col justify-between gap-4 opacity-80">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center">
              <span className="material-symbols-outlined">fingerprint</span>
            </div>
            <ComingLaterBadge />
          </div>
          <div>
            <h2 className="font-semibold text-on-surface">Voiceprint Biometrics</h2>
            <p className="text-xs text-on-surface-variant mt-1">
              Acoustic speaker verification will calibrate once desktop DSP support ships.
            </p>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-border-subtle/50">
            <span className="text-xs text-on-surface-variant">Voice Lock</span>
            <ToggleSwitch
              checked={false}
              disabled
              onChange={() => {}}
              label="Voiceprint Biometrics (Coming later)"
            />
          </div>
        </GlassCard>

        <GlassCard className="p-5 flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-tertiary/15 text-tertiary flex items-center justify-center">
              <span className="material-symbols-outlined">shield</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-tertiary/15 text-tertiary uppercase">
              {settings.safety_level.replace(/_/g, ' ')}
            </span>
          </div>
          <div>
            <h2 className="font-semibold text-on-surface">Execution Safety Protocol</h2>
            <p className="text-xs text-on-surface-variant mt-1">
              Controls when Zara asks manual or PIN confirmation before laptop actions.
            </p>
          </div>
          <div className="pt-2 border-t border-border-subtle/50">
            <select
              value={settings.safety_level}
              onChange={(e) =>
                void updateSettings({ safety_level: e.target.value as SafetyLevel })
              }
              aria-label="Execution safety level"
              className="zara-input w-full px-3 py-2 text-xs"
            >
              <option value="relaxed">Relaxed (Low/Medium auto-run)</option>
              <option value="prompt_on_risk">Prompt On Risk (Recommended)</option>
              <option value="restricted">Restricted (Confirm Medium+)</option>
            </select>
          </div>
        </GlassCard>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Permissions + Ask-Before + Real Summary */}
        <div className="lg:col-span-5 space-y-5">
          <GlassCard className="p-5 space-y-4">
            <div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface">
                System Permissions
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Granular access policy enforced before dispatching any Local Agent command.
              </p>
            </div>
            <div className="space-y-3">
              {permissionRules.map((rule) => {
                const isLater = rule.permission_key === 'messaging';
                return (
                  <div
                    key={rule.permission_key}
                    className={`rounded-2xl p-3.5 bg-surface-container-low/70 border border-border-subtle/70 space-y-2 ${
                      isLater ? 'opacity-65' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-on-surface">{rule.label}</span>
                          <RiskBadge risk={rule.risk_level} />
                          {isLater && <ComingLaterBadge />}
                        </div>
                        <p className="text-[11px] text-on-surface-variant mt-0.5">
                          {PERMISSION_DESC[rule.permission_key] ?? ''}
                        </p>
                      </div>
                      <ToggleSwitch
                        checked={rule.is_enabled}
                        disabled={isLater}
                        onChange={(next) =>
                          void updatePermissionRule(rule.permission_key, { is_enabled: next })
                        }
                        label={`Toggle ${rule.label}`}
                      />
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-on-surface-variant">Authorization Mode</span>
                      <select
                        value={rule.mode}
                        disabled={isLater || !rule.is_enabled}
                        onChange={(e) =>
                          void updatePermissionRule(rule.permission_key, {
                            mode: e.target.value as PermissionMode,
                          })
                        }
                        aria-label={`${rule.label} authorization mode`}
                        className="zara-input px-2.5 py-1 text-xs"
                      >
                        <option value="allow">Allow (Auto)</option>
                        <option value="voice_confirm">Voice Confirm</option>
                        <option value="pin_required">PIN Required</option>
                        <option value="deny">Deny All</option>
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>

          <GlassCard className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-headline-sm text-headline-sm text-on-surface">
                Mandatory &lsquo;Ask Before Doing&rsquo; Rules
              </h2>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-primary/15 text-primary font-semibold">
                Guardrails
              </span>
            </div>
            <div className="space-y-3">
              {askBeforeRules.map((rule) => (
                <div
                  key={rule.rule_key}
                  className="rounded-xl p-3 bg-surface-container-low/70 border border-border-subtle/70 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-on-surface">{rule.label}</p>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">
                      Requires: <span className="uppercase text-primary">{rule.required_method}</span>
                      {rule.rule_key === 'large_file_delete' && (
                        <span> · Threshold: {Number(rule.threshold?.size_mb ?? 10)} MB</span>
                      )}
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={rule.is_enforced}
                    onChange={(next) =>
                      void updateAskBeforeRule(rule.rule_key, { is_enforced: next })
                    }
                    label={`Toggle ${rule.label}`}
                  />
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-5 space-y-2">
            <h3 className="text-sm font-semibold text-on-surface">Ledger Audit Summary</h3>
            <p className="text-xs text-on-surface-variant">
              Computed directly from your recorded activity entries in this session.
            </p>
            <div className="grid grid-cols-3 gap-2 pt-2 text-center">
              <div className="rounded-xl bg-surface-container-low p-2.5">
                <p className="text-lg font-bold text-emerald-300">{counts.executed}</p>
                <p className="text-[11px] text-on-surface-variant">Executed</p>
              </div>
              <div className="rounded-xl bg-surface-container-low p-2.5">
                <p className="text-lg font-bold text-error">{counts.blocked}</p>
                <p className="text-[11px] text-on-surface-variant">Blocked</p>
              </div>
              <div className="rounded-xl bg-surface-container-low p-2.5">
                <p className="text-lg font-bold text-tertiary">{counts.awaiting_confirmation}</p>
                <p className="text-[11px] text-on-surface-variant">Pending</p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Right: Cryptographic Activity Ledger */}
        <div className="lg:col-span-7">
          <GlassCard className="p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2">
                  <span>Cryptographic Activity Ledger</span>
                  <span className="urdu-rtl text-base text-primary-fixed-dim" dir="rtl" lang="ur">
                    مکمل کارروائیوں کا لاگ
                  </span>
                </h2>
                <p className="text-xs text-on-surface-variant">
                  Hash-chained log of executed, blocked, and pending commands.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={dateFilter}
                  onChange={(e) => {
                    setDateFilter(e.target.value as 'all' | 'today' | '7d');
                    setPage(1);
                  }}
                  aria-label="Filter ledger by date"
                  className="zara-input px-3 py-1.5 text-xs"
                >
                  <option value="all">All Dates</option>
                  <option value="today">Today</option>
                  <option value="7d">Last 7 Days</option>
                </select>
                <PillButton
                  variant="secondary"
                  className="!px-3.5 !py-1.5 !min-h-[34px] text-xs"
                  onClick={handleExportCsv}
                  disabled={filteredLog.length === 0}
                >
                  <span className="material-symbols-outlined text-[15px]">download</span>
                  Export CSV
                </PillButton>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {STATUS_TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setStatusFilter(t.id);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer border ${
                    statusFilter === t.id
                      ? 'bg-primary/20 text-primary border-primary/50'
                      : 'bg-surface-container-low text-on-surface-variant border-border-subtle'
                  }`}
                >
                  {t.label} ({counts[t.id]})
                </button>
              ))}
            </div>

            {pagedLog.length === 0 ? (
              <EmptyState
                icon="receipt_long"
                title="No activity ledger entries yet"
                subtitle="Actions dispatched through Talk, Laptop Control, or Automations will be cryptographically recorded here."
              />
            ) : (
              <div className="space-y-2.5">
                {pagedLog.map((entry) => {
                  const isOpen = expandedRow === entry.id;
                  const cmd = entry.command_id
                    ? commands.find((c) => c.id === entry.command_id)
                    : null;
                  const canResolve =
                    entry.status === 'awaiting_confirmation' &&
                    cmd?.status === 'awaiting_confirmation';
                  return (
                    <div
                      key={entry.id}
                      className={`rounded-2xl p-3.5 border transition-colors ${
                        entry.status === 'blocked'
                          ? 'bg-error-container/15 border-error/30'
                          : entry.status === 'awaiting_confirmation'
                          ? 'bg-amber-500/10 border-tertiary/30'
                          : 'bg-surface-container-low/70 border-border-subtle/70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-on-surface">
                              {entry.action}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-semibold bg-surface-container-high text-on-surface-variant">
                              {entry.verified_by}
                            </span>
                            <RiskBadge risk={entry.risk_level} />
                          </div>
                          {entry.detail && (
                            <p className="text-xs text-on-surface-variant mt-1">{entry.detail}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] text-on-surface-variant">
                            {formatTimeAgo(entry.created_at)}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
                              entry.status === 'blocked'
                                ? 'bg-error-container text-error'
                                : entry.status === 'awaiting_confirmation'
                                ? 'bg-amber-500/20 text-tertiary'
                                : 'bg-emerald-500/15 text-emerald-300'
                            }`}
                          >
                            {entry.status.replace('_', ' ')}
                          </span>
                          <button
                            type="button"
                            onClick={() => setExpandedRow(isOpen ? null : entry.id)}
                            aria-label="Inspect ledger hashes"
                            className="p-1 text-on-surface-variant hover:text-on-surface cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              {isOpen ? 'expand_less' : 'expand_more'}
                            </span>
                          </button>
                        </div>
                      </div>

                      {canResolve && cmd && (
                        <div className="mt-2.5 flex items-center gap-2">
                          <PillButton
                            className="!px-3 !py-1 !min-h-[30px] text-xs"
                            onClick={() => {
                              if (cmd.confirmation_method === 'pin') {
                                openConfirmModal({
                                  title: 'Confirm Pending Command',
                                  description: `Enter Owner PIN to approve ${cmd.command_type}`,
                                  method: 'pin',
                                  riskLevel: cmd.risk_level,
                                  onConfirm: async (pin) => {
                                    await confirmCommand(cmd.id, 'pin', pin);
                                  },
                                });
                              } else {
                                void confirmCommand(cmd.id, 'manual');
                              }
                            }}
                          >
                            Approve
                          </PillButton>
                          <PillButton
                            variant="ghost"
                            className="!px-3 !py-1 !min-h-[30px] text-xs text-error"
                            onClick={() => void cancelCommand(cmd.id)}
                          >
                            Reject
                          </PillButton>
                        </div>
                      )}

                      {isOpen && (
                        <div className="mt-2.5 pt-2.5 border-t border-border-subtle/50 text-[11px] font-mono text-on-surface-variant space-y-1">
                          <p>prev_hash: {entry.prev_hash ?? 'genesis'}</p>
                          <p>entry_hash: {entry.entry_hash}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2 border-t border-border-subtle/50 text-xs text-on-surface-variant">
                <span>
                  Page {page} of {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <PillButton
                    variant="secondary"
                    className="!px-3 !py-1 !min-h-[30px] text-xs"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </PillButton>
                  <PillButton
                    variant="secondary"
                    className="!px-3 !py-1 !min-h-[30px] text-xs"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </PillButton>
                </div>
              </div>
            )}
          </GlassCard>
        </div>
      </div>

      {/* Panic Resume PIN Modal */}
      <ModalShell
        isOpen={resumeOpen}
        onClose={() => setResumeOpen(false)}
        title="Resume From Panic Kill-Switch"
      >
        <div className="space-y-4">
          <p className="text-body-sm text-on-surface-variant">
            Enter your 6-digit Owner PIN to clear emergency panic lock and re-enable command queue.
          </p>
          {resumeError && (
            <p role="alert" className="text-xs text-error font-medium">
              {resumeError}
            </p>
          )}
          <PinPad
            value={resumePin}
            onChange={(v) => {
              setResumePin(v);
              setResumeError(null);
            }}
            onSubmit={() => void handlePanicResume()}
            disabled={resuming}
            submitLabel={resuming ? 'Verifying...' : 'Resume System'}
            errorShake={Boolean(resumeError)}
          />
          <div className="flex justify-end gap-2">
            <PillButton variant="ghost" onClick={() => setResumeOpen(false)}>
              Cancel
            </PillButton>
          </div>
        </div>
      </ModalShell>
    </div>
  );
}
