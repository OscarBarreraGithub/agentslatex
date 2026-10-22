export interface AgentRange {
  id: string;
  from: number;
  to: number;
}
export function agentRanges(text: string): {
  ranges: AgentRange[];
  errors: string[];
} {
  const ranges: AgentRange[] = [],
    errors: string[] = [];
  let open: { id: string; from: number } | undefined;
  let offset = 0;
  const ids = new Set<string>();
  for (const line of text.split("\n")) {
    const begin = line.match(/^\s*%\s*agentlatex:begin agent id=([\w.-]+)\s*$/);
    const end = line.match(/^\s*%\s*agentlatex:end id=([\w.-]+)\s*$/);
    if (begin) {
      if (open) errors.push("Nested Agent tags.");
      if (ids.has(begin[1])) errors.push("Duplicate Agent ID: " + begin[1]);
      open = { id: begin[1], from: offset + line.length + 1 };
      ids.add(begin[1]);
    }
    if (end) {
      if (!open || open.id !== end[1])
        errors.push("Unmatched Agent tag: " + end[1]);
      else {
        ranges.push({
          id: open.id,
          from: open.from,
          to: Math.max(open.from, offset - 1),
        });
        open = undefined;
      }
    }
    offset += line.length + 1;
  }
  if (open) errors.push("Unclosed Agent tag: " + open.id);
  return { ranges, errors };
}
