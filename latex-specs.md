# LaTeX requirements for agents

Read this before creating or changing a paper for AgentsLaTeX. Use normal LaTeX,
not HTML math or a proprietary document format. Work in the user's chosen project;
preserve original papers and distinguish source-based text from new explanations.

## Runtime and default choices

- Compiler: **texlyre-busytex 1.4.1**, official **assets-v1.4.1 / TeX Live 2026**.
- Default engine: **pdfLaTeX**. The app also offers LuaLaTeX and XeLaTeX.
- The default browser configuration loads **texlive-extra alone**, a cumulative bundle.
  Basic/recommended are not loaded alongside it. Do not load overlapping bundles.
- Compilation runs in a Web Worker. No native executable, shell escape, network fetch
  of manuscript resources, or installed OS font is implicitly available to the TeX job.
- The adapter runs multiple passes, detects ordinary BibTeX versus BibLaTeX/Biber usage,
  and returns a PDF plus SyncTeX. Its default build deadline is 120 seconds, including
  initialization. That is an application setting, not a universal LaTeX limit.
- Fresh browser loading can be substantial: configured default assets total about
  **364 MiB uncompressed**; Biber adds about **30 MiB** on demand. Loopback measurements
  are not internet first-visit timings. Caching is upstream; do not promise offline
  availability or cache persistence before testing that workflow.

## Project shape

Prefer one root `main.tex`, with relative paths to `chapters/`, `figures/`, and a `.bib`.
Keep all required inputs inside the imported project. Include local `.sty`, `.cls`,
`.bst`, CSV/data files and images when needed. Multi-file input and a local style file
passed our fixtures. A package missing from the installed bundle can sometimes be
supplied as ordinary project files; this does not make external programs available.

- Use relative forward-slash paths. No absolute machine paths, parent traversal or URLs.
- Import a folder when paths are nested. Flat file selection cannot distinguish two
  same-named files from different directories and is rejected rather than overwritten.
- Filenames with spaces passed an image test; short ASCII filenames remain simplest.
- Do not include `.git`, credentials, dependency directories or unrelated private files.
- Browser edits are copies and persist only in this browser's draft storage. Export the
  project to retain changes on disk. A native agent's later edits are not watched yet;
  re-import intentionally. Do not claim that GitHub or collaborators received an edit.
- Runtime projects/build output belong in ignored `data/`, never application test fixtures.

## Text, mathematics, layout

Use ordinary `article`/`report`/`book` conventions as appropriate. Only `article` was
used in the current acceptance fixtures; do not infer that all journal classes were
validated. Standard math, `amsmath`, `amssymb`, numbered equations, labels/references,
`geometry`, tables, `booktabs`, `longtable`, `hyperref`, and ordinary inline/display math
are covered by our fixtures or the real stat-mech paper trial.

With pdfLaTeX, use LaTeX math commands (`$\alpha$` in TeX),
not raw Greek Unicode characters in ordinary text. Accented UTF-8 Latin text passed;
raw Greek text intentionally failed. Escape TeX special characters in prose. For a
Unicode/font-dependent project, select and test LuaLaTeX or XeLaTeX explicitly.

`fontspec` with **Latin Modern Roman** passed under XeLaTeX. An imaginary system font
correctly failed. Do not assume that a font installed on the computer is in the WASM
filesystem. Custom font upload and arbitrary language/font combinations remain untested.

## TikZ and plots

**Ordinary TikZ works in the tested browser configuration.** Geometry, shading, nodes,
arrows, positioning and decorations passed. Keep drawings inline in the TeX build.

Tested cases:

- TikZ using `arrows.meta`, `calc`, `shadings`, `positioning`, `decorations.pathreplacing`.
- PGFPlots 1.18 compatibility: a 2D function plus CSV data, and a 25x25 sampled 3D surface.
- CircuitikZ: a simple resistor/capacitor/voltage-source diagram.
- TikZ-Feynman with manually positioned vertices and `\diagram*` under pdfLaTeX. It
  emits warnings about automatic graph-drawing options; do not hide those warnings.
- TikZ `graphs,graphdrawing` with `\usegdlibrary{layered}` under **LuaLaTeX**.

Do **not** enable `\tikzexternalize`: the normal externalization mode launches a
separate compiler process. That intentionally failed. Remove externalization and draw
inline, or supply a previously prepared vector PDF. Do not enable shell escape to
work around it. Automatic graph layout requires the right engine; package presence
alone is not enough. Extremely dense plots still consume time and TeX/browser memory;
use sensible samples, simplify, or include a pre-rendered figure.

## Images and generated figures

PNG was tested through 12 distinct 1600x1000 RGB images totaling about **55 MiB**, reused
on 60 pages. All 60 pages compiled and the last page rendered. This is a measured case,
not a maximum supported project size. Use `graphicx` and relative paths; size figures
with `width=\linewidth` or another deliberate bound.

Prefer PNG/JPEG for raster images and PDF for vector figures. JPEG and imported PDF
figures are standard pdfLaTeX formats but were not separate cases in this first fixture
matrix; verify a representative file before claiming acceptance. Preserve scientific
labels, units and resolution. Optimize excess pixels outside compilation if needed.

Do not rely on runtime SVG/EPS conversion through Inkscape/Ghostscript, or on gnuplot,
PythonTeX or other native commands. Prepare the result as a PDF/PNG/JPEG in the agent's
normal environment, include it, and record the source/script that generated it.

## Bibliography and code

Both these fixtures passed:

1. BibTeX: `\bibliographystyle{plain}` plus `\bibliography{refs}` and a local `refs.bib`.
2. BibLaTeX/Biber: `\usepackage[backend=biber]{biblatex}`, `\addbibresource{refs.bib}`,
   `\cite{...}`, and `\printbibliography`. Biber is a separate on-demand WASM component.

Do not mix the two systems accidentally. Check the rendered citation and bibliography,
not just process exit status. The small fixture does not validate every bibliography
style, language or large-database edge case.

For code, `listings` works without Python. `minted` requiring an external highlighter
intentionally failed. Use `listings`, plain verbatim, or prepared highlighting rather
than assuming a native Python executable exists in the browser.

## Long documents and failure handling

A generated **200-page** manuscript with repeated prose, math and page numbering passed.
This does not imply a 200-page document with arbitrary expensive diagrams will be as fast.
The PDF viewer renders one page at a time instead of allocating all page canvases.

Compile after a meaningful change. Inspect the error log on failure. A missing image,
package, font or undefined command is actionable; do not repeatedly retry unchanged
source. After a bounded correction attempt, explain the unsupported requirement and
choose the simplest supported alternative. Timeout/cancel must stop the worker and
permit a fresh build. Previous-project inputs must not leak into a later project.

A failed/newer edit does not make the last successful PDF current. Keep revision status
honest. Confirm included files and figures as well as the main source before treating
an output as matched. The current UI's revision marker is local-session state, not a
cryptographic provenance receipt.

## Scientific attribution and future Frankenstein review

Compilation does not verify authorship, quotations, citations or scientific claims.
Retain source-paper references and exact passage/equation/page locators separately from
compile logs. Label original agent explanations, adaptations and quoted source material.
Do not mark human approval on someone's behalf. Unknown authorship remains unknown.

SyncTeX provides positions, not provenance or perfect semantic paragraph boundaries.
Future review overlays must bind the complete input snapshot and PDF, and become stale
when their source content changes. This repository does not implement those overlays yet.

## Validation to report

Use the relevant fixture or imported project in the actual browser. Report engine,
browser, pass/fail, compile time separately from engine loading, page count, and warnings.
Inspect rendered equations and figures. Test the affected failure/retry when changing
compiler behavior. The public current matrix is in [docs/TESTING.md](docs/TESTING.md).
Do not substitute advertised upstream support for an observed pass.

References: [BusyTeX](https://github.com/TeXlyre/texlyre-busytex),
[TikZ externalization](https://tikz.dev/library-external),
[Lua graph drawing](https://tikz.dev/gd-overview).
