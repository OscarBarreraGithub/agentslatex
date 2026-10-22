# Agents: start here

AgentsLaTeX is a small browser editor for ordinary LaTeX projects. Source is on the
left, the real compiled PDF on the right. TeX compilation runs on the user's device
inside a browser Web Worker, using TeXlyre BusyTeX 1.4.1 / TeX Live 2026. It does not
call a model or send papers to a compilation server.

**Before writing or importing LaTeX, read [latex-specs.md](latex-specs.md).** It is the
agent authoring contract: supported engines/packages, figures, bibliography, TikZ,
known failures, practical alternatives, and how to validate the result.

Read [SPEC.md](SPEC.md) for product scope and [docs/TESTING.md](docs/TESTING.md) for
fixtures and measured acceptance. Actual results outrank guesses about support.
Never claim a case passed merely because a dependency advertises it.

Product messaging and future home/splash-screen copy live in [docs/SELLING_POINTS.md](docs/SELLING_POINTS.md).
Project prompt behavior is in [docs/PROMPTS.md](docs/PROMPTS.md). Maintain the import
skill as the source of truth; regenerate its shared string with scripts/prepare-template.mjs.

Keep source as normal `.tex`, `.bib`, and image files. Keep original papers intact.
Imported files are browser copies: saving a draft does not update their disk files.
Use Save to GitHub for a versioned checkpoint, Refresh for collaborator updates, and
Export for a source ZIP. Never force-push. Preserve drafts when synchronization fails.
Read docs/GITHUB_ACCEPTANCE.md before claiming the hosted workflow is ready.

This repository is independent of SWA. Do not change other apps, accounts, running
agents, or deployments. Private papers and generated builds belong in ignored data/.
Do not commit credentials, machine paths, compiler binaries, or imported manuscripts.

**Owner's hosting budget: $0 usage charges.** Keep Workers/D1 on the Free plan and
serve the compiler with Static Assets. Do not activate R2, upgrade plans, enable
metered add-ons, or introduce paid fallbacks. At free limits, requests must stop;
preserve drafts. Budget alerts/rate limits are not spending caps. Read
[docs/COST_POLICY.md](docs/COST_POLICY.md) before deployment or hosting changes.

**Privacy decision:** the owner has deferred encryption and approved retaining the
current trusted-backend design for now. Read the privacy boundary in SPEC.md. Do not
claim zero operator access or end-to-end encryption. Do not inspect another user's
manuscript without their explicit authorization; backend access is not permission to
browse their work. Keep manuscript contents out of application logs and analytics.

Use TypeScript and pnpm. Keep the UI to a visible file tree, two panes and a small toolbar.
User access tokens stay encrypted server-side; authorize every private repository read
and write through GitHub. Runtime credentials and project data must never enter source.zip.
Preserve keyboard access. Compile in a worker; permit one build at a time; cancellation
must settle promptly; a failed/stale build must never be shown as current.

For changes, run the smallest affected check, then the actual browser workflow.
Do not repeat passing stress suites without a new compiler/configuration change.
Record unsupported cases and move on rather than building a new TeX distribution.
