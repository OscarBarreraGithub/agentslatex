# Browser compiler testing

## REVTeX and bibliography correction — 2026-10-23

Local headless Chrome 155 passed **37/37 browser checks** with the production-packaged
`1.4.1-static2` assets: the existing 32 cases plus unrelated bibliography sources,
a supplied `.bbl`, REVTeX APS/PRD with a PNG/equation/resolved reference, a missing
class that must stop before BibTeX, and successful recovery. The shared pipeline
changed, so the existing matrix was run once after correcting the local server.
The journal fixture compiled in 0.64s (warm), one page; its rendered page was visually
inspected. This is loopback/headless evidence, not hosted or physical-device timing.

The normal editor also compiled the synthetic REVTeX paper (0.67s), displayed the
missing-class error after an edit, preserved the draft, and compiled a corrected
retry (0.65s). This used the local authenticated UI fixture, not real GitHub accounts.
Three focused runtime tests, both TypeScript checks, the hosted build and two static
asset checks passed. All 19 supplied REVTeX runtime/style files match the upstream
archive byte-for-byte. Existing source files override these compiler-only defaults.

An initial local run failed during loading because Vite served gzip parts with
`Content-Encoding: gzip`, causing a second decompression in the compiler loader.
The development server now serves these parts as raw bytes, like the hosted assets.
That interrupted run is not counted as a pass. No compiler binary or TeX Live data
was rebuilt. The production deployment and its acceptance are tracked separately.

Hosted follow-up: deployed source `982bde5` passed the real signed-in Chrome edit,
GitHub save, REVTeX compile and reload workflow on 2026-10-23. The synthetic paper's
equation, citation, bibliography and TikZ figure rendered correctly in one page
(0.90s after loading). See GITHUB_ACCEPTANCE.md for the saved commit and scope.

## Earlier compiler baseline

On 2026-10-21, **32/32 checks passed in Chrome 155 and 32/32 in Safari 26.5.2 on this Mac**.
This includes 23 successful compilations, eight expected compilation failures, and an
expected deadline followed by recovery. It is not a claim that all inputs compile.

The first Safari run was stopped after PDF.js text extraction used an unsupported stream
iterator. The compiler was not the source of that error. Reading the PDF text stream with
`getReader()` fixed the validator; the complete Safari rerun passed. Its failed/stopped
local evidence remains retained separately. Browser heartbeat delays are not reliable
when the browser/tab is in the background and are omitted there.

Chrome's initial automatic evidence save failed because the development route rejected a
leading slash. All evidence was recovered via Download evidence; the route was corrected
and the complete Safari rerun saved automatically. The page now reports save failure.

## Results

Single-run samples, on one Mac, assets served from loopback. Compilation excludes initial
engine/package loading and subsequent PDF validation. These are not internet cold-load,
Windows, mobile, maximum-memory or statistically repeated performance benchmarks.

| Fixture            | Expected outcome | Chrome compile | Safari compile | PDF pages |
| ------------------ | ---------------- | -------------: | -------------: | --------: |
| demo               | pass             |          0.99s |          2.94s |         1 |
| math               | pass             |          0.43s |          1.07s |         1 |
| tikz               | pass             |          0.78s |          2.23s |         1 |
| flowchart          | pass             |          0.77s |          2.24s |         1 |
| pgfplots-2d        | pass             |          1.33s |          4.09s |         1 |
| pgfplots-3d        | pass             |          3.57s |         14.52s |         1 |
| circuits           | pass             |          1.25s |          5.11s |         1 |
| feynman-manual     | pass             |          1.09s |          4.46s |         1 |
| lua-graph          | pass             |          1.87s |          5.82s |         1 |
| xe-fonts           | pass             |          2.40s |          6.63s |         1 |
| unicode-accents    | pass             |          0.42s |          1.91s |         1 |
| multifile          | pass             |          0.42s |          1.06s |         1 |
| bibtex             | pass             |          0.58s |          1.45s |         1 |
| biber              | pass             |          2.29s |          9.41s |         1 |
| tables             | pass             |          0.86s |          2.52s |         1 |
| listings           | pass             |          0.49s |          1.28s |         1 |
| invalid-command    | fail             |          0.24s |          1.47s |         — |
| missing-image      | fail             |          0.28s |          0.78s |         — |
| externalization    | fail             |          0.53s |          1.61s |         — |
| minted             | fail             |          0.56s |          2.86s |         — |
| missing-package    | fail             |          0.21s |          1.62s |         — |
| missing-font       | fail             |          5.32s |         10.67s |         — |
| unicode-greek      | fail             |          0.24s |          1.70s |         — |
| isolation-producer | pass             |          0.41s |          1.05s |         1 |
| isolation-consumer | fail             |          0.24s |          0.63s |         — |
| timeout            | timeout          |       deadline |       deadline |         — |
| recovery           | pass             |          0.47s |          1.24s |         1 |
| long-200           | pass             |          1.00s |          2.80s |       200 |
| images-small       | pass             |          0.46s |          1.34s |         1 |
| images-medium      | pass             |          0.54s |          1.66s |         4 |
| images-large       | pass             |          0.81s |          2.80s |        60 |
| space-path         | pass             |          0.43s |          1.24s |         1 |

The 200-page fixture is about 293 KiB of generated source with repeated prose and math.
The image tests use deterministic high-entropy PNGs: 4.6, 18.3 and 55 MiB of distinct
image data. The largest reuses 12 images across 60 pages. Neither stress case failed;
these are tested sizes, not discovered hard limits.

## Run and extend

`pnpm setup` prepares generated fixtures and compiler assets. Start `pnpm dev`, then
open `/tests.html`. Select All, Core, Stress, or TikZ. Recommended-only is an explicit
smaller-bundle experiment; the default tested configuration is extra-only.

- `tests/manifest.json` enumerates expectations and parameters.
- `tests/fixtures/<case>/main.tex` contains each readable TeX example.
- `scripts/prepare-fixtures.mjs` regenerates sources and deterministic stress images.
- `src/tests.ts` compiles through the same adapter as the editor, checks page counts and
  expected text on the first/second/last pages, and records logs/PDF/SyncTeX/timings.
- The development server saves raw evidence under ignored `data/results/<run>/`.
  Download evidence gives a ZIP in static previews too.
- `docs/benchmark-2026-10-21.json` preserves shareable synthetic benchmark measurements.
- `pnpm test` checks imported paths, collisions and root-document inference.

After a compiler/configuration change run affected cases once. Run the full matrix for
changes affecting every build; stop after passing. Do not turn fixture maintenance into
a requirement for every prose/UI adjustment.

## Visual inspection and current acceptance limits

Rendered PDF inspection covered the demo math/TikZ, 3D plot, Lua graph layout, the last
page of the 200-page document, and the last image page. Check representative plots,
labels and math visually; successful text extraction cannot detect every layout defect.
The manually positioned TikZ-Feynman fixture emits automatic-layout warnings; these
are retained in the report, not silently described as warning-free.

Browser compilation and UI acceptance are distinct. Exact file-import, edit/retry,
draft persistence, PDF navigation and desktop UI evidence are recorded in
`docs/UI_ACCEPTANCE.md`. Physical Windows/phone tests and hosted cold-download timings
remain unverified. No claim of complete native LaTeX parity is made.
