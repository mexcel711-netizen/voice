import React from 'react';
import { Link } from 'react-router-dom';
import { ZaraOrbLogo } from '../components/ui/Primitives';

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface relative overflow-x-hidden flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-24 left-1/4 w-[28rem] h-[28rem] rounded-full bg-primary-container/15 blur-[130px]" />
        <div className="absolute bottom-0 right-1/4 w-[32rem] h-[32rem] rounded-full bg-secondary-container/20 blur-[150px]" />
      </div>

      <div className="relative z-10 w-full max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2.5 text-on-surface-variant hover:text-on-surface text-label-md"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Home
          </Link>
          <div className="flex items-center gap-2">
            <ZaraOrbLogo size="xs" />
            <span className="font-headline-sm text-primary font-bold">Zara</span>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
