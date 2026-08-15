# IARCO Portal v6
Use `python -m http.server 8080` and open `http://localhost:8080/`.
Configure global branding in `data/config.json`. Timeline `rules` power the submission modal. Modules can contain `lectures`; each lecture can have `resource`, and empty resources are hidden.


## V10 UI updates
- Sidebar Submit and Rules actions are compact and inline.
- Countdown now displays `Time left:` before the timer.
- Added responsive sponsor header driven by `data/config.json` -> `sponsorLogos`.
- Logout button is compact.
- Vimeo player now includes play/pause, mute, volume, progress seeking, current time, remaining time, playback speed, and fullscreen controls.

### Sponsor logo configuration
Put the actual logo files at the paths configured in `sponsorLogos`, for example:
`assets/sponsors/savemyexams.png`
`assets/sponsors/domainme.png`
