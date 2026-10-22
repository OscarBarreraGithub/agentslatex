import { defaultMainFolder } from "./workspace";
import { appendInstructions } from "./instructions";

export function templateFiles(folder = defaultMainFolder): Record<string, string> {
  const prefix = folder ? folder + "/" : "";
  return {
    "AGENTS.md": appendInstructions(),
    [prefix + "AGENTS.md"]: appendInstructions(),
    ".agentlatex.json": JSON.stringify(
      { version: 1, folder, main: prefix + "main.tex", references: [], engine: "pdf" }, null, 2,
    ) + "\n",
    "README.md": `# My paper

Open this repository in [AgentsLaTeX](https://agentlatex.com).

Manuscript: \`${prefix}main.tex\`. Images: \`${prefix}figures/\`. Bibliography: \`${prefix}references.bib\`.

Agents: read **AGENTS.md** and the current [agent instructions](https://agentlatex.com/docs/AGENTS.md).
Invite collaborators in this repository's GitHub settings. They sign in to AgentsLaTeX with their own GitHub account.
`,
    ".gitignore": "*.aux\n*.log\n*.out\n*.toc\n*.synctex.gz\n*.fls\n*.fdb_latexmk\n*.bbl\n*.blg\n.DS_Store\n.env*\n",
    [prefix + "main.tex"]: String.raw`% Agents: follow this folder's AGENTS.md and https://agentlatex.com/docs/AGENTS.md.
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
% agentlatex:author {"model":"unknown","version":"unknown","reasoning":"unknown"}
\section{Introduction}
Your paper starts here.
% agentlatex:end id=starter-introduction

% Add sources to references.bib beside this document, then uncomment:
% \bibliographystyle{plain}
% \bibliography{references}
\end{document}
`,
    [prefix + "references.bib"]: "% Add bibliography entries here.\n",
    [prefix + "figures/.gitkeep"]: "",
  };
}
