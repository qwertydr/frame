# IARCO 2026 Research Bootcamp Portal v5

## Run
Serve this directory over HTTP, not file://:
`python -m http.server 8080`

Open `http://localhost:8080/`.

## Demo
Email: student@example.com
Password: DemoPass123!

## v5
- app.js rebuilt from scratch.
- Login prefetches users/modules/timeline before dashboard.
- Loading animation.
- Multiple languages per user.
- Live EST (UTC-05:00) countdown.
- Timeline in sidebar and dashboard.
- Submit + Rules links.
- First-login 3-step Next/Skip introduction.
- IARCO 2026 sponsor links.
- #003366 / #ffd700 theme.
- Custom Vimeo presentation and controls.
- Logo watermark with fallback.
- Temporary lesson routes and expiry.
- Right-click/common shortcut deterrents.

## Important security limitation
Static HTML/JavaScript cannot make browser source, Vimeo iframe URLs, or network requests impossible to inspect. Real authentication and video access control require a server-side architecture.
