# Assets guide

All PNGs are transparent. Use them as-is (do not redraw, recolor or re-vectorize).

| File | Size | What it is | Used for |
|---|---|---|---|
| reference/full-screen-mockup.png | 1921x1260 | The final composed big-screen design. **Visual reference only**, not to be used as a background image in production. The top band is transparent: the page behind it must be WHITE. | Layout / proportions / colors to match exactly |
| background/background-pattern.png | 1921x1260 | Pattern + green->navy gradient, empty (no logos/text). Top band transparent over white. | Idle/results background |
| logos/meeting-logo-cube-with-text.png | 451x136 | 6th Annual KSUMC Pharmacy Meeting cube logo + white text beside it. | Top-left, click = Results toggle |
| logos/ksu-logo-full-with-arabic-lines.png | 196x128 | King Saud University logo INCLUDING the Arabic lines beneath it (المدينة الطبية الجامعية / الإدارة العامة للخدمات الصيدلية), exactly as in the mockup. White text on transparent. Do NOT recreate those lines as text. | Top-right, click = Admin |
| svg/cube-logo-only.svg | 134x136 vector | Cube logo alone, no text. | Cube animation: 3D spin, glow, shockwave origin |
| svg/meeting-logo-cube-with-text.svg | 450x136 vector | Cube + "6th Annual KSUMC Pharmacy Meeting" text, vector. Prefer over the PNG for sharpness at 4K. | Top-left, click = Results toggle |
| svg/background-pattern-full.svg | 1921x1254 vector, ~300KB, 880+ paths, 314 groups | The full pattern + gradient as vectors. Inspect its structure; split the pattern tiles/paths into individually animatable pieces for the intro assemble, shimmer waves, ripple on vote, and the shatter/sweep transition. Prefer over the PNG for 4K. Gradient colors seen: #248675 / #215877 / #243e6c / #27b373 / #282560 | Background + pattern animation |
| text/ai-innovation-competition-cyan.png | 657x61 | "AI INNOVATION COMPETITION" cyan lettering | Above the divider line |
| text/divider-line-white.png | 956x4 | Thin white line | Under the cyan text |
| text/title-arabic-white.png | 950x260 | "ذكاء يُبتكر" large white Arabic title | Main title |

Note: the white assets look blank on a white viewer. They are white on transparent; view them on a dark background.
