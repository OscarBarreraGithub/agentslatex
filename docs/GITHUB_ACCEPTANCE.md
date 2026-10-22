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

## Naming, typography and compilation handoff — 2026-10-22

The owner selected Baskerville for the g, with a tighter A–g gap. Local Chrome
desktop and 360×800 emulation checked the resulting outlined wordmark. Existing
project onboarding now uses the same two-pixel, 44px dropdowns as settings; the
actual Connect existing chooser was checked locally.

New-project whitespace becomes hyphens in both client and server validation.
The synthetic local workflow created “Another paper” as “Another-paper”. Invalid
format feedback and corrected retry were checked before the whitespace refinement.
Settings exposes GitHub's repository rename page; its link was checked, without
renaming a real repository. Numeric repository identity and draft keys are retained.
File rename/move notices are shorter; automatic TeX-reference rewriting is not added.

A real compiler failure exposed a three-line visible error, a successful Copy prompt
action, and the full log with file/engine/base-revision and unsaved-draft context.
Desktop and 360×800 Chrome emulation were inspected. A second missing-document
failure reset the prompt; corrected source compiled in 0.34s (one page, excluding
loading) and cleared the panel. No physical-device or clipboard-denied check is claimed.
The fixture was synthetic and local; no private manuscript or production repo changed.

Nine affected GitHub/template checks and the full-log handoff check passed.
Client/Worker typechecks and hosted packaging passed. No compiler stress matrix
or broad suite was repeated. Workers Free / $0 / Current plan was confirmed before
deployment. Second-account collaboration and physical drag acceptance remain open.

Deployed code `a5a37de` as Worker version
`7b73181d-bbdd-4e77-9544-26e419dd25dc`. Public health returned OK; the root HTML
and editor/workspace/CSS bytes match the checked build. The signed-out production
landing page was visually verified in Chrome. The authenticated failure/retry and
new-project workflow evidence is from the local fixture, not a new live-account test.
Owned fixture/preview servers and the verification tab were closed.

## Released editor and account workflow — 2026-10-22

Implementation: compact Connect agent/import prompts with Copy before Read prompt;
shared skills/GitHub-setup.md, optional import scaffolding, single AGENTS.md convention,
agentlatex/main default for new projects, existing project paths preserved; creation
spinner/failure retry; recent-first project rows and already-connected filtering;
Report issue agent prompt; repository-tree divider; adjusted wordmark.

Caching: per-user home-list persistence, fresh authorization/snapshot checks before
opening, matching-blob reuse, separate bounded PDF/SyncTeX cache and stale labels.
Identity lookup no longer lists GitHub repositories; that work happens during the
background list refresh or when installation status is needed for creation.

PDF: PDF.js continuous rendering queue, link annotations/TOC, two-way SyncTeX using
line-number/PDF double clicks, exact included-file paths and stale-source refusal.
Session: 180-day renewable cookie/server session with weekly visit renewal; temporary
GitHub refresh failures preserve the session. Actual token rotation on GitHub is
still a remaining acceptance item; mocked failure/expiry/renewal checks passed.

Focused checks: GitHub contracts 9, draft cache 1, PDF signature 1, session 5 and
SyncTeX 1 passed; Client/Worker typechecks and hosted build passed. SyncTeX test first
exposed floating-point comparison precision; tolerance corrected. Adding glyph-level
mapping exposed a box tie that favored a container; the tie now favors the contained
text record. No broad compiler matrix rerun for these viewer/UI changes.

Chrome local synthetic fixture: 200-page document compiled in 1.18s (excludes engine
loading); TOC jumped to page 3, normal scrolling advanced pages, page input reached
200. Returning through Already connected restored the saved PDF on page 200 without
recompiling; GitHub-file fixture reads remained 7 before/after reopening. Cached home
rows appeared while a deliberately delayed list request was pending. Private source
was not inspected. These are local single-run observations, not a production latency
or maximum-memory guarantee. Final mobile and deployed checks follow below.

Demo instruction cleanup was separately applied to the owner-authorized synthetic
agentslatex-demo repo at a9e70093f97bbc657c2b6af9db2cb6506852e93e: removed generated
CLAUDE.md duplicates and compacted the paper guide; no manuscript was moved or edited.

Final local checks: first connection (including legacy welcome=1 URL) lands directly
on projects; sign-out lands on the signed-out message and clears the project list.
Reconnect requests GitHub's documented select_account picker. Logout works without
GitHub refresh even for an expired session, can be repeated, and rejects wrong-origin
requests. The fixture checks the app transitions; the live account picker is checked
after deployment, not simulated as evidence of GitHub behavior.

Desktop PDF double-click now selects the exact synthetic sentence (line 12), rather
than its following equation. At 360×800 Chrome emulation the compact Connect agent
prompt fits; cached page 200 restores when the PDF pane is opened. Hidden-pane page
navigation initially triggered a PDF.js offsetParent warning; navigation is now
deferred until visible, and the warning is gone. The only remaining console error
was the fixture's absent favicon, not an editor failure. Physical-device interaction
and touch double-tap behavior have not been established by this emulation.

Workers Free / $0 / Current plan rechecked in the account dashboard immediately
before this release. No plan, binding or subscription change.

Deployed source commit 18ec8ca6948a8e5181f8baa004c123d61e0d4609, Worker version
7fdeb0fe-6450-46a3-af45-07e18b13ffb0. Public health is OK and the landing page loads
editor-CFL2fbje.js from the verified build. Live Chrome sign-out reached the new
message; Connect to GitHub opened GitHub's account picker with Continue as the owner
and Use a different account. Continuing returned directly to Your projects. No second
account was used. The drawn alien was saved in GitHub App settings and visually
confirmed on that live account picker. GitHub's earlier reauthentication prompt had
cleared; the initial file chooser stalled, and reopening it after a settings reload
completed normally. No permissions or credentials were changed for the icon.

The isolated authentication fixture was stopped. The local 4393 preview remains
available because the owner has it open in their own browser tab; it contains only
synthetic fixture projects. Version-history UI and full Frankenstein attribution
remain deferred; physical Windows/phone, real collaborator and large GitHub import
acceptance remain explicitly unverified rather than inferred from local fixtures.

## Refresh and navigation follow-up — 2026-10-22

Startup now checks the session before rendering the signed-out landing page. Chrome
with a 3.5-second synthetic session delay showed only the neutral loading indicator
on authenticated navigation and refresh, followed by the project list. A synthetic
500 response showed Try again (not the splash), and retry restored the list. Sign-out
still reached the landing page after the 401 response. Project rows now omit the
owner/branch subtitle; the account remains in the header.

One click on source line number 12 moved the cached synthetic PDF from page 200 to
the matching passage on page 3. PDF-to-source remains double-click. Client/Worker
typechecks and hosted build passed; no compiler or cache policy changes and no
compiler stress-suite rerun. PDF retention remains latest-per-project, capped at
five builds / 64 MiB, separate from drafts.

Refresh/navigation deployed at source 6d65253; Worker version
7f6ba465-c3d0-4574-8680-ac17a5bcd6d7. The isolated delayed-auth fixture was stopped.

## Live documentation and lightweight project instructions — 2026-10-22

New/newly connected repositories get short root and main-folder AGENTS.md pointers
instead of copied specs/setup/import guides. Existing content and filename casing are
preserved; marked reminders append once. Older projects' Connect agent prompts now
link live docs and ask the agent to add missing pointers without removing local rules.
No automatic rewrite of existing users' repositories occurred.

The two affected contract files passed (16 checks): template layout/tagging, custom
folder/root configuration, existing root and nested instruction preservation, retry
idempotence, and failed-read propagation. Client/Worker typechecks and hosted packaging
passed. Local Wrangler HTTP checks verified /docs, all four HTML guides, and byte-exact
plain Markdown with text/plain and no-cache headers without authentication. No compiler
stress tests were repeated. Workers Free / $0 / Current plan was rechecked in Chrome.

The legacy synthetic preview crashed when a /docs directory was opened; its static
server now resolves directory indexes and extensionless guide URLs. The preview was
restarted at 127.0.0.1:4393. This was a fixture error; local Wrangler served the routes
correctly. Visual checking could not complete because native browser control lost
window/input access (noWindowsAvailable); do not infer a visual/mobile pass from HTTP
checks. No private manuscript was read and no new real GitHub repository was created
for this check. Live documentation fetch verification follows deployment.

Source 017b4fd deployed as Worker 910774d4-7c2c-4076-9ca2-c9c41558c725.
Public HTTP verified the docs index, all four HTML pages and byte-exact Markdown
with no-cache/text/plain headers, plus editor-BtEFMMVY.js. The chat web-reader could
not open agentlatex.com despite successful direct requests; it successfully read
GitHub's raw copy. An explicit raw-GitHub fallback was therefore added to reminders
and prompts, and the central guide links all four source counterparts. This is a
reader compatibility fallback, not a second maintained copy. Visual acceptance stays
unverified. Local Wrangler was stopped; the owner's synthetic 4393 preview stays up.

Fallback follow-up source cd1b67e deployed as Worker
12675b74-b8e7-456b-80b5-b620b0615611. Final public verification matched /docs/AGENTS.md
with GitHub's raw source, confirmed no-cache, and found editor-Cc3gL1rw.js on the
landing page. Client/Worker typechecks and packaging passed after the pointer change.
The prior 16 focused contract checks passed before this text-only fallback addition.

Visual retry at the owner's request: Chrome desktop control recovered. The live
/docs index, Agent instructions and LaTeX requirements pages rendered with readable
dark-theme text and code examples. Clicking the guide/index links navigated correctly;
Plain Markdown opened inline as text rather than downloading or requesting sign-in.
This closes the deferred desktop docs visual check. No rendering fix or deployment
was needed; it does not establish a mobile-device check or remove the separate
chat web-reader limitation. The GitHub fallback remains available.

## First project without an installed repository — 2026-10-22

Removed the New project installation-count gate. The existing GitHub App has account
Repository creation write permission; GitHub documents automatic access to repositories
created with that permission. Server creation already uses the authorized user token.
Connect existing retains the selected-repository installation flow.

Client/Worker typechecks and hosted build passed. Chrome desktop with
`tsx tests/ui-fixture.ts --first-project` (port 4394) started with no projects or
installations. New project → name → Create reached the editor directly. An injected
503 triggered the existing automatic retry with the same request ID; the fixture
confirmed it, and no installation-status request occurred. This is synthetic browser
acceptance, not a completed real first-user GitHub authorization/creation check.
No account permissions, existing repositories or credentials were changed. Workers
Free / $0 / Current plan was rechecked before deployment. No compiler matrix was run.

The same release includes the requested first-line preferences placeholder and blank
space in newly generated AGENTS.md files, removal of the starter bibliography's
"Cite real sources only" text, and the recorded Check citations workflow TODO.
The 10 affected template/GitHub contract checks passed for those template changes.
Existing user instruction files remain preserved.

Deployed source 0e07272 as Worker 7de46f42-229b-4889-b6f7-0e9747bbd594.
Public HTTP confirmed the live editor-wtKKRK7C.js matches the local build byte for
byte, contains no installation-status gate, and /api/health returns ok. Python's
default urllib request received 403; curl fetched and verified the public endpoints.
The isolated 4394 fixture and verification tab were closed. The owner's 4393 preview
and existing production tab were preserved; refresh an already-open tab for this fix.

## Correction: repository creation requires an installation grant — 2026-10-22

The owner's fresh-account attempt after 0e07272 failed with GitHub's “Resource not
accessible by integration.” The newest creation record had no repository ID: failure
occurred before creation. The earlier synthetic frontend pass did not establish that
GitHub would allow creation without installation. That readiness claim was premature.
Repository creation is a repository permission, not an account permission granted by
OAuth sign-in alone; the earlier description above is superseded by this correction.

A creation-stage 403 now opens a guided fallback: create the named private repository
on GitHub with README enabled, grant access to only that repository, then Finish setup.
The name/intent is stored per signed-in user in browser storage; refresh resumes it.
Finish checks accessible repositories, ownership, privacy and write access and uses
normal authorized /connect initialization. Incomplete access remains retryable, no
unrelated repository is required, and Cancel setup clears the local intent. If the
repository is empty, the app explains how to add README before retrying. Existing
installation users can still create private repositories directly through the API.
GitHub's new-repo form was inspected: name/privacy prefill works, README must be enabled
explicitly (auto_init in a URL did not enable it). No app permission was broadened.

The affected 14 tests passed: creation denial becomes an actionable setup response,
unauthorized connect writes nothing, authorized connect initializes once and preserves
README, canonical reminder reuse, failure-prompt revision/draft/log context, and the
existing GitHub contracts. Client/Worker typechecks and hosted build passed. Chrome's
synthetic first-project workflow passed denial → guide, incomplete-access message,
refresh preserving name, explicit fixture authorization → editor. It does not prove a
real fresh GitHub account's final installation/creation. Live verification is separate.

All five instruction-review findings were corrected: live build-repair specs/config,
capability-first setup, one canonical marked reminder source, proportional manuscript
validation, and a concise Connect agent prompt. The title is “agent latex”; the favicon
reuses the existing drawn-alien web icon. Workers Free / $0 / Current plan was checked
again. No compiler/runtime behavior changed and no stress matrix was repeated.

Deployed source a3ea7cd as Worker 111311c9-d7ee-48d6-a4af-38e409ec99dd. The live
asset check caught the favicon missing because hosted Vite disables publicDir copying;
43caa97 adds the explicit asset copy. Final Worker a2c12d58-eb6d-432c-95db-e4870568cb41
serves the exact icon, revised guides, canonical reminder and editor-DdpcoS3E.js.
This was one focused packaging correction, not a compiler change.

Real GitHub test on the already-installed owner account: created a new private,
synthetic agentlatex-setup-check-20261022 repository with README; selected only that
additional repository while preserving the four prior installation selections. The
live app listed it, initialized agentlatex/main through Connect existing, and opened
the synced editor. GitHub read-back confirmed root config/instructions and manuscript
folder while preserving README. Browser compilation rendered one page in 0.82 seconds;
title and alien favicon were visually confirmed. The synthetic private project is
retained for inspection; no real manuscript was used. This verifies the real creation,
selected-access and initialization components, but uses an existing installation and
Connect existing rather than the full fresh-account fallback. The owner was asked to
retry that original failing account; its first-installation check remains pending.
The isolated 4394 fixture was stopped; the owner's 4393 preview remains untouched.

## Empty repository setup — 2026-10-22

The user found that both Finish setup and Connect existing still required an initial
README commit. Source 5e6e4ee removed that manual requirement: the folder picker reads
an empty repository without writing, and authorized setup initializes it using the
Contents API before adding the normal starter files. Existing README files are never
overwritten. Folder/document validation runs before initialization.

The first real empty-repository check found a GitHub propagation delay that mocks had
not represented: Contents acknowledged the README, but Git refs briefly still returned
“Git Repository is empty.” Source 824ec4d adds a bounded wait, followed by the existing
transient-request retry if needed. The previously interrupted setup also completed
through Try again without a duplicate initialization commit.

Six focused creation tests passed, including permission denial, browsing without a
write, validation before a write, delayed initial-commit visibility, interrupted setup
retry, concurrent initialization, and existing README preservation. Client/Worker
typechecks and the hosted build passed. No compiler stress suite was repeated.
Workers Free / $0 / Current plan was confirmed before deployment. Final live Worker:
c4c5c2df-73f7-437f-a15e-1aa65b56186b (source 824ec4d).

Real Chrome desktop acceptance used two private synthetic repositories:
agentlatex-empty-check-20261022 (interrupted-setup recovery) and
agentlatex-empty-retry-check-20261022 (fresh zero-commit setup). The latter was confirmed
empty through GitHub immediately before connecting. One Connect project click opened
the synced editor without a README step or manual retry. GitHub read-back showed the
two expected commits and all starter files; browser compilation rendered one page in
0.83 seconds. The repositories are retained for inspection, and only these synthetic
repositories were added to the app installation; prior selections were preserved.
Temporary Cloudflare/GitHub tabs were closed; the working demo remains open. This is
an actual empty-repository workflow check on an existing installation, not a new
GitHub-account OAuth test. The user separately reported that their invited abtest
project appeared automatically after accepting its GitHub collaborator invitation.

## Sign-in recovery and simple agent tags — 2026-10-22

The user reported repeated “Couldn't check your sign-in” retries. Code inspection
found that the identity endpoint unnecessarily depended on GitHub token renewal; a
concurrent renewal or temporary upstream failure could strand an otherwise valid
session. The exact response from the user's failed attempt was not captured. The
identity endpoint now checks the local session independently; repository operations
still require GitHub authorization. The browser retries temporary identity failures
with a bounded delay, respects long Retry-After values, and sends a genuine 401
directly to sign-in. Persistent failure retains a Reconnect button and saved drafts.

24 focused auth/retry/tag/GitHub/build-prompt tests passed, including an active
refresh lock with an expired GitHub token, private API access checks, transient
recovery, bounded failure, 401 and long rate-limit backoff. Client/Worker typechecks
and the hosted build passed. No compiler stress suite was repeated.

Chrome desktop acceptance on isolated loopback fixture 4394: injected one session
HTTP 500, then opened the app; it reached the projects list without another click.
The new starter was plain text with no model metadata. A synthetic manuscript using
only `% agent:begin` / `% agent:end` highlighted the enclosed paragraph with Show AI
and left adjacent manual paragraphs unhighlighted. Legacy tags remain supported
by the focused parser checks; existing private papers were not rewritten. The test
tab/server were closed; the owner's 4393 preview was preserved.

Live instructions and repair prompts now prohibit manuscript agents from driving
Safari, accessibility APIs, screen readers or browser UI automation to compile.
They should use a compatible compiler directly or ask the user to press Compile.
Website development browser tests remain a separate activity. Managed reminder
updates replace only the complete marked block and preserve owner preferences.

Google separately flagged “Deceptive pages” without sample URLs. After ownership
verification and correction of stale www parking and missing canonical HTTPS
redirects, an owner-approved review was submitted in Chrome. Google displayed
“Request submitted successfully.” The issue remains flagged; this is submission
evidence, not a cleared security review or proof of the classification's cause.
