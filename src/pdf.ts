import * as pdfjs from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
export { pdfjs };
export async function inspectPdf(bytes: Uint8Array) {
  const task = pdfjs.getDocument({ data: bytes.slice() });
  const pdf = await task.promise;
  const pages = pdf.numPages;
  let text = "";
  for (const i of [...new Set([1, Math.min(2, pages), pages])]) {
    const page = await pdf.getPage(i);
    const reader = page.streamTextContent().getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text +=
          value.items.map((x: { str?: string }) => x.str ?? "").join(" ") + " ";
      }
    } finally {
      reader.releaseLock();
    }
    text += "\n";
  }
  await task.destroy();
  return { pages, text };
}
