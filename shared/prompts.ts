import type { Project } from "./contracts";
import importSkill from "./import-skill.generated";

export interface ProjectPrompt {
  id: string;
  title: string;
  destination: string;
  text: string;
}

export function projectPrompts(project: Project): ProjectPrompt[] {
  // Use the selected project's actual configuration, including legacy layouts.
  const context = `My AgentsLaTeX project:\nRepository: https://github.com/${project.owner}/${project.name}\nBranch: ${JSON.stringify(project.branch)}\nMain document: ${JSON.stringify(project.main)}\nWebsite: https://agentlatex.com/?project=${project.id}\nRead .agentlatex.json for the current workspace and compiler settings.\n`;
  const browserSetup = `
If we are in a browser chat without GitHub access, guide me through connecting it
one step at a time. In ChatGPT, open Settings > Apps or Plugins > GitHub and follow
the connection flow. In Claude, use + > Add from GitHub and follow sign-in. Select
this repository when asked, wait for me to finish, and verify you can read it. If
work/school approval is required, explain that next step. Use the controls actually
shown; official help if needed:
https://help.openai.com/en/articles/11145903-connecting-github-to-chatgpt-deep-resear
https://support.claude.com/en/articles/10167454-use-the-github-integration
My AgentsLaTeX sign-in does not connect the chat's GitHub account. A read connection
does not grant write tools: ChatGPT's standard GitHub app is read-only. Check actual
write capability; if absent, prepare files and guide me through a local-agent handoff.
Do not request passwords/tokens or repeatedly reconnect to try to enable uploads.
`;
  return [
    {
      id: "setup",
      title: "Set up GitHub on my computer",
      destination: "Paste into an agent on your computer.",
      text: context + browserSetup + `
Help me open this existing project on my computer. I am new to GitHub; explain one
concrete step at a time in plain language. A repository is the shared project folder.
Do routine checks yourself when your tools allow it, and wait when I need to sign in.

First check whether you can operate on MY computer. If you only have a cloud session,
say so and guide me to a local agent or terminal; do not install tools in the cloud
and claim my computer is set up. Detect my operating system. Check for git and gh
(GitHub CLI) and existing authentication before installing or signing in again.
If tools are missing, explain the appropriate official installer for my system.
Use gh auth status to check sign-in without printing credentials. Preserve my other
accounts. If login is needed, guide me through gh auth login using the browser flow.
Show the exact sign-in URL AND actual one-time code in your message before waiting;
keep the login interactive. Say a website is open only if you actually opened it.
Never ask me to paste passwords, tokens, or private keys. Verify login after I finish.

Check my access to the supplied repository. If access is missing, explain how to accept
the collaborator invitation or ask its owner; do not create a replacement repository.
Use an existing checkout when available. Otherwise ask where I want the project folder
and clone there without replacing existing files. Use the supplied branch and preserve
local changes. Read AGENTS.md and latex-specs.md. Finish with the local folder location,
the GitHub link, and the next simple step. Do not modify the paper during setup.`,
    },
    {
      id: "import",
      title: "Import a conversation",
      destination: "Paste into the conversation you want to bring over.",
      text: context + `\nGo through our conversation and preserve its useful work in this project.
First read skills/agentslatex-import-conversation/SKILL.md and root IMPORTS.md in
this repository. Keep an entry in IMPORTS.md of what was imported and where it went.
Do not overwrite previous imports. The instructions below also work if these files
have not yet been added to this project.\n\n` +
        importSkill.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "").trim(),
    },
    {
      id: "work",
      title: "Work on this project",
      destination: "Paste into the agent you normally work with.",
      text: context + browserSetup + `
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
given; opening the project does not authorize inventing manuscript changes.`,
    },
  ];
}
