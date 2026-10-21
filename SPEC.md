# Product specification

## Purpose

A simple place to edit and read scientific LaTeX, with agents working through familiar
files and tools. The UI should feel quiet and predictable: source left, PDF right,
minimal controls, dark application chrome, original white PDF pages. No QUARK or
managed-agent framework. No model calls merely to read, edit, compile, or navigate.

## This working slice

- Browser compilation using pinned TeXlyre BusyTeX 1.4.1 and TeX Live 2026 assets.
- Localhost serves static UI/compiler files; the browser does the compilation CPU work.
- CodeMirror source editing, file and folder import, main-file and engine selection.
- Compile, Stop, readable errors, optional debounced auto-build, timings and PDF download.
- Original source files stay untouched; editable browser draft persists, with ZIP export.
- PDF.js renders one selected page at a time, preserving vector diagrams and text.
- Old PDF remains readable after an edit/error but never claims to match newer source.
- A fixture-driven, reproducible browser compatibility/performance laboratory.
- Mac/Windows portable source and setup; actual platform acceptance must be reported.

## Authoring contract

`latex-specs.md` is authoritative for agents. Prefer supported features rather than
inventing a separate native build pipeline. Document missing packages/tools clearly.
A compiler success proves a PDF was produced, not that its scientific claims are true.

## Later, preserve these requirements

- GitHub remains the version-control and sharing system. Ordinary project files stay
  useful outside this UI. Slow/checkpoint synchronization is acceptable initially;
  real-time simultaneous editing is not required for the MVP.
- Frankenstein review: toggle subtle passage highlights on the actual PDF; select a
  passage to see source-paper page/region, attribution and separate human checks.
- Keep stable passage identifiers and content/version bindings. Changed passages stale
  their checks. Do not infer authorship or scientific truth from a compile receipt.
- SyncTeX gives source/PDF locations; a provenance sidecar supplies evidence and authorship.
  Untracked edits remain unknown until attributed. Agents keep native editing tools.
- Each PDF must be associated with the complete source snapshot and compiler settings
  used to build it, including included files/images. A main.tex hash alone is insufficient.
- Agent connections may be optional skills/MCP. They must not require a proprietary
  manager, replace native tools, or imply every filesystem write is tracked automatically.
- Phone/shared reading, GitHub authentication and sharing, live disk-folder connections,
  and hosted agentlatex.com access are subsequent slices, not delivered features.

## Keep it small

No cloud TeX service, hidden model summarization, or app-specific document format in this
slice. Do not upload private manuscripts as test fixtures. No paid hosting required.

Open design todo: the owner will supply the final document/workspace folder structure.
The current application source layout is provisional; do not reorganize existing SWA
files or manuscripts to impose it.
