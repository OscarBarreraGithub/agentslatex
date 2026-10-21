# agentslatex

**Agents: read [AGENTS.md](AGENTS.md), then [latex-specs.md](latex-specs.md), before editing a paper.**

An intentionally small LaTeX workspace: editable source on the left, the real PDF on
the right. Compilation happens in a browser worker on your computer. No AI call,
cloud compilation service, or native TeX installation is required.

## Run

Install Node.js 24 or newer and pnpm, then:

```sh
pnpm install
pnpm setup
pnpm dev
```

Open **http://127.0.0.1:4390**. Compile the included math/TikZ example with the button
or **Cmd/Ctrl+Enter**. The first build loads the TeX engine and packages; subsequent
builds reuse the worker. Setup downloads pinned compiler assets once (about 498 MiB
archive); only the selected bundle is fetched by the browser. Assets remain outside Git.
If pnpm is not on PATH, use `npx --yes pnpm@12.14.0` in place of `pnpm`.

For a static local build, run `pnpm build`, then `pnpm start`. On this Mac, the included
`Start agentslatex.command` starts that built version; leave its terminal open while
using the app. The localhost demo is not a public website.

Use **Open files** for a standalone `.tex` and its sibling dependencies. Use **Open
folder** for a project with subdirectories: relative image and input paths are retained.
Select the main document if it is not inferred correctly. Imported originals are never
overwritten. The editable copy is saved in this browser's IndexedDB; **Export project**
downloads a ZIP of the current source files. Browser storage can be cleared or evicted,
so export important work. **PDF ↓** downloads the most recent successful PDF.

The viewer renders one page at a time to keep long documents usable. Failed builds
retain the previous PDF with an explicit stale label. Build log exposes the TeX error.
Stop terminates the worker; another build can start afterward. Auto compilation is
optional and debounced; explicit Compile is the default.

## Compiler checks

Open **http://127.0.0.1:4390/tests.html** and choose Run checks. The same compiler
adapter used by the editor builds 32 fixtures: TikZ, plots, circuits, bibliography,
multiple files, fonts, deliberate failures, timeout/recovery, 200 pages, and up to
55 MiB of distinct PNGs. See [testing and results](docs/TESTING.md).

The development server saves evidence under ignored `data/results/`. Download evidence
also works when serving the static build. Some fixtures intentionally fail compilation;
a passing check means the observed outcome matches the fixture's expectation.

## What is here

- [Product scope](SPEC.md) — delivered slice and later collaboration/review work.
- [LaTeX agent contract](latex-specs.md) — authoring rules and observed limitations.
- [Compiler review](docs/COMPILER_REVIEW.md) — small integration improvements and limits.
- `src/` — strict TypeScript editor, compiler adapter, PDF viewer and browser runner.
- `tests/fixtures/` — readable `.tex` sources for individual cases.
- `scripts/` — reproducible compiler installation and deterministic stress images.
- `data/` — ignored private manuscripts, generated output and local evidence.

This is a local MVP, independent of SWA. It has no accounts, group chat, GitHub sync,
agent launcher, or attribution UI yet. GitHub versions this application's source;
importing a paper does not publish it. Real Windows and phone acceptance remain separate
from browser tests on this Mac. The same app is buildable as static assets; hosting is
not configured in this slice.
