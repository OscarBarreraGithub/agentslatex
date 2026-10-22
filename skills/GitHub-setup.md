# Connect this project to your agent

Read the repository URL and branch from the user’s Connect agent prompt.
Check existing access first; skip setup steps that are already complete.

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
the GitHub link, and the next simple step. Do not modify the paper during setup.

## Browser agents

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
