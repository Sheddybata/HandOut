# AI Study Assistant — Next Steps & Structure

## Code structure (current)

```
handout/
├── app/
│   ├── layout.tsx          # Root layout, skip link, viewport, AppShell
│   ├── page.tsx             # Home → AIStudyAssistant
│   ├── saved/page.tsx       # Saved (placeholder)
│   ├── profile/page.tsx     # Profile (placeholder)
│   └── globals.css          # Base styles, focus-visible, shimmer, touch-target
├── components/
│   ├── AppShell.tsx         # Mobile container + bottom nav (Home | Saved | Profile)
│   ├── AIStudyAssistant/
│   │   └── AIStudyAssistant.tsx   # Upload / Summary / Quiz tabs + content
│   └── ui/
│       └── SkeletonLoader.tsx     # Shimmer placeholders (text, bullet)
├── lib/
│   ├── studyTypes.ts        # Shared types (summary + quiz)
│   └── utils.ts             # cn() for class names
├── tailwind.config.ts
├── next.config.js
└── package.json
```

**Removed in cleanup:** Unused Tailwind color `trust-blue-light`, redundant `:root` CSS variables, global 48px rule on all `a[href]` (replaced with buttons/role only + `.touch-target` for nav), SkeletonLoader `card` variant.

---

## UI improvements applied (global standards)

- **Accessibility (WCAG):**
  - **Skip to main content** link (2.4.1 Bypass Blocks).
  - **Visible focus** via `:focus-visible` (2.4.7 Focus Visible).
  - **Touch targets** ≥ 48px for primary controls (2.5.5 Target Size).
  - **Semantic structure:** `<main id="main-content">`, tab panels with `role="tabpanel"`, `aria-selected`, `aria-current="page"` on nav.
- **Base styles:** 48px minimum only on `button` and `[role="button"]`; use `.touch-target` for key links (e.g. nav) to avoid breaking inline links.
- **Reduced motion:** Consider adding `prefers-reduced-motion` later to tone down Framer Motion.

---

## Suggested next steps (priority order)

### 1. Backend & data
- **Upload API:** `POST /api/upload` (multipart) → store file or forward to AI pipeline; return `handoutId` and optionally poll for status.
- **Summary API:** `GET /api/handouts/:id/summary` (and/or generate via AI). Summary is **content-only** (no YouTube or other external links).
- **Quiz API:** `GET /api/handouts/:id/quiz` for questions; `POST /api/handouts/:id/quiz/submit` to store score/answers.
- **Download PDF:** `GET /api/handouts/:id/summary.pdf` or generate on demand; wire “Download PDF Summary” to it.

### 2. Auth & persistence
- **Auth:** Add login/sign-up (e.g. NextAuth, Clerk, or Bata Learner’s existing auth). Gate “Saved” and “Profile” or make them useful only when signed in.
- **Saved:** Persist “saved” summaries/quizzes per user; Saved page lists them and links to view/retake.
- **Profile:** Account details, change password, notifications, data-saver preference.

### 3. UX enhancements
- **Scan Handout:** Use device camera (e.g. `getUserMedia` or native file picker with `capture="environment"` on mobile) and send captured image to upload API.
- **Error & loading:** Toasts or inline messages for upload failure, summary/quiz load errors, and network errors.
- **Offline / data saver:** Cache summary text; optional “Lite” mode (no auto-download of heavy assets).
- **Reduced motion:** `@media (prefers-reduced-motion: reduce)` to shorten or disable Framer Motion.

### 4. Integration with Bata Learner
- **Route:** Mount this experience at a course-specific route (e.g. `/courses/[courseId]/assistant` or `/handout`).
- **Course context:** Pass `courseId` / `courseCode` from LMS so header and APIs use the right course.
- **Global nav:** If Bata Learner has its own header/drawer, align AppShell bottom nav with it or replace with LMS nav.

### 5. Testing & quality
- **E2E:** Playwright or Cypress for: upload → summary → quiz flow, empty states, nav.
- **A11y:** axe-core or Lighthouse; fix any remaining issues.
- **i18n:** If targeting multiple languages, extract strings and add locale for Nigerian languages where needed.

---

## Quick reference

- **Add a new page:** Create `app/<route>/page.tsx`; add to bottom nav in `AppShell.tsx` if it should be in the bar.
- **Study types:** Shared summary/quiz types are in `lib/studyTypes.ts`.
- **Theme:** Trust Blue `#2563eb`, Slate grays, `rounded-intermediate` (14px) / `intermediate-lg` (16px) in `tailwind.config.ts`.
