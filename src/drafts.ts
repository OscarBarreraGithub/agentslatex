import type { FileInput } from "texlyre-busytex";
import type { Entry } from "../shared/contracts";
export interface ProjectDraft {
  revision: string;
  entries: Entry[];
  files: FileInput[];
  dirty: string[];
  selected: string;
  main: string;
  engine: "pdf" | "lua" | "xe";
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
