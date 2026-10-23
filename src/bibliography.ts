/** Remove TeX line comments. A backslash-escaped percent sign is literal text. */
export const stripComments = (tex: string) => tex.replace(/(^|[^\\])%.*$/gm, "$1");

/**
 * Which bibliography tool a build needs, judged from uncommented source only.
 * The starter document keeps `% \bibliography{references}` commented until the
 * author adds sources; that line must not trigger a bibtex run.
 */
export function bibliographyTools(texSources: string[]): { bibtex: boolean; biber: boolean } {
  const source = texSources.map(stripComments).join("\n");
  const biblatex = /\\(?:usepackage|RequirePackage)(?:\[[^\]]*\])?\{[^}]*\bbiblatex\b/.test(source);
  return { biber: biblatex, bibtex: !biblatex && /\\bibliography\s*\{/.test(source) };
}
