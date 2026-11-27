/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ToastProvider } from './components/common/ToastProvider';
import { ZaraProvider } from './context/ZaraContext';
import { AppRouter } from './routes/router';

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <ZaraProvider>
          <AppRouter />
        </ZaraProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
