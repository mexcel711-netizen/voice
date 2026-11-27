import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useZara } from '../context/ZaraContext';
import { SupabaseConfigNotice, ZaraOrbLogo } from '../components/ui/Primitives';
import { useToast } from '../context/ToastContext';

interface NavItem {
  to: string;
  label: string;
  icon: string;
  badge?: string;
}

const SIDEBAR_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/talk', label: 'Talk (Live Voice)', icon: 'graphic_eq', badge: 'Live' },
  { to: '/history', label: 'History', icon: 'forum' },
  { to: '/control', label: 'Control', icon: 'laptop_mac' },
  { to: '/files', label: 'Files', icon: 'folder_special' },
  { to: '/automations', label: 'Automations', icon: 'bolt' },
  { to: '/reminders', label: 'Reminders & Prayer', icon: 'schedule' },
  { to: '/memory', label: 'Memory Vault', icon: 'neurology' },
  { to: '/emotions', label: 'Emotions & Mood', icon: 'mood' },
  { to: '/personality', label: 'Personality Studio', icon: 'smart_toy' },
  { to: '/voice-studio', label: 'Voice Studio', icon: 'record_voice_over' },
  { to: '/safety', label: 'Safety & Logs', icon: 'verified_user' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
];

const MOBILE_BOTTOM_TABS = [
  { to: '/dashboard', label: 'Home', icon: 'dashboard' },
  { to: '/talk', label: 'Talk', icon: 'graphic_eq' },
  { to: '/control', label: 'Control', icon: 'laptop_mac' },
  { to: '/memory', label: 'Memory', icon: 'neurology' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const {
    persona,
    ownerProfile,
    settings,
    device,
    deviceOnline,
    updateSettings,
    lockScreen,
  } = useZara();
  const { showToast } = useToast();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const activeNav = SIDEBAR_ITEMS.find((item) =>
    location.pathname.startsWith(item.to)
  );

  const handleToggleMic = async () => {
    if (settings.panic_active) {
      showToast('Panic mode ON hai. Resume Safety page par PIN se karein.', 'error');
      return;
    }
    const next = !settings.mic_enabled;
    await updateSettings({ mic_enabled: next });
    showToast(next ? 'Microphone enabled.' : 'Microphone muted globally.', 'info');
  };

  const handleLockScreen = () => {
    lockScreen();
    navigate('/login');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between">
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="p-space-lg flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2.5 focus-visible:outline-none">
            <ZaraOrbLogo size="sm" />
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm text-primary tracking-tight font-bold">
                {persona.assistant_name || 'Zara'}
              </span>
              <span
                className="font-urdu-body text-xs text-on-surface-variant leading-relaxed"
                dir="rtl"
                lang="ur"
              >
                ذہین ساتھی
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-high/80 shadow-[0_0_10px_rgba(244,84,163,0.25)]">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                settings.panic_active ? 'bg-error' : 'bg-primary animate-pulse'
              }`}
            />
            <span
              className={`font-label-sm text-label-sm ${
                settings.panic_active ? 'text-error' : 'text-primary'
              }`}
            >
              {settings.panic_active ? 'Panic' : 'Ready'}
            </span>
          </div>
        </div>

        <nav
          aria-label="Primary Sidebar"
          className="flex-1 px-3 space-y-1 overflow-y-auto overscroll-contain pb-4"
        >
          {SIDEBAR_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all group min-h-[42px] ${
                  isActive
                    ? 'bg-primary-container text-on-primary-container font-semibold shadow-[0_0_20px_rgba(244,84,163,0.35)]'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`material-symbols-outlined text-[20px] transition-transform group-hover:scale-110 ${
                      isActive
                        ? 'text-on-primary-container'
                        : item.to === '/talk'
                        ? 'text-primary'
                        : ''
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="font-label-md text-label-md flex-1">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isActive
                          ? 'bg-on-primary-container/20 text-on-primary-container'
                          : 'bg-primary/20 text-primary'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="p-3 bg-surface-container/60 backdrop-blur-md m-3 rounded-2xl flex items-center justify-between gap-2 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
        <button
          type="button"
          onClick={handleLockScreen}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-surface-container-high text-on-surface-variant hover:text-on-surface hover:bg-surface-bright transition-all cursor-pointer min-h-[40px]"
        >
          <span className="material-symbols-outlined text-[18px]">lock</span>
          <span className="font-label-sm text-label-sm">Lock Screen</span>
        </button>
        <button
          type="button"
          onClick={handleToggleMic}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl transition-all cursor-pointer min-h-[40px] ${
            settings.mic_enabled
              ? 'bg-surface-container-high text-on-surface-variant hover:text-on-surface hover:bg-surface-bright'
              : 'bg-error-container/60 text-error'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {settings.mic_enabled ? 'mic_off' : 'mic'}
          </span>
          <span className="font-label-sm text-label-sm">
            {settings.mic_enabled ? 'Mute Mic' : 'Unmute'}
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface relative overflow-x-hidden">
      {/* Ambient Background Glows */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-[12rem] -left-[12rem] w-[36rem] h-[36rem] rounded-full bg-primary-container/10 blur-[130px]" />
        <div className="absolute top-1/3 -right-[14rem] w-[40rem] h-[40rem] rounded-full bg-secondary-container/15 blur-[150px]" />
        <div className="absolute -bottom-[10rem] left-1/3 w-[34rem] h-[34rem] rounded-full bg-primary/5 blur-[140px]" />
      </div>

      {/* Desktop Fixed Sidebar (>=1024px) */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-72 bg-surface-container-low/90 backdrop-blur-2xl z-50 flex-col shadow-[0_8px_32px_rgba(0,0,0,0.4)] border-r border-border-subtle/40">
        {sidebarContent}
      </aside>

      {/* Tablet / Mobile Drawer (<1024px) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <aside
            aria-label="Mobile Navigation Drawer"
            className="relative w-72 max-w-[85vw] bg-surface-container-low h-full z-10 flex flex-col shadow-2xl border-r border-border-subtle/50"
          >
            <button
              type="button"
              aria-label="Close navigation menu"
              onClick={() => setDrawerOpen(false)}
              className="lg:hidden absolute top-4 right-3 p-2 rounded-full text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Column */}
      <div className="lg:pl-72 flex flex-col min-h-screen relative z-10">
        {/* Top Bar */}
        <header className="fixed top-0 left-0 lg:left-72 right-0 h-16 bg-surface-container-low/80 backdrop-blur-xl z-40 shadow-[0_1px_16px_rgba(0,0,0,0.2)] border-b border-border-subtle/30">
          <div className="h-16 w-full px-4 md:px-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                aria-label="Open navigation menu"
                aria-expanded={drawerOpen}
                onClick={() => setDrawerOpen(true)}
                className="lg:hidden p-2 rounded-xl bg-surface-container-high text-on-surface hover:bg-surface-bright min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[22px]">menu</span>
              </button>

              <div className="lg:hidden">
                <ZaraOrbLogo size="xs" />
              </div>

              <div className="flex items-center gap-1.5 truncate">
                <span className="hidden sm:inline font-label-md text-label-md text-on-surface-variant">
                  Companion Space
                </span>
                <span className="hidden sm:inline material-symbols-outlined text-[14px] text-outline">
                  chevron_right
                </span>
                <span className="font-label-md text-label-md text-on-surface font-semibold truncate">
                  {activeNav?.label || 'Active Session'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3 shrink-0">
              <button
                type="button"
                onClick={handleToggleMic}
                aria-label={settings.mic_enabled ? 'Mute microphone' : 'Enable microphone'}
                className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                  settings.mic_enabled && !settings.panic_active
                    ? 'bg-surface-container-high/90 shadow-[0_0_18px_rgba(244,84,163,0.2)] text-on-surface'
                    : 'bg-error-container/60 text-error'
                }`}
              >
                <span className="material-symbols-outlined text-[17px]">
                  {settings.mic_enabled && !settings.panic_active ? 'mic' : 'mic_off'}
                </span>
                <span className="font-label-sm text-label-sm">
                  {settings.panic_active
                    ? 'Mic Halted (Panic)'
                    : settings.mic_enabled
                    ? 'Mic Active (Urdu / English)'
                    : 'Mic Muted'}
                </span>
              </button>

              <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-surface-container-high/60 text-label-sm text-on-surface-variant">
                {deviceOnline && device ? (
                  <>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-secondary text-[16px]">
                        wifi
                      </span>
                      <span>{device.telemetry.wifi_ssid || 'Wi-Fi'}</span>
                    </div>
                    <span className="w-1 h-1 rounded-full bg-outline" />
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-tertiary text-[16px]">
                        battery_charging_80
                      </span>
                      <span>
                        {device.telemetry.battery_percent != null
                          ? `${device.telemetry.battery_percent}%`
                          : 'AC'}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-outline" />
                    <span>Laptop Offline</span>
                  </div>
                )}
              </div>

              <Link
                to="/settings"
                className="flex items-center gap-2 pl-1 focus-visible:outline-none"
                aria-label="Owner profile settings"
              >
                <div className="hidden md:flex flex-col text-right">
                  <span className="font-label-md text-label-md text-on-surface font-semibold leading-tight">
                    {ownerProfile.display_name || persona.owner_nickname || 'Boss'}
                  </span>
                  <span className="font-label-sm text-label-sm text-primary leading-tight">
                    (Owner)
                  </span>
                </div>
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-sm">
                  {(ownerProfile.display_name || 'B').slice(0, 1).toUpperCase()}
                </div>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Scroll Container */}
        <main className="w-full pt-16 pb-24 md:pb-10 flex-1">
          <div className="max-w-[1360px] mx-auto px-margin-mobile md:px-space-lg pt-4 space-y-4">
            {settings.panic_active && (
              <div
                role="alert"
                className="rounded-2xl bg-error-container/90 border border-error/60 px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[0_0_32px_rgba(255,92,108,0.3)]"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-error text-[24px]">
                    gpp_bad
                  </span>
                  <div>
                    <p className="font-label-md text-on-error-container font-bold">
                      Panic mode ON — mic aur commands band hain
                    </p>
                    <p className="text-xs text-on-error-container/90">
                      Live Voice and Laptop Control execution are suspended until you verify your PIN.
                    </p>
                  </div>
                </div>
                <Link
                  to="/safety"
                  className="px-4 py-2 rounded-full bg-surface-container-lowest text-on-surface text-label-sm font-semibold hover:bg-surface-container-high shrink-0"
                >
                  Resume on Safety
                </Link>
              </div>
            )}

            <SupabaseConfigNotice compact />

            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Tab Bar (< 768px) */}
      <nav
        aria-label="Mobile Quick Tabs"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-container-low/95 backdrop-blur-2xl border-t border-border-subtle/50 px-2 py-1.5 flex items-center justify-around"
      >
        {MOBILE_BOTTOM_TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-xl min-w-[56px] min-h-[44px] ${
                isActive ? 'text-primary' : 'text-on-surface-variant'
              }`
            }
          >
            <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
            <span className="text-[11px] font-medium">{tab.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
