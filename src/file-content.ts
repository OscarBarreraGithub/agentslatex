import { isTextFile } from "./project.mjs";
import { missingExtension } from "../shared/workspace";

/**
 * Decode text without silently damaging it. Lenient UTF-8 decoding turns every
 * byte of an older Latin-1 manuscript into U+FFFD, and a later save would commit
 * those replacement characters. Fall back to Windows-1252 so the characters survive;
 * the file is re-encoded as UTF-8 only if it is edited and saved.
 */
function decodeText(data: Uint8Array): string {
  try { return new TextDecoder("utf-8", { fatal: true }).decode(data); }
  catch { return new TextDecoder("windows-1252").decode(data); }
}

export function fileContent(path: string, data: Uint8Array): string | Uint8Array {
  if (isTextFile(path) || /\.(md|json|yaml|yml|gitignore)$/i.test(path))
    return decodeText(data);
  // A forgotten extension should not make ordinary text uneditable after reload.
  // Keep actual binary files byte-for-byte instead of decoding with replacement.
  if (missingExtension(path) && !data.includes(0)) {
    try { return new TextDecoder("utf-8", { fatal: true }).decode(data); } catch { /* binary */ }
  }
  return data;
}
