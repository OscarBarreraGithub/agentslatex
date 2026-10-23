export function inferMain(files) {
  return (
    files.find((f) => f.path === "main.tex")?.path ??
    files.find(
      (f) =>
        f.path.endsWith(".tex") &&
        typeof f.content === "string" &&
        /\\documentclass\b/.test(f.content),
    )?.path ??
    files.find((f) => f.path.endsWith(".tex"))?.path ??
    ""
  );
}
export const isTextFile = (path) =>
  /\.(tex|bib|sty|cls|bst|txt|csv|dat|tikz|def|cfg|clo|fd|map|enc)$/i.test(
    path,
  );
