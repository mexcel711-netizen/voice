# Zara on Windows

These scripts make the hosted Zara app open in a Chrome app-style window each time the current Windows user signs in.

## Install

1. Install Google Chrome if it is not already installed.
2. Download the repository ZIP from GitHub and extract it.
3. Open the extracted \`windows\` folder.
4. Double-click \`Install-Zara-Startup.bat\`.
5. The script detects Chrome, creates \`Zara AI Assistant.lnk\` in the current user's Windows Startup folder, and opens Zara immediately.

Zara URL: https://voice-8ts.pages.dev

Windows starts Startup apps after you sign in (not before the Windows lock screen). An internet connection is required because Zara is hosted online.

## Chrome browser controls

The browser-control extension is separate from the startup shortcut:

1. Open \`chrome://extensions\` in Chrome.
2. Turn on **Developer mode**.
3. Select **Load unpacked**.
4. Choose the \`chrome-extension\` folder from the extracted repository.
5. Open https://voice-8ts.pages.dev, open the Zara extension popup and grant the requested site access.

The extension can list/open/search/switch/close tabs, read a page after you grant site access, and scroll. It cannot run arbitrary scripts or access cookies/passwords.

## Voice setup

Allow microphone access for \`https://voice-8ts.pages.dev\` in Chrome and allow sound playback. Chrome may require the first microphone/session start to be initiated by a click after sign-in.

The app can use browser speech as a fallback. For the configured high-quality Urdu ElevenLabs voice to work, an owner must add \`ELEVENLABS_API_KEY\` as a **Cloudflare Pages secret** (Settings → Variables and Secrets) for both Production and Preview, then redeploy. Never put this secret in this repository, browser code, or a public chat. The currently linked voice is Reva (Urdu); the provider key is not included in this project.

## Disable automatic launch

Double-click \`Remove-Zara-Startup.bat\` in this folder. This removes only Zara's startup shortcut; it does not uninstall Chrome or the extension.

## Important limitation

This launcher opens the hosted web app; it does not install a native Windows desktop app or a local computer-control service. Full desktop control (Windows apps, local files, system settings) needs a separate trusted local agent and explicit local permissions.
