import reminderLines from "./project-reminder.json";
import { joinFolder } from "./workspace";

export const docsUrl = "https://agentlatex.com/docs";
const marker = "<!-- agentlatex:instructions -->";
const reminder = reminderLines.join("\n");
const preferences = "% Add your LaTeX-specific instructions for agents here.\n\n\n\n\n\n\n\n";

/** Refresh only our delimited block; preserve the repository owner's instructions. */
export function appendInstructions(existing?: string): string {
  if (existing?.includes(marker)) return existing.replace(
    /<!-- agentlatex:instructions -->[\s\S]*?<!-- \/agentlatex:instructions -->/,
    reminder,
  );
  return existing === undefined ? preferences + reminder + "\n" : existing + "\n\n" + reminder + "\n";
}

/** Reuse existing filename casing, including agents.md, on macOS and Windows. */
export function instructionPaths(paths: string[], folder: string): string[] {
  return [...new Set(["AGENTS.md", joinFolder(folder, "AGENTS.md")])].map(target =>
    paths.includes(target) ? target : paths.find(path => path.toLowerCase() === target.toLowerCase()) ?? target,
  );
}

export async function connectInstructions(
  paths: string[], folder: string, read: (path: string) => Promise<string>,
): Promise<Record<string, string>> {
  const changes: Record<string, string> = {};
  for (const path of instructionPaths(paths, folder)) {
    const existing = paths.includes(path) ? await read(path) : undefined;
    const next = appendInstructions(existing);
    if (next !== existing) changes[path] = next;
  }
  return changes;
}
