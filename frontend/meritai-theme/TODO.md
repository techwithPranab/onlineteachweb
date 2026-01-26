# MeriTai Theme Migration - TODO

This is the canonical MeriTai theme TODO (migrated from `frontend/vedantu-theme/TODO.md`).

Goal: Convert all student-facing pages to a MeriTai-inspired visual language (clean white backgrounds, purple-indigo primary, orange CTAs, subtle gradients, card-based layout).

Priority list (pages and tasks):

1. High Priority (header/title + page background + primary CTA)
   - StudentDashboard.jsx (done)
   - ProgressReports.jsx (minor updates done)
   - SubscriptionManagement.jsx (done)
   - QuizListing.jsx (done)
   - QuizHistory.jsx (done)
   - CourseListing.jsx (done)

2. Medium Priority (update banners, small icon gradients, tables colors)
   - QuizAttempt.jsx
   - QuizSetup.jsx
   - QuizResults.jsx
   - CourseDetail.jsx (done)
   - UpcomingSessions.jsx
   - SessionDetail.jsx

3. Low Priority (demo pages, historical variants)
   - GenZThemeDemo.jsx
   - QuizHistory_Enhanced.jsx
   - QuizHistory_Old.jsx

Tasks for each page:
- Replace large background gradients (purple->pink->blue or emerald->teal->cyan) with `bg-white` or `bg-gray-50` where appropriate.
- Use `bg-gradient-to-r from-purple-600 to-indigo-600` for title gradients and thin top bars (use `.meritai-bar`).
- Use `bg-gradient-to-br from-purple-500 to-indigo-500` for small icon backgrounds.
- Update CTA classes to `meritai-btn-primary` (purple background) or `meritai-btn-accent` (orange) which will be added to the theme CSS.
- Update hover states and active states to purple/indigo variants.
- Verify Recharts colors where used (switch lines to purple/indigo/amber) for consistent look.

Notes:
- Add MeriTai variables and utility classes to `src/styles/genz-theme.css` under a new `/* MeriTai Theme */` section.
- Run a build and visual spot checks for pages after each batch of changes.

Planned implementation order:
1. Add MeriTai variables + utility classes to `genz-theme.css`.
2. Update high/medium priority pages (replace gradient strings and CTA classes).
3. Run `npm run build` and fix any CSS or JSX issues.
4. Iterate on colors / minor spacing / icons where needed.

- Replace any remaining `vedantu-` class names in the codebase with `meritai-` equivalents and prefer components (`MeritaiButton`, `MeritaiCard`) where repeated gradient/button/card patterns exist.

If you'd like, I can:
- Remove the legacy `vedantu-theme` folder (I left it as a soft redirect for safety),
- Add a short migration checklist and PR description,
- Or start sweeping the remaining pages and replace more repeated gradient patterns with `Meritai` components.
