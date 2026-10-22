import { projectConfig, safePath } from "./contracts";

export const parentFolder = (path: string) => path.split("/").slice(0, -1).join("/");
export const inFolder = (path: string, folder: string) => !folder || path.startsWith(folder + "/");
export const joinFolder = (folder: string, name: string) => safePath.parse(folder ? folder + "/" + name : name);
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
