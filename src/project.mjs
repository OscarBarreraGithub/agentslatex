export function normalizePath(path) {
  const clean = path.replaceAll("\\", "/").replace(/^\.\//, "");
  if (
    !clean ||
    clean.startsWith("/") ||
    /^[A-Za-z]:/.test(clean) ||
    clean.split("/").some((x) => !x || x === "." || x === "..") ||
    /[\0\r\n]/.test(clean)
  )
    throw Error("Use project-relative file paths: " + path);
  return clean;
}
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
export function validateFiles(files) {
  const seen = new Set();
  for (const file of files) {
    file.path = normalizePath(file.path);
    if (seen.has(file.path))
      throw Error(
        "Duplicate path: " +
          file.path +
          ". Import a folder to preserve subdirectories.",
      );
    seen.add(file.path);
  }
  if (!inferMain(files))
    throw Error("Choose a .tex file, or a project folder containing one.");
  return files;
}
export const isTextFile = (path) =>
  /\.(tex|bib|sty|cls|bst|txt|csv|dat|tikz|def|cfg|clo|fd|map|enc)$/i.test(
    path,
  );
