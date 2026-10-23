# Product specification

## Purpose

A quiet workspace for scientific LaTeX: source left, real PDF right, visible files,
dark chrome and ordinary white PDF pages. GitHub is the account, sharing and version
control system. The browser does the compilation. Reading/editing/compiling makes no
model calls. No QUARK, agent manager or app-specific manuscript format.

## Current implementation

One project corresponds to one GitHub repository. New projects are private and owned
by the signed-in person, with agentlatex/main/main.tex, figures/, references.bib and agent guides.
Existing repositories retain their layout. Repository access comes from GitHub and
selected GitHub App installations; every server operation uses a user access token.

Sign-in → projects / New project or Connect existing → file tree,
CodeMirror editor and PDF viewer. There is no hosted guest editor. Browser drafts are
separate by numeric GitHub user/repository ID. Save checkpoints the exact loaded base;
Refresh preserves nonconflicting edits and asks which version to keep for overlapping
files. Neither operation force-pushes. Incoming updates are checked every 30 seconds
while active, two minutes while idle, and paused when hidden/offline. A head check
precedes any tree/file refresh. Clean projects update automatically; drafts show
Updates available and retain explicit merge choices. No automatic GitHub commits or
automatic PDF builds. Requests back off on errors and respect Retry-After.

Compile loads pinned TeXlyre BusyTeX 1.4.1 / TeX Live 2026 in a browser worker. Loading,
compiling and errors are visible; the previous PDF becomes stale after edits/failure.
Stop cancels work. File/folder import copies files, preserves relative paths and asks
before replacing browser copies. The main-folder source ZIP (including linked files and current drafts) and PDF can
be downloaded. Compile targets the selected `.tex`; Markdown renders locally with raw
HTML disabled and remote images suppressed. Other file types disable Compile.

Agents use their normal GitHub/file tools. Short root/nested AGENTS.md reminders link
the live guides at https://agentlatex.com/docs; no CLAUDE.md or copied specs are generated. They
require only paired `% agent:begin` / `% agent:end` comments, without IDs or model
metadata. Earlier tags remain readable; new starter text has no attribution markers.
Tagged passages are Agent; everything else is Manual. This convention depends on agent
compliance and is not cryptographic proof of authorship. The source highlight toggle
shows tags; PDF attribution and detailed provenance are later work.

The project header provides a Prompts dialog with Connect agent first, then Import a
conversation. GitHub setup is linked from Connect agent. Conversation import is a
portable skill/prompt, not an automatic chat-history integration. It saves accessible
artifacts and a summary, identifies gaps, and uses an export handoff when writes are
unavailable. See docs/PROMPTS.md and docs/SELLING_POINTS.md.

## Infrastructure

Cloudflare Worker serves UI/API; D1 stores expiring sessions, OAuth state and project
registration metadata. GitHub tokens are encrypted server-side; they never reach browser
JavaScript. Free Static Assets hold the UI and versioned compiler downloads. No R2.
Papers live in GitHub plus browser drafts. No cloud compiler or cloud agent execution.
Workers/D1 must stay on Free: at capacity the service stops rather than billing
overages. See docs/COST_POLICY.md. Domain registration/renewal is separate.

## Privacy boundary — current decision

After discussing operator access and encryption, the owner explicitly chose to leave
the application as it is for now and defer encryption. This supersedes the earlier
privacy redesign gate for the pilot; it does not establish a zero-access guarantee.

The backend decrypts GitHub user tokens and relays plaintext files during reads and
saves. D1 holds encrypted credentials, account and project metadata, not manuscript
contents. The central GitHub App's installation permissions also grant access. Service
operators therefore retain the technical ability to retrieve authorized repository
contents. Browser compilation is local. Human inspection is not part of the normal
workflow, and must require the affected user's explicit authorization. Do not record
manuscript contents in application logs or analytics.

Describe storage precisely: papers are saved in GitHub and drafts in the browser;
manuscript contents are not persisted in the application's own database. Do not say
“files are never saved,” “operators cannot read papers,” or “end-to-end encrypted.”

Deferred AL-5: evaluate direct user-controlled GitHub authentication or client-side
end-to-end encryption, including collaborator access, recovery and agent compatibility.
GitHub identity alone is not a user-held encryption secret. No migration, permission
revocation or change to the running authentication flow is authorized by this deferral.

## Acceptance and later work

Implementation is not deployment acceptance. Track current verification and remaining
external setup in docs/GITHUB_ACCEPTANCE.md. Physical Windows/phone use, hosted cold
loads, real collaborator onboarding and token expiry need explicit evidence.

Preserve later Frankenstein requirements: subtle PDF passage highlights, source-paper
page/region evidence, separate human checks, stable passage IDs, and source-version
binding. A compile result says nothing about scientific validity. Coediting, custom MCP
and cloud ChatGPT connectors must not delay the basic GitHub workflow.

The main folder is independent of the opening document in .agentlatex.json. New
projects default to agentlatex/main/ and its main.tex; legacy projects infer their folder
from the saved main document. Settings sits beside Synced. The optional second tree
browses the entire repository: opening a file goes to GitHub; linking retains its
original path, with no copy or OS symlink. New files start in the main-folder root.
Moves are draft changes, reject name collisions, and save through the existing safe
GitHub checkpoint. TeX references are not automatically rewritten on moves.
Only the saved/default branch is exposed; there is no branch switching UI and existing
non-main branch configurations are preserved rather than redirected silently. If the
saved branch no longer exists because GitHub's default branch was renamed, opening the
project follows the current default once and records it, so the project stays openable.

Version-control UI is explicitly a later TODO: explore meaningful checkpoints, readable
diffs and agent-assisted explanations/restoration on top of GitHub history. No second
history store, automatic destructive rollback or model call simply to view history.
Outgoing automatic saving remains proposed; incoming refresh is implemented.
Do not reorganize SWA or existing manuscripts as part of these changes.

## Session continuity

Sessions last 180 days and renew on visits (at most weekly), including upgrades of
still-valid older 30-day sessions. GitHub access tokens refresh automatically while
the refresh token remains valid. Temporary upstream/network refresh failures preserve
the session for retry; explicit invalid/expired credentials require reconnecting.
Sign-out deletes the server session and clears the home-list cache. A stored token that
can no longer be decrypted (for example after a SESSION_KEY rotation) ends that session
and asks for a reconnection rather than failing every request. Cookie protections
remain HttpOnly, Secure on HTTPS, SameSite=Lax. Browser cookie removal, GitHub revocation
or roughly six months without renewal can require sign-in. This is not permanent access.
