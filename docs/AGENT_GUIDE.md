# Agent instructions — AgentsLaTeX

AgentsLaTeX (agentlatex.com): LaTeX, TeX, PDF, manuscript, figures, bibliography,
agent attribution and GitHub sync. This is the starting point for agents searching
for project instructions. Read this live guide at the start of each work session and
after resuming/compaction, together with the repository's root and relevant nested
AGENTS.md files. Preserve local preferences and the user's instructions. These docs
describe the app; they do not authorize unrelated work or override the owner.

For agent connection and GitHub setup, read [GitHub-setup.md](https://agentlatex.com/docs/GitHub-setup.md).
For conversation imports, read [import-conversation.md](https://agentlatex.com/docs/import-conversation.md).
Read [latex-specs.md](https://agentlatex.com/docs/latex-specs.md) before editing this paper. Compilation runs in the user's browser
with BusyTeX / TeX Live 2026. Use ordinary .tex, .bib and image files.

## Required: mark every agent-written passage
Every manuscript passage you add or rewrite (prose, equations, captions, footnotes)
must be enclosed by these ordinary TeX comments, on separate lines:

```tex
% agentlatex:begin agent id=UNIQUE-ID
% agentlatex:author {"model":"unknown","version":"unknown","reasoning":"unknown"}
Your new or rewritten passage here.
% agentlatex:end id=UNIQUE-ID
```

Use a fresh unique ID for a new passage. Preserve existing IDs for edits within that
passage. No nested or overlapping blocks. Use small paragraph/equation blocks, not a
whole-document wrapper. Preserve untouched text and its existing tags. Do not label
untouched human writing as Agent. Untagged text is displayed as Manual; this is a
workflow convention, not proof of authorship. Never remove tags to hide agent work.
If you edit part of a manual paragraph, isolate and tag your rewritten passage.

## Required: record the model behind each agent passage
Immediately after each begin marker, add an ordinary TeX comment containing JSON:

```tex
% agentlatex:author {"model":"unknown","version":"unknown","reasoning":"unknown"}
```

Replace each value with what your session actually exposes. Use the exact model ID
or displayed name, including aliases such as Sol, Astra, Luna, Terra, Haiku, Sonnet,
Opus or Fable when that is all you know. Record a version/release identifier when
known. Reasoning is the actual setting (for example low, medium, high or xhigh),
not a model name. Use "not-applicable" only when reasoning does not apply; otherwise
use "unknown" for unavailable fields. Never guess an underlying model or version.

Keep begin/end marker syntax unchanged. Preserve existing author records when editing
a passage; append your own record if its model/version/reasoning differs. Do not
attribute untouched or imported passages to the importing agent: retain the original
model when known and use unknown otherwise. Tag newly reconstructed writing with the
model that reconstructed it. These are self-reported labels, not verified identities.


Pull current GitHub changes before editing. Keep tags with their text in the same
commit. Never force-push or overwrite another contributor's changes. Resolve conflicts
explicitly. If compilation is not available in your environment, say so; the user
can compile in AgentsLaTeX. Check paired IDs and review the diff before committing.

Main document and engine are in root .agentlatex.json. Keep manuscript files under agentlatex/main/
for new projects; preserve existing layouts when importing. Do not commit build
outputs, credentials, tokens, or local machine paths. Do not invent scientific sources.

## Keep instructions current

Shared guides live at https://agentlatex.com/docs; do not copy them into the paper
repository. Keep the short root and manuscript-folder AGENTS.md reminders, plus local
preferences. The first conversation import creates IMPORTS.md and its artifacts, not
a copy of the import skill. Later imports read the latest index before appending.

When working on an older project with copied app guides, use these live docs for
current app behavior while preserving project-specific preferences. Do not delete or
replace older files automatically. With write access, add a short live-docs pointer
to the root and configured main folder's AGENTS.md if missing, preserving existing
contents and filename casing. Include these URLs in a handoff/compaction note.

If the site is unavailable, the same guide is in the public source repository:
https://github.com/OscarBarreraGithub/agentslatex/blob/main/docs/AGENT_GUIDE.md
If neither is accessible, explain that current guidance could not be checked and
retain known local rules; never claim validation or compiler support you did not verify.
Never force a manuscript/layout migration just because the shared guide has changed.
