# Project Rules

## Authentication & PWA Guardrails
- **DO NOT** modify the authentication logic in `src/pages/Login.tsx` (especially the Google Sign-In, watchdog timer, and `signInWithPopup` handling) without explicit user permission. The current setup is uniquely configured to handle Android PWA hanging popup bugs.
- **DO NOT** change the `navigateFallback` or `navigateFallbackDenylist` settings inside `vite.config.ts`. The Service Worker must not intercept `/__/` URLs, otherwise Firebase Auth popups will break.
- **DO NOT** reintroduce `signInWithRedirect` as it breaks the PWA experience by opening external browser tabs.
- Always assume `firestore.rules` must be manually deployed by the user via the Firebase Console since the CI/CD pipeline only deploys Firebase Hosting.
