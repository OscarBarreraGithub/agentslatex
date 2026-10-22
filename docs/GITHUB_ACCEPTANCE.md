# GitHub workspace acceptance — 2026-10-21

## Current status

Deployed to the Workers subdomain; custom domain and actual account/project journey
are pending. This is deployment evidence, not full product acceptance.
GitHub App **agentslatex** registered successfully under OscarBarreraGithub. The first
manifest POST was lost through sign-in; resubmission after sign-in registered it.
D1 **agentslatex** schema and production secrets are installed. GitHub sign-in and
selected repository installation completed. Application code and static compiler assets
are deployed at https://agentslatex.oscarbarrera.workers.dev (version
48ad5404-f231-4f37-9dcb-81f768ba9fc6, code checkpoint db725e6).
Cloudflare Free zone is pending registrar nameserver changes; Namecheap needs sign-in.
Workers Free was verified in the dashboard. R2 remains inactive and is no longer used:
the owner requires $0 usage charges. Static compiler packaging passed local verification.
No private paper upload occurred.

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
- Historical transport check: ten objects through local Wrangler R2 decoded to the
  original SHA-256. That R2 transport is superseded by the static packaging policy.
- Static packaging: all parts below 25 MiB; reconstructed WASM and TeX data match
  original SHA-256; missing-part failure and successful retry passed. Client/Worker
  typecheck/build and the eight affected GitHub checks passed. Safari compiled the
  equation/TikZ preview from the new static path: 3.36s, one page, PDF Up to date.
- Public Worker health, landing page and compiler manifest return HTTP 200. A hosted
  compiler part matches local bytes and is served with immutable cache headers.

The UI fixture does not contact GitHub. Its save checks are distinct from the mocked
GitHub API contract tests. Neither establishes a live private repository workflow.
Historical compiler stress results remain in TESTING.md; they were not repeated.

## Remaining acceptance

1. Verify real private repository create/import/save with the installed GitHub App.
2. Complete registrar sign-in, connect domain and verify HTTPS and hosted compilation.
3. Verify hosted sign-in, compilation download and actual collaborator access/conflict.
4. Check import of real file/folder copies, responsive layout, physical Windows/phone.
5. Exercise expiring-token refresh with actual GitHub credentials.

Stop cancelled the final browser build and released the controls; a corrected retry
rendered successfully in 0.45s. Safari responsive emulation checked 360×800 PDF and
412×915 file navigation; these are not physical phone tests. A remaining mobile issue:
selecting a source file while PDF is active should switch to Source, and Refresh needs
a visible mobile location. The 915×412 layout is not yet checked.
Detailed PDF Frankenstein attribution remains explicitly deferred.
