import { defaultMainFolder } from "./workspace";
import { appendInstructions } from "./instructions";

/**
 * The smallest useful paper: one root AGENTS.md pointer, the portable settings file,
 * a README, and a compilable main.tex with an empty bibliography beside it. Nothing
 * else is written into a person's repository; figures/ appears when they add one.
 */
export function templateFiles(folder = defaultMainFolder): Record<string, string> {
  const prefix = folder ? folder + "/" : "";
  return {
    "AGENTS.md": appendInstructions(),
    ".agentlatex.json": JSON.stringify(
      { version: 1, folder, main: prefix + "main.tex", references: [], engine: "pdf" }, null, 2,
    ) + "\n",
    "README.md": `# My paper

Edit and compile in [AgentsLaTeX](https://agentlatex.com). Manuscript: \`${prefix}main.tex\`;
bibliography: \`${prefix}references.bib\`; images go in \`${prefix}figures/\`.
Agents: read **AGENTS.md**. Collaborators sign in with their own GitHub account after you
invite them in this repository's settings.
`,
    ...starterManuscript(folder),
  };
}

/** The manuscript files alone, for a connected repository whose main document is missing. */
export function starterManuscript(folder: string): Record<string, string> {
  const prefix = folder ? folder + "/" : "";
  return {
    [prefix + "main.tex"]: String.raw`% Agents: follow the root AGENTS.md and https://agentlatex.com/docs/AGENTS.md.
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

\section{Introduction}
Your paper starts here.

% Add sources to references.bib beside this document, then uncomment:
% \bibliographystyle{plain}
% \bibliography{references}
\end{document}
`,
    [prefix + "references.bib"]: "% Add bibliography entries here.\n",
  };
}
