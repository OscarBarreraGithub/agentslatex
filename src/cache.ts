import type { Project, Entry } from "../shared/contracts";
import type { FileInput } from "texlyre-busytex";

export function projectListCache(user: number, projects?: Project[]): Project[] | undefined {
  try {
    const key = "agentslatex-project-list:" + user;
    if (projects) { localStorage.setItem(key, JSON.stringify(projects)); return projects; }
    const saved: unknown = JSON.parse(localStorage.getItem(key) ?? "null");
    return Array.isArray(saved) && saved.every(p => Number.isSafeInteger(p?.id) && p.id > 0 && typeof p.branch === "string" && typeof p?.name === "string" && typeof p?.owner === "string") ? saved : undefined;
  } catch { return undefined; }
}
export function clearProjectList(user: number) {
  try { localStorage.removeItem("agentslatex-project-list:" + user); } catch { /* Optional cache. */ }
}
export interface CachedBuild {
  pdf: Uint8Array;
  synctex?: Uint8Array;
  signature: string;
  path: string;
  engine: string;
  seconds: number;
  page: number;
  savedAt: number;
}
/** The Git blob object ID GitHub reports for these bytes. */
export async function gitBlobSha(data: Uint8Array): Promise<string> {
  const header = new TextEncoder().encode(`blob ${data.byteLength}\0`);
  const blob = new Uint8Array(header.length + data.byteLength);
  blob.set(header); blob.set(data, header.length);
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-1", blob)), b => b.toString(16).padStart(2, "0")).join("");
}
/** Match the entire compiler input, including dirty drafts, without downloading unchanged files. */
export async function buildSignature(paths: string[], entries: Entry[], files: Map<string, FileInput>, dirty: Set<string>, target: string, engine: string): Promise<string> {
  const remote = new Map(entries.map(e => [e.path, e.sha]));
  const manifest: string[] = [];
  for (const path of [...paths].sort()) {
    let sha = !dirty.has(path) ? remote.get(path) : undefined;
    if (!sha) {
      const content = files.get(path)?.content;
      if (content === undefined) throw Error("Missing build input: " + path);
      sha = await gitBlobSha(typeof content === "string" ? new TextEncoder().encode(content) : content);
    }
    manifest.push(path + ":" + sha);
  }
  return JSON.stringify([target, engine, manifest]);
}
// Disposable PDF cache lives separately from irreplaceable unsaved source drafts.
export async function pdfCache(key: string, value?: CachedBuild): Promise<CachedBuild | undefined> {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const open = indexedDB.open("agentslatex-pdf-cache", 1);
    open.onupgradeneeded = () => open.result.createObjectStore("builds");
    open.onsuccess = () => resolve(open.result);
    open.onerror = () => reject(open.error);
  });
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction("builds", value ? "readwrite" : "readonly");
      const store = tx.objectStore("builds");
      let result: CachedBuild | undefined;
      if (!value) {
        const get = store.get(key);
        get.onsuccess = () => { result = get.result; };
      } else {
        const maxBytes = 64 * 1024 * 1024;
        const size = (b: CachedBuild) => b.pdf.byteLength + (b.synctex?.byteLength ?? 0);
        // One latest build per project, at most five builds / 64 MiB total per browser.
        const all = store.getAll(); const keys = store.getAllKeys();
        keys.onsuccess = () => {
          const records = (all.result as CachedBuild[]).map((build, i) => ({ build, key: keys.result[i] }));
          if ((records.find(item => item.key === key)?.build.savedAt ?? 0) > value.savedAt) return;
          if (size(value) > maxBytes) { store.delete(key); return; }
          const previous = records.filter(item => item.key !== key).sort((a,b) => b.build.savedAt - a.build.savedAt);
          let used = size(value), count = 1;
          store.put(value, key);
          for (const item of previous) {
            used += size(item.build); count++;
            if (count > 5 || used > maxBytes) store.delete(item.key);
          }
        };
      }
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally { db.close(); }
}
