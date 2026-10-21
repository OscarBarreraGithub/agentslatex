import { mkdir, writeFile, cp, readFile, rm } from "node:fs/promises";
import { resolve, join } from "node:path";
import { deflateSync } from "node:zlib";
const root = resolve(import.meta.dirname, ".."),
  source = join(root, "tests/fixtures"),
  output = join(root, "public/fixtures");
await mkdir(source, { recursive: true });
await mkdir(output, { recursive: true });
const fixtures = [];
const wrap = (body, packages = "") =>
  `\\documentclass[11pt]{article}\n\\usepackage[margin=24mm]{geometry}\n\\usepackage{amsmath,amssymb}\n${packages}\n\\begin{document}\n${body}\n\\end{document}\n`;
async function add(
  id,
  label,
  tex,
  {
    files = {},
    engine = "pdf",
    expect = "pass",
    pages = 1,
    contains,
    timeoutMs,
    group = "core",
    reason,
  } = {},
) {
  const dir = join(source, id);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "main.tex"), tex);
  for (const [path, content] of Object.entries(files)) {
    await mkdir(resolve(dir, path, ".."), { recursive: true });
    await writeFile(join(dir, path), content);
  }
  await cp(dir, join(output, id), { recursive: true });
  fixtures.push({
    id,
    label,
    files: ["main.tex", ...Object.keys(files)],
    engine,
    expect,
    pages,
    contains,
    timeoutMs,
    group,
    reason,
  });
}
const demo = wrap(
  String.raw`\begin{center}
{\Huge A little space to think.}\\[8pt]
{\large Notes on a particle in a potential well}\\[4pt]
\textit{A browser-compiled LaTeX example}
\end{center}
\section{From a sketch to an equation}
Keep the source readable. Your agent can help with the mathematics; the document remains an ordinary \LaTeX{} file.
For a particle of mass $m$, the time-independent Schr\"odinger equation is
\begin{equation}
-\frac{\hbar^2}{2m}\frac{d^2\psi}{dx^2}+V(x)\psi(x)=E\psi(x).
\end{equation}
\begin{center}
\begin{tikzpicture}[x=1.15cm,y=0.85cm,>=Stealth]
\fill[blue!6] (-2.2,0) rectangle (2.2,2.8);
\draw[->,gray] (-3.3,0)--(3.5,0) node[right] {$x$};
\draw[->,gray] (0,-.25)--(0,3.5) node[above] {$V(x)$};
\draw[very thick,blue!60!black] (-3.1,2.8)--(-2.2,2.8)--(-2.2,0)--(2.2,0)--(2.2,2.8)--(3.1,2.8);
\draw[thick,teal!70!black,domain=-2.2:2.2,samples=80] plot (\x,{1.3+0.65*cos(\x*180/4.4)});
\draw[dashed,gray] (-3,1.3)--(3,1.3) node[right] {$E$};
\node at (0,-.65) {A finite square well, drawn directly with TikZ};
\end{tikzpicture}
\end{center}
\section{A useful approximation}
In a classically forbidden region, a semiclassical estimate gives
\[
T\sim\exp\!\left[-2\int_a^b\frac{\sqrt{2m\,[V(x)-E]}}{\hbar}\,dx\right].
\]
\textbf{Try it:} change the title or the colour of the potential, then compile again.
\paragraph{A note on evidence.} This is synthetic demonstration material. Passage attribution and human review will be added as a separate layer; compilation alone does not establish scientific correctness.`,
  String.raw`\usepackage{tikz}
\usetikzlibrary{arrows.meta}`,
);
await add("demo", "Demo: math and TikZ", demo, { contains: "A little space" });
await add(
  "math",
  "Inline and display mathematics",
  wrap(
    String.raw`Inline $e^{i\pi}+1=0$ and $\alpha+\beta=\gamma$. \begin{align}f(x)&=\int_0^x e^{-t^2}\,dt\\A&=\begin{pmatrix}1&2\\3&4\end{pmatrix}\end{align} End of math.`,
  ),
  { contains: "End of math" },
);
await add(
  "tikz",
  "TikZ geometry, labels and shading",
  wrap(
    String.raw`\section{TikZ geometry}\begin{tikzpicture}[>=Stealth]\shade[ball color=blue!30] (0,0) circle(1);\draw[->,thick] (0,0)--(2,1) node[right] {$\vec v$};\draw[red,dashed] (0,0)--(-2,1);\foreach \x in {0,30,...,330}{\fill ({cos(\x)},{sin(\x)}) circle(1pt);}\end{tikzpicture}`,
    String.raw`\usepackage{tikz}\usetikzlibrary{arrows.meta,shadings,calc}`,
  ),
  { contains: "TikZ geometry" },
);
await add(
  "flowchart",
  "TikZ positioning, arrows and decorations",
  wrap(
    String.raw`\section{Flowchart}\begin{tikzpicture}[node distance=17mm,box/.style={draw,rounded corners,fill=blue!5,minimum width=25mm,minimum height=10mm},>=Stealth]\node[box](a){Source};\node[box,right=of a](b){Compiler};\node[box,right=of b](c){PDF};\draw[->](a)--(b);\draw[->](b)--(c);\draw[decorate,decoration={brace,amplitude=5pt}] (4.6,-1)--(1.5,-1);\end{tikzpicture}`,
    String.raw`\usepackage{tikz}\usetikzlibrary{positioning,arrows.meta,decorations.pathreplacing}`,
  ),
  { contains: "Flowchart" },
);
await add(
  "pgfplots-2d",
  "PGFPlots: curves and CSV data",
  wrap(
    String.raw`\section{Plot from data}\begin{tikzpicture}\begin{axis}[width=11cm,height=6cm,xlabel={$x$},ylabel={$f(x)$},grid=major,legend pos=north west]\addplot[blue,domain=0:6,samples=120]{sin(deg(x))};\addlegendentry{Sine}\addplot[red,mark=*] table[x=x,y=y,col sep=comma]{values.csv};\addlegendentry{Data}\end{axis}\end{tikzpicture}`,
    String.raw`\usepackage{pgfplots}\pgfplotsset{compat=1.18}`,
  ),
  {
    files: {
      "values.csv":
        "x,y\n0,0\n1,0.84\n2,0.91\n3,0.14\n4,-0.76\n5,-0.96\n6,-0.28\n",
    },
    contains: "Plot from data",
  },
);
await add(
  "pgfplots-3d",
  "PGFPlots: 3D surface",
  wrap(
    String.raw`\section{Surface plot}\begin{tikzpicture}\begin{axis}[width=11cm,height=8cm,view={45}{30}]\addplot3[surf,samples=25,domain=-2:2]{exp(-x*x-y*y)};\end{axis}\end{tikzpicture}`,
    String.raw`\usepackage{pgfplots}\pgfplotsset{compat=1.18}`,
  ),
  { contains: "Surface plot" },
);
await add(
  "circuits",
  "CircuitikZ: resistor and voltage source",
  wrap(
    String.raw`\section{Circuit diagram}\begin{circuitikz}\draw(0,0) to[V,l=$V$](0,3) to[R,l=$R$](4,3) to[C,l=$C$](4,0)--(0,0);\end{circuitikz}`,
    String.raw`\usepackage{circuitikz}`,
  ),
  { contains: "Circuit diagram" },
);
await add(
  "feynman-manual",
  "TikZ-Feynman: manually placed vertices",
  wrap(
    String.raw`\section{Feynman diagram}\begin{tikzpicture}\begin{feynman}\vertex(a) at (-2,1){$e^-$};\vertex(b) at (-2,-1){$e^+$};\vertex(c) at (0,0);\vertex(d) at (2,0){$\gamma$};\diagram*{(a)--[fermion](c)--[fermion](b),(c)--[photon](d)};\end{feynman}\end{tikzpicture}`,
    String.raw`\usepackage[compat=1.1.0]{tikz-feynman}`,
  ),
  { contains: "Feynman diagram" },
);
await add(
  "lua-graph",
  "LuaLaTeX: automatic graph layout",
  wrap(
    String.raw`\section{Automatic graph}\tikz\graph[layered layout,nodes={draw,circle}]{a->{b,c},b->d,c->d};`,
    String.raw`\usepackage{tikz}\usetikzlibrary{graphs,graphdrawing}\usegdlibrary{layered}`,
  ),
  { engine: "lua", contains: "Automatic graph" },
);
await add(
  "xe-fonts",
  "XeLaTeX: packaged OpenType font",
  wrap(
    "Packaged fonts: café, naïve, résumé.",
    String.raw`\usepackage{fontspec}\setmainfont{Latin Modern Roman}`,
  ),
  { engine: "xe", contains: "Packaged fonts" },
);
await add(
  "unicode-accents",
  "pdfLaTeX: accented UTF-8 text",
  wrap("Accented text: café, naïve, résumé, München. Supported accents."),
  { contains: "Supported accents" },
);
await add(
  "multifile",
  "Nested input and custom style",
  wrap(
    String.raw`\section{Multi-file project}\input{chapters/intro.tex}\input{chapters/end.tex}`,
    String.raw`\usepackage{localstyle}`,
  ),
  {
    files: {
      "localstyle.sty": String.raw`\ProvidesPackage{localstyle}\newcommand{\localword}{Local style works}`,
      "chapters/intro.tex": String.raw`\localword. See Section~\ref{sec:last}.`,
      "chapters/end.tex": String.raw`\section{Last section}\label{sec:last} Nested files work.`,
    },
    contains: "Nested files work",
  },
);
await add(
  "bibtex",
  "BibTeX bibliography and references",
  wrap(
    String.raw`\section{References}\label{sec:ref} See Section~\ref{sec:ref} and Knuth~\cite{knuth}.\bibliographystyle{plain}\bibliography{refs}`,
  ),
  {
    files: {
      "refs.bib":
        "@book{knuth,title={The TeXbook},author={Donald Knuth},year={1984},publisher={Addison-Wesley}}",
    },
    contains: "TeXbook",
  },
);
await add(
  "biber",
  "BibLaTeX and Biber",
  wrap(
    String.raw`\section{Biber bibliography}Reference~\cite{knuth}.\printbibliography`,
    String.raw`\usepackage[backend=biber]{biblatex}\addbibresource{refs.bib}`,
  ),
  {
    files: {
      "refs.bib":
        "@book{knuth,title={The TeXbook},author={Donald Knuth},year={1984},publisher={Addison-Wesley}}",
    },
    contains: "TeXbook",
  },
);
await add(
  "tables",
  "Tables, longtable and hyperlinks",
  wrap(
    String.raw`\section{Tables}\begin{tabular}{lrr}\toprule Item&Value&Error\\\midrule Alpha&1.2&0.1\\Beta&2.4&0.2\\\bottomrule\end{tabular}\par\href{https://example.org}{Example link}.\begin{longtable}{ll}A&B\\C&D\\\end{longtable}`,
    String.raw`\usepackage{booktabs,longtable,hyperref}`,
  ),
  { contains: "Tables" },
);
await add(
  "listings",
  "Code listings without external Python",
  wrap(
    String.raw`\section{Code listing}\begin{lstlisting}[language=Python]
for x in range(10):
    print(x * x)
\end{lstlisting}`,
    String.raw`\usepackage{listings}`,
  ),
  { contains: "Code listing" },
);
await add(
  "invalid-command",
  "Expected error: undefined control sequence",
  wrap(String.raw`\AnUndefinedCommand`),
  {
    expect: "fail",
    pages: 0,
    reason: "Ordinary syntax error; log must be visible.",
  },
);
await add(
  "missing-image",
  "Expected error: missing image",
  wrap(
    String.raw`\includegraphics{missing-image.png}`,
    String.raw`\usepackage{graphicx}`,
  ),
  {
    expect: "fail",
    pages: 0,
    reason: "Import referenced figures with the source.",
  },
);
await add(
  "externalization",
  "Expected error: TikZ externalization",
  wrap(
    String.raw`\begin{tikzpicture}\draw(0,0)--(1,1);\end{tikzpicture}`,
    String.raw`\usepackage{tikz}\usetikzlibrary{external}\tikzexternalize`,
  ),
  {
    expect: "fail",
    pages: 0,
    reason: "Disable externalization; compile TikZ inline.",
  },
);
await add(
  "minted",
  "Expected error: external syntax highlighter",
  wrap(
    String.raw`\begin{minted}{python}
print(42)
\end{minted}`,
    String.raw`\usepackage{minted}`,
  ),
  {
    expect: "fail",
    pages: 0,
    reason: "Use listings, or supply prepared highlighting.",
  },
);
await add(
  "missing-package",
  "Expected error: unavailable package",
  wrap(
    "Missing package.",
    String.raw`\usepackage{agentslatex-package-does-not-exist}`,
  ),
  {
    expect: "fail",
    pages: 0,
    reason: "Provide local .sty files or use an installed package.",
  },
);
await add(
  "missing-font",
  "Expected error: unavailable system font",
  wrap(
    "Font test.",
    String.raw`\usepackage{fontspec}\setmainfont{AgentsLatexImaginaryFont}`,
  ),
  {
    engine: "xe",
    expect: "fail",
    pages: 0,
    reason: "Use a packaged font; OS fonts are not automatically visible.",
  },
);
await add(
  "unicode-greek",
  "Expected error: raw Greek in pdfLaTeX",
  wrap("Raw Greek: α β γ."),
  {
    expect: "fail",
    pages: 0,
    reason: "Use math commands in pdfLaTeX or a tested Unicode engine/font.",
  },
);
await add(
  "isolation-producer",
  "Project isolation: supplied include",
  wrap(String.raw`\input{private-previous-project.tex}`),
  {
    files: { "private-previous-project.tex": "PRIVATE PREVIOUS PROJECT." },
    contains: "PRIVATE PREVIOUS PROJECT",
  },
);
await add(
  "isolation-consumer",
  "Project isolation: previous include unavailable",
  wrap(String.raw`\input{private-previous-project.tex}`),
  {
    expect: "fail",
    pages: 0,
    reason: "Files from the previous project must not leak into this build.",
  },
);
await add(
  "timeout",
  "Expected timeout: unbounded TeX loop",
  wrap(String.raw`\loop\iftrue\repeat`),
  {
    expect: "timeout",
    pages: 0,
    timeoutMs: 2500,
    reason: "Worker must stop and release the UI.",
  },
);
await add(
  "recovery",
  "Recovery after failures and timeout",
  wrap("Recovery succeeded. The compiler is usable again."),
  { contains: "Recovery succeeded" },
);
let long = "";
for (let i = 1; i <= 200; i++)
  long +=
    `\\section*{Chapter ${i}}\nPage ${i} of the 200-page stress fixture. This is generated demonstration text, not scientific evidence.\n` +
    "A bounded browser build should retain clear mathematics, stable pagination, and readable source. We exercise repeated text without expanding an unbounded macro.\n".repeat(
      8,
    ) +
    String.raw`\[Z(\beta)=\sum_{n=0}^{\infty}e^{-\beta E_n},\qquad F=-\beta^{-1}\log Z.\]` +
    "\n" +
    (i < 200 ? "\\newpage\n" : "");
await add("long-200", "200-page, long-source manuscript", wrap(long), {
  pages: 200,
  contains: "Chapter 200",
  group: "stress",
});
const crcTable = Array.from({ length: 256 }, (_, n) => {
  for (let k = 0; k < 8; k++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1;
  return n >>> 0;
});
function crc(bytes) {
  let c = 0xffffffff;
  for (const b of bytes) c = crcTable[(c ^ b) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const t = Buffer.from(type),
    out = Buffer.alloc(data.length + 12);
  out.writeUInt32BE(data.length);
  t.copy(out, 4);
  data.copy(out, 8);
  out.writeUInt32BE(crc(Buffer.concat([t, data])), data.length + 8);
  return out;
}
function png(w, h, seed) {
  const rows = Buffer.alloc((w * 3 + 1) * h);
  let state = seed;
  for (let y = 0; y < h; y++) {
    for (let x = 1; x <= w * 3; x++) {
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      rows[y * (w * 3 + 1) + x] = state & 255;
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(w);
  header.writeUInt32BE(h, 4);
  header[8] = 8;
  header[9] = 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(rows)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
for (const [id, count, repeat] of [
  ["images-small", 1, 1],
  ["images-medium", 4, 4],
  ["images-large", 12, 60],
]) {
  const dir = join(output, id);
  await mkdir(dir, { recursive: true });
  const names = ["main.tex"];
  for (let i = 0; i < count; i++) {
    const name = `figure-${i}.png`;
    names.push(name);
    await writeFile(join(dir, name), png(1600, 1000, 12345 + i));
  }
  let body = "";
  for (let i = 0; i < repeat; i++)
    body +=
      `\\section*{Image page ${i + 1}}\n\\includegraphics[width=\\linewidth]{figure-${i % count}.png}\n\\[x^2+y^2=z^2\\]\n` +
      (i < repeat - 1 ? "\\newpage\n" : "");
  const tex = wrap(body, String.raw`\usepackage{graphicx}`);
  await mkdir(join(source, id), { recursive: true });
  await writeFile(join(source, id, "main.tex"), tex);
  await writeFile(join(dir, "main.tex"), tex);
  fixtures.push({
    id,
    label: `${count} distinct large PNGs / ${repeat} pages`,
    files: names,
    engine: "pdf",
    expect: "pass",
    pages: repeat,
    contains: `Image page ${repeat}`,
    group: "stress",
  });
}
const spaced = "image with spaces.png";
await add(
  "space-path",
  "Image filename containing spaces",
  wrap(
    String.raw`\section{Space in filename}\includegraphics[width=8cm]{image with spaces.png}`,
    String.raw`\usepackage{graphicx}`,
  ),
  { files: { [spaced]: png(320, 200, 999) }, contains: "Space in filename" },
);
await writeFile(
  join(output, "manifest.json"),
  JSON.stringify(fixtures, null, 2) + "\n",
);
await writeFile(
  join(root, "tests/manifest.json"),
  JSON.stringify(fixtures, null, 2) + "\n",
);
console.log(
  `Prepared ${fixtures.length} cases. Large generated images remain outside Git.`,
);
