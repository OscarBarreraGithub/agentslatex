import type { Project } from "./contracts";
import importSkill from "./import-skill.generated";
import { modelTaggingInstructions } from "./authoring";

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
For a project issue, explain and fix the smallest cause, following AGENTS.md and
latex-specs.md. Do not file a website bug for an ordinary source error.

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
First read skills/GitHub-setup.md in this repository. It guides local and browser
agents through GitHub access. If this older project does not have it yet, read
https://github.com/OscarBarreraGithub/agentslatex/blob/main/skills/GitHub-setup.md
and add the same guide under skills/GitHub-setup.md when you can write to the repo.
If you cannot access the private repository yet, use that public guide first.
Guide me through any required sign-in step by step; show the actual login URL and
one-time code before waiting. Preserve existing accounts and check actual read/write
capabilities. A read-only connection does not let you push edits.

Use this existing repository for our work. Check your actual GitHub read/write access;
if it is unavailable, tell me the next concrete setup step. Use an existing checkout
or clone the supplied repository, preserving local changes. Read root AGENTS.md,
latex-specs.md, .agentlatex.json and relevant nested instructions before editing.

Follow the configured folder layout and Agent passage tags. Keep linked files at their
original repository paths. Pull current changes before editing; after each coherent
update, review the diff, commit only our work with its tags, and push to the supplied
branch. Never force-push. Resolve conflicts explicitly and preserve other work.
Verify the remote commit before saying it is synced. I must save browser drafts to
GitHub before you can read them. The website checks for updates automatically and
preserves browser drafts; Save to GitHub publishes my edits and Refresh resolves
pending updates. Do not claim to see unsaved browser text or browser build results.

If a local compiler is available, follow latex-specs.md and check the changed document.
Otherwise say it needs browser compilation. Finish with changed files, the commit link,
validation actually performed, and any remaining issue. Wait for my task if none was
given; opening the project does not authorize inventing manuscript changes.\n\n` + modelTaggingInstructions,
    },
    {
      id: "import",
      title: "Import a conversation",
      destination: "Paste into the conversation you want to bring over.",
      text: context + `\nGo through our conversation and preserve its useful work in this project.
First read skills/agentslatex-import-conversation/SKILL.md and root IMPORTS.md in
this repository. Keep an entry in IMPORTS.md of what was imported and where it went.
Do not overwrite previous imports. On the first import these files do not exist yet;
create them from the instructions below.\n\n` +
        importSkill.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "").trim() + "\n\n" + modelTaggingInstructions,
    },
  ];
}
