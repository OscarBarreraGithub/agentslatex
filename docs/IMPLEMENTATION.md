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
Visible file tree, ordinary agentlatex/ files, browser compilation, clear progress/errors.
New project = private repository + working template + one root agent instruction pointer.
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

- AL-14 — external review pending: Google Search Console flags Deceptive pages,
  with no sample URLs. Corrected the stale www parking target and canonical HTTPS
  redirects. Google confirmed “Request submitted successfully” for the authorized
  review on 2026-10-22. Next: check Google's result; do not submit duplicates or
  describe the browser warning as cleared. See GITHUB_ACCEPTANCE.md.

## Review hardening — 2026-10-22

A scoped code review (branch `review/hardening-2026-10-22`, by Claude Fable 5.1) looked
for incorrect implementations and subtle failure modes rather than new features. It is
not deployment acceptance and does not close AL-12. Changes, each with a unit test:

- Session refresh: a request that races a concurrent token rotation now re-reads the
  stored token after taking the lock instead of sending the consumed refresh token,
  which GitHub rejects and which deleted the session. A token that no longer decrypts
  (SESSION_KEY rotation) ends the session with 401 rather than 500 on every call.
- GitHub transport: non-JSON error bodies and fetch timeouts map to 503 with
  Retry-After instead of a generic failure; ref paths are encoded per segment so
  branch names containing `/` work; file streaming no longer carries a 30-second
  abort past the response headers, and the browser verifies size and Git blob ID of
  every downloaded file.
- Saves keep an existing file's executable mode. A project whose saved branch was
  renamed on GitHub follows the current default branch once instead of being
  unopenable; an existing non-default branch is still never redirected.
- Workspace: a `.agentlatex.json` edit that is not valid JSON yet stops rename, move,
  link, delete and settings changes with a readable message instead of being
  overwritten, connect returns a clear 400, and automatic refresh defers
  to manual Refresh; manual Refresh keeps unchanged blobs loaded; a restored draft
  shows Updates available immediately when its base is behind GitHub.
- Compiler: bibliography tooling is detected from uncommented source, so the starter's
  commented `\bibliography` line no longer triggers a bibtex run. Text that is not valid
  UTF-8 decodes as Windows-1252 instead of becoming replacement characters, is saved
  back in that encoding, and compiles with its legacy inputenc option read as utf8; a
  character that encoding cannot hold stops the save with a message naming the file,
  character and line instead of silently switching the file to UTF-8. SyncTeX forward
  lookup skips an opening vertical box.
- Layout and footprint (owner request): new projects use `agentlatex/` rather than
  `agentlatex/main/`, and the starter is five files — root AGENTS.md pointer block,
  `.agentlatex.json`, README, `main.tex`, `references.bib`. No `.gitignore`, nested
  AGENTS.md or `figures/.gitkeep` is written. Connecting an existing repository adds
  only the pointer block (appended to the existing root AGENTS.md, any casing) and
  `.agentlatex.json`, plus the starter manuscript only if the chosen main document is
  missing. The reminder block is condensed to the same instructions in fewer lines.
- Cleanup: unused prototype draft storage, the unused installation-status endpoint and
  dead path helpers were removed; the compiler laboratory page is omitted from the
  hosted build; stale creation receipts are pruned at sign-in; invalid file names get
  a readable message.

Next: run `pnpm test`, `pnpm build:hosted` and the real Connect → edit → save → compile →
refresh journey before merging; see the pull request for what was and was not run.
