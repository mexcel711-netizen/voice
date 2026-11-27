(() => {
  const PAGE_SOURCE = 'zara-browser-bridge';
  const EXTENSION_SOURCE = 'zara-chrome-extension';

  window.addEventListener('message', (event) => {
    if (event.source !== window || event.origin !== window.location.origin) return;
    const message = event.data;
    if (!message || message.source !== PAGE_SOURCE || typeof message.requestId !== 'string') return;

    chrome.runtime.sendMessage(
      {
        type: 'ZARA_BROWSER_BRIDGE_REQUEST',
        requestId: message.requestId,
        command: message.command
      },
      (response) => {
        const runtimeError = chrome.runtime.lastError;
        const safeResponse = runtimeError
          ? { ok: false, error: runtimeError.message || 'Extension background service unavailable.' }
          : response || { ok: false, error: 'No response from Chrome extension.' };

        window.postMessage(
          {
            source: EXTENSION_SOURCE,
            requestId: message.requestId,
            response: safeResponse
          },
          window.location.origin
        );
      }
    );
  });
})();
