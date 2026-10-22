# Project prompts

The project header's **Prompts** button opens **Connect agent** first, followed by
Import a conversation. Copy prompt is visible above the collapsed Read prompt preview;
there is no repeated repository heading. The copied prompt retains the exact repository,
branch, main file and project URL. Copying does not run commands or grant access.
A draft reminder appears when needed. Clipboard failure expands/selects the prompt.

Connect agent points to `https://agentlatex.com/docs/GitHub-setup.md`, with a public
source-repository fallback. That guide covers
capability detection, existing connectors/checkouts, necessary git/gh setup, actual
login URLs and codes, and handoff when write tools are unavailable. It is read online rather than copied into paper repositories.
Local instructions are preserved. There is no separate Set up GitHub task in the UI.
Connect agent also links the live agent/LaTeX guides for old and new projects and asks
the canonical marked root/main-folder reminder through the live guide, preserving local rules.
Conversation-import bookkeeping is still added only on the first import.

Project settings → Report issue provides one copyable diagnosis prompt. It directs
agents to fix local/document issues, or search for duplicates and submit a minimal
synthetic site bug to this repository. Private paper/account information must be
excluded. Agents without issue-writing tools prepare the report and direct the user
to GitHub; they must not claim an issue was submitted. No issue is sent by the website.

Compilation failures also offer **Copy prompt for agent** below a three-line error
preview. The copied prompt contains the entire available build log, document path,
compiler, repository, branch and base revision. An unsaved-draft notice tells the
agent to obtain the failing source before editing. It asks for a minimal repair that
preserves scientific content and author tags. View prompt is collapsed by default;
the full Build log remains available. Nothing is sent to an agent automatically.
A new attempt resets the prompt; a successful build clears the failure panel.

Setup targets beginners: inspect available capabilities first, preserve existing
accounts/checkouts, show the real login URL and device code, wait for login, then
verify access. A cloud-only agent must not claim it configured the user's computer.

The portable [conversation import skill](../skills/agentslatex-import-conversation/SKILL.md)
is the single source for import instructions. `scripts/build-docs.mjs` publishes it at
`/docs/import-conversation.md` and as a readable HTML page. The copied prompt links
there and to its GitHub source fallback, retaining project context and the key no-overwrite
rule. No copied skill is created in the paper repository.

Multiple chats share the root `IMPORTS.md` index. Each import has a unique ID and
workspace folder, with an entry describing source, destination, coverage and related
imports; SUMMARY.md maps individual artifacts to their origins. Follow-up imports
link earlier entries and add only new material. Retries retain their ID. Concurrent
imports must merge index additions against the latest branch, preserving both.
The first import creates the index if missing, in both new and existing
projects. Later imports reuse them. A no-write
bundle contains a proposed IMPORT-ENTRY.md for the receiving agent to append, never
a stale replacement index. These are agent instructions, not automatic enforcement.

Import produces actual available artifacts plus SUMMARY.md (decisions, results,
file inventory, reproduction, open work and coverage gaps). A raw transcript is
optional and must be an authentic, explicitly requested export of the selected chat.
SUMMARY.md also records requests and outcomes chronologically, using known dates or
conversation order. Each substantive prompt maps to a saved artifact or an explicit
status; acknowledgment alone is not completion. Work done elsewhere and material not
recovered are identified for the user, without inventing access or timestamps.
Never fabricate JSONL, inaccessible messages, missing binaries or successful uploads.
Browser chat capability varies: verify write tools and selected-repo access. With no
write tool, export a bundle and provide a handoff for a local agent. A pasted skill
does not install tools or grant access. Remote read-back is required to claim upload.

The prompts provide or link browser GitHub connection guidance when access is missing,
separate from AgentsLaTeX login and local `gh` authentication. They guide rather than
grant access and account for school/work approval. Product references checked 2026-10-22:
- [ChatGPT GitHub connection](https://help.openai.com/en/articles/11145903-connecting-github-to-chatgpt-deep-resear):
  Connection guidance; use observed capabilities rather than a categorical write-access claim.
- [Claude GitHub integration](https://support.claude.com/en/articles/10167454-use-the-github-integration):
  + → Add from GitHub, repository context and manual refresh. This is not evidence
  of a write tool. The prompt checks actual capability before claiming upload.

## Verification — 2026-10-22

Client/Worker typechecks and hosted packaging passed. The skill passed its structural
validator. Chrome loopback fixture: all three project-specific prompts, actual clipboard
copy/paste, Escape/return focus, and 360×800, 412×915, 915×412 responsive layouts checked.
These are emulated viewport checks, not physical phones. Clipboard-denied fallback was
inspected, not forced. Repeated-import and provider-login instructions were reviewed;
no claim that a real ChatGPT/Claude conversation was imported end to end.

The deployed demo project's Prompts menu and selected-repository import instructions
were checked at agentlatex.com. Deployment evidence is in GITHUB_ACCEPTANCE.md.

## Model labels

Connect agent and import prompts link the current model-tag convention even for older projects.
Short root/nested reminders retain the key rule; live agent instructions and LaTeX specs contain the details. Each
paired passage block includes an ordinary `% agentlatex:author` JSON comment with
model, version and reasoning; unavailable fields are unknown. Prior author records
are preserved. Imports distinguish original from reconstructed writing. This is
self-reported metadata; Show AI still uses the existing begin/end markers. Existing
repository files are not silently rewritten, and no new identity verification or
model-details UI is implied. The full agent guide is `docs/AGENT_GUIDE.md`.

## Public docs

`/docs` is a static, login-free index with HTML and plain Markdown versions of agent
instructions, LaTeX specs, GitHub setup and imports. Generated docs are build outputs;
the files above are the editable sources. Docs use revalidation (`Cache-Control: no-cache`),
not immutable compiler caching. This does not refresh a running agent's context: reminders
ask it to reread at the start/resumption of work, including after compaction. Docs describe
current app behavior, preserve local preferences, and do not authorize unrelated actions.
No new Worker route, database, dependency, paid service or runtime model call is added.

The repair prompt reads root .agentlatex.json, local AGENTS.md and live LaTeX specs,
with a raw-GitHub fallback. Connect agent carries project identity, scope and entry
links; procedures live in the guides. Setup starts from observed connector/filesystem
capabilities, not product-name assumptions. The canonical marked reminder is generated
from shared/project-reminder.json for both the app and /docs/project-reminder.md.
Manuscript validation is separate from website compiler development checks.
