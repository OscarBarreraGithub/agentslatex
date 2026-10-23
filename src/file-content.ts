import type { FileInput } from "texlyre-busytex";
import { isTextFile } from "./project.mjs";
import { missingExtension } from "../shared/workspace";

/** Encodings a text file may have been read from; UTF-8 needs no mark. */
export type TextEncoding = "windows-1252";
/** A project file as the editor holds it. Text remembers the encoding it was read from. */
export interface DraftFile extends FileInput { encoding?: TextEncoding }

const strictUtf8 = new TextDecoder("utf-8", { fatal: true });
let windows1252: Map<string, number> | undefined;
function windows1252Bytes() {
  if (!windows1252) {
    windows1252 = new Map();
    const decoder = new TextDecoder("windows-1252");
    for (let byte = 0; byte < 256; byte++) windows1252.set(decoder.decode(new Uint8Array([byte])), byte);
  }
  return windows1252;
}

/**
 * Decode text without silently damaging it. Lenient UTF-8 decoding turns every
 * byte of an older Latin-1 manuscript into U+FFFD, and a later save would commit
 * those replacement characters. Fall back to Windows-1252 and remember it, so a save
 * writes the file back in its own encoding (see encodeText) and its
 * \usepackage[latin1]{inputenc} declaration stays true.
 */
function decodeText(data: Uint8Array): { content: string; encoding?: TextEncoding } {
  try { return { content: strictUtf8.decode(data) }; }
  catch { return { content: new TextDecoder("windows-1252").decode(data), encoding: "windows-1252" }; }
}

export function decodeFile(path: string, data: Uint8Array): { content: string | Uint8Array; encoding?: TextEncoding } {
  if (isTextFile(path) || /\.(md|json|yaml|yml|gitignore)$/i.test(path)) return decodeText(data);
  // A forgotten extension should not make ordinary text uneditable after reload.
  // Keep actual binary files byte-for-byte instead of decoding with replacement.
  if (missingExtension(path) && !data.includes(0)) {
    try { return { content: strictUtf8.decode(data) }; } catch { /* binary */ }
  }
  return { content: data };
}

export const fileContent = (path: string, data: Uint8Array) => decodeFile(path, data).content;

/**
 * Bytes for saving or exporting text, in the encoding the file was read from. A character
 * that encoding cannot hold is refused, naming the place, rather than silently switching
 * the file to UTF-8: that would leave its bytes at odds with its inputenc declaration
 * while the preview, which compiles the Unicode text, looked right.
 */
export function encodeText(text: string, encoding?: TextEncoding, path = "This file"): Uint8Array {
  if (encoding === "windows-1252") {
    const table = windows1252Bytes(), out = new Uint8Array(text.length);
    let length = 0, line = 1;
    for (const char of text) {
      const byte = table.get(char);
      if (byte === undefined)
        throw Error(`${path} is stored as Latin-1 (Windows-1252), which has no "${char}" (line ${line}). Remove it, or convert the file to UTF-8 and change its inputenc declaration to utf8 first.`);
      out[length++] = byte;
      if (char === "\n") line++;
    }
    return out.subarray(0, length);
  }
  return new TextEncoder().encode(text);
}

const legacyInputenc = /^(latin1|latin9|latin10|ansinew|cp125[0-8]|applemac|macce)$/i;
/**
 * The editor holds Unicode text, so a manuscript read from Windows-1252 is compiled as
 * UTF-8. Read its legacy inputenc option as utf8 for that build only; the saved file
 * keeps both its bytes and its declaration.
 */
export function declareUtf8Input(tex: string): string {
  return tex.replace(/\\usepackage\s*\[([^\]]*)\]\s*\{inputenc\}/g, (_, options: string) =>
    `\\usepackage[${options.split(",").map(o => legacyInputenc.test(o.trim()) ? "utf8" : o).join(",")}]{inputenc}`);
}
