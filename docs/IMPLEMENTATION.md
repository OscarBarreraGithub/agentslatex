# GitHub workspace — active slice

Account = GitHub identity. One project = one repository; new repositories are private
and user-owned. Existing repositories are connected in place. GitHub controls access.
No guest project editing on the hosted site. No custom agent MCP in this slice.
Owner decision: browser-agent GitHub integration is supported for repository owners
only for now. Collaborators use agentlatex.com, an authorized Codex/Claude Code Git
workflow, or the browser-import bundle handoff. No new MCP implementation is planned
for this limitation. The user confirmed Codex can edit the shared test repository;
this does not establish browser-connector access or every two-user save scenario.

Deliver connect → projects + New project / Connect existing → editor.
Visible file tree, ordinary agentlatex/main/ files, browser compilation, clear progress/errors.
New project = private repository + working template + root/nested agent instructions.
Agent passages use paired comments; other text is Manual. Detailed provenance later.

Use GitHub App user tokens server-side, selected repositories, secure sessions,
origin checks on writes, and non-force commits from the exact loaded base revision.
Preserve local drafts and show conflicts. GitHub stores papers; Cloudflare stores
sessions and the app/compiler assets. No server compilation or model calls.

Acceptance: connect, create, reopen, import files, edit, save, compile, refresh an
external change, refuse a conflicting save without losing the draft; verify access
checks and sign-out. Targeted tests and browser journey; no repeat compiler matrix.

## Checkpoint handoff

- AL-6, root: main folder/default document split implemented with legacy fallback,
  optional repository explorer, references to original files, safe file moves and
  folder-based onboarding. Compile targets the selected document; Markdown preview
  and non-compilable-file disabling included. See WORKSPACE.md for current evidence.
- AL-9, root: TODO by owner request. Design version-history UI later: GitHub checkpoints,
  useful diffs and agent-assisted change explanations/restoration. No implementation
  or model-driven history process in this slice.
- AL-7, root: project Prompts menu, conversation-import skill, searchable agent guides
  shared IMPORTS.md index, browser-connection guidance and selling-points copy bank. Scoped verification/deployment status is recorded in
  docs/PROMPTS.md; collaborator acceptance remains separate.
- AL-8, root: conservative automatic incoming refresh. 30s active / 120s idle,
  hidden/offline pause, serial requests and server-aware backoff. Dirty drafts wait
  for explicit review. Outgoing saves and compilation stay explicit. See docs/SYNC.md.

- AL-1, root: implementation and local fixture verified; see GITHUB_ACCEPTANCE.md.
- AL-2, root: live owner-account sign-in, private project creation, save/reopen and
  external GitHub conflict/refreshed-save checks passed. Next: first collaborator
  signs in with their own GitHub account and opens the shared repository.
- AL-3, root: Workers Free verified; R2 never activated. Static compiler packaging
  and hosted compile passed. Canonical https://agentlatex.com is live over HTTPS;
  Namecheap nameservers and approved root parking-record replacement are complete.
- AL-4, root: mobile file-selection/Refresh fixes implemented. Current header/dialog
  checked in 360×800, 412×915 and 915×412 emulation. Physical phone/Windows and the
  complete mobile file upload journey remain open.

- AL-5, root: deferred by the owner after the privacy discussion. Keep the current
  backend and record its operator-access boundary accurately; see SPEC.md. No
  encryption migration or permission revocation is underway.

The functional owner workflow passed and the owner retained the current design for
the pilot. This is not evidence of multi-user load, second-account acceptance or
complete device coverage. No further infrastructure purchase is needed for the pilot.
Detailed PDF attribution remains a later slice.

## Outstanding work audit — 2026-10-22

Owner for these app follow-ups: root. This audits AgentsLaTeX, not the older SWA backlog.
Evidence: current implementation plus GITHUB_ACCEPTANCE.md, WORKSPACE.md and PROMPTS.md.

- AL-9 — deferred: in-app version history, readable diffs and restoration. GitHub
  checkpoints already exist. Next: a small design for browsing GitHub history.
- AL-10 — deferred: full Frankenstein PDF passage/source-paper review and human
  approval records. Show AI currently highlights source; SyncTeX navigation is not
  provenance. Next: one passage linked to its exact source evidence and review state.
- AL-5 — owner-deferred: encryption/zero-operator-access redesign. Current trusted
  backend still has technical access; retain this boundary in product descriptions.
- AL-2 — verification pending: real invited collaborator saves/refreshes across two
  GitHub accounts, and a real existing-repo/file/folder import. Next: complete the
  owner's current pilot with the collaborator, preserving drafts and private files.
- AL-7 — verification pending: a real conversation imported end to end, followed by
  a second import without overwriting the first. Prompts, live docs, index convention
  and thorough chronological requests/outcomes instructions are implemented.
- AL-4 — verification pending: physical Windows/phone, real native file selection
  and drag/drop. Responsive emulation and alternative Move/Link controls passed.
- AL-11 — verification pending: real GitHub token rotation and full old-tab lazy-chunk
  failure/retry. Corresponding code/mocked checks exist; do not claim live acceptance.
- AL-12 — requested review pending: independent Opus sign-off has not been completed
  for AgentsLaTeX. Next: an explicitly scoped review with that model when available.
- AL-13 — new owner TODO: simple copyable workflows under Prompts, starting with
  **Check citations**. Verify each reference's existence and bibliographic identity
  (title/authors/year/DOI or arXiv ID), then inspect the cited paper to check that it
  actually supports the associated statement. Flag adjacent-but-wrong papers,
  misleading citation placement, metadata mismatches and unverifiable items. Return
  a readable claim-to-reference report with evidence locations and proposed fixes;
  never present inaccessible sources as checked. Use the person's usual agent, with
  a copyable prompt first; no background model service or one-click certification.

Current scope choices: GitHub/file tools rather than a custom MCP; 30-second active
incoming refresh rather than live coediting; explicit GitHub saves and PDF builds.
The app uses the repository's default/saved branch, not a forced branch named main;
there is no branch picker. Existing branches are not silently migrated. These are
implementation choices to state clearly, not evidence of unfinished synchronization.
Selling-point ideas are recorded; there is no automatic extraction of every historical
SWA conversation. No claim of broad load certification or complete native LaTeX parity.
