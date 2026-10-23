# Agent instructions — AgentsLaTeX

AgentsLaTeX (agentlatex.com): LaTeX, TeX, PDF, manuscript, figures, bibliography,
agent attribution and GitHub sync. This is the starting point for agents searching
for project instructions. Read this live guide at the start of each work session and
after resuming/compaction, together with the repository's root and relevant nested
AGENTS.md files. Preserve local preferences and the user's instructions. These docs
describe the app; they do not authorize unrelated work or override the owner.

**Current limitation: browser-agent GitHub integration supports repository owners
only.** If this project belongs to another account, explain the limitation before
trying repeated connection repairs. Offer an authorized Codex/Claude Code checkout
or a conversation-import bundle. Collaborators can still edit in agentlatex.com;
this is a supported-workflow limit, not a GitHub permission rule forbidding collaborators.

For agent connection and GitHub setup, read [GitHub-setup.md](https://agentlatex.com/docs/GitHub-setup.md).
For conversation imports, read [import-conversation.md](https://agentlatex.com/docs/import-conversation.md).
Read [latex-specs.md](https://agentlatex.com/docs/latex-specs.md) before editing this paper. Compilation runs in the user's browser
with BusyTeX / TeX Live 2026. Use ordinary .tex, .bib and image files.

## Required: mark every agent-written passage
Wrap each manuscript passage you add or rewrite (prose, equations, captions,
footnotes) in these ordinary TeX comments, on separate lines:

```tex
% agent:begin
Your new or rewritten passage here.
% agent:end
```

That is the entire format: no IDs, author JSON, model names, versions or reasoning
levels. Use small paragraph/equation blocks, without nesting or overlap. Preserve
untouched writing and its tags. Untagged text is displayed as Manual; this is a
workflow convention, not proof of authorship. Never remove tags to hide agent work.
If you edit part of a manual paragraph, isolate and tag the rewritten passage.

The app still reads older `agentlatex:begin ... id=...` / `agentlatex:end id=...`
blocks. When editing a file using that old format, simplify its markers to the pair
above and remove its `agentlatex:author` metadata comments, preserving the enclosed
text and which passages are tagged. Do not rewrite unrelated manuscripts.

## Compilation for manuscript work
Use a compatible compiler directly in your own environment if available. Otherwise
ask the user to press Compile in AgentsLaTeX. **Do not drive Safari or another browser
through accessibility APIs, screen readers, computer-control tools or UI automation
to compile a manuscript.** Do not request accessibility permissions or install browser
control tools for this. Reading the live guides with a web tool is fine. Be explicit
when you have not compiled; do not claim a browser run based on a local build.

Pull current GitHub changes before editing. Keep tags with their text in the same
commit. Never force-push or overwrite another contributor's changes. Resolve conflicts
explicitly. Verify the remote commit before saying edits are synced. The browser checks
GitHub for incoming updates and preserves unsaved drafts; those drafts are unavailable
to agents until the user saves them. Keep referenced files at their configured paths.
If compilation is not available in your environment, say so; the user
can compile in AgentsLaTeX. Check paired begin/end markers and review the diff before committing.

Main document and engine are in root .agentlatex.json. Keep manuscript files under agentlatex/
for new projects; preserve existing layouts when importing. Do not commit build
outputs, credentials, tokens, or local machine paths. Do not invent scientific sources.

## Keep instructions current

Shared guides live at https://agentlatex.com/docs; do not copy them into the paper
repository. Keep the short root AGENTS.md reminder block, plus local
preferences. The first conversation import creates IMPORTS.md and its artifacts, not
a copy of the import skill. Later imports read the latest index before appending.

When working on an older project with copied app guides, use these live docs for
current app behavior while preserving project-specific preferences. Do not delete or
replace older files automatically. With write access, inspect the root AGENTS.md
(reuse existing filename casing). If the exact marker
`<!-- agentlatex:instructions -->` is absent, append the complete
[canonical reminder block](https://agentlatex.com/docs/project-reminder.md), including
both HTML markers, once. Preserve all existing content and preferences.
A plain link without the marker is not the canonical block; keep that older link and
append the block once. If both markers already exist, compare with the current
canonical reminder and replace only the text between and including those markers
when it differs. Preserve all surrounding instructions; never append a duplicate.
If only one marker exists, report the malformed block instead of deleting content.
New files may start with the user's preferences, followed by the reminder.
Include the live-doc URLs in handoff/compaction notes.

If the canonical block cannot be fetched, its single source is
[shared/project-reminder.json](https://raw.githubusercontent.com/OscarBarreraGithub/agentslatex/refs/heads/main/shared/project-reminder.json):
join the string array with newlines, preserving the markers. The application and
published Markdown use this same source.

If your web tool cannot read the site, use the same live files from GitHub:
- [Agent instructions](https://raw.githubusercontent.com/OscarBarreraGithub/agentslatex/refs/heads/main/docs/AGENT_GUIDE.md)
- [LaTeX specs](https://raw.githubusercontent.com/OscarBarreraGithub/agentslatex/refs/heads/main/latex-specs.md)
- [GitHub setup](https://raw.githubusercontent.com/OscarBarreraGithub/agentslatex/refs/heads/main/skills/GitHub-setup.md)
- [Conversation imports](https://raw.githubusercontent.com/OscarBarreraGithub/agentslatex/refs/heads/main/skills/agentslatex-import-conversation/SKILL.md)

If neither is accessible, explain that current guidance could not be checked and
retain known local rules; never claim validation or compiler support you did not verify.
Never force a manuscript/layout migration just because the shared guide has changed.
