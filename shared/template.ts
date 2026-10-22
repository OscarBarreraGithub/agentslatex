import latexSpecs from "./latex-specs.generated";
export const taggingInstructions = `# Agent instructions

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

Main document and engine are in .agentlatex.json. Keep manuscript files under paper/
for new projects; preserve existing layouts when importing. Do not commit build
outputs, credentials, tokens, or local machine paths. Do not invent scientific sources.
`;
export function templateFiles(): Record<string, string> {
  return {
    "AGENTS.md": taggingInstructions,
    "CLAUDE.md": "@AGENTS.md\n",
    "latex-specs.md": latexSpecs,
    ".agentlatex.json":
      JSON.stringify(
        { version: 1, main: "paper/main.tex", engine: "pdf" },
        null,
        2,
      ) + "\n",
    "README.md":
      "# My paper\n\nOpen this repository in [AgentsLaTeX](https://agentlatex.com).\n\nManuscript: `paper/main.tex`. Images: `paper/figures/`. Bibliography: `paper/references.bib`.\n\nAgents: read **AGENTS.md** and **latex-specs.md**. Every agent-written passage must carry the paired Agent tags. Commit source and tags together.\n\nInvite collaborators in this repository’s GitHub settings. They sign in to AgentsLaTeX with their own GitHub account.\n",
    ".gitignore":
      "*.aux\n*.log\n*.out\n*.toc\n*.synctex.gz\n*.fls\n*.fdb_latexmk\n*.bbl\n*.blg\n.DS_Store\n.env*\n",
    "paper/AGENTS.md":
      "# Manuscript editing\n\nFollow ../AGENTS.md and ../latex-specs.md. Tag **every** new or rewritten agent passage with paired `% agentlatex:begin agent id=...` / `% agentlatex:end id=...` comments. Preserve untouched text and tags.\n",
    "paper/CLAUDE.md": "@../AGENTS.md\n",
    "paper/main.tex": String.raw`% Agents: read ../AGENTS.md. Tag every new or rewritten manuscript passage.
\documentclass[11pt]{article}
\usepackage[margin=1in]{geometry}
\usepackage{amsmath,amssymb,graphicx}
\usepackage[hidelinks]{hyperref}
\graphicspath{{paper/figures/}}
\title{My paper}
\author{}
\date{}
\begin{document}
\maketitle

% agentlatex:begin agent id=starter-introduction
\section{Introduction}
Your paper starts here.
% agentlatex:end id=starter-introduction

% Add sources to paper/references.bib, then uncomment:
% \bibliographystyle{plain}
% \bibliography{paper/references}
\end{document}
`,
    "paper/references.bib":
      "% Add bibliography entries here. Cite real sources only.\n",
    "paper/figures/.gitkeep": "",
  };
}
