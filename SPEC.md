# Product specification

## Purpose

A quiet workspace for scientific LaTeX: source left, real PDF right, visible files,
dark chrome and ordinary white PDF pages. GitHub is the account, sharing and version
control system. The browser does the compilation. Reading/editing/compiling makes no
model calls. No QUARK, agent manager or app-specific manuscript format.

## Current implementation

One project corresponds to one GitHub repository. New projects are private and owned
by the signed-in person, with paper/main.tex, figures/, references.bib and agent guides.
Existing repositories retain their layout. Repository access comes from GitHub and
selected GitHub App installations; every server operation uses a user access token.

Sign-in → optional existing-paper connection → projects / New project → file tree,
CodeMirror editor and PDF viewer. There is no hosted guest editor. Browser drafts are
separate by numeric GitHub user/repository ID. Save checkpoints the exact loaded base;
Refresh preserves nonconflicting edits and asks which version to keep for overlapping
files. Neither operation force-pushes. No automatic polling in this first slice.

Compile loads pinned TeXlyre BusyTeX 1.4.1 / TeX Live 2026 in a browser worker. Loading,
compiling and errors are visible; the previous PDF becomes stale after edits/failure.
Stop cancels work. File/folder import copies files, preserves relative paths and asks
before replacing browser copies. The source ZIP and PDF can be downloaded.

Agents use their normal GitHub/file tools. AGENTS.md, CLAUDE.md and manuscript reminders
require paired `% agentlatex:begin agent id=...` / `% agentlatex:end id=...` comments.
Tagged passages are Agent; everything else is Manual. This convention depends on agent
compliance and is not cryptographic proof of authorship. The source highlight toggle
shows tags; PDF attribution and detailed provenance are later work.

## Infrastructure

Cloudflare Worker serves UI/API; D1 stores expiring sessions, OAuth state and project
registration metadata. GitHub tokens are encrypted server-side; they never reach browser
JavaScript. Free Static Assets hold the UI and versioned compiler downloads. No R2.
Papers live in GitHub plus browser drafts. No cloud compiler or cloud agent execution.
Workers/D1 must stay on Free: at capacity the service stops rather than billing
overages. See docs/COST_POLICY.md. Domain registration/renewal is separate.

## Acceptance and later work

Implementation is not deployment acceptance. Track current verification and remaining
external setup in docs/GITHUB_ACCEPTANCE.md. Physical Windows/phone use, hosted cold
loads, real collaborator onboarding and token expiry need explicit evidence.

Preserve later Frankenstein requirements: subtle PDF passage highlights, source-paper
page/region evidence, separate human checks, stable passage IDs, and source-version
binding. A compile result says nothing about scientific validity. Coediting, custom MCP
and cloud ChatGPT connectors must not delay the basic GitHub workflow.

Open design todo: the owner will supply the final document/workspace folder structure.
The current source layout is provisional. Do not reorganize SWA or existing manuscripts.
