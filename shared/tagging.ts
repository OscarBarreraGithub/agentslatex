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
  let open: { id: string; from: number; legacy: boolean } | undefined;
  let offset = 0;
  const ids = new Set<string>();
  for (const line of text.split("\n")) {
    const simpleBegin = /^\s*%\s*agent:begin\s*$/.test(line);
    const simpleEnd = /^\s*%\s*agent:end\s*$/.test(line);
    // Keep earlier papers highlightable without rewriting their source on load.
    const begin = line.match(/^\s*%\s*agentlatex:begin agent id=([\w.-]+)\s*$/);
    const end = line.match(/^\s*%\s*agentlatex:end id=([\w.-]+)\s*$/);
    if (begin || simpleBegin) {
      if (open) errors.push("Nested Agent tags.");
      const id = begin?.[1] ?? `passage-${offset}`;
      if (begin && ids.has(id)) errors.push("Duplicate Agent ID: " + id);
      open = { id, from: offset + line.length + 1, legacy: !!begin };
      if (begin) ids.add(id);
    }
    if (end || simpleEnd) {
      if (!open || (end ? !open.legacy || open.id !== end[1] : open.legacy))
        errors.push("Unmatched agent:end tag.");
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
  if (open) errors.push("Missing agent:end tag.");
  return { ranges, errors };
}
