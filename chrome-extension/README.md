# Zara Browser Bridge (Chrome, Manifest V3)

This extension gives Zara a narrow, allowlisted browser-control bridge. It does **not** expose arbitrary JavaScript execution, cookies, passwords, or a generic DevTools interface.

## Install in Chrome

1. Open `chrome://extensions`.
2. Turn on **Developer mode**.
3. Choose **Load unpacked** and select this `chrome-extension` directory.
4. Open the extension's popup and choose **Grant website access** if you want page reading and scrolling. This is optional and can be revoked in Chrome's extension settings.
5. Open Zara from `http://localhost:3000` or its Cloudflare Pages / Workers URL.

The app and extension communicate over a same-window message bridge. Only the configured local app host and Cloudflare `pages.dev` / `workers.dev` sites are accepted. For a custom domain, add its exact match pattern to `manifest.json`'s `content_scripts.matches`, reload the extension, then refresh Zara.

## Supported voice actions

- "Chrome mein kaun se tabs khulay hain?" — list tabs
- "YouTube kholo" / "https://example.com kholo" — open a new tab
- "React hooks search karo" — open Google search
- "Is page ka summary do" — read current page text after website permission
- "Agla tab kholo" / "tab 123 par jao" — switch tab
- "Is tab ko band karo" — close a selected tab (the Zara app tab is protected)
- "Page neeche scroll karo" — scroll current page after website permission

Page text is capped before it is returned to the assistant. The extension does not collect browser history in the background; it reads tab metadata only when Zara explicitly asks for it.
