const statusEl = document.getElementById('status');
const grantButton = document.getElementById('grant');

async function refresh() {
  const granted = await chrome.permissions.contains({ origins: ['<all_urls>'] });
  statusEl.textContent = granted
    ? 'Website access is enabled. Zara can read and scroll pages when asked.'
    : 'Website access is not enabled. Zara can still list, open, switch and search tabs.';
  grantButton.textContent = granted ? 'Website access enabled' : 'Grant website access';
  grantButton.disabled = granted;
}

grantButton.addEventListener('click', async () => {
  try {
    const granted = await chrome.permissions.request({ origins: ['<all_urls>'] });
    statusEl.textContent = granted ? 'Website access granted.' : 'Permission was not granted.';
    await refresh();
  } catch (error) {
    statusEl.textContent = error instanceof Error ? error.message : 'Could not request permissions.';
  }
});

void refresh();
