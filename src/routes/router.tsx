import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { SkeletonCard } from '../components/ui/Primitives';
import { AppShell } from '../layouts/AppShell';
import { AuthLayout } from '../layouts/AuthLayout';
import { PublicLayout } from '../layouts/PublicLayout';
import { RequireOwnerUnlocked } from './guards';

const LandingPage = lazy(() => import('../pages/LandingPage'));
const OwnerLogin = lazy(() => import('../pages/OwnerLogin'));
const DashboardHome = lazy(() => import('../pages/DashboardHome'));
const LiveVoiceConversation = lazy(() => import('../pages/LiveVoiceConversation'));
const ConversationHistory = lazy(() => import('../pages/ConversationHistory'));
const EmotionsMoodCenter = lazy(() => import('../pages/EmotionsMoodCenter'));
const PersonalityStudio = lazy(() => import('../pages/PersonalityStudio'));
const VoiceStudio = lazy(() => import('../pages/VoiceStudio'));
const LaptopControlCenter = lazy(() => import('../pages/LaptopControlCenter'));
const FileAppFinder = lazy(() => import('../pages/FileAppFinder'));
const AutomationsRoutines = lazy(() => import('../pages/AutomationsRoutines'));
const RemindersTimersPrayerTimes = lazy(() => import('../pages/RemindersTimersPrayerTimes'));
const MemoryVault = lazy(() => import('../pages/MemoryVault'));
const SafetyPermissionsActivityLog = lazy(() => import('../pages/SafetyPermissionsActivityLog'));
const Settings = lazy(() => import('../pages/Settings'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

function RouteLoader() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <SkeletonCard lines={4} />
      <SkeletonCard lines={3} />
    </div>
  );
}

function ProtectedShell({ children }: { children: React.ReactNode }) {
  return (
    <RequireOwnerUnlocked>
      <AppShell>
        <Suspense fallback={<RouteLoader />}>{children}</Suspense>
      </AppShell>
    </RequireOwnerUnlocked>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          <Route
            path="/"
            element={
              <PublicLayout>
                <LandingPage />
              </PublicLayout>
            }
          />
          <Route
            path="/login"
            element={
              <AuthLayout>
                <OwnerLogin />
              </AuthLayout>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedShell>
                <DashboardHome />
              </ProtectedShell>
            }
          />
          <Route
            path="/talk"
            element={
              <ProtectedShell>
                <LiveVoiceConversation />
              </ProtectedShell>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedShell>
                <ConversationHistory />
              </ProtectedShell>
            }
          />
          <Route
            path="/history/:sessionId"
            element={
              <ProtectedShell>
                <ConversationHistory />
              </ProtectedShell>
            }
          />
          <Route
            path="/emotions"
            element={
              <ProtectedShell>
                <EmotionsMoodCenter />
              </ProtectedShell>
            }
          />
          <Route
            path="/personality"
            element={
              <ProtectedShell>
                <PersonalityStudio />
              </ProtectedShell>
            }
          />
          <Route
            path="/voice-studio"
            element={
              <ProtectedShell>
                <VoiceStudio />
              </ProtectedShell>
            }
          />
          <Route
            path="/control"
            element={
              <ProtectedShell>
                <LaptopControlCenter />
              </ProtectedShell>
            }
          />
          <Route
            path="/files"
            element={
              <ProtectedShell>
                <FileAppFinder />
              </ProtectedShell>
            }
          />
          <Route
            path="/automations"
            element={
              <ProtectedShell>
                <AutomationsRoutines />
              </ProtectedShell>
            }
          />
          <Route
            path="/reminders"
            element={
              <ProtectedShell>
                <RemindersTimersPrayerTimes />
              </ProtectedShell>
            }
          />
          <Route
            path="/memory"
            element={
              <ProtectedShell>
                <MemoryVault />
              </ProtectedShell>
            }
          />
          <Route
            path="/safety"
            element={
              <ProtectedShell>
                <SafetyPermissionsActivityLog />
              </ProtectedShell>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedShell>
                <Settings />
              </ProtectedShell>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
