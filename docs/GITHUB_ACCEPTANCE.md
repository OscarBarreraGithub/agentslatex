# GitHub workspace acceptance — 2026-10-21

## Current status

**Live functional pilot at https://agentlatex.com; privacy requirement unresolved.**
The owner now requires no operator access to private repositories. The deployed
server-side GitHub token/proxy design does not provide that boundary; see SPEC.md.
Do not onboard private papers under a no-access promise. No permissions or existing
projects were revoked during this read-only privacy audit.

Owner-account
Connect → private project → edit → Save to GitHub → Compile → reopen passed on the
public deployment. A real external GitHub commit caused a stale save to be refused;
explicit conflict resolution and a subsequent save succeeded. Second-account access
still needs the first invited user. This is not a general production/load certification.

GitHub App **agentslatex**, D1 schema and production secrets are installed. Namecheap
nameservers point to Cloudflare. The owner explicitly authorized replacing the root
parking record; HTTPS and `/api/health` return successfully. Email MX/SPF records were
preserved. Use the apex address; `www` has not been configured for this application.
Workers Free / $0 was verified in the dashboard. The domain zone uses Free Website.
R2 was never activated, purchased or cancelled; it is not part of this deployment.
Compiler assets use free Static Assets. No private manuscript was uploaded.

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

## Public workflow evidence

- Chrome and Safari completed GitHub sign-in at the public origin without a new grant.
- Chrome New project created the private `OscarBarreraGithub/agentslatex-demo` repository
  (ID 1429171953) with the paper template and root/nested agent instructions. GitHub API
  independently confirmed its private visibility and the actual saved source.
- Saved source reopened in Safari from GitHub; returning to projects listed the paper.
- The first hosted compiler download showed percentage progress. The equation/TikZ
  document rendered one PDF page in 0.85s after loading; this excludes initial download
  and engine setup. The current resolved source then compiled in 0.79s, marked Up to
  date. These are single measurements on this Mac, not performance guarantees.
- A GitHub CLI commit changed that same synthetic paper externally. An older Chrome
  draft was refused with “GitHub has newer changes”; the remote commit stayed intact.
  Refresh retained the draft until an explicit per-file choice. Choosing GitHub version
  loaded the external sentence. A further browser edit saved successfully and preserved
  that sentence; GitHub API confirmed the final content.
- A stale open local tab exposed an uncaught lazy-module load failure after deployment.
  The import is now inside the project error handler with Reload project / Back to
  projects actions; the changed client/Worker build passed and is deployed.

The local UI fixture does not contact GitHub. Its earlier checks above are separate
from this public workflow and from mocked API contract tests. Historical compiler
stress results remain in TESTING.md; they were not repeated for deployment.

## Remaining acceptance / bounded follow-ups

1. First collaborator: authorize the GitHub App on their account, accept repository
   access, connect/open the paper, save and refresh across two different accounts.
2. Real existing-repository connect/import, large GitHub file transfers and real
   file/folder uploads on the authenticated production app.
3. Expiring-token refresh using actual GitHub credentials; simulated auth checks passed.
4. Mobile file-selection/Refresh recheck, 915×412 layout, physical Windows/phone.
   Earlier Safari responsive emulation covered 360×800 PDF and 412×915 navigation;
   those were not physical phone tests. The two mobile fixes are deployed but unverified.
5. Full stale-version lazy-chunk failure/retry simulation; recovery code is deployed.

Stop cancelled a local fixture build and released controls; corrected retry rendered
in 0.45s. That result is local, not a new public cancellation check. Detailed PDF
Frankenstein attribution remains explicitly deferred. No independent Opus review was
performed for this deployment checkpoint.
