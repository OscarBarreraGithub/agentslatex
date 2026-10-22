# AgEnT LaTeX

**Agents: read [AGENTS.md](AGENTS.md), then [latex-specs.md](latex-specs.md).**

A small GitHub-backed LaTeX workspace. Sign in with GitHub, open a paper, edit source
on the left and compile its PDF on the right. Compilation runs in a browser worker
on your computer; no model or cloud compilation service is involved.

**Live functional pilot:** https://agentlatex.com. GitHub sign-in, private project
creation, save/reopen, browser compilation and conflict handling passed with the owner
account. The owner has deferred encryption and retained the current design: our
backend handles authorized GitHub credentials and file transfers, so it has technical
access to connected repositories. Manuscript contents are not persisted in our own
database; compilation stays in the browser. This is not end-to-end encryption.
See [current acceptance](docs/GITHUB_ACCEPTANCE.md).

## The workflow

- Connect to GitHub, then choose repositories the app may access.
- **New project** creates a private repository with a working paper and agent guides.
  **Connect existing** preserves an existing repository's layout and adds instructions.
- The tree opens your main folder. **See entire repo** adds a second explorer; files
  there open on GitHub, or can be linked without copying. New files start in the main
  folder and can be moved into its subfolders.
- The settings icon beside Synced selects the main folder, default opening document
  and engine separately. New projects use `agentlatex/main/main.tex`; existing layouts stay
  in place. Without a specified document, the default is `main.tex` in that folder.
- **Upload ↑ → Files… / Folder…** adds local files or folder contents to the main folder, preserving
  subfolders. It does not watch/sync the disk folder. **Save to GitHub** publishes them.
- **Download source ZIP** includes the main folder, linked files, browser edits and
  agent/configuration guides, preserving repository paths. It contains no Git history.
- Browser drafts save automatically. **Save to GitHub** makes a versioned checkpoint;
  clean projects refresh automatically while visible. With a draft, **Updates available**
  lets you review incoming changes. Overlapping file changes need an explicit
  choice; saves never force-push. Export downloads a source ZIP.
- **Compile** builds the selected `.tex`; `.md` shows a Markdown preview. Other file
  types disable Compile. Progress and errors stay visible. The previous PDF is labeled
  when stale. Stop cancels a build; corrected source can compile again.
- Invite collaborators using GitHub's repository settings. They use their own GitHub
  login. GitHub controls repository access; the app cannot grant broader access.
- Codex/Claude agents edit and commit ordinary files in that same repository. Root and
  nested instructions require paired Agent comments. **Show AI** highlights those
  source passages; untagged text is Manual. No custom MCP is needed for this workflow.
- **Prompts** in the project header offers **Connect agent** (including GitHub setup)
  and **Import a conversation**, linking current online instructions. Each
  prompt includes the selected repository. Browser chats without GitHub writes get
  a download-and-local-agent handoff. See [prompt behavior](docs/PROMPTS.md).

## Development

Node.js 24+, pnpm 12.14.0. If pnpm is absent, use `npx --yes pnpm@12.14.0`.

```sh
pnpm install
pnpm setup
pnpm build:hosted
pnpm exec wrangler d1 execute agentslatex --local --file worker/schema.sql
pnpm dev:hosted
```

The authenticated app is at **http://127.0.0.1:4391**. Configure the GitHub App and
ignored `.dev.vars` first; see [deployment](docs/DEPLOYMENT.md). The hosted build packages
the compiler into free static downloads. No R2 subscription or upload is required.
Hosting must follow the owner's [$0 usage policy](docs/COST_POLICY.md).

For a synthetic UI check without credentials, after building run
`pnpm exec tsx tests/ui-fixture.ts` and open **http://127.0.0.1:4393**. This loopback-only
fixture is excluded from the deployed worker. It is not a real account or repository.

Compiler fixtures remain available through `pnpm dev` at
**http://127.0.0.1:4390/tests.html**. That Vite server is the compiler laboratory; the
account/project application needs the Worker API above. Original prototype browser
drafts are retained in their separate IndexedDB database.

## Evidence and scope

- [Current GitHub workspace acceptance](docs/GITHUB_ACCEPTANCE.md)
- [Product scope](SPEC.md) and [deployment](docs/DEPLOYMENT.md)
- [Compiler results](docs/TESTING.md): 32/32 outcomes matched in Chrome and Safari on
  this Mac, including TikZ, 200 pages and 55 MiB of images. Not native LaTeX parity.
- [Agent LaTeX requirements](latex-specs.md)
- [Live instructions for agents and collaborators](https://agentlatex.com/docs)
- [Selling points / future splash-screen copy](docs/SELLING_POINTS.md)
- [Conversation import skill](skills/agentslatex-import-conversation/SKILL.md)

GitHub saves and conflict choices are explicit; incoming clean updates are automatic.
Checks run every 30 seconds while active, two minutes while idle, and pause in hidden
tabs or offline. They back off on errors and respect GitHub retry timing. Files are limited to
20 MiB each for GitHub transfers. Fine-grained source citations, passage highlighting
on the PDF, live coediting, custom MCP and phone/Windows acceptance remain separate
work. This app is independent of SWA; it neither launches nor manages agents.

Application source is public on [GitHub](https://github.com/OscarBarreraGithub/agentslatex);
the site’s Source link opens that repository. The license is AGPL-3.0-or-later. Hosted
builds also retain the exact-build `/source.zip`, LICENSE
and [third-party notices](NOTICE.md). Private manuscripts and credentials stay out of
that archive and this repository.


## The name: AgEnT LaTeX

Our wordmark is typeset with LaTeX and rendered as SVG outlines: **g = Git**, **n = Notarized**.
Here, “notarized” means keeping a versioned record of changes and attribution;
it is not a claim of legal notarization or cryptographic proof of authorship.

In TeX, the typesetting system behind LaTeX, the letters represent Greek tau,
epsilon and chi (τ, ε, χ). T corresponds to tau, pronounced like an English t;
X corresponds to chi, with the ch sound of Scottish “loch” or German “Bach”.
TeX is therefore traditionally pronounced approximately “tekh” (/tɛx/), not “tecks”.
Donald Knuth's distinctive logo lowers the E and brings the letters close together.
The name evokes Greek *technē*, meaning art or craft. See the
[TeX Users Group's history](https://www.tug.org/whatis.html) and
[Knuth's TeXbook source](https://ctan.org/tex-archive/systems/knuth/dist/tex/texbook.tex).
