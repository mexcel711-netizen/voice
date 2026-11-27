const statusEl = document.getElementById('status');
const grantButton = document.getElementById('grant');

async function currentSitePattern() {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!tab?.url) return null;
  try {
    const url = new URL(tab.url);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    return { origin: url.origin, pattern: url.origin + '/*' };
  } catch {
    return null;
  }
}

async function refresh() {
  const site = await currentSitePattern();
  if (!site) {
    statusEl.textContent = 'Open a normal http/https website, then reopen this popup to grant access to that site.';
    grantButton.disabled = true;
    grantButton.textContent = 'No website selected';
    return;
  }
  const granted = await chrome.permissions.contains({ origins: [site.pattern] });
  statusEl.textContent = granted
    ? `Website access is enabled for ${site.origin}. Zara can read and scroll this site when asked.`
    : `Website access is not enabled for ${site.origin}. Zara can still list, open, switch and search tabs.`;
  grantButton.textContent = granted ? 'Access enabled for this site' : 'Grant access to this site';
  grantButton.disabled = granted;
}

grantButton.addEventListener('click', async () => {
  try {
    const site = await currentSitePattern();
    if (!site) throw new Error('Open a normal http/https website first.');
    const granted = await chrome.permissions.request({ origins: [site.pattern] });
    statusEl.textContent = granted
      ? `Website access granted for ${site.origin}.`
      : 'Permission was not granted.';
    await refresh();
  } catch (error) {
    statusEl.textContent = error instanceof Error ? error.message : 'Could not request permissions.';
  }
});

void refresh();
