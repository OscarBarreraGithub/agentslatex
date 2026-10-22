# GitHub workspace acceptance — 2026-10-21

## Current status

Implemented locally; public deployment and actual account/project journey are pending.
GitHub App **agentslatex** registered successfully under OscarBarreraGithub. The first
manifest POST was lost through sign-in; resubmission after sign-in registered it.
D1 **agentslatex** exists remotely, with schema applied locally. R2 is not yet enabled
in the account. No production deployment, DNS change or private paper upload occurred.

## Passing evidence

- Client/Worker TypeScript and hosted asset build.
- Eight focused checks: stale-base save refusal; racing non-force update refusal;
  conflict detection; template/tags; invalid tags; safe paths; API authentication and
  cross-origin write refusal; expired login returns to a usable Connect page.
- Safari desktop, loopback synthetic UI fixture: projects/New project, visible folder
  tree, seeded paper, source editing, Agent toggle, automatic draft recovery on reload.
- Save rejected after an external update; Refresh requested an explicit file choice;
  selecting My draft preserved its content; subsequent Save succeeded in the fixture.
- Template rendered in Safari: 1.14s compile, one page. Deliberate undefined command
  displayed Compilation failed and its line number. Corrected retry: 0.39s, one page.
- All ten compiler objects served through local Wrangler R2 with gzip decoded to the
  exact original SHA-256. No Worker buffering of the large package is needed.

The UI fixture does not contact GitHub. Its save checks are distinct from the mocked
GitHub API contract tests. Neither establishes a live private repository workflow.
Historical compiler stress results remain in TESTING.md; they were not repeated.

## Remaining acceptance

1. Authorize GitHub account, select repositories, and verify real create/import/save.
2. Enable R2; apply production schema/secrets; deploy, connect domain and verify HTTPS.
3. Verify hosted sign-in, compilation download and actual collaborator access/conflict.
4. Check import of real file/folder copies, responsive layout, physical Windows/phone.
5. Exercise expiring-token refresh with actual GitHub credentials.

Stop cancelled the final browser build and released the controls; a corrected retry
rendered successfully in 0.45s. Safari responsive emulation checked 360×800 PDF and
412×915 file navigation; these are not physical phone tests. A remaining mobile issue:
selecting a source file while PDF is active should switch to Source, and Refresh needs
a visible mobile location. The 915×412 layout is not yet checked.
Detailed PDF Frankenstein attribution remains explicitly deferred.
