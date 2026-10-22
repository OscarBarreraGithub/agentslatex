# GitHub workspace acceptance — 2026-10-21

## Current status

**Live functional pilot at https://agentlatex.com.** The owner explicitly deferred
encryption and chose to keep the current trusted-backend design. Its technical access
to authorized GitHub repositories remains; see SPEC.md. Privacy redesign is a future
item, not a pilot gate, and the site must not be presented as zero-access or end-to-end
encrypted. Existing authentication, permissions and projects are unchanged.

Owner-account Connect → private project → edit → Save to GitHub → Compile → reopen passed on the
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


## Prompts and automatic refresh — 2026-10-22

The current slice adds project-specific copy prompts, a portable conversation-import
skill and shared IMPORTS.md convention, and conservative incoming refresh. See
PROMPTS.md and SYNC.md for exact behavior and scoped evidence. Owner-account and
second-account acceptance boundaries above still apply.

Chrome responsive emulation covered 360×800, 412×915 and 915×412 with the new project
header and prompt dialog. Clean incoming updates and dirty-draft preservation passed
in the local synthetic fixture, including explicit My draft conflict resolution.
This closes the landscape layout recheck, not physical phone/Windows or every mobile
file upload workflow. No provider conversation import was performed.

Deployed code checkpoint `10d49b2` as Worker version
`b025f1f3-5479-424c-897c-a7e15b31f41d`. Workers Free / $0 / Current plan was verified
in the account dashboard before deployment. Public health and the new workspace asset
returned HTTP 200. The existing signed-in synthetic demo opened on agentlatex.com;
Prompts showed the correct repository and the deployed import-index/browser-connection
instructions. Eleven affected checks passed (eight GitHub, three refresh/transport),
plus the skill validator and hosted Client/Worker build. No new paid service or schema.

## Folder workspace and selected-file preview — 2026-10-22

Deployed `94c6fdc` as Worker version
`54d33de7-5762-4f78-8f54-ec2fa11466d6`. Workers Free / $0 / Current plan was
rechecked immediately before deployment. Public health and the new workspace asset
returned HTTP 200. The signed-in Safari synthetic demo displayed the legacy paper
folder, optional repository explorer, top settings, Highlight agent, and the project
header without the redundant owner username. The projects screen retains the account
name and shows the new AgEnT LaTeX wordmark. Existing browser drafts were preserved.

Fifteen focused checks and the hosted Client/Worker build passed. Local Chrome
verification and bounded remaining drag/device/import checks are in WORKSPACE.md.
No compiler stress suite was repeated, no paid service or database migration added,
and no private manuscript was inspected. Version-history UI remains AL-9 TODO.

## Small UI corrections — 2026-10-22

Code checkpoint `555679c`, Worker version
`537188a7-d0a7-4040-b77f-f88ebfa7eef4`: uniform wordmark typography/color,
removed redundant repository-explorer heading, labeled ← Back folder navigation,
purple ↓ PDF download, and one Upload arrow offering Files… or Folder…. Browser
compilation is now the lead entry in SELLING_POINTS.md for future landing-page copy.

Client/Worker typechecks and hosted packaging passed. Live editor/workspace/CSS bytes
match the build, and health returns OK. Workers Free / $0 / Current plan was checked
during this update. No compiler matrix was rerun. The fresh visual/native-picker
check could not be completed: computer control returned cgWindowNotFound for Safari
and Chrome, and no browser provider was available. These small changes are deployed;
the fresh visual/upload-picker verification remains open rather than recorded as passed.

## Landing typography and approved copy — 2026-10-22

Code `63b6406`, Worker version `c3650101-e5c4-47f2-893e-98835322768e`.
The headline is “Write with agents. Revise with confidence.” and supporting copy is
“Compile, version control, and collaborate. All in your browser.” The old footer
sentence is removed. Both parts of AgEnT LaTeX use actual LaTeX/Latin Modern artwork,
shipped as accessible inline SVG outlines with no external font dependency.

Client/Worker typechecks and hosted build passed. Browser access recovered: the
public signed-out landing page was visually verified in Chrome at desktop size;
local final-build checks covered 360×800 and 915×412 emulation (the short landscape
viewport scrolls vertically). A 412×915 check preceded the final headline wrapping
adjustment. No physical-device or account-collaboration claims are added. Public
health returned OK and deployed JS/CSS bytes matched the local build. Workers
Free / $0 / Current plan was rechecked in the account dashboard before deployment.
No compiler suite was repeated. Temporary preview server and verification tabs/windows
were closed; user sessions and drafts were not changed.

Wordmark follow-up: `f837293`, Worker version
`e1959a04-2b5f-4e9e-984d-cd5542b45786`, raises and reduces the n and tightens the
following T at the owner's request. Hosted asset packaging and live Chrome desktop
visual verification passed. Only SVG/TeX artwork and copy-bank documentation changed;
no compiler or application behavior checks were repeated.

Splash refinement: `dd9f272`, Worker version
`1ed17132-978d-41f5-a832-937215623a4a`, removes the duplicate corner logo from the
signed-out splash, raises the central content and uses “Write with agents, revise
with confidence.” The superscript n increased from 25pt to 28.75pt (15%), and the g
uses sharper Nimbus Roman lettering. Client/Worker typechecks, hosted packaging,
local desktop/360px-width emulation and live signed-out Chrome visual checks passed.
The narrow emulation used an automatic 778px height; this is not a physical-device
check. Workers Free was rechecked before deployment. Temporary tabs/windows and the
preview server were closed. Authenticated navigation remains unchanged.


## File actions, author labels and toolbar cleanup — 2026-10-22

Local Chrome fixture passed extensionless creation/editing, saved reload, visible
rename-collision failure and corrected retry, preserved text after renaming to .tex,
and compilation (0.37s, one page, excluding compiler loading). Delete → Save removed
the synthetic file. Link → Save → Unlink → Save kept the original repository bytes
unchanged and removed only its reference; fixture API read-back confirmed both cases.
No private paper was used. Physical drag and second-account checks remain open.

The toolbar uses Show AI and a neutral Download button with purple text. Settings has
two-pixel dropdown borders and no redundant helper sentence. These were visually
checked on desktop and 360×800 Chrome emulation. The author-comment template compiled
in 0.91s (one page); Work prompts displayed model/version/reasoning instructions.
New-project guides and existing-project Work/Import prompts now include honest model
labels with unknown fallbacks. Existing repositories are not automatically rewritten.

Eight GitHub/template checks and six workspace checks passed. Client/Worker typechecks
and hosted packaging passed, including after the inline rename-error correction.
No compiler stress matrix or broad suite was repeated. Workers Free / $0 / Current
plan was confirmed in the account dashboard; no hosting or schema change was made.

Deployed code `8186b81` as Worker version
`f5d32337-6815-46c2-aa54-cc48144a71ec`. Public health returned OK and the deployed
HTML/editor/workspace/CSS bytes matched the checked build. The Chrome production tab
was signed out, so this slice's interactive file-action evidence is local; no new
production-account workflow is claimed. The temporary fixture and verification tab
were closed. The 15 local logo comparisons await the owner's selection; the live
wordmark remains unchanged.
