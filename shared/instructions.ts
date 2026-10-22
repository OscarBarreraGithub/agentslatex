import { joinFolder } from "./workspace";

export const docsUrl = "https://agentlatex.com/docs";
const marker = "<!-- agentlatex:instructions -->";
const reminder = `${marker}
## AgentsLaTeX

For this project's LaTeX, TeX, PDF, manuscript, figures, bibliography and AI attribution:
- At the start of work and after resuming/compaction, read ${docsUrl}/AGENTS.md
  and ${docsUrl}/latex-specs.md. Follow their links for GitHub setup or conversation imports.
- If your web tool cannot read the site, use the same live guide at
  https://raw.githubusercontent.com/OscarBarreraGithub/agentslatex/refs/heads/main/docs/AGENT_GUIDE.md
- Read root .agentlatex.json and relevant local AGENTS.md files; preserve local preferences.
- Tag every new or rewritten agent passage with paired \`% agentlatex:begin agent id=...\` /
  \`% agentlatex:end id=...\` comments and \`% agentlatex:author\` model/version/reasoning metadata.
  Preserve untouched text and existing tags. Check tags and the diff before committing.
- Keep a note of these doc URLs in your handoff when compacting. Shared instructions live
  online; do not copy them into this repository. If unavailable, say so; do not invent guidance.
<!-- /agentlatex:instructions -->`;
const preferences = "% Add your LaTeX-specific instructions for agents here.\n\n\n\n\n\n\n\n";

/** Appends once, without replacing the repository owner's instructions. */
export function appendInstructions(existing?: string): string {
  if (existing?.includes(marker)) return existing;
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
