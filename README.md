# AI Innovation Competition - Live Voting System
### نظام التصويت المباشر لمسابقة الابتكار في الذكاء الاصطناعي
**6th Annual KSUMC Pharmacy Meeting | الملتقى السنوي السادس للصيدلة - المدينة الطبية بجامعة الملك سعود**

---

## 🌟 Overview (نظرة عامة)

A production-quality, real-time live voting system designed for high-profile auditorium events, LED video walls, and projectors (16:9 landscape 1080p / 4K), accompanied by a mobile voting web application accessible by attendees via QR code scan.

The visual identity faithfully reproduces the official event branding:
- **Top band**: Pure white with faint geometric pharmacy meeting glyph pattern.
- **Lower band**: Rich gradient from emerald green (`#248675`, `#27b373`) to deep oceanic navy (`#215877`, `#243e6c`, `#282560`, `#0d2745`).
- **Meeting Logo**: 3D cube logo with white lettering on the top-left (interactive toggle to Results mode).
- **KSU Logo**: King Saud University cyan crest with white Arabic sub-lines on the top-right (interactive gateway to Admin panel).
- **Title**: Arabic display typography ("ذكاء يُبتكر") with cyan neon lettering ("AI INNOVATION COMPETITION") and thin white divider line.
- **Real-Time Sync**: Instantaneous zero-refresh updates across all connected devices via Socket.io.

---

## 🖥️ System Architecture (أقسام النظام)

The system consists of three views unified on a single port:

```
                                  ┌────────────────────────┐
                                  │   Socket.io & Server   │
                                  │      (Port 3000)       │
                                  └───────────┬────────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    │                         │                         │
                    ▼                         ▼                         ▼
         ┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐
         │ 🖥️ Big Screen (16:9) │   │  📱 Mobile Voting   │   │  ⚙️ Admin Panel     │
         │  Path: / or /screen │   │     Path: /vote     │   │    Path: /admin     │
         │                     │   │                     │   │                     │
         │ • Idle/Attract Mode │   │ • RTL Arabic first  │   │ • Protected by PIN  │
         │ • Results Bar Mode  │   │ • English toggle    │   │ • Options manager   │
         │ • QR Code Badge     │   │ • Big touch cards   │   │ • Voting state      │
         │ • Rolling Counter   │   │ • One-vote lock     │   │ • Reveal mode       │
         │ • Particle Canvas   │   │ • No login required │   │ • CSV / JSON export │
         └─────────────────────┘   └─────────────────────┘   └─────────────────────┘
```

---

## 🚀 Quick Start (تشغيل النظام)

### Requirements
- **Node.js**: v18.0.0 or newer (tested on Node v22)
- **NPM**: v9 or newer

### 1. Installation
```bash
npm install
```

### 2. Build & Run
To compile the frontend bundle and start the live voting server:
```bash
npm run dev
```

The system will start and display the access URLs:
```
======================================================
🚀 AI Innovation Competition - Live Voting System
======================================================
🖥️  Big Screen:   http://localhost:3000/
📱 Mobile Vote:  http://<LAN-IP>:3000/vote
⚙️  Admin Panel:  http://localhost:3000/admin
🔑 Admin PIN:    2026
======================================================
```

---

## 📱 URLs & Navigation

| Screen | Route | Description |
|---|---|---|
| **Big Screen** | `http://localhost:3000/` | 16:9 stage with Idle Mode, live votes counter, and QR code. Press **`R`** or click the meeting cube logo to toggle Results Mode. Press **`F`** for Fullscreen. |
| **Mobile Voting** | `http://localhost:3000/vote` | Mobile page reached by attendee phones when scanning the big-screen QR code. Supports RTL Arabic & English. |
| **Admin Panel** | `http://localhost:3000/admin` | Or click the KSU logo (top-right) on the Big Screen. Protected by PIN. |

---

## 🔑 Environment Variables

Create a `.env` file in the root directory (optional, sensible defaults provided):

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | Port for the HTTP server and WebSocket. |
| `ADMIN_PIN` | `2026` | PIN code required to open and control the Admin panel. |

---

## 🗳️ Voting Logic & Rules

### Seed Options (5 Candidates)
1. **دوائي الذكي**
2. **RxCompass Ai \| بوصلة الصرف الذكي** *(Rendered on two lines: Latin "RxCompass Ai" on top in LTR, Arabic "بوصلة الصرف الذكي" below in RTL)*
3. **جسور**
4. **MedCompanion**
5. **PharmGuard AI**

### Anti-Cheat & Frictionless Security
- **No Personal Data Collected**: Respects participant privacy.
- **Device Fingerprint + LocalStorage Token**: Attendees cannot vote multiple times by simply refreshing or closing the browser.
- **Server-Side Enforcement**: Server validates both the persistent voter token and device fingerprint hash, backed by IP rate limiting to prevent automated spamming.
- **Locked State**: Once voted, attendees see an animated success screen with their voted project name. They cannot vote again unless the admin clears voter locks.

---

## 🎬 Keynote-Level Animations & Audio

- **60fps GPU Ambient Canvas**: Shimmering light particles floating gently across the gradient, with traveling light waves across the pattern tiles.
- **Mode Transition (Idle ↔ Results)**: Spectacular keynote sequence — the cube logo spins 360°, a radial shockwave washes across the screen, the Arabic title sweeps smoothly, and ranked horizontal bars glide in with spring easing.
- **FLIP Live Re-ordering**: When votes arrive while viewing Results mode, option bars smoothly slide into their new rank positions without jumping.
- **Reveal Ceremony Mode**: Admin can hide rankings and reveal candidates from 5th place up to 1st place one by one, culminating in explosive digital confetti for the winner!
- **Procedural Web Audio API Synthesizer**: 100% offline procedural audio (vote chime, transition whoosh, reveal tension sweep, and triumphant celebration fanfare). Muted by default; toggleable in the Admin panel.

---

## 📋 Day-of-Event Operation Checklist (دليل تشغيل يوم الحفل)

### Before the Event (التجهيز المسبق)
- [ ] Connect the display laptop to the venue projector/LED screen via HDMI/DisplayPort.
- [ ] Ensure the laptop is on the same local Wi-Fi / LAN network as attendees, or use a hotspot / venue Wi-Fi router.
- [ ] Run `npm run dev` in the terminal.
- [ ] Open `http://localhost:3000/` in Google Chrome or Microsoft Edge.
- [ ] Press **`F`** to enter Fullscreen mode (the mouse cursor automatically hides after 3 seconds of inactivity).
- [ ] Click the KSU logo (top-right) and enter PIN `2026` to verify the Admin panel opens.
- [ ] Verify that the QR code displays the correct URL (e.g., `http://<Wi-Fi-IP>:3000/vote`). You can update the URL in Admin settings if using a custom domain.

### Rehearsal (التجربة والبروفة)
- [ ] Open Admin → Overview → Click **"تفعيل وضع التدريب (Test Mode)"**.
- [ ] Click **"+ محاكاة صوت عشوائي (Simulate Vote)"** several times.
- [ ] Verify that the rolling counter increments smoothly and the background triggers a ripple effect.
- [ ] Press **`R`** to toggle into Results Mode and observe the transition and ranked bar re-ordering.
- [ ] Click **"تصفير أقفال الأجهزة (Clear Locks)"** or **"تصفير شامل (Reset All)"** to return all options to 0 votes before attendees enter.

### During the Live Competition (أثناء المسابقة)
- [ ] Keep the screen on **Idle Mode** (`http://localhost:3000/`) so attendees can see the QR code and scan to vote.
- [ ] Ensure Voting State is **"فتح التصويت (Open)"**.
- [ ] When the voting time is up, click **"إيقاف مؤقت (Paused)"** or **"إغلاق التصويت (Closed)"** in Admin.
- [ ] Switch to **Results Mode** (Press **`R`** or click the meeting cube logo) to display the live rankings.
- [ ] *(Optional)* Use **Reveal Mode** to reveal 5th place → 4th place → 3rd place → 2nd place → 1st place (with celebratory confetti!).
- [ ] Click **"تحميل Excel (CSV)"** to save a permanent record of the results.

---

## 🌐 Venue Offline & Cloud Deployment

### 100% Local / Venue Offline Mode (No Internet Needed)
The app is engineered to run completely offline on a venue laptop connected to a local Wi-Fi router or switch:
- Local fonts bundled
- Web Audio API procedural synthesis (no external audio files)
- Vector SVGs and local assets
- SQLite/JSON file-backed persistent store

### Deploying on Vercel
This repository is pre-configured with [`vercel.json`](vercel.json) and a dedicated serverless function in [`api/index.js`](api/index.js):
1. Go to [Vercel](https://vercel.com) and click **"Add New Project"**.
2. Import this GitHub repository: `Mohanned-Mahmoud/KSU-VOTING`.
3. Under **Environment Variables**, add:
   - `DATABASE_URL`: Your Neon PostgreSQL connection string (`postgresql://...`)
   - `ADMIN_PIN`: `2026` (or your preferred operator PIN)
4. Click **Deploy**. Vercel will build the frontend with `scripts/build.js` and serve both static assets and API routes globally!

### Cloud Deployment (Render, Railway, Fly.io, or VPS)
To deploy as a continuous Node.js server with WebSockets:
1. In Railway / Render / Fly.io:
   - Build command: `npm run build`
   - Start command: `node server/index.js`
   - Set environment variables:
     - `DATABASE_URL`: `postgresql://...`
     - `ADMIN_PIN`: `2026`
2. The server serves both the WebSocket real-time engine and the compiled static app on the single specified `PORT`.

