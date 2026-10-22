import type { FileInput } from "texlyre-busytex";
import type { Entry } from "../shared/contracts";
export interface ProjectDraft {
  revision: string;
  entries: Entry[];
  files: FileInput[];
  dirty: string[];
  selected: string;
  main: string;
  folder?: string;
  references?: string[];
  engine: "pdf" | "lua" | "xe";
}
/** Reuse saved bytes only when GitHub still identifies them as the same blob. */
export function cachedDraftFiles(saved: ProjectDraft | undefined, entries: Entry[]): FileInput[] {
  if (!saved || saved.dirty.length) return [];
  const previous = new Map(saved.entries.map(entry => [entry.path, entry.sha]));
  const current = new Map(entries.map(entry => [entry.path, entry.sha]));
  return saved.files.filter(file => current.has(file.path) && current.get(file.path) === previous.get(file.path));
}
export async function projectDraft(
  key: string,
  value?: ProjectDraft,
): Promise<ProjectDraft | undefined> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open("agentslatex-workspace", 1);
    open.onupgradeneeded = () => open.result.createObjectStore("drafts");
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      const tx = db.transaction("drafts", value ? "readwrite" : "readonly");
      const req = value
        ? tx.objectStore("drafts").put(value, key)
        : tx.objectStore("drafts").get(key);
      let result: ProjectDraft | undefined;
      req.onsuccess = () => (result = value ?? req.result);
      tx.oncomplete = () => {
        db.close();
        resolve(result);
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    };
  });
}
