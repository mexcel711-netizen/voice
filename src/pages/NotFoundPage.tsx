import React from 'react';
import { Link } from 'react-router-dom';
import { GlassCard, PillButton, ZaraOrbLogo } from '../components/ui/Primitives';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-16">
      <GlassCard elevated className="max-w-md w-full p-8 text-center flex flex-col items-center gap-4">
        <ZaraOrbLogo size="md" />
        <p className="text-xs uppercase tracking-widest text-primary font-semibold">404 — Not Found</p>
        <h1 className="font-headline-lg text-headline-lg text-on-surface">
          Yeh route mojood nahi hai
        </h1>
        <p className="text-body-sm text-on-surface-variant">
          The page you tried to open does not exist in Zara Companion Space.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link to="/dashboard">
            <PillButton>Go to Dashboard</PillButton>
          </Link>
          <Link to="/">
            <PillButton variant="secondary">Landing Page</PillButton>
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
