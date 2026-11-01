# AI Innovation Competition - Live Demo & Testing Script
### سيناريو تجربة واختبار كافة مزايا نظام التصويت المباشر

This walkthrough script guides you through testing every feature of the live voting system step by step.

---

## 🏁 Step 1: Launch the System

1. Open your terminal in the project directory:
   ```bash
   npm run dev
   ```
2. Verify that the terminal logs confirm the server has started on port 3000:
   - Big Screen: `http://localhost:3000/`
   - Mobile Vote: `http://localhost:3000/vote`
   - Admin Panel: `http://localhost:3000/admin`
   - Default PIN: `2026`

---

## 🖥️ Step 2: Verify Big Screen Idle (Attract) Mode

1. Open `http://localhost:3000/` in Google Chrome or Microsoft Edge.
2. Press **`F`** to toggle fullscreen mode.
3. Observe the exact branding match with `assets/reference/full-screen-mockup.png`:
   - **Top Band**: Pure white background with faint pattern tiles visible.
   - **Lower Area**: Emerald green to oceanic navy gradient.
   - **Top-Left**: 3D Cube meeting logo with crisp white text ("6th Annual KSUMC Pharmacy Meeting").
   - **Top-Right**: King Saud University cyan crest with Arabic sub-lines ("المدينة الطبية الجامعية / الإدارة العامة للخدمات الصيدلية").
   - **Centerpiece**: Glowing cyan neon text ("AI INNOVATION COMPETITION"), thin white divider line, and large white Arabic title ("ذكاء يُبتكر").
   - **Bottom-Right**: Glassy floating QR code card with clear CTA ("امسح الكود وصوّت / Scan to vote").
   - **Bottom-Left**: Live counter badge showing current total votes with an active green pulse.
   - **Background**: Ambient 60fps canvas particles floating gently upward and a traveling light wave across the pattern.
   - **Inactivity**: Notice the mouse cursor fades out automatically after 3 seconds of inactivity.

---

## 📱 Step 3: Test Mobile Voting Flow (Attendee Experience)

1. Open a new browser window or mobile tab and navigate to `http://localhost:3000/vote`.
2. Notice the RTL Arabic layout:
   - Meeting cube branding at top.
   - Language toggle: Click **"English"** to switch UI into English, then click **"عربي"** to switch back to Arabic.
   - Connection status: Green indicator dot confirms real-time connection.
3. Review the 5 candidate projects:
   - Notice Candidate 2 (`RxCompass Ai | بوصلة الصرف الذكي`) displays cleanly on two lines:
     - Top line: **"RxCompass Ai"** in LTR Latin typography.
     - Bottom line: **"بوصلة الصرف الذكي"** in RTL Arabic typography.
   - Unicode bidi isolation prevents diacritics or punctuation from scrambling.
4. Tap on **"RxCompass Ai"**:
   - The card illuminates with an emerald/cyan border glow and checkmark icon.
5. Tap **"تأكيد واختيار هذا المشروع"** at the bottom:
   - A modal dialog appears asking: *"هل أنت متأكد من اختيارك؟"*
6. Tap **"نعم، صوّت الآن"**:
   - An animated green checkmark appears with the celebratory title: *"شكراً لمشاركتك!"*
   - The screen shows the project you voted for and indicates that results are live on the main stage screen.
7. Refresh the page or try to vote again:
   - Notice the page remembers your device and stays safely locked on the thank-you screen.

---

## ⚡ Step 4: Verify Live Big Screen Reaction

1. Look back at the Big Screen (`http://localhost:3000/`):
   - Notice the **Live Counter** at the bottom-left smoothly rolled up from `0` to `1` with a cyan pulse!
   - A radial light shockwave ripple expanded outward across the pattern tiles upon vote submission.

---

## 🎬 Step 5: Test Keynote Transition (Idle ↔ Results Mode)

1. On the Big Screen, click the **Meeting Cube Logo** (top-left) or press keyboard key **`R`**:
   - A transition whoosh sound effect plays (if sound is enabled).
   - The cube logo executes an interactive 3D spin.
   - A radial light shockwave sweeps across the screen.
   - The Arabic title sweeps out and the **Results Board** glides in with smooth spring physics!
2. In Results Mode:
   - Candidate 2 (`RxCompass Ai`) is crowned in **1st Place** with a gold trophy badge 🥇 and amber glow.
   - The horizontal bar shows `1 صوت` and `100.0%`.
   - Other candidates are ranked below with elegant glassy bars.
3. Press **`R`** again to return to Idle Mode with the reverse transition sequence.

---

## ⚙️ Step 6: Test Admin Panel & Option Management

1. On the Big Screen, click the **KSU Logo** (top-right) or press keyboard key **`A`** (or open `http://localhost:3000/admin`).
2. An overlay appears requesting the Admin PIN.
3. Enter `2026` and click **"تأكيد الدخول"**:
   - The full glassy dark dashboard opens with 5 tabs.
4. Test Tab 1 (**نظرة عامة والتحكم**):
   - Test Voting State: Click **"إيقاف مؤقت (Paused)"**. Notice on your mobile tab (`/vote`) the screen immediately updates to *"التصويت متوقف مؤقتاً"*!
   - Click **"فتح التصويت (Open)"** to resume.
5. Test Tab 2 (**إدارة الخيارات**):
   - Click **"إضافة مشروع جديد"**. Enter title *"فارما تك AI"* and subtitle *"نظام التوصيات السريرية"*. Click Add.
   - The new candidate immediately appears in the list and is accessible for voting!
   - Test Reordering: Use the Up / Down chevron buttons to change option order.
   - Test Manual Correction: Click on an option's vote badge (e.g. `1 صوت`), change it to `5`, enter reason *"فرز ورقي"*, and confirm. The count updates instantly with an entry logged in the audit trail.

---

## 🏆 Step 7: Test Reveal Ceremony Mode (إعلان الفائزين)

1. Open Admin Panel → Navigate to Tab 4 (**مراسم إعلان الفائزين**).
2. Toggle on **"تفعيل وضع الكشف التدريجي على الشاشة"**.
3. On the Big Screen (in Results mode, press `R`):
   - Notice all candidates' names are masked with *"قيد الكشف... (???)"*.
4. In Admin, click **"+ كشف المركز التالي"**:
   - The lowest ranked candidate (5th place) is revealed on the big screen!
5. Continue clicking **"+ كشف المركز التالي"** for 4th, 3rd, and 2nd place.
6. Click to reveal **1st Place**:
   - The champion option illuminates in gold with the trophy badge, a triumphant fanfare plays, and confetti bursts across the screen!

---

## 🧪 Step 8: Test Mode & Simulated Votes Rehearsal

1. In Admin Panel → Tab 1 (**نظرة عامة**):
2. Click **"تفعيل وضع التدريب (Test Mode)"**:
   - Notice the amber *"وضع التجربة والمحاكاة - TEST MODE"* badge appears at the top of the Big Screen.
3. Click **"+ محاكاة صوت عشوائي"** 5 to 10 times in rapid succession:
   - Notice on the Big Screen how the rolling counter counts up continuously.
   - When viewing Results mode, observe the **FLIP live re-ordering**: bars smoothly slide past each other into their updated rank positions with zero jank or jumping!

---

## 💾 Step 9: Export Data & Reset for Event

1. In Admin Panel → Tab 1:
   - Click **"تحميل Excel (CSV)"**: Downloads a formatted CSV file with Arabic UTF-8 BOM, ready to open in Microsoft Excel with ranks, candidate names, vote counts, and percentages.
   - Click **"تحميل JSON"**: Downloads complete structured JSON data including the full audit trail.
2. In Admin Panel → Tab 5 (**سجل العمليات وإعادة الضبط**):
   - Click **"تصفير أقفال الأجهزة (Clear Locks)"**: Clears attendee voting locks so participants can vote again without deleting vote totals.
   - Click **"تصفير شامل لكافة الأصوات (Reset All)"**: Type `RESET` and confirm. All option vote counts return to `0`, voter locks are cleared, and the system is in clean state for the event!
3. Close the Admin modal (click X or press `Escape`).
4. The system is ready for the audience!

