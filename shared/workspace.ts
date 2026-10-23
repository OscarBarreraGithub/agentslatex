import { projectConfig, safePath } from "./contracts";

export const defaultMainFolder = "agentlatex/main";
export const parentFolder = (path: string) => path.split("/").slice(0, -1).join("/");
export const inFolder = (path: string, folder: string) => !folder || path.startsWith(folder + "/");
export function joinFolder(folder: string, name: string) {
  const result = safePath.safeParse(folder ? folder + "/" + name : name);
  // Callers show this message directly; a raw schema issue list is not readable.
  if (!result.success) throw Error("Use a plain project-relative name without \"..\" segments, backslashes or control characters.");
  return result.data;
}
export function workspaceConfig(value: unknown, legacyMain: string) {
  const cfg = projectConfig.parse(value);
  const folder = cfg.folder ?? parentFolder(cfg.main ?? legacyMain);
  return { ...cfg, folder, main: cfg.main ?? joinFolder(folder, "main.tex") };
}
export function workspacePaths(paths: string[], folder: string, references: string[]) {
  return paths.filter(path => inFolder(path, folder) || references.some(ref => path === ref || inFolder(path, ref)));
}
export function directories(paths: string[]) {
  const dirs = new Set<string>([""]);
  for (const path of paths) {
    const parts = path.split("/");
    for (let i = 1; i < parts.length; i++) dirs.add(parts.slice(0, i).join("/"));
  }
  return [...dirs].sort();
}
export function fileDestination(source: string, folder: string, paths: string[]) {
  const target = joinFolder(folder, source.split("/").at(-1)!);
  if (target !== source && paths.includes(target)) throw Error("That folder already contains a file with this name.");
  return target;
}
export function renamedPath(source: string, name: string, paths: string[]) {
  name = name.trim();
  if (!name || /[\\/]/.test(name)) throw Error("Enter a file name, not a folder path.");
  const target = joinFolder(parentFolder(source), name);
  if (target !== source && paths.some(p => p === target || p.startsWith(target + "/")))
    throw Error("That name is already in use. Choose another name.");
  return target;
}
export const missingExtension = (path: string) => {
  const name = path.split("/").at(-1) ?? "";
  return !!name && (!name.includes(".") || name.endsWith("."));
};
export function unlinkReference(path: string, references: string[], paths: string[]) {
  return references.flatMap(ref => ref === path ? [] : inFolder(path, ref)
    ? paths.filter(p => p !== path && inFolder(p, ref)) : [ref]);
}
