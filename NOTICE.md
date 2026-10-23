# Third-party notices

This project is distributed under AGPL-3.0-or-later. See LICENSE.

TeXlyre BusyTeX 1.4.1 is AGPL-3.0-or-later. Compiler assets are downloaded unchanged
from its official assets-v1.4.1 release and are not committed to this repository.
TeX Live contains packages and fonts under their respective licenses. Retain upstream
license information when distributing compiler bundles; this file does not relicense
those packages. Dependency source, version and license details remain in the pnpm lockfile
and installed package metadata. CodeMirror is MIT; PDF.js is Apache-2.0; fflate is MIT.

The hosted application offers its corresponding application source at `/source.zip`.
This includes the build scripts and pinned dependency lockfile. Hosted JS loaders are
adapted by `scripts/static-compiler.mjs` to download compressed static parts. WebAssembly
and TeX Live data bytes are unchanged. `scripts/compiler-support.mjs` patches the
JavaScript pipeline to select bibliography tools from first-pass artifacts and stop
after fatal errors even when WASM reports exit zero. Upstream source and build instructions:

- https://github.com/TeXlyre/texlyre-busytex/tree/v1.4.1
- https://github.com/TeXlyre/texlyre-busytex/releases/tag/assets-v1.4.1
- https://github.com/TeXlyre/texlyre-busytex

## REVTeX

The compiler supplies the unmodified REVTeX 4.2f runtime files and bibliography styles,
copyright 1999–2022 The American Physical Society, under LPPL 1.3c or later as specified
by upstream. The complete upstream distribution, including its sources and README,
is served at `/compiler/1.4.1-static2/revtex-4.2f.zip`.

- https://ctan.org/pkg/revtex
- https://mirrors.ctan.org/install/macros/latex/contrib/revtex.tds.zip
- Archive SHA-256: `594346d851a4a8f73de31235b83cbb105bf7730cc4b8eca23c3c87f159a48400`

Runtime files are extracted at setup/build time and retained byte-for-byte; no package
source is modified or stored in a user's manuscript repository.

## Markdown preview

markdown-it 15.0.3 is distributed under the MIT license:

Copyright (c) 2014 Vitaly Puzrin, Alex Kocharin.

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

## Wordmark

The wordmark is LaTeX-typeset artwork using Latin Modern (Computer Modern-derived)
lettering and a Baskerville lowercase g, converted to SVG outlines. The font software is not bundled with the UI.
Editable source and generated artwork are in `src/assets/wordmark.tex` and
`src/assets/wordmark.svg`. Latin Modern: https://www.gust.org.pl/projects/e-foundry/latin-modern

The SyncTeX navigation parser in src/synctex.ts is adapted from TeXlyre,
AGPL-3.0, commit ccbe092027bc45e9e37b852bdbe48fb29661f3e0:
https://github.com/TeXlyre/texlyre/blob/ccbe092027bc45e9e37b852bdbe48fb29661f3e0/src/utils/latexSynctexParser.ts
Changes include gzip decoding through fflate, PDF-point units and offsets, and
repository-relative path matching restricted to compiler inputs.
