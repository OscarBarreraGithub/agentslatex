import latexSpecs from "./latex-specs.generated";
import importSkill from "./import-skill.generated";
export const taggingInstructions = `# Agent instructions — AgentsLaTeX

AgentsLaTeX (agentlatex.com): LaTeX, TeX, PDF, manuscript, figures, bibliography,
agent attribution and GitHub sync. This is the starting point for agents searching
for project instructions. For importing a ChatGPT conversation, Python scripts,
derivations or results, read skills/agentslatex-import-conversation/SKILL.md and the
root IMPORTS.md index first. Append every import's origin and destination there;
preserve earlier entries and files. Each conversation import has its own folder.

Read latex-specs.md before editing this paper. Compilation runs in the user's browser
with BusyTeX / TeX Live 2026. Use ordinary .tex, .bib and image files.

## Required: mark every agent-written passage
Every manuscript passage you add or rewrite (prose, equations, captions, footnotes)
must be enclosed by these ordinary TeX comments, on separate lines:

\`\`\`tex
% agentlatex:begin agent id=UNIQUE-ID
Your new or rewritten passage here.
% agentlatex:end id=UNIQUE-ID
\`\`\`

Use a fresh unique ID for a new passage. Preserve existing IDs for edits within that
passage. No nested or overlapping blocks. Use small paragraph/equation blocks, not a
whole-document wrapper. Preserve untouched text and its existing tags. Do not label
untouched human writing as Agent. Untagged text is displayed as Manual; this is a
workflow convention, not proof of authorship. Never remove tags to hide agent work.
If you edit part of a manual paragraph, isolate and tag your rewritten passage.

Pull current GitHub changes before editing. Keep tags with their text in the same
commit. Never force-push or overwrite another contributor's changes. Resolve conflicts
explicitly. If compilation is not available in your environment, say so; the user
can compile in AgentsLaTeX. Check paired IDs and review the diff before committing.

Main document and engine are in .agentlatex.json. Keep manuscript files under agentlatex/
for new projects; preserve existing layouts when importing. Do not commit build
outputs, credentials, tokens, or local machine paths. Do not invent scientific sources.
`;
export function templateFiles(folder = "agentlatex"): Record<string, string> {
  const prefix = folder ? folder + "/" : "";
  const result: Record<string, string> = {
    "AGENTS.md": taggingInstructions,
    "CLAUDE.md": "@AGENTS.md\n",
    "latex-specs.md": latexSpecs,
    "skills/agentslatex-import-conversation/SKILL.md": importSkill,
    "IMPORTS.md": `# Conversation import index

Agents: read skills/agentslatex-import-conversation/SKILL.md before every import.
Always record what was imported and where it went here. Read the latest branch first.
Append entries; never replace earlier entries or imported files. Keep each import in
its own uniquely named folder under the configured workspace's imports/ directory.
For a continuation, link the earlier import and add only newly recovered work.
Check for duplicate imports and directory collisions. Keep this entry and its files
in the same commit. Resolve concurrent index changes by preserving both entries.
This is a shared working index, not a tamper-proof authorship record.

## Imports

No conversations imported yet. Replace this sentence when adding the first entry.

<!-- Append a heading per import with: unique ID; actual date; topic; chat provider
and title; source reference if available and safe; destination folder; SUMMARY.md
link; recovered/reconstructed/missing material; related prior import IDs. The summary
lists each file's repository-relative path, purpose and origin. Do not publish private
chat links or credentials. Git history records the commit; no self-referential SHA needed. -->
`,
    ".agentlatex.json":
      JSON.stringify(
        { version: 1, folder, main: prefix + "main.tex", references: [], engine: "pdf" },
        null,
        2,
      ) + "\n",
    "README.md":
      "# My paper\n\nOpen this repository in [AgentsLaTeX](https://agentlatex.com).\n\nManuscript: `agentlatex/main.tex`. Images: `agentlatex/figures/`. Bibliography: `agentlatex/references.bib`.\n\nAgents: read **AGENTS.md** and **latex-specs.md**. Every agent-written passage must carry the paired Agent tags. Commit source and tags together.\n\nInvite collaborators in this repository’s GitHub settings. They sign in to AgentsLaTeX with their own GitHub account.\n",
    ".gitignore":
      "*.aux\n*.log\n*.out\n*.toc\n*.synctex.gz\n*.fls\n*.fdb_latexmk\n*.bbl\n*.blg\n.DS_Store\n.env*\n",
    "agentlatex/AGENTS.md":
      "# Manuscript editing\n\nFollow ../AGENTS.md and ../latex-specs.md. Tag **every** new or rewritten agent passage with paired `% agentlatex:begin agent id=...` / `% agentlatex:end id=...` comments. Preserve untouched text and tags.\n",
    "agentlatex/CLAUDE.md": "@../AGENTS.md\n",
    "agentlatex/main.tex": String.raw`% Agents: read ../AGENTS.md. Tag every new or rewritten manuscript passage.
\documentclass[11pt]{article}
\usepackage[margin=1in]{geometry}
\usepackage{amsmath,amssymb,graphicx}
\usepackage[hidelinks]{hyperref}
\graphicspath{{figures/}}
\title{My paper}
\author{}
\date{}
\begin{document}
\maketitle

% agentlatex:begin agent id=starter-introduction
\section{Introduction}
Your paper starts here.
% agentlatex:end id=starter-introduction

% Add sources to references.bib beside this document, then uncomment:
% \bibliographystyle{plain}
% \bibliography{references}
\end{document}
`,
    "agentlatex/references.bib":
      "% Add bibliography entries here. Cite real sources only.\n",
    "agentlatex/figures/.gitkeep": "",
  };
  // Repo instructions remain at root; paper files use the chosen folder.
  const up = "../".repeat(folder ? folder.split("/").length : 0);
  result["README.md"] = result["README.md"].replaceAll("agentlatex/", prefix);
  for (const path of Object.keys(result)) {
    if (!path.startsWith("agentlatex/")) continue;
    const content = result[path].replaceAll("../AGENTS.md", up + "AGENTS.md").replaceAll("../latex-specs.md", up + "latex-specs.md");
    delete result[path];
    const target = prefix + path.slice("agentlatex/".length);
    // At repository root, keep the complete root agent instructions.
    if (!(target in result)) result[target] = content;
  }
  return result;
}
