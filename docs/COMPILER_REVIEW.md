# Compiler integration review

Reviewed the installed upstream `texlyre-busytex` 1.4.1 wrapper and matching
`busytex_pipeline.js` assets. This is a targeted integration review, not a security
audit or a claim that every TeX package works.

## Changes made in our adapter

1. **One package bundle, not overlapping bundles.** The release's extra bundle includes
   the basic/recommended collections. Use it alone for the default authoring path;
   keep recommended-only as an explicit probe. No manual package dependency resolver.
2. **Serialize compilation.** Upstream assigns one worker `onmessage` handler per build.
   Overlapping calls could replace that handler. The adapter permits one active build.
3. **Cancel and time out explicitly.** Upstream's worker termination does not settle its
   current compile promise; its internal compile timeout is 180 seconds. Our outer
   cancellation settles the UI immediately and destroys the worker. A fresh worker is
   used after cancellation or an exception. The upstream pending promise/timer can remain
   until its own timeout; the UI does not await it. No upstream fork was introduced.
4. **Snapshot build inputs.** An edit during compilation cannot make an old PDF appear
   current. Keep its previous source revision visible until a new build succeeds.
5. **Preserve imported paths.** Folder import keeps subdirectories; reject path traversal
   and duplicate flat filenames instead of silently compiling the wrong resource.
6. **Bound viewer work.** Render one PDF page at a time instead of allocating canvases for
   all 200 pages. Files are passed as bytes, not base64 strings.
7. **Use a portable PDF text reader.** The validator reads PDF.js text streams with
   `getReader()` instead of relying on async stream iteration, which failed in Safari.

## Already implemented upstream; do not reinvent

Web Workers, TeX engines, multi-pass compilation, bibliography support, package caching,
and SyncTeX output. This is actively maintained TeX Live 2026 software, not simply an
abandoned pre-LLM project. Agents primarily need a tested authoring contract.

## Limits retained

No arbitrary native shell programs or automatic OS-font access. Worker-only execution
is not a complete security audit of TeX/WASM. The MVP imports browser copies; no native
filesystem permissions, shell commands, or local process-launch endpoint are exposed.
The development-only evidence endpoint accepts fixed result filenames and same-origin
POSTs on loopback, and writes only ignored data/results/.

Sources:

- https://github.com/TeXlyre/texlyre-busytex
- https://github.com/TeXlyre/texlyre-busytex/releases/tag/assets-v1.4.1
