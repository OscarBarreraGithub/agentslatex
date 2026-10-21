import { EditorView, basicSetup } from "codemirror";
import { StreamLanguage } from "@codemirror/language";
import { stex } from "@codemirror/legacy-modes/mode/stex";
import { oneDark } from "@codemirror/theme-one-dark";
import { zipSync, strToU8 } from "fflate";
import type { FileInput } from "texlyre-busytex";
import { Compiler, type Engine } from "./compiler";
import { pdfjs } from "./pdf";
import { draft } from "./storage";
import { inferMain, isTextFile, validateFiles } from "./project.mjs";
import "./style.css";
const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `<header><div class="brand"><span class="mark">a<span>λ</span></span><span>agentslatex<small>YOUR PAPER. YOUR COMPUTER.</small></span></div><nav><button id="open-files">Open files</button><button id="open-folder">Open folder</button><button id="export">Export project</button><button id="build" class="primary">Compile <kbd>⌘ ↵</kbd></button><button id="cancel" hidden>Stop</button></nav></header>
<main class="workspace"><section class="source-pane"><div class="pane-bar"><label class="file-label">SOURCE <select id="files" aria-label="Editing file"></select></label><span id="save-state">Browser copy</span></div><div id="editor"></div><div class="pane-footer"><label>Main <select id="main" aria-label="Main document"></select></label><label><select id="engine" aria-label="LaTeX engine"><option value="pdf">pdfLaTeX</option><option value="lua">LuaLaTeX</option><option value="xe">XeLaTeX</option></select></label><label class="auto"><input type="checkbox" id="auto"> Auto</label></div></section>
<section class="pdf-pane"><div class="pane-bar"><span>PREVIEW <span id="freshness" class="muted">Not compiled</span></span><div class="pagination"><button id="prev" aria-label="Previous PDF page" disabled>‹</button><input id="page" aria-label="PDF page" type="number" min="1" value="1" disabled><span id="count">/ —</span><button id="next" aria-label="Next PDF page" disabled>›</button><button id="download" disabled>PDF ↓</button></div></div><div id="pdf-scroll"><div id="empty"><span class="paper-icon">Aa</span><h1>A little space to think.</h1><p>Edit your source, then Compile.<br>Your PDF is built here, in your browser.</p><p class="muted">Open files for a single paper, or Open folder<br>to include its images and bibliography.</p></div><canvas id="pdf" hidden aria-label="Compiled PDF page"></canvas></div><div class="pane-footer"><span id="status" role="status">Ready</span><button id="log-toggle">Build log</button></div></section></main>
<dialog id="logs"><div class="dialog-heading"><h2>Build log</h2><button id="close-log">Close</button></div><pre id="log">No build yet.</pre></dialog><input id="file-input" type="file" multiple hidden><input id="folder-input" type="file" multiple webkitdirectory hidden><div id="toast" role="alert" hidden></div>`;
const $ = <T extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const fileSelect = $<HTMLSelectElement>("files"),
  mainSelect = $<HTMLSelectElement>("main"),
  engineSelect = $<HTMLSelectElement>("engine");
let files: FileInput[] = [],
  main = "",
  selected = "",
  revision = 0,
  builtRevision = -1,
  loadingEditor = false,
  busy = false,
  saveTimer: ReturnType<typeof setTimeout>,
  autoTimer: ReturnType<typeof setTimeout>;
let pdfTask: ReturnType<typeof pdfjs.getDocument> | undefined;
let pdf: pdfjs.PDFDocumentProxy | undefined,
  renderTask: pdfjs.RenderTask | undefined,
  pdfBytes: Uint8Array | undefined,
  page = 1,
  renderVersion = 0;
const compiler = new Compiler();
const editor = new EditorView({
  doc: "",
  extensions: [
    basicSetup,
    StreamLanguage.define(stex),
    oneDark,
    EditorView.lineWrapping,
    EditorView.contentAttributes.of({ "aria-label": "LaTeX source editor" }),
    EditorView.updateListener.of((update) => {
      if (!update.docChanged || loadingEditor) return;
      const file = files.find((f) => f.path === selected);
      if (!file) return;
      file.content = update.state.doc.toString();
      revision++;
      freshness();
      scheduleSave();
      clearTimeout(autoTimer);
      if ($<HTMLInputElement>("auto").checked)
        autoTimer = setTimeout(() => {
          if (!busy) void compile();
        }, 1400);
    }),
  ],
  parent: $("editor"),
});
function notify(message: string) {
  $("toast").textContent = message;
  $("toast").hidden = false;
  setTimeout(() => ($("toast").hidden = true), 7000);
}
function freshness() {
  $("freshness").textContent = !pdf
    ? "Not compiled"
    : builtRevision === revision
      ? "Up to date"
      : "Earlier edit";
  $("freshness").className = builtRevision === revision ? "current" : "muted";
}
function scheduleSave() {
  clearTimeout(saveTimer);
  $("save-state").textContent = "Saving draft…";
  saveTimer = setTimeout(() => void save(), 700);
}
async function save() {
  try {
    await draft({
      files,
      main,
      selected,
      engine: engineSelect.value as Engine,
    });
    $("save-state").textContent = "Draft saved in browser";
  } catch {
    $("save-state").textContent = "Draft not saved — use Export";
  }
}
function showFile(path: string) {
  selected = path;
  fileSelect.value = path;
  const file = files.find((f) => f.path === path);
  loadingEditor = true;
  editor.dispatch({
    changes: {
      from: 0,
      to: editor.state.doc.length,
      insert: typeof file?.content === "string" ? file.content : "",
    },
  });
  loadingEditor = false;
}
function populate() {
  fileSelect.replaceChildren();
  mainSelect.replaceChildren();
  for (const file of files) {
    if (typeof file.content === "string")
      fileSelect.add(new Option(file.path, file.path));
    if (file.path.endsWith(".tex"))
      mainSelect.add(new Option(file.path, file.path));
  }
  mainSelect.value = main;
  showFile(
    files.some((f) => f.path === selected && typeof f.content === "string")
      ? selected
      : main,
  );
}
async function setProject(incoming: FileInput[]) {
  if (busy) compiler.cancel();
  files = validateFiles(incoming);
  main = inferMain(files);
  selected = main;
  revision++;
  builtRevision = -1;
  populate();
  freshness();
  await clearPdf();
  $("status").textContent =
    `${files.length} file${files.length === 1 ? "" : "s"} · originals unchanged`;
  await save();
}
async function readImport(input: HTMLInputElement) {
  try {
    const chosen = [...(input.files ?? [])];
    if (!chosen.length) return;
    const folder = chosen[0].webkitRelativePath?.split("/")[0];
    const incoming = await Promise.all(
      chosen
        .filter(
          (f) =>
            !f.webkitRelativePath.split("/").some((p) => p.startsWith(".")) &&
            !/\.(aux|log|synctex|gz|fls|fdb_latexmk)$/i.test(f.name),
        )
        .map(async (file) => ({
          path: folder
            ? file.webkitRelativePath.slice(folder.length + 1)
            : file.name,
          content: isTextFile(file.name)
            ? await file.text()
            : new Uint8Array(await file.arrayBuffer()),
        })),
    );
    await setProject(incoming);
  } catch (e) {
    notify(String(e));
  } finally {
    input.value = "";
  }
}
function download(bytes: Uint8Array, name: string, type: string) {
  const url = URL.createObjectURL(
    new Blob([bytes.slice().buffer as ArrayBuffer], { type }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
async function clearPdf() {
  renderVersion++;
  renderTask?.cancel();
  if (pdfTask) await pdfTask.destroy();
  pdfTask = undefined;
  pdf = undefined;
  pdfBytes = undefined;
  $("pdf").hidden = true;
  $("empty").hidden = false;
  $<HTMLButtonElement>("download").disabled = true;
  $<HTMLInputElement>("page").disabled = true;
  updatePaging();
  freshness();
}
function updatePaging() {
  $<HTMLInputElement>("page").value = String(page);
  $("count").textContent = "/ " + (pdf?.numPages ?? "—");
  $<HTMLButtonElement>("prev").disabled = !pdf || page <= 1;
  $<HTMLButtonElement>("next").disabled = !pdf || page >= pdf.numPages;
}
async function render() {
  if (!pdf) return;
  const version = ++renderVersion;
  renderTask?.cancel();
  try {
    const sheet = await pdf.getPage(page);
    if (version !== renderVersion) return;
    const scale = Math.min(
      2.2,
      Math.max(
        0.2,
        ($("pdf-scroll").clientWidth - 48) /
          sheet.getViewport({ scale: 1 }).width,
      ),
    );
    const viewport = sheet.getViewport({ scale });
    const canvas = $<HTMLCanvasElement>("pdf");
    const ratio = Math.min(devicePixelRatio, 2);
    canvas.width = Math.round(viewport.width * ratio);
    canvas.height = Math.round(viewport.height * ratio);
    canvas.style.width = viewport.width + "px";
    canvas.style.height = viewport.height + "px";
    canvas.hidden = false;
    $("empty").hidden = true;
    renderTask = sheet.render({
      canvas,
      viewport,
      transform: ratio !== 1 ? [ratio, 0, 0, ratio, 0, 0] : undefined,
    });
    await renderTask.promise;
    updatePaging();
  } catch (error) {
    if ((error as Error).name !== "RenderingCancelledException")
      notify("PDF preview: " + (error as Error).message);
  }
}
async function compile() {
  if (busy || !main) return;
  busy = true;
  for (const id of ["open-files", "open-folder"])
    $<HTMLButtonElement>(id).disabled = true;
  $<HTMLButtonElement>("build").disabled = true;
  $("cancel").hidden = false;
  const version = revision;
  const snapshot = files.map((f) => ({
    ...f,
    content: typeof f.content === "string" ? f.content : f.content.slice(),
  }));
  try {
    const result = await compiler.compile(
      snapshot,
      main,
      engineSelect.value as Engine,
      (message) => ($("status").textContent = message),
    );
    $("log").textContent =
      result.log + "\n" + result.logs.map((x) => x.stderr).join("\n");
    if (!result.success || !result.pdf) {
      $("status").textContent = "Build failed · see log";
      builtRevision = pdf ? -2 : -1;
      freshness();
      return;
    }
    const previousPage = page;
    await clearPdf();
    pdfBytes = result.pdf;
    pdfTask = pdfjs.getDocument({ data: result.pdf.slice() });
    pdf = await pdfTask.promise;
    page = Math.min(previousPage, pdf.numPages);
    builtRevision = version;
    freshness();
    $<HTMLButtonElement>("download").disabled = false;
    $<HTMLInputElement>("page").disabled = false;
    $<HTMLInputElement>("page").max = String(pdf.numPages);
    await render();
    $("status").textContent =
      `${result.compileSeconds.toFixed(2)}s compile${result.loadSeconds ? ` · ${result.loadSeconds.toFixed(2)}s load` : ""} · ${pdf.numPages} pages · ${(result.pdf.length / 1048576).toFixed(2)} MiB`;
  } catch (e) {
    $("status").textContent = (e as Error).message;
  } finally {
    busy = false;
    for (const id of ["open-files", "open-folder"])
      $<HTMLButtonElement>(id).disabled = false;
    $<HTMLButtonElement>("build").disabled = false;
    $("cancel").hidden = true;
    if ($<HTMLInputElement>("auto").checked && revision !== version) {
      clearTimeout(autoTimer);
      autoTimer = setTimeout(() => void compile(), 500);
    }
  }
}
$("build").onclick = () => void compile();
$("cancel").onclick = () => {
  clearTimeout(autoTimer);
  $<HTMLInputElement>("auto").checked = false;
  compiler.cancel();
};
$("open-files").onclick = () => $<HTMLInputElement>("file-input").click();
$("open-folder").onclick = () => $<HTMLInputElement>("folder-input").click();
$<HTMLInputElement>("file-input").onchange = () =>
  void readImport($("file-input"));
$<HTMLInputElement>("folder-input").onchange = () =>
  void readImport($("folder-input"));
fileSelect.onchange = () => {
  showFile(fileSelect.value);
  scheduleSave();
};
mainSelect.onchange = () => {
  main = mainSelect.value;
  revision++;
  freshness();
  scheduleSave();
};
engineSelect.onchange = () => {
  revision++;
  freshness();
  scheduleSave();
};
$("export").onclick = () => {
  const entries: Record<string, Uint8Array> = {};
  for (const file of files)
    entries[file.path] =
      typeof file.content === "string" ? strToU8(file.content) : file.content;
  download(
    zipSync(entries, { level: 0 }),
    "agentslatex-project.zip",
    "application/zip",
  );
};
$("download").onclick = () => {
  if (pdfBytes)
    download(
      pdfBytes,
      main
        .replace(/\.tex$/i, ".pdf")
        .split("/")
        .at(-1)!,
      "application/pdf",
    );
};
$("prev").onclick = () => {
  page--;
  void render();
};
$("next").onclick = () => {
  page++;
  void render();
};
$<HTMLInputElement>("page").onchange = () => {
  page = Math.min(
    pdf?.numPages ?? 1,
    Math.max(1, Number($<HTMLInputElement>("page").value) || 1),
  );
  void render();
};
$("log-toggle").onclick = () => $<HTMLDialogElement>("logs").showModal();
$("close-log").onclick = () => $<HTMLDialogElement>("logs").close();
addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
    event.preventDefault();
    void compile();
  }
  if ((event.metaKey || event.ctrlKey) && event.key === "s") {
    event.preventDefault();
    void save();
  }
});
let resizeTimer: ReturnType<typeof setTimeout>;
new ResizeObserver(() => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => void render(), 150);
}).observe($("pdf-scroll"));
addEventListener("pagehide", () => compiler.dispose());
async function start() {
  try {
    const saved = await draft();
    if (saved) {
      files = validateFiles(saved.files);
      main = saved.main;
      selected = saved.selected;
      engineSelect.value = saved.engine;
      populate();
      $("save-state").textContent = "Restored browser draft";
      return;
    }
  } catch {
    notify("Could not restore the browser draft.");
  }
  const res = await fetch("/fixtures/demo/main.tex");
  if (!res.ok) throw Error("Run pnpm setup first.");
  await setProject([{ path: "main.tex", content: await res.text() }]);
}
void start().catch((e) => notify((e as Error).message));
