import type { Entry } from "../shared/contracts";
/** Whole-file choices only when both sides changed; unaffected local edits survive refresh. */
export function conflictingPaths(
  base: Entry[],
  remote: Entry[],
  dirty: string[],
): string[] {
  const before = new Map(base.map((f) => [f.path, f.sha]));
  const after = new Map(remote.map((f) => [f.path, f.sha]));
  return dirty.filter((path) => before.get(path) !== after.get(path));
}
