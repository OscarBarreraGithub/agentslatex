# Connect this project to your agent

Use the repository and branch supplied in the Connect agent prompt. A repository is
our shared project folder. Explain only the next necessary step in plain language;
skip setup that is already complete. Signing into AgentsLaTeX does not authenticate
a separate agent, connector or terminal.

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
