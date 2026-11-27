import React from 'react';
import { Link } from 'react-router-dom';
import { ZaraOrbLogo } from '../components/ui/Primitives';
import { useZara } from '../context/ZaraContext';

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const { isUnlocked } = useZara();

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col relative overflow-x-hidden">
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.12)] border-b border-border-subtle/30">
        <div className="h-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 focus-visible:outline-none">
            <ZaraOrbLogo size="sm" />
            <span className="font-headline-sm text-headline-sm font-bold text-primary tracking-tight">
              Zara AI
            </span>
          </Link>

          <nav aria-label="Landing Navigation" className="hidden md:flex items-center gap-3">
            <a
              href="#features"
              className="px-4 py-2 rounded-full font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-colors"
            >
              Overview
            </a>
            <Link
              to="/talk"
              className="px-4 py-2 rounded-full font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-colors"
            >
              Voice Tech
            </Link>
            <Link
              to="/dashboard"
              className="px-4 py-2 rounded-full font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-colors"
            >
              Companion Console
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to={isUnlocked ? '/dashboard' : '/login'}
              className="px-4 py-2 rounded-full bg-surface-container-high text-on-surface font-label-md text-label-md hover:bg-surface-bright transition-all"
            >
              {isUnlocked ? 'Open Console' : 'Owner Access'}
            </Link>
            <div
              className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-xs"
              aria-hidden="true"
            >
              B
            </div>
          </div>
        </div>
      </header>

      <main className="w-full pt-16 flex-1">{children}</main>

      <footer className="border-t border-border-subtle/40 bg-surface-container-lowest/90 py-8 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-body-sm text-on-surface-variant">
          <div className="flex items-center gap-3">
            <ZaraOrbLogo size="xs" />
            <span className="font-semibold text-on-surface">Zara Companion</span>
            <span className="text-outline">•</span>
            <span className="urdu-rtl text-tertiary text-sm" dir="rtl" lang="ur">
              ذاتی اے آئی ساتھی
            </span>
          </div>
          <p className="text-xs text-text-secondary">
            Single-Owner Private Workspace • End-to-End Safety Guardrails
          </p>
        </div>
      </footer>
    </div>
  );
}
