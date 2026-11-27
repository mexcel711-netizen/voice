const APP_HOSTS = [
  'localhost',
  '127.0.0.1',
  'pages.dev',
  'workers.dev'
];

function isApprovedAssistantOrigin(sender) {
  if (!sender.tab?.id || !sender.url) return false;
  try {
    const url = new URL(sender.url);
    if (url.protocol !== 'https:' && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') return false;
    return APP_HOSTS.some((host) =>
      host === 'localhost' || host === '127.0.0.1'
        ? url.hostname === host
        : url.hostname === host || url.hostname.endsWith('.' + host)
    );
  } catch {
    return false;
  }
}

function safeHttpUrl(value) {
  if (typeof value !== 'string' || value.length > 2048) throw new Error('A valid http/https URL is required.');
  const url = new URL(value);
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('Only http and https browser destinations are allowed.');
  }
  return url.toString();
}

async function requireHostPermission(tab) {
  if (!tab?.url) throw new Error('The selected tab does not expose a readable URL.');
  const url = new URL(tab.url);
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('Chrome does not allow page reading on this browser-internal page.');
  }
  const originPattern = url.origin + '/*';
  const granted = await chrome.permissions.contains({ origins: [originPattern] });
  if (!granted) {
    throw new Error('Grant website access from the Zara Browser Bridge extension popup before reading or scrolling web pages.');
  }
}

async function runBrowserCommand(command, assistantTab) {
  if (!command || typeof command.action !== 'string') throw new Error('Invalid browser command.');
  const action = command.action;

  if (action === 'ping') return { ok: true, message: 'Zara Browser Bridge connected.' };

  if (action === 'list_tabs') {
    const tabs = await chrome.tabs.query({});
    return {
      ok: true,
      message: `Found ${tabs.length} browser tabs.`,
      data: tabs.map((tab) => ({
        id: tab.id,
        title: (tab.title || 'Untitled').slice(0, 180),
        url: tab.url || '',
        active: Boolean(tab.active),
        windowId: tab.windowId
      }))
    };
  }

  if (action === 'open_tab') {
    const url = safeHttpUrl(command.url);
    const tab = await chrome.tabs.create({ url, active: true });
    return { ok: true, message: 'Opened a new Chrome tab.', data: { tabId: tab.id, url: tab.url || url } };
  }

  if (action === 'search') {
    const query = typeof command.query === 'string' ? command.query.trim().slice(0, 300) : '';
    if (!query) throw new Error('A non-empty browser search query is required.');
    const url = 'https://www.google.com/search?q=' + encodeURIComponent(query);
    const tab = await chrome.tabs.create({ url, active: true });
    return { ok: true, message: 'Opened Google search results.', data: { tabId: tab.id, url } };
  }

  const targetTabId = Number.isSafeInteger(command.tabId) && command.tabId > 0
    ? command.tabId
    : assistantTab.id;
  const targetTab = await chrome.tabs.get(targetTabId).catch(() => null);
  if (!targetTab) throw new Error('Chrome tab not found. Ask Zara to list tabs and try again.');

  if (action === 'switch_tab') {
    await chrome.tabs.update(targetTabId, { active: true });
    await chrome.windows.update(targetTab.windowId, { focused: true });
    return { ok: true, message: 'Switched to the selected Chrome tab.', data: { tabId: targetTabId } };
  }

  if (action === 'close_tab') {
    if (targetTabId === assistantTab.id) {
      throw new Error('For safety, Zara will not close the tab running the assistant.');
    }
    await chrome.tabs.remove(targetTabId);
    return { ok: true, message: 'Closed the selected Chrome tab.', data: { tabId: targetTabId } };
  }

  if (action === 'read_page' || action === 'scroll_page') {
    await requireHostPermission(targetTab);
    if (action === 'read_page') {
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: targetTabId },
        func: () => ({
          title: document.title.slice(0, 180),
          url: location.href,
          selectedText: (window.getSelection()?.toString() || '').slice(0, 4000),
          text: (document.body?.innerText || '').replace(/\n{3,}/g, '\n\n').slice(0, 9000)
        })
      });
      return { ok: true, message: 'Read the visible page content.', data: result?.result || null };
    }

    const direction = command.direction === 'up' ? 'up' : 'down';
    const pixels = Math.max(100, Math.min(1200, Number(command.pixels) || 600));
    await chrome.scripting.executeScript({
      target: { tabId: targetTabId },
      func: (scrollDirection, amount) => {
        window.scrollBy({ top: scrollDirection === 'up' ? -amount : amount, behavior: 'smooth' });
      },
      args: [direction, pixels]
    });
    return { ok: true, message: `Scrolled the page ${direction}.`, data: { tabId: targetTabId, pixels } };
  }

  throw new Error('Unsupported Chrome browser action.');
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== 'ZARA_BROWSER_BRIDGE_REQUEST') return false;
  if (!isApprovedAssistantOrigin(sender)) {
    sendResponse({ ok: false, error: 'Request origin is not an approved Zara assistant page.' });
    return false;
  }

  runBrowserCommand(message.command, sender.tab)
    .then(sendResponse)
    .catch((error) => sendResponse({
      ok: false,
      error: error instanceof Error ? error.message : 'Chrome browser command failed.'
    }));
  return true;
});
