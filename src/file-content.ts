import { isTextFile } from "./project.mjs";
import { missingExtension } from "../shared/workspace";

export function fileContent(path: string, data: Uint8Array): string | Uint8Array {
  if (isTextFile(path) || /\.(md|json|yaml|yml|gitignore)$/i.test(path))
    return new TextDecoder().decode(data);
  // A forgotten extension should not make ordinary text uneditable after reload.
  // Keep actual binary files byte-for-byte instead of decoding with replacement.
  if (missingExtension(path) && !data.includes(0)) {
    try { return new TextDecoder("utf-8", { fatal: true }).decode(data); } catch { /* binary */ }
  }
  return data;
}
