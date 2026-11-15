# NEXORA Browser

A futuristic desktop browser prototype built with Electron.

## Features
- Multi-tab browsing with back, forward, reload, home and address/search bar
- Right-side Social Space shortcuts (Instagram, YouTube, TikTok, Discord, X, WhatsApp)
- Add custom social shortcuts
- Dark and light themes
- Workspaces to organize tabs
- Built-in lightweight domain-based ad/tracker blocking
- Picture-in-picture button for HTML5 videos on supported websites
- Quick notes saved locally
- Optional AI assistant using your own OpenAI API key

## Requirements
- Windows 10/11, macOS, or Linux
- Node.js 20 or newer (LTS recommended)
- Internet connection

## Run on Windows
1. Install Node.js from https://nodejs.org/
2. Extract the `nexora-browser` folder.
3. Open the folder in VS Code.
4. Open Terminal in VS Code.
5. Run:

   ```bash
   npm install
   npm start
   ```

## Build an installer
```bash
npm run dist
```
The packaged app will be placed in the `dist` folder. On Windows, the build config creates an NSIS installer and a portable build.

## AI assistant setup
1. Open NEXORA.
2. Click **AI Assistant** in the right sidebar.
3. Enter your own OpenAI API key and save it.
4. Enter a prompt and click **Ask AI**.

The key is stored in local storage in your Electron profile. Do not share your key or publish a build containing your key. API usage is billed separately by the API provider. For a public release, move AI requests to a secure backend rather than shipping users' API keys through a renderer.

## Notes and limitations
- This is a functional starter browser, not a full Chrome replacement.
- The social sidebar opens sites in the active tab. Some services may require login and some may restrict embedded browser environments or unsupported user agents.
- The ad blocker is a small domain blocklist, not a full filter-list engine. It will not catch every ad.
- Picture-in-picture depends on the website exposing a compatible HTML5 video element and allowing PiP.
- Browser passwords, sync, extension support, profiles, and advanced download management are not implemented yet.
- Electron's embedded `webview` is used for the browser tabs. Keep Electron updated and review Electron's security guidance before distributing a public browser.
