import { test } from "node:test";
import assert from "node:assert/strict";
import { bibliographyTools, stripComments } from "../src/bibliography";

test("the starter's commented bibliography lines do not start a bibtex run", () => {
  const starter = String.raw`\documentclass{article}
\begin{document}
Text.
% Add sources to references.bib beside this document, then uncomment:
% \bibliographystyle{plain}
% \bibliography{references}
\end{document}`;
  assert.deepEqual(bibliographyTools([starter]), { bibtex: false, biber: false });
  assert.deepEqual(bibliographyTools([starter.replace("% \\bibliography{references}", "\\bibliography{references}")]), { bibtex: true, biber: false });
});
test("biblatex wins over a bibtex-style bibliography command and escaped percent signs are not comments", () => {
  const preamble = String.raw`\usepackage[backend=biber,style=numeric]{biblatex}`;
  assert.deepEqual(bibliographyTools([preamble, String.raw`\bibliography{refs}`]), { bibtex: false, biber: true });
  assert.deepEqual(bibliographyTools([String.raw`% \usepackage{biblatex}`, String.raw`\bibliography{refs}`]), { bibtex: true, biber: false });
  assert.equal(stripComments(String.raw`Rate: 5\% % note`), String.raw`Rate: 5\% `);
  assert.equal(stripComments("a\n% whole line\nb"), "a\n\nb");
});
