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

Keep source as normal `.tex`, `.bib`, and image files. Keep original papers intact.
Imported files are browser copies: saving a draft does not update their disk files.
Use Export to retain edits. No automatic Git synchronization is implemented yet.

This repository is independent of SWA. Do not change other apps, accounts, running
agents, or deployments. Private papers and generated builds belong in ignored data/.
Do not commit credentials, machine paths, compiler binaries, or imported manuscripts.

Use TypeScript and pnpm. Keep the UI to the requested two panes and a small toolbar.
Preserve keyboard access. Compile in a worker; permit one build at a time; cancellation
must settle promptly; a failed/stale build must never be shown as current.

For changes, run the smallest affected check, then the actual browser workflow.
Do not repeat passing stress suites without a new compiler/configuration change.
Record unsupported cases and move on rather than building a new TeX distribution.
