import type { FileInput } from "texlyre-busytex";
export type Saved = {
  files: FileInput[];
  main: string;
  selected: string;
  engine: "pdf" | "lua" | "xe";
};
export async function draft(value?: Saved): Promise<Saved | undefined> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open("agentslatex-project", 1);
    open.onupgradeneeded = () => open.result.createObjectStore("draft");
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      const tx = db.transaction("draft", value ? "readwrite" : "readonly");
      const request = value
        ? tx.objectStore("draft").put(value, "current")
        : tx.objectStore("draft").get("current");
      let result: Saved | undefined;
      request.onsuccess = () => (result = value ?? request.result);
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
