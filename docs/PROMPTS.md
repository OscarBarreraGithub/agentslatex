# Project prompts

The project header's **Prompts** button offers three copyable, project-specific tasks:
local GitHub setup, conversation import, and continuing work with an agent. Copying
does not execute a command, send a message, sign in, or grant repository access.
The prompt includes the actual repository, branch and current main document. A browser
draft reminder appears when needed. Clipboard failure selects the text for manual copy.

Setup targets beginners: inspect the local environment first, preserve existing
accounts/checkouts, show the real login URL and device code, wait for login, then
verify access. A cloud-only agent must not claim it configured the user's computer.

The portable [conversation import skill](../skills/agentslatex-import-conversation/SKILL.md)
is the single source for the copyable import instructions and the skill seeded into
new/newly connected paper repositories. `scripts/prepare-template.mjs` generates the
shared string. Existing connected repositories are not rewritten by this UI update;
their project prompts still contain the full import instructions.

Multiple chats share the root `IMPORTS.md` index. Each import has a unique ID and
workspace folder, with an entry describing source, destination, coverage and related
imports; SUMMARY.md maps individual artifacts to their origins. Follow-up imports
link earlier entries and add only new material. Retries retain their ID. Concurrent
imports must merge index additions against the latest branch, preserving both.
New/newly connected repositories receive the index and skill. In older projects,
the copied instructions tell the importing agent to create missing files. A no-write
bundle contains a proposed IMPORT-ENTRY.md for the receiving agent to append, never
a stale replacement index. These are agent instructions, not automatic enforcement.

Import produces actual available artifacts plus SUMMARY.md (decisions, results,
file inventory, reproduction, open work and coverage gaps). A raw transcript is
optional and must be an authentic, explicitly requested export of the selected chat.
Never fabricate JSONL, inaccessible messages, missing binaries or successful uploads.
Browser chat capability varies: verify write tools and selected-repo access. With no
write tool, export a bundle and provide a handoff for a local agent. A pasted skill
does not install tools or grant access. Remote read-back is required to claim upload.

All three prompts include browser GitHub connection guidance when access is missing,
separate from AgentsLaTeX login and local `gh` authentication. They guide rather than
grant access and account for school/work approval. Product references checked 2026-10-22:
- [ChatGPT GitHub connection](https://help.openai.com/en/articles/11145903-connecting-github-to-chatgpt-deep-resear):
  Apps/Plugins connection and selected-repo authorization; the standard app is read-only.
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
