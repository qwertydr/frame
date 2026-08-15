# Research Bootcamp Static Portal

## Security limitation
This is a client-side/static implementation. It is **not suitable for protecting real passwords or confidential course content**. The browser must receive the user JSON and JavaScript, so a participant can inspect or alter them. localStorage is also user-controlled.

The random lesson URL is only a UX/session deterrent. It is not authorization. Right-click/F12/Ctrl+U blocking is also only a deterrent and cannot stop DevTools or source inspection.

For production, move authentication and authorization to a server (PHP/Node + MariaDB/MySQL), store password hashes (Argon2id/bcrypt), use Secure/HttpOnly/SameSite cookies, and authorize every lesson server-side.

## Run locally
Do not open `index.html` using `file://`.

From this folder:

    python -m http.server 8080

Then open:

    http://localhost:8080/

Demo:
Email: student@example.com
Password: DemoPass123!

## Customize
- `data/users.json`: participant profile and language.
- `data/modules.json`: curriculum, topics, and Vimeo player URLs.
- `data/timeline.json`: deadlines and submission/guideline URLs.
- `assets/app.css`: responsive design.
- `assets/app.js`: portal behavior.

Language values in the sample are `en`, `bn`, and `hi`.
