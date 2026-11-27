export type ChromeBrowserAction =
  | 'list_tabs'
  | 'open_tab'
  | 'search'
  | 'read_page'
  | 'switch_tab'
  | 'close_tab'
  | 'scroll_page'
  | 'ping';

export interface ChromeBrowserCommand {
  action: ChromeBrowserAction;
  url?: string;
  query?: string;
  tabId?: number;
  direction?: 'up' | 'down';
  pixels?: number;
}

export interface ChromeBrowserResult {
  ok: boolean;
  message?: string;
  data?: unknown;
  error?: string;
}

const BRIDGE_SOURCE = 'zara-browser-bridge';
const RESPONSE_SOURCE = 'zara-chrome-extension';
const REQUEST_TIMEOUT_MS = 12_000;

type PendingRequest = {
  resolve: (value: ChromeBrowserResult) => void;
  reject: (error: Error) => void;
  timeoutId: number;
};

const pending = new Map<string, PendingRequest>();
let listenerAttached = false;

function attachResponseListener(): void {
  if (typeof window === 'undefined' || listenerAttached) return;
  listenerAttached = true;

  window.addEventListener('message', (event: MessageEvent<unknown>) => {
    if (event.source !== window || event.origin !== window.location.origin) return;
    const message = event.data as {
      source?: string;
      requestId?: string;
      response?: ChromeBrowserResult;
    } | null;
    if (message?.source !== RESPONSE_SOURCE || !message.requestId) return;

    const entry = pending.get(message.requestId);
    if (!entry) return;
    window.clearTimeout(entry.timeoutId);
    pending.delete(message.requestId);

    if (message.response?.ok) {
      entry.resolve(message.response);
    } else {
      entry.reject(new Error(message.response?.error || 'Chrome browser request failed.'));
    }
  });
}

function validateCommand(command: ChromeBrowserCommand): void {
  if (!command || typeof command !== 'object') throw new Error('Invalid Chrome action.');
  if (command.action === 'open_tab' && !isSafeWebUrl(command.url)) {
    throw new Error('Only valid http or https URLs can be opened in Chrome.');
  }
  if (command.action === 'search' && !command.query?.trim()) {
    throw new Error('Enter a search query first.');
  }
  if (['switch_tab', 'close_tab'].includes(command.action) &&
      (!Number.isSafeInteger(command.tabId) || (command.tabId ?? 0) <= 0)) {
    throw new Error('A valid tabId is required for this Chrome action.');
  }
}

function isSafeWebUrl(value?: string): boolean {
  if (!value || value.length > 2048) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

export const chromeBrowserService = {
  async execute(command: ChromeBrowserCommand): Promise<ChromeBrowserResult> {
    validateCommand(command);
    if (typeof window === 'undefined') throw new Error('Chrome browser control is available in the web app only.');

    attachResponseListener();
    const requestId = crypto.randomUUID();

    return new Promise<ChromeBrowserResult>((resolve, reject) => {
      const timeoutId = window.setTimeout(() => {
        pending.delete(requestId);
        reject(new Error('Chrome extension did not respond. Install the Zara Browser Bridge and grant website access.'));
      }, REQUEST_TIMEOUT_MS);

      pending.set(requestId, { resolve, reject, timeoutId });
      window.postMessage(
        { source: BRIDGE_SOURCE, requestId, command },
        window.location.origin
      );
    });
  },

  async ping(): Promise<boolean> {
    try {
      const result = await this.execute({ action: 'ping' });
      return Boolean(result.ok);
    } catch {
      return false;
    }
  },
};
