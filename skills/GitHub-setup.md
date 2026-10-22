# Connect this project to your agent

Use the repository and branch supplied in the Connect agent prompt. A repository is
our shared project folder. Explain only the next necessary step in plain language;
skip setup that is already complete. Signing into AgentsLaTeX does not authenticate
a separate agent, connector or terminal.

## Current browser-agent limitation: repository owners only

For now, AgentsLaTeX supports ChatGPT/Claude browser GitHub integration only for
repositories owned by the browser connector's signed-in GitHub account. If the user
is a collaborator on another account's repository, point this out immediately:

> Browser-agent GitHub integration currently supports repository owners only.
> You can still edit this project in AgentsLaTeX or use Codex/Claude Code with your
> GitHub access. For this browser conversation, I can prepare an import bundle.

This is our current supported scope, not a claim that GitHub technically forbids
collaborator access through every connector. Do not turn it into repeated sign-ins,
broader permissions or owner-installation troubleshooting by default. Use the local
Git route below or the import guide's bundle handoff. No custom MCP is being added
for this limitation.

## Start with the capabilities available here

Inspect your tools before asking the user to install or connect anything:
- Can you read and write this repository through an existing GitHub connector?
- Do you have a filesystem and Git? Is it the user's computer, a remote machine or
  a temporary cloud environment? Is there an existing checkout and authentication?
- Can you only read, or produce downloadable files without pushing changes?

Use the working route. A browser agent with repository write tools needs no local
Git installation. A cloud checkout can be useful; identify where it lives and do not
claim it configured the user's computer. Do not infer read/write capability from a
product name or a successful sign-in. Check the actual tools and repository access;
do not make test commits solely to probe permission.

## An existing connector or checkout works

Use it. Read the current branch and repository instructions. Verify that your write
tool can target the supplied branch before promising a push. Preserve existing
accounts and local work. Do not create a replacement repository if access is denied;
guide the user to accept the collaborator invitation or request access from its owner.

## The repository opens elsewhere, but this connector returns 404

These are separate permissions: the person's GitHub access, AgentsLaTeX's GitHub App,
and the agent product's GitHub App. A collaborator invitation grants the person access;
it does not automatically authorize another app. GitHub can return 404 for a private
repository that the connector cannot access. Search results alone are not decisive.

Check the connector's signed-in GitHub account, then request the exact repository's
metadata and a known file such as .agentlatex.json on the supplied branch. If access
works through another authorized connection but not this connector, diagnose connector
access before suggesting new paths or replacing project files.

For collaborator-owned repositories, explain the current support limitation above
and offer the handoff. For the user's own repository, check that the agent product's
GitHub App includes it, then retry the exact repository; refresh/reconnect only if
needed. AgentsLaTeX's installation is separate. Verify write tools separately.
If repository reads work but IMPORTS.md is absent, that is normal before the first
import. An inaccessible repository is not evidence that every requested file is absent.
If access still fails, use the downloadable-bundle/local-agent handoff without
creating a replacement repository or making the repository public.

Reference: [GitHub Apps act with the intersection of user and app permissions](https://docs.github.com/en/apps/using-github-apps/authorizing-github-apps).

## A GitHub connector is missing

Guide the user through the Apps, Connectors or Integrations controls actually shown
in their agent product. Select this repository, wait for sign-in/approval, then verify
read access and inspect available write tools. Work/school approval may be required.
Use the provider's current official help when the controls are unclear:
- [ChatGPT GitHub connection](https://help.openai.com/en/articles/11145903-connecting-github-to-chatgpt-deep-resear)
- [Claude GitHub integration](https://support.claude.com/en/articles/10167454-use-the-github-integration)

Do not assume every connector can write. If it cannot, prepare the changed files or
an import bundle and hand it to an authorized agent with write access. Reconnecting
a read-only tool repeatedly will not give it a new write operation.

## A filesystem/Git route is needed

Check the operating system, git, gh (if needed), and existing authentication first.
Use `gh auth status` without exposing credentials. Install missing tools only in the
intended environment; use the official installer and explain the one user step needed.
If login is needed, use an interactive browser flow. Show the actual URL AND one-time
code in your message before waiting. Never request passwords, tokens or private keys.
Say you opened a website only if you did. Verify access after the user finishes.

Reuse the appropriate checkout. If cloning is necessary, choose an available working
folder; ask the user for a location only when it matters on their computer. Preserve
uncommitted work and the supplied branch. Do not overwrite another checkout.

## Ready to work

Read local AGENTS.md files, root .agentlatex.json and the live
[agent guide](https://agentlatex.com/docs/AGENTS.md). Follow its links for LaTeX,
manual setup reminders and imports. Shared guides stay online. Report the working
location or connector, verified capabilities and next step. Setup alone does not
authorize edits to the manuscript. Only claim a completed push after remote read-back.
