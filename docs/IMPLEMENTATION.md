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
- AL-2, root: live owner-account sign-in, private project creation, save/reopen and
  external GitHub conflict/refreshed-save checks passed. Next: first collaborator
  signs in with their own GitHub account and opens the shared repository.
- AL-3, root: Workers Free verified; R2 never activated. Static compiler packaging
  and hosted compile passed. Canonical https://agentlatex.com is live over HTTPS;
  Namecheap nameservers and approved root parking-record replacement are complete.
- AL-4, root: mobile file-selection/Refresh fixes implemented; their browser recheck,
  915×412 layout and physical phone/Windows checks remain open.

- AL-5, root: deferred by the owner after the privacy discussion. Keep the current
  backend and record its operator-access boundary accurately; see SPEC.md. No
  encryption migration or permission revocation is underway.

The functional owner workflow passed and the owner retained the current design for
the pilot. This is not evidence of multi-user load, second-account acceptance or
complete device coverage. No further infrastructure purchase is needed for the pilot.
Detailed PDF attribution remains a later slice.
