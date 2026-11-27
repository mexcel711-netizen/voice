import React from 'react';
import { GlassCard, PillButton } from '../ui/Primitives';

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message || 'Unexpected application error' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center p-6">
          <GlassCard className="max-w-md w-full p-8 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-error-container/50 text-error flex items-center justify-center">
              <span className="material-symbols-outlined text-[28px]">error</span>
            </div>
            <h1 className="font-headline-md text-headline-md text-on-surface">
              Something went wrong
            </h1>
            <p className="text-body-sm text-on-surface-variant">
              {this.state.errorMessage}
            </p>
            <PillButton onClick={() => window.location.assign('/dashboard')}>
              Dobara koshish karein
            </PillButton>
          </GlassCard>
        </div>
      );
    }
    return this.props.children;
  }
}
