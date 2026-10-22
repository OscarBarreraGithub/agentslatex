# GitHub workspace — active slice

Account = GitHub identity. One project = one repository; new repositories are private
and user-owned. Existing repositories are connected in place. GitHub controls access.
No guest project editing on the hosted site. No custom agent MCP in this slice.

Deliver connect → optional existing-project import → projects + New project → editor.
Visible file tree, ordinary paper/ files, browser compilation, clear progress/errors.
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

- AL-1, root: implementation and local fixture verified; see GITHUB_ACCEPTANCE.md.
- AL-2, root: awaiting GitHub user authorization, then verify real private repo creation/sync.
- AL-3, root: awaiting Cloudflare dashboard sign-in/R2 activation; DNS and deployment pending.
- AL-4, root: finish mobile file-selection/Refresh controls and remaining acceptance.

No live readiness claim until AL-2/3 and required workflow checks pass.
