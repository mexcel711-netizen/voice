import React, { useState } from 'react';
import { useZara } from '../context/ZaraContext';
import {
  ComingLaterBadge,
  EmptyState,
  GlassCard,
  PillButton,
  RiskBadge,
  ToggleSwitch,
} from '../components/ui/Primitives';
import { formatDuration } from '../lib/format';
import { Link } from 'react-router-dom';

export default function LaptopControlCenter() {
  const { device, deviceOnline, settings, commands, dispatchCommand } = useZara();

  const [volume, setVolume] = useState(device?.telemetry.volume_percent ?? 50);
  const [brightness, setBrightness] = useState(device?.telemetry.brightness_percent ?? 70);
  const [appInput, setAppInput] = useState('');
  const [urlInput, setUrlInput] = useState('');

  const blockedOrOffline = settings.panic_active;
  const telemetry = device?.telemetry;
  const runningApps = telemetry?.running_apps ?? [];

  const handleOpenApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appInput.trim()) return;
    await dispatchCommand('open_app', { name: appInput.trim() }, 'ui');
    setAppInput('');
  };

  const handleOpenUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    await dispatchCommand('open_url', { url: urlInput.trim() }, 'ui');
    setUrlInput('');
  };

  return (
      <div className="space-y-6 pb-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold">
              Laptop Control Center
            </h1>
            <p className="text-body-sm text-on-surface-variant">
              Direct hardware controls, running apps, display, and PIN-gated power states.
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full glass-panel">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                deviceOnline ? 'bg-emerald-400 animate-pulse' : 'bg-outline'
              }`}
            />
            <span className="text-xs font-semibold text-on-surface">
              {deviceOnline && device
                ? `${device.device_name} (${device.os_name})`
                : 'Laptop Offline — Start Zara Local Agent'}
            </span>
          </div>
        </div>

        {/* Live Telemetry Matrix */}
        {deviceOnline && device ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <GlassCard className="p-5">
              <p className="text-xs text-on-surface-variant">Battery</p>
              <p className="font-headline-md text-tertiary mt-1">
                {telemetry?.battery_percent ?? '—'}%
              </p>
              <p className="text-[11px] text-on-surface-variant mt-1">
                {telemetry?.is_charging ? 'Charging' : 'On Battery'}
              </p>
            </GlassCard>
            <GlassCard className="p-5">
              <p className="text-xs text-on-surface-variant">CPU & Thermal</p>
              <p className="font-headline-md text-secondary mt-1">
                {telemetry?.cpu_percent ?? '—'}%
              </p>
              <p className="text-[11px] text-on-surface-variant mt-1">
                {telemetry?.temperature_c != null ? `${telemetry.temperature_c}°C` : '—'}
              </p>
            </GlassCard>
            <GlassCard className="p-5">
              <p className="text-xs text-on-surface-variant">Network</p>
              <p className="font-headline-md text-primary mt-1">
                {telemetry?.wifi_ssid || 'Connected'}
              </p>
              <p className="text-[11px] text-on-surface-variant mt-1">
                {telemetry?.wifi_mbps != null ? `${telemetry.wifi_mbps} Mbps` : 'Active'}
              </p>
            </GlassCard>
            <GlassCard className="p-5">
              <p className="text-xs text-on-surface-variant">Uptime</p>
              <p className="font-headline-md text-on-surface mt-1">
                {formatDuration(telemetry?.uptime_seconds)}
              </p>
              <p className="text-[11px] text-on-surface-variant mt-1">
                Agent v{device.agent_version || '1.0'}
              </p>
            </GlassCard>
          </div>
        ) : (
          <GlassCard className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-secondary/30">
            <div className="space-y-1">
              <h2 className="font-headline-sm text-on-surface">
                Laptop offline — Zara Local Agent connect nahi hai
              </h2>
              <p className="text-body-sm text-on-surface-variant">
                Commands can still be tested through the Safety Classifier below, and will wait for
                the Agent once configured.
              </p>
            </div>
            <Link to="/safety" className="text-xs text-primary hover:underline shrink-0">
              Review Safety Rules
            </Link>
          </GlassCard>
        )}

        {/* Audio, Display & Quick Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <GlassCard className="lg:col-span-6 p-6 space-y-5">
            <h2 className="font-headline-sm text-on-surface">Audio & Display Controls</h2>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Master Volume</span>
                <span className="text-primary font-bold">{volume}%</span>
              </div>
              <input
                type="range"
                aria-label="Master Volume"
                min={0}
                max={100}
                value={volume}
                disabled={blockedOrOffline}
                onChange={(e) => setVolume(Number(e.target.value))}
                onMouseUp={() => void dispatchCommand('set_volume', { percent: volume }, 'ui')}
                onTouchEnd={() => void dispatchCommand('set_volume', { percent: volume }, 'ui')}
                className="zara-slider"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Screen Brightness</span>
                <span className="text-tertiary font-bold">{brightness}%</span>
              </div>
              <input
                type="range"
                aria-label="Screen Brightness"
                min={0}
                max={100}
                value={brightness}
                disabled={blockedOrOffline}
                onChange={(e) => setBrightness(Number(e.target.value))}
                onMouseUp={() =>
                  void dispatchCommand('set_brightness', { percent: brightness }, 'ui')
                }
                onTouchEnd={() =>
                  void dispatchCommand('set_brightness', { percent: brightness }, 'ui')
                }
                className="zara-slider"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-surface-container/70 flex items-center justify-between">
                <span className="text-xs font-medium">Night Shift</span>
                <ToggleSwitch
                  checked={Boolean(telemetry?.night_shift_on)}
                  onChange={(v) => void dispatchCommand('night_shift_toggle', { enabled: v }, 'ui')}
                  label="Toggle Night Shift"
                  disabled={blockedOrOffline}
                />
              </div>
              <div className="p-3 rounded-xl bg-surface-container/70 flex items-center justify-between">
                <span className="text-xs font-medium">Focus Mode</span>
                <ToggleSwitch
                  checked={Boolean(telemetry?.focus_mode_on)}
                  onChange={(v) => void dispatchCommand('focus_mode_toggle', { enabled: v }, 'ui')}
                  label="Toggle Focus Mode"
                  disabled={blockedOrOffline}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <PillButton
                variant="secondary"
                disabled={blockedOrOffline}
                onClick={() => void dispatchCommand('mute_toggle', { muted: true }, 'ui')}
              >
                Mute Audio
              </PillButton>
              <PillButton
                variant="secondary"
                disabled={blockedOrOffline}
                onClick={() => void dispatchCommand('screenshot', {}, 'ui')}
              >
                Capture Screenshot
              </PillButton>
              <PillButton
                variant="secondary"
                disabled={blockedOrOffline}
                onClick={() => void dispatchCommand('lock_screen', {}, 'ui')}
              >
                Lock Screen
              </PillButton>
            </div>
          </GlassCard>

          {/* Apps & Browser */}
          <GlassCard className="lg:col-span-6 p-6 space-y-5">
            <h2 className="font-headline-sm text-on-surface">Apps & Browser Control</h2>

            <form onSubmit={handleOpenApp} className="flex gap-2">
              <label htmlFor="open-app-input" className="sr-only">
                Application name
              </label>
              <input
                id="open-app-input"
                type="text"
                value={appInput}
                onChange={(e) => setAppInput(e.target.value)}
                placeholder="Open application (e.g., VS Code, Chrome)..."
                className="zara-input flex-1 px-3.5 py-2.5 text-sm"
              />
              <PillButton type="submit" disabled={!appInput.trim() || blockedOrOffline}>
                Open App
              </PillButton>
            </form>

            <form onSubmit={handleOpenUrl} className="flex gap-2">
              <label htmlFor="open-url-input" className="sr-only">
                URL to open
              </label>
              <input
                id="open-url-input"
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Open URL (https://...)..."
                className="zara-input flex-1 px-3.5 py-2.5 text-sm"
              />
              <PillButton variant="secondary" type="submit" disabled={!urlInput.trim() || blockedOrOffline}>
                Open URL
              </PillButton>
            </form>

            <div className="space-y-2">
              <h3 className="text-xs uppercase tracking-wider text-on-surface-variant">
                Running Applications
              </h3>
              {runningApps.length === 0 ? (
                <p className="text-xs text-on-surface-variant py-3">
                  No live process data available until Zara Local Agent connects.
                </p>
              ) : (
                <ul className="space-y-2 max-h-40 overflow-y-auto">
                  {runningApps.map((app) => (
                    <li
                      key={app.name}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container/70 text-xs"
                    >
                      <span className="font-medium text-on-surface">{app.name}</span>
                      <button
                        type="button"
                        onClick={() => void dispatchCommand('close_app', { name: app.name }, 'ui')}
                        className="text-error hover:underline cursor-pointer"
                      >
                        Close
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Restricted Power Actions & Coming Later OS Toggles */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <GlassCard className="lg:col-span-6 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-headline-sm text-on-surface">Restricted System Power Actions</h2>
              <RiskBadge risk="critical" />
            </div>
            <p className="text-xs text-on-surface-variant">
              Sleep, Restart, and Shutdown always require your 6-digit Owner PIN confirmation.
            </p>
            <div className="flex flex-wrap gap-3">
              <PillButton
                variant="secondary"
                disabled={blockedOrOffline}
                onClick={() => void dispatchCommand('sleep', {}, 'ui')}
              >
                Sleep
              </PillButton>
              <PillButton
                variant="danger"
                disabled={blockedOrOffline}
                onClick={() => void dispatchCommand('restart', {}, 'ui')}
              >
                Restart
              </PillButton>
              <PillButton
                variant="danger"
                disabled={blockedOrOffline}
                onClick={() => void dispatchCommand('shutdown', {}, 'ui')}
              >
                Shutdown
              </PillButton>
            </div>
          </GlassCard>

          <GlassCard className="lg:col-span-6 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-headline-sm text-on-surface">Hardware Radio & Clipboard</h2>
              <ComingLaterBadge />
            </div>
            <div className="grid grid-cols-2 gap-3 opacity-60">
              {['Wi-Fi Toggle', 'Bluetooth Control', 'Clipboard Read/Write', 'Network Speedtest'].map(
                (label) => (
                  <div
                    key={label}
                    className="p-3 rounded-xl bg-surface-container/50 flex items-center justify-between text-xs cursor-not-allowed"
                  >
                    <span>{label}</span>
                    <span className="text-[10px] text-on-surface-variant">Later</span>
                  </div>
                )
              )}
            </div>
          </GlassCard>
        </div>

        {/* Recent Command Queue */}
        <GlassCard className="p-6 space-y-3">
          <h2 className="font-headline-sm text-on-surface">Recent Command Dispatch Queue</h2>
          {commands.length === 0 ? (
            <EmptyState
              icon="terminal"
              title="No commands queued yet"
              subtitle="Trigger any control above to see live classification and execution states."
            />
          ) : (
            <ul className="space-y-2">
              {commands.slice(0, 6).map((c) => (
                <li
                  key={c.id}
                  className="p-3 rounded-xl bg-surface-container/70 flex flex-wrap items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <RiskBadge risk={c.risk_level} />
                    <span className="font-mono font-semibold text-on-surface">{c.command_type}</span>
                    <span className="text-on-surface-variant">{JSON.stringify(c.params)}</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-surface-container-highest text-primary font-semibold capitalize">
                    {c.status.replace('_', ' ')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      </div>
  );
}
