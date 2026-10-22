import type { Project } from "./contracts";
import { docsUrl } from "./instructions";

export interface ProjectPrompt {
  id: string;
  title: string;
  destination: string;
  text: string;
}

export function reportIssuePrompt(project: Project): ProjectPrompt {
  return {
    id: "issue", title: "Report issue", destination: "Paste into your agent to diagnose and report.",
    text: `Help me diagnose an AgentsLaTeX problem. Ask what happened, what I expected,
and how to reproduce it if I have not described those details yet.

Private diagnostic context (do not include in a public issue):
Project: https://github.com/${project.owner}/${project.name}
Main document: ${project.main}
Compiler: ${project.engine}

First distinguish a document/project issue (LaTeX source, paths, GitHub access,
unsaved edits, local setup) from a bug in agentlatex.com. Inspect only relevant,
authorized files and logs. Preserve my draft, scientific content and account settings.
For a project issue, explain and fix the smallest cause, following local AGENTS.md,
${docsUrl}/AGENTS.md and ${docsUrl}/latex-specs.md.
Do not file a website bug for an ordinary source error.

For a reproducible site bug, search existing issues at
https://github.com/OscarBarreraGithub/agentslatex/issues to avoid duplicates.
If already reported, give me that issue link. Otherwise create a GitHub issue there
on my behalf using your available GitHub tool or gh CLI. Include a clear title,
steps to reproduce, expected and actual behavior, relevant browser/OS information,
and a minimal synthetic example when useful. Distinguish observations from guesses.
Do not publish private repository names/URLs, manuscript text, conversations,
credentials or unredacted logs. Reproduce with synthetic content instead.

Check existing GitHub sign-in first. If sign-in is needed, guide me step by step
and show the actual login URL and device code before waiting. Never ask for tokens
or passwords. If you cannot create issues with your tools, prepare the issue text
and open the repository's New issue page for me; do not claim it was submitted.
After creation, verify the issue exists and give me its link.`,
  };
}

export function projectPrompts(project: Project): ProjectPrompt[] {
  // Use the selected project's actual configuration, including legacy layouts.
  const context = `My AgentsLaTeX project:\nRepository: https://github.com/${project.owner}/${project.name}\nBranch: ${JSON.stringify(project.branch)}\nMain document: ${JSON.stringify(project.main)}\nWebsite: https://agentlatex.com/?project=${project.id}\nRead .agentlatex.json for the current workspace and compiler settings.\n`;
  return [
    {
      id: "work",
      title: "Connect agent",
      destination: "Paste into the agent you normally work with.",
      text: context + `
Use this existing project for the work I request. Preserve local instructions and
unrelated changes; wait for my task if I have not given one.

Start with https://agentlatex.com/docs/AGENTS.md. For access or setup, follow
https://agentlatex.com/docs/GitHub-setup.md using the tools actually available to you.
Before editing LaTeX, read https://agentlatex.com/docs/latex-specs.md.
If the site is unavailable, the same live guide and its linked sources are at:
https://raw.githubusercontent.com/OscarBarreraGithub/agentslatex/refs/heads/main/docs/AGENT_GUIDE.md

Check repository access before editing. My browser draft is not available to you
until saved to GitHub. Opening this project does not authorize manuscript changes.`,
    },
    {
      id: "import",
      title: "Import a conversation",
      destination: "Paste into the conversation you want to bring over.",
      text: context + `\nGo through our conversation and preserve its useful work in this project.
First read ${docsUrl}/import-conversation.md and ${docsUrl}/AGENTS.md.
Fallback: https://raw.githubusercontent.com/OscarBarreraGithub/agentslatex/refs/heads/main/skills/agentslatex-import-conversation/SKILL.md
Read the latest root IMPORTS.md before importing; create that index only if missing.
Append what was imported and where it went. Preserve all earlier entries and files.
Store new artifacts in a unique folder, with a SUMMARY.md; reuse the import ID on retry.
Do not copy shared instructions into this repository. Preserve local AGENTS.md preferences.
The live guide explains GitHub connection and a downloadable-bundle handoff when this
browser agent cannot write to GitHub. Check actual tools; do not claim an upload without
verifying the remote files. Preserve source/model attribution and state any missing history.
If neither instruction URL is accessible, ask me to provide the guide before importing.`,
    },
  ];
}
