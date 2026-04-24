# ⚡ Vikiio Browser

**Privacy-first, AI-powered desktop browser** built on Electron + Chromium + React + TypeScript.

> Chrome-level compatibility · Brave-level privacy · Firefox-level control · Comet-style AI assistant

---

## Features

### Browser Shell
- Full tab management (pin, mute, duplicate, close others, context menu)
- Address bar with URL/search detection and keyboard shortcuts
- Back / Forward / Reload / Home navigation
- Bookmark bar with quick access
- Download manager panel
- Session history
- Multi-window support (via Electron)

### Privacy System (Brave-style Shields)
- **Ad Blocking** — blocks known ad networks at the network layer
- **Tracker Blocking** — blocks analytics, telemetry, and social trackers
- **Cookie Blocking** — optional third-party cookie blocking
- **Fingerprint Protection** — canvas, WebGL, audio, font, and UA masking
- **Per-site shield controls** via toolbar dropdown
- **Privacy stats** — live tracker/ad block count per tab

### Browser Modes

| Mode | Description |
|------|-------------|
| 🌐 Normal | Default browsing with AI memory |
| 🔒 Private | No history, no cookies, no AI memory |
| 💼 Work | AI tab organization, workspace sync |
| 🕵️ Anonymous | VPN routing, no cloud AI, strict shields |
| 🔐 Locked | Auto-wipe, no sync, no extensions |

### AI Assistant Sidebar (Comet-style)
- **Chat** — page-aware AI chat powered by OpenAI GPT-4o-mini
- **Summary** — one-click page summarization
- **Actions** — 15+ AI actions (summarize, explain, translate, extract data, compare tabs, etc.)
- **Tabs** — manage all open tabs from the sidebar
- **Notes** — save AI-generated and manual notes
- **History** — full browsing history with quick navigation
- **Bookmarks** — manage bookmarks panel
- **Downloads** — download manager panel
- **Settings** — all browser settings in one place

### New Tab Page
- Live clock and date
- Search bar with configurable search engine
- Quick links grid
- AI command bar with suggestions
- Privacy stats dashboard
- Recent history

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop wrapper | Electron |
| Rendering engine | Chromium (via Electron) |
| UI framework | React 18 + TypeScript |
| Build tool | Vite |
| Styling | CSS Modules |
| AI | OpenAI API (GPT-4o-mini) |
| State management | React Context + useReducer |
| Privacy filtering | Electron session request filter |

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
git clone https://github.com/vikiioplatforms/vikiiobrowser
cd vikiiobrowser
npm install
```

### Development

```bash
# Start Vite dev server (browser preview at localhost:5173)
npm run dev

# Start full Electron app
npm run start
```

### Build

```bash
# Build web assets + Electron main process
npm run build:all

# Package as distributable (AppImage / dmg / exe)
npm run dist
```

---

## Configuration

### AI Assistant
1. Open the AI sidebar (click **AI** button in toolbar)
2. Go to **Settings** tab
3. Enter your **OpenAI API Key** (sk-...)
4. Click **Save**

---

## Project Structure

```
vikiiobrowser/
├── electron/
│   ├── main.ts          # Electron main process + ad/tracker blocking
│   └── preload.ts       # Context bridge (window controls)
├── src/
│   ├── components/
│   │   ├── BrowserShell.tsx     # Root layout
│   │   ├── TitleBar.tsx         # Window chrome + mode indicator
│   │   ├── TabBar.tsx           # Tab management
│   │   ├── Toolbar.tsx          # Address bar + navigation + shields
│   │   ├── BookmarkBar.tsx      # Quick bookmark access
│   │   ├── BrowserContent.tsx   # Tab content router
│   │   ├── WebView.tsx          # Web renderer
│   │   ├── NewTabPage.tsx       # New tab dashboard
│   │   ├── AISidebar.tsx        # Full AI assistant panel
│   │   ├── StatusBar.tsx        # Bottom status bar
│   │   └── icons/               # SVG icon components
│   ├── store/
│   │   └── browserStore.ts      # Global state (Context + useReducer)
│   ├── types/
│   │   └── index.ts             # TypeScript types
│   └── styles/
│       └── globals.css          # Global CSS variables + reset
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## Roadmap

### MVP 1 — Browser Foundation ✅
- [x] Chromium-based desktop browser
- [x] Address bar + navigation
- [x] Tab management (pin, mute, duplicate, groups)
- [x] Bookmarks + bookmark bar
- [x] History
- [x] Basic private mode
- [x] AI assistant sidebar shell

### MVP 2 — Privacy Browser ✅
- [x] Ad blocker (network layer in Electron)
- [x] Tracker blocker
- [x] Per-site shield controls
- [x] Privacy dashboard
- [x] Fingerprint protection settings

### MVP 3 — AI Browser ✅
- [x] Page summary
- [x] Ask current page
- [x] Compare tabs
- [x] Extract data actions
- [x] Save AI notes
- [x] AI command bar on new tab

### MVP 4 — Identity + Sync (Planned)
- [ ] Firefox-style containers
- [ ] Workspaces
- [ ] Encrypted sync
- [ ] Password manager
- [ ] Cross-device tabs

### MVP 5 — Premium Features (Planned)
- [ ] WireGuard VPN integration
- [ ] Secure vault
- [ ] Local AI model (Ollama)
- [ ] Chrome extension support
- [ ] Advanced automation

---

## License

MIT © Vikiio
