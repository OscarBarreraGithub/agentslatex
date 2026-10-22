# Original prototype UI acceptance — 2026-10-21

Historical evidence for the original anonymous prototype. The GitHub workspace has
separate current evidence in [GITHUB_ACCEPTANCE.md](GITHUB_ACCEPTANCE.md).

## Observed in the built app, Chrome 155 on this Mac

- Local static production build opens at 127.0.0.1:4390.
- CodeMirror shows editable source left; PDF.js renders the actual PDF right.
- The default math/TikZ document compiles and renders correctly; screenshot inspected.
- Editing marks the previous PDF as Earlier edit.
- A deliberately undefined command reports Build failed while retaining the old PDF.
- Removing that command restores a successful build and Up to date status.
- An intentionally endless TeX loop can be stopped with Stop. The button releases the
  UI immediately; a new successful build works after correcting the source.
- Source draft survives reload. Export project downloads a ZIP; its source was checked
  to contain the valid document without the deliberate failing commands.
- Representative final production demo build: 0.97s compilation + 0.73s local engine load.
  These are one-machine observations, not internet or Windows timings.

## Compiler versus viewer versus picker

The 32-case compiler/PDF-validation matrix passed separately in Chrome and Safari.
Rendered fixture inspection covered TikZ, a 3D surface, automatic Lua graph layout,
page 200 of the long document and page 60 of the large-image fixture.

The native macOS file-selection step remains **unverified**. Open files and Open folder
invoke their native dialogs, but Open/Upload stayed disabled during computer-control
selection in both browsers, including a private test copy outside Documents. This was
also seen against the built app, so development reloads do not explain it. No browser
security setting or filesystem permission was changed. A manual selection check has
been requested. Do not claim that a real user's file import was accepted end to end.
The application file parser/path validation and compiler multi-file fixtures are separate
passing checks, not a substitute for that native-dialog acceptance.

Safari's built editor also compiled and rendered the math/TikZ demo; the final screenshot
was inspected. One observed build took 1.19s compilation plus 1.05s local engine load.
A tab still holding development-server modules initially failed to load its PDF worker
after switching the server to the static build. Reloading onto the production build
resolved that stale-tab failure; no source change was needed.

## Not established

Physical Windows/phone acceptance; a responsive viewport matrix; page selection in the
editor for a 200-page imported project; real hosted cold downloads; generic authoring
provenance/highlight integration; agent/Git synchronization; exact native-font parity.
These remain explicit follow-ups, not implicit failures of the successful compiler tests.
