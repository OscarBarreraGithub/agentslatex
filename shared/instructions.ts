import reminderLines from "./project-reminder.json";

export const docsUrl = "https://agentlatex.com/docs";
const marker = "<!-- agentlatex:instructions -->";
const closingMarker = "<!-- /agentlatex:instructions -->";
const reminder = reminderLines.join("\n");
const preferences = "<!-- Project-specific instructions for agents go above the AgentsLaTeX block. -->\n\n";

/**
 * Refresh only our delimited block; preserve the repository owner's instructions.
 * A file with a lone marker is malformed: leave it untouched rather than appending a
 * second block or deleting content (the live guide asks agents to report it).
 */
export function appendInstructions(existing?: string): string {
  if (existing === undefined) return preferences + reminder + "\n";
  const hasOpen = existing.includes(marker), hasClose = existing.includes(closingMarker);
  if (hasOpen && hasClose) return existing.replace(
    /<!-- agentlatex:instructions -->[\s\S]*?<!-- \/agentlatex:instructions -->/,
    () => reminder, // A function replacement keeps "$" sequences in the reminder literal.
  );
  if (hasOpen || hasClose) return existing;
  return existing + "\n\n" + reminder + "\n";
}

/** One root instruction file, reusing existing filename casing (agents.md) on macOS and Windows. */
export function instructionPath(paths: string[]): string {
  return paths.includes("AGENTS.md") ? "AGENTS.md"
    : paths.find(path => path.toLowerCase() === "agents.md") ?? "AGENTS.md";
}

export async function connectInstructions(
  paths: string[], read: (path: string) => Promise<string>,
): Promise<Record<string, string>> {
  const path = instructionPath(paths);
  const existing = paths.includes(path) ? await read(path) : undefined;
  const next = appendInstructions(existing);
  return next !== existing ? { [path]: next } : {};
}
