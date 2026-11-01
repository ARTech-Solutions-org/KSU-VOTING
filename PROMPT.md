# TASK: Build the "AI Innovation Competition" live voting system

You are working inside this project folder. Read `assets/README.md` first (it lists PNG and vector SVG versions of the background pattern and logos; prefer the SVGs for sharpness and for splitting the pattern into animatable pieces), then view `assets/reference/full-screen-mockup.png` (the target design) and every file inside `assets/`. Build everything inside this folder. Work autonomously: make sensible decisions, document them, and only ask me if something is truly blocking. Finish with a verified, runnable project.

Build a complete, production-quality web app for a live voting event, shown on a very large event screen (projector/LED wall, 16:9 landscape) plus a mobile voting page that attendees reach by scanning a QR code. Match the mockup's visual identity exactly and reuse the provided assets as-is (do not redraw or recolor them).

## 1. System overview
Three parts:
A) Big Screen (display page): idle/attract mode + results mode.
B) Mobile Voting page: opened via the QR code shown on the big screen.
C) Admin panel: opened by clicking the KSU logo (top-right) on the big screen, protected by a PIN.

Use a real-time backend (Firebase Realtime DB / Firestore, Supabase Realtime, or Node + WebSocket) so votes appear live on the big screen with no refresh. Choose the simplest reliable stack, and tell me how to run and deploy it. It must also run fully locally (e.g. `npm install && npm run dev`) in case venue internet is poor; document that option.

## 2. Voting logic
- A configurable list of "words" (options). Admin can add/edit/delete/reorder, enable/disable, with Arabic and English display names.
- Each attendee can vote a limited number of times, configurable globally by admin (default: exactly 1 vote total per person), with a toggle for whether the same option can be voted more than once.
- Enforce one-vote-per-person using device fingerprint + localStorage token + server-side check (IP/session rate limit as an extra layer). Show a friendly "thank you / you already voted" screen when the limit is reached. Reasonably hard to bypass, but collect no personal data.
- Voting states controlled by admin: open / paused / closed. The mobile page reflects the state live.

### 2.1 Initial voting options (seed data)
Pre-load these 5 options (all editable in admin):
1. "دوائي الذكي"
2. "RxCompass Ai | بوصلة الصرف الذكي" (display on two lines: "RxCompass Ai" in Latin on top, "بوصلة الصرف الذكي" in Arabic below; the "|" is only a data separator and is not displayed)
3. "جسور"
4. "MedCompanion"
5. "PharmGuard AI"

Display rules:
- Names mix Arabic and English: each must render in its own direction (RTL Arabic, LTR English) without scrambled punctuation or reordering on mobile, results bars, and admin. Use Unicode bidi isolation (`dir="auto"` / `<bdi>`) on every name.
- Long names must wrap gracefully and never overflow bars or buttons on big screen or mobile.
- Do not show rankings or counts on the mobile page, only a thank-you screen after voting.

## 3. Mobile voting page (RTL Arabic first, English toggle)
- Same visual identity (green-to-navy gradient, pattern, cube logo, cyan accents).
- Big tap targets, fast on slow connections, no login.
- Flow: welcome -> choose option(s) -> confirm -> animated success ("شكراً لمشاركتك") -> locked state.
- Handle: voting closed, already voted, offline/error with retry.

## 4. Big Screen: Idle (attract) mode
Reproduce the mockup layout exactly: white top band with faint pattern, green->navy gradient lower area, cube logo + "6th Annual KSUMC Pharmacy Meeting" top-left, KSU logo top-right (use `assets/logos/ksu-logo-full-with-arabic-lines.png`, which already includes the Arabic sub-lines), cyan "AI INNOVATION COMPETITION" with the thin white line under it, and the large Arabic title "ذكاء يُبتكر". Add a clear, tasteful QR code (to the mobile voting URL) with a short call to action ("امسح الكود وصوّت" / "Scan to vote") placed so it doesn't break the composition, plus a live total-votes counter.

STRONG, high-end animation (60fps, GPU-accelerated; GSAP / Framer Motion / Three.js / Canvas as appropriate):
- Cinematic intro on load: pattern elements assemble/draw in piece by piece, cube logo animates in with glow and slight 3D rotation, text reveals with masked/stagger reveal, the line under the title draws from center outward.
- Continuous ambient motion: slowly moving gradient, pattern tiles shimmering/pulsing with traveling light waves, floating particles, soft glow pulse on the cyan text, gentle breathing/floating loop on the cube.
- Live reaction: each new vote triggers a ripple/pulse across the pattern and a rolling-number increment on the counter.
- Must run smoothly for hours with no memory leaks. Scale to any large resolution (fixed 1920x1080 stage scaled to fit, or vw/vh/clamp; support up to 4K).

## 5. Big Screen: Results mode
- Triggered by clicking the meeting logo (cube, top-left). Click toggles Idle <-> Results (also keyboard shortcut R, and optional auto-cycle in admin).
- Shows every option with percentage and vote count, ranked high to low, as animated horizontal bars (or another elegant ranked visualization) in the same design language. Show total votes. Live re-sorting with smooth FLIP/position-swap animation; bars and numbers animate (count-up). Highlight top 3 (gold/silver/bronze or glow), special emphasis for #1.
- THE TRANSITION between Idle and Results must be the most spectacular animation in the app: e.g. pattern tiles shatter outward or sweep like a wave, the title "ذكاء يُبتكر" dissolves into particles that reorganize into the results layout, the cube spins and fires a light shockwave across the screen, then bars grow in with staggered easing and overshoot. Build a reverse transition results -> idle. ~2.5-3.5s total, cinematic, no jank, keynote-level.
- Optional "Reveal mode" in admin: results hidden and revealed one by one from last place to first with dramatic animation and sound-ready hooks.

## 6. Admin panel (modal/overlay opened by clicking the KSU logo)
Protected by a PIN (environment variable; default shown in README).
- Reset all votes (double confirmation). Reset votes for a single option.
- Reset voters' ability to vote again (clear vote locks) without deleting counts.
- Set max votes per person; allow same option multiple times toggle.
- Open / pause / close voting.
- Manage options (add, edit, delete, reorder, enable/disable, Arabic + English names).
- Toggle: show counts vs percentages only on big screen; show top N only.
- Toggle: auto-cycle idle/results every X seconds. Reveal mode toggle.
- Manually edit an option's count (correction tool) with an audit log.
- Live stats: total votes, unique voters, votes-per-minute chart, per-option breakdown.
- Export results CSV/JSON and a downloadable snapshot image of results.
- Regenerate/preview QR code and edit the voting URL.
- Edit event texts (title, subtitle) and swap logos.
- Test mode: simulate fake votes to rehearse animations, with a clear badge so it's never confused with real data.
- Full-screen toggle and "hide cursor after 3s idle" for the big screen.
Admin UI: clean, dark, glassy, matching the identity, usable on laptop or phone.

## 7. Extra requirements
- Anti-spam, rate limiting, basic bot protection.
- Offline-resilient big screen (keeps last state if connection drops, auto-reconnect indicator).
- Sound hooks (optional ambient + reveal sound, muted by default, toggle in admin).
- Correct Arabic RTL and shaping. Fonts matching the mockup: bold Arabic display font (Tajawal / Cairo / IBM Plex Sans Arabic) and condensed Latin (Barlow Condensed / Oswald). Bundle fonts locally (no runtime CDN dependency) for venue reliability.
- Mobile accessibility basics (contrast, focus states, respect reduced-motion on mobile only; the big screen always plays full animation).
- Loading and error states everywhere.
- Clean, commented, modular code.

## 8. Deliverables
- Working project in this folder with all three views and all assets wired in from `assets/`.
- Realtime sync verified (open big screen + several mobile sessions and show votes flowing).
- `README.md`: setup, env vars, local and cloud deployment, day-of-event operation checklist.
- `DEMO_SCRIPT.md`: step-by-step test of every feature, including test-mode votes.
- Work in this order, verifying each stage: (1) backend + mobile voting, (2) big screen idle + animations, (3) results + transitions, (4) admin panel, (5) polish, performance check, README.
