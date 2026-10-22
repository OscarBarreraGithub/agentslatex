import { EditorView, basicSetup } from "codemirror";
import { Decoration, ViewPlugin, type DecorationSet } from "@codemirror/view";
import { StreamLanguage } from "@codemirror/language";
import { stex } from "@codemirror/legacy-modes/mode/stex";
import { oneDark } from "@codemirror/theme-one-dark";
import { zipSync, strToU8 } from "fflate";
import type { FileInput } from "texlyre-busytex";
import { Compiler, type Engine } from "./compiler";
import { pdfjs } from "./pdf";
import { api, request, RequestError, escapeHtml as h } from "./api";
import { projectDraft } from "./drafts";
import { conflictingPaths } from "./merge";
import { agentRanges } from "../shared/tagging";
import {
  safePath,
  projectConfig,
  type Snapshot,
  type Entry,
} from "../shared/contracts";
import { isTextFile, inferMain } from "./project.mjs";
const textFile = (p: string) =>
  isTextFile(p) ||
  /\.(md|json|yaml|yml|gitignore)$/i.test(p) ||
  p.endsWith(".gitignore");
const $ = <T extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const bytes = (f: FileInput) =>
  typeof f.content === "string"
    ? new TextEncoder().encode(f.content)
    : f.content;
export async function mountEditor(
  app: HTMLElement,
  id: number,
  userId: number,
  back: () => void,
  notify: (s: string) => void,
): Promise<() => Promise<void>> {
  let snapshot = await api<Snapshot>("/projects/" + id),
    project = snapshot.project,
    main = project.main,
    engine: Engine = project.engine;
  let selected = main,
    files = new Map<string, FileInput>(),
    dirty = new Set<string>(),
    revision = 0,
    builtRevision = -1,
    busy = false,
    syncing = false,
    refreshing = false,
    loadingEditor = false,
    disposed = false,
    highlight = false,
    selectionVersion = 0,
    previewUrl = "";
  let timer: ReturnType<typeof setTimeout> | undefined;
  const key = userId + ":" + id;
  const saved = await projectDraft(key).catch(() => undefined);
  if (saved?.dirty.length) {
    snapshot = { ...snapshot, revision: saved.revision, files: saved.entries };
    files = new Map(saved.files.map((f) => [f.path, f]));
    dirty = new Set(saved.dirty);
    selected = saved.selected;
    main = saved.main;
    engine = saved.engine;
  }
  const compiler = new Compiler();
  let buildAbort: AbortController | undefined;
  let pdf: pdfjs.PDFDocumentProxy | undefined,
    pdfTask: ReturnType<typeof pdfjs.getDocument> | undefined,
    renderTask: pdfjs.RenderTask | undefined,
    pdfBytes: Uint8Array | undefined,
    page = 1,
    renderVersion = 0;
  app.innerHTML = `<header class="workspace-header"><button id="back" class="icon" aria-label="Back to projects">←</button><div class="project-title"><strong>${h(project.name)}</strong><span>${h(project.owner)}</span></div><span id="save-state" class="save-state">Synced</span><div class="actions"><button id="refresh" title="Get changes from GitHub">Refresh</button><button id="sync">Save to GitHub</button><button id="build" class="primary">Compile <kbd>⌘ ↵</kbd></button><button id="stop" hidden>Stop</button></div></header>
 <div class="mobile-tabs"><button id="mobile-files">Files</button><button id="mobile-source" aria-pressed="true">Source</button><button id="mobile-pdf" aria-pressed="false">PDF</button></div>
 <main class="workspace"><aside class="file-pane"><div class="pane-bar"><span>Files</span><div class="actions"><button class="icon" id="new-file" title="New file" aria-label="New file">＋</button><button class="icon" id="upload" title="Upload files" aria-label="Upload files">↑</button></div></div><nav id="file-tree" aria-label="Project files"></nav><div class="file-bottom"><button id="mobile-refresh" class="quiet">Refresh from GitHub</button><button id="upload-folder">Upload folder</button><a class="button quiet" href="${h(project.url)}/settings/access" target="_blank" rel="noopener">Collaborators ↗</a><a class="button quiet" href="${h(project.url)}" target="_blank" rel="noopener">GitHub ↗</a><button id="export" class="quiet">Export project ↓</button></div></aside>
 <section class="source-pane"><div class="pane-bar"><span id="filename"></span><button id="tags" class="quiet" aria-pressed="false" title="Highlight tagged Agent passages">Agent tags</button></div><div id="editor"></div><div id="file-preview" hidden></div><div class="pane-footer"><span id="main-label"></span><button id="settings" class="quiet">Settings</button></div></section>
 <section class="pdf-pane"><div class="pane-bar"><span>PDF <span id="freshness" class="muted">Not compiled</span></span><div class="pagination"><button id="prev" class="icon" disabled aria-label="Previous PDF page">‹</button><input id="page" type="number" min="1" value="1" aria-label="PDF page" disabled><span id="count">/ —</span><button id="next" class="icon" disabled aria-label="Next PDF page">›</button><button id="download" class="quiet" disabled aria-label="Download PDF">↓</button></div></div>
 <div id="build-state" class="build-state" role="status" hidden><span id="build-label"></span><progress id="build-progress" hidden></progress><p id="build-error" hidden></p><button id="error-log" hidden>Show build log</button></div><div id="pdf-scroll"><div id="pdf-empty"><span class="paper-glyph">Aa</span><p>Ready when you are.</p><button id="empty-build" class="primary">Compile</button></div><canvas id="pdf" hidden></canvas></div><div class="pane-footer"><span id="timing"></span><button id="log-toggle" class="quiet">Build log</button></div></section></main>
 <dialog id="editor-dialog"></dialog><input id="file-input" type="file" multiple hidden><input id="folder-input" type="file" multiple webkitdirectory hidden>`;
  let log = "No build yet.",
    cancelled = false;
  const tagPlugin = ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      constructor(view: EditorView) {
        this.decorations = this.make(view);
      }
      update(u: {
        view: EditorView;
        docChanged: boolean;
        viewportChanged: boolean;
      }) {
        this.decorations = this.make(u.view);
      }
      make(view: EditorView) {
        if (!highlight || !selected.endsWith(".tex")) return Decoration.none;
        const { ranges } = agentRanges(view.state.doc.toString());
        return Decoration.set(
          ranges
            .filter((r) => r.to > r.from)
            .map((r) =>
              Decoration.mark({
                class: "agent-passage",
                attributes: { title: "Agent-written passage" },
              }).range(r.from, r.to),
            ),
          true,
        );
      }
    },
    { decorations: (v) => v.decorations },
  );
  const editor = new EditorView({
    doc: "",
    extensions: [
      basicSetup,
      StreamLanguage.define(stex),
      oneDark,
      EditorView.lineWrapping,
      tagPlugin,
      EditorView.contentAttributes.of({ "aria-label": "LaTeX source editor" }),
      EditorView.updateListener.of((u) => {
        if (!u.docChanged || loadingEditor) return;
        const f = files.get(selected);
        if (!f) return;
        f.content = u.state.doc.toString();
        dirty.add(selected);
        revision++;
        freshness();
        scheduleDraft();
        updateSaveState();
      }),
    ],
    parent: $("editor"),
  });
  function fail(e: unknown) {
    notify((e as Error).message);
  }
  async function persist() {
    if (disposed) return;
    await projectDraft(key, {
      revision: snapshot.revision,
      entries: snapshot.files,
      files: [...files.values()],
      dirty: [...dirty],
      selected,
      main,
      engine,
    });
  }
  function scheduleDraft() {
    clearTimeout(timer);
    timer = setTimeout(
      () =>
        void persist().catch(() =>
          notify(
            "Browser storage is full. Save to GitHub or export your draft.",
          ),
        ),
      400,
    );
  }
  function updateSaveState() {
    if (disposed) return;
    $("save-state").textContent = syncing
      ? "Saving…"
      : dirty.size
        ? "Unsynced changes"
        : "Synced";
    $<HTMLButtonElement>("sync").disabled =
      syncing || refreshing || !dirty.size || !project.writable;
    $("save-state").classList.toggle("changed", !!dirty.size);
  }
  function freshness() {
    $("freshness").textContent = !pdf
      ? "Not compiled"
      : builtRevision === revision
        ? "Up to date"
        : "Earlier edit";
    $("freshness").className =
      pdf && builtRevision === revision ? "current" : "muted";
  }
  function dialog(title: string, content: string) {
    const d = $<HTMLDialogElement>("editor-dialog");
    d.innerHTML = `<div class="dialog-title"><h2>${h(title)}</h2><button class="icon" id="close-dialog" aria-label="Close">×</button></div>${content}`;
    $("close-dialog").onclick = () => d.close();
    d.showModal();
    return d;
  }
  const allPaths = () =>
    [...new Set([...snapshot.files.map((f) => f.path), ...files.keys()])]
      .filter((p) => !(dirty.has(p) && !files.has(p)))
      .sort((a, b) => {
        const aPaper = a.startsWith("paper/"),
          bPaper = b.startsWith("paper/");
        return Number(bPaper) - Number(aPaper) || a.localeCompare(b);
      });
  function tree() {
    const expanded = new Map(
      [...document.querySelectorAll<HTMLDetailsElement>("[data-folder]")].map(
        (d) => [d.dataset.folder!, d.open],
      ),
    );
    type Node = { dirs: Map<string, Node>; paths: string[] };
    const root: Node = { dirs: new Map(), paths: [] };
    for (const path of allPaths()) {
      const parts = path.split("/");
      let node = root;
      for (const name of parts.slice(0, -1)) {
        if (!node.dirs.has(name))
          node.dirs.set(name, { dirs: new Map(), paths: [] });
        node = node.dirs.get(name)!;
      }
      if (!path.endsWith("/.gitkeep")) node.paths.push(path);
    }
    const fileButton = (path: string, depth: number) =>
      `<button class="file-row ${path === selected ? "selected" : ""}" style="--depth:${depth}" data-path="${h(path)}" title="${h(path)}" aria-current="${path === selected ? "page" : "false"}"><span class="file-type">${path.endsWith(".tex") ? "T" : /\.(png|jpg|jpeg|svg|pdf)$/i.test(path) ? "◇" : "≡"}</span><span>${h(path.split("/").at(-1)!)}</span>${path === main ? '<span class="main-dot" title="Main document">•</span>' : ""}</button>`;
    function folder(node: Node, prefix = "", depth = 0): string {
      return (
        [...node.dirs]
          .sort(([a], [b]) =>
            a === "paper" ? -1 : b === "paper" ? 1 : a.localeCompare(b),
          )
          .map(([name, child]) => {
            const path = prefix + name;
            const open =
              expanded.get(path) ??
              (path === "paper" || selected.startsWith(path + "/"));
            return `<details data-folder="${h(path)}" ${open ? "open" : ""}><summary style="padding-left:${8 + depth * 10}px">${h(name)}</summary>${folder(child, path + "/", depth + 1)}</details>`;
          })
          .join("") +
        node.paths
          .sort((a, b) =>
            a === main
              ? -1
              : b === main
                ? 1
                : Number(b.endsWith(".tex")) - Number(a.endsWith(".tex")) ||
                  a.localeCompare(b),
          )
          .map((p) => fileButton(p, depth))
          .join("")
      );
    }
    $("file-tree").innerHTML = folder(root);
    document
      .querySelectorAll<HTMLButtonElement>("[data-path]")
      .forEach(
        (b) => (b.onclick = () => void showFile(b.dataset.path!).catch(fail)),
      );
    $("main-label").textContent =
      main.split("/").at(-1) +
      " · " +
      { pdf: "pdfLaTeX", lua: "LuaLaTeX", xe: "XeLaTeX" }[engine];
  }

  async function getFile(path: string, signal?: AbortSignal) {
    signal?.throwIfAborted();
    const cached = files.get(path);
    if (cached) return cached;
    const entry = snapshot.files.find((f) => f.path === path);
    if (!entry) throw Error("File not found: " + path);
    if (entry.size > 20 * 1024 * 1024)
      throw Error(path + " exceeds the 20 MB per-file limit.");
    const r = await request(`/projects/${id}/file?sha=${entry.sha}`, {
      signal,
    });
    const content = textFile(path)
      ? await r.text()
      : new Uint8Array(await r.arrayBuffer());
    const f = { path, content };
    files.set(path, f);
    return f;
  }
  async function showFile(path: string) {
    const v = ++selectionVersion;
    const f = await getFile(path);
    if (disposed || v !== selectionVersion) return;
    selected = path;
    loadingEditor = true;
    editor.dispatch({
      changes: {
        from: 0,
        to: editor.state.doc.length,
        insert: typeof f.content === "string" ? f.content : "",
      },
    });
    loadingEditor = false;
    $("filename").textContent = path.split("/").at(-1)!;
    $("filename").title = path;
    $("editor").hidden = typeof f.content !== "string";
    $("file-preview").hidden = typeof f.content === "string";
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (typeof f.content !== "string") {
      previewUrl = URL.createObjectURL(
        new Blob([f.content.slice().buffer as ArrayBuffer]),
      );
      $("file-preview").innerHTML = /\.(png|jpe?g|webp|gif|svg)$/i.test(path)
        ? `<img src="${previewUrl}" alt="${h(path)}">`
        : `<p>${h(path)}</p><a class="button" href="${previewUrl}" download="${h(path.split("/").at(-1)!)}">Download file</a>`;
    }
    tree();
    scheduleDraft();
    app.classList.remove("show-files", "show-pdf");
    $("mobile-source").setAttribute("aria-pressed", "true");
    $("mobile-pdf").setAttribute("aria-pressed", "false");
  }
  async function loadAll(signal?: AbortSignal) {
    for (const path of allPaths()) await getFile(path, signal);
    return [...files.values()];
  }
  function download(data: Uint8Array, name: string, type: string) {
    const url = URL.createObjectURL(
      new Blob([data.slice().buffer as ArrayBuffer], { type }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
  async function sync() {
    if (syncing || refreshing || !dirty.size) return;
    syncing = true;
    $<HTMLButtonElement>("back").disabled = true;
    updateSaveState();
    const saving = [...dirty].map((path) => ({
      path,
      file: files.get(path) ? { ...files.get(path)! } : undefined,
    }));
    try {
      const changes = [];
      for (const item of saving) {
        if (!item.file) {
          changes.push({ path: item.path, sha: null });
          continue;
        }
        const raw = bytes(item.file);
        const b = (await (
          await request("/projects/" + id + "/blob", {
            method: "PUT",
            headers: { "Content-Type": "application/octet-stream" },
            body: raw.slice().buffer as ArrayBuffer,
          })
        ).json()) as { sha: string };
        changes.push({ path: item.path, sha: b.sha });
      }
      const result = await api<{ revision: string }>(
        "/projects/" + id + "/save",
        { base: snapshot.revision, changes },
      );
      snapshot.revision = result.revision;
      for (const c of changes) {
        snapshot.files = snapshot.files.filter((f) => f.path !== c.path);
        if (c.sha)
          snapshot.files.push({
            path: c.path,
            sha: c.sha,
            type: "blob",
            mode: "100644",
            size: bytes(saving.find((f) => f.path === c.path)!.file!).length,
          });
        const original = saving.find((f) => f.path === c.path)!.file;
        const current = files.get(c.path);
        if (original?.content === current?.content) dirty.delete(c.path);
      }
      await persist();
      notify("Saved to GitHub.");
    } catch (e) {
      if ((e as RequestError).status === 409)
        (dialog(
          "GitHub has newer changes",
          `<p>Your draft is safe. Refresh to combine changes and choose which version to keep when a file conflicts.</p><button class="primary" id="resolve">Refresh changes</button>`,
        ),
          ($("resolve").onclick = () => {
            $<HTMLDialogElement>("editor-dialog").close();
            void refresh().catch(fail);
          }));
      else fail(e);
    } finally {
      syncing = false;
      if (!disposed) $<HTMLButtonElement>("back").disabled = false;
      updateSaveState();
    }
  }
  async function refresh() {
    if (syncing || refreshing || busy) return;
    refreshing = true;
    $<HTMLButtonElement>("back").disabled = true;
    updateSaveState();
    const button = $<HTMLButtonElement>("refresh");
    button.disabled = true;
    try {
      const remote = await api<Snapshot>("/projects/" + id);
      if (remote.revision === snapshot.revision) {
        notify("Already up to date.");
        return;
      }
      const conflicts = conflictingPaths(snapshot.files, remote.files, [
        ...dirty,
      ]);
      let choices = new Map<string, "mine" | "github">();
      if (conflicts.length) {
        const d = dialog(
          "Choose changes to keep",
          `<p class="hint">Both you and GitHub changed these files.</p><div class="conflicts">${conflicts.map((p, i) => `<label class="field">${h(p)}<select data-conflict="${i}"><option value="">Choose a version</option><option value="mine">My draft</option><option value="github">GitHub version</option></select></label>`).join("")}</div><button class="primary wide" id="apply-merge">Continue</button>`,
        );
        const accepted = await new Promise<boolean>((resolve) => {
          d.addEventListener("close", () => resolve(false), { once: true });
          $("apply-merge").onclick = () => {
            const fields = [
              ...d.querySelectorAll<HTMLSelectElement>("[data-conflict]"),
            ];
            if (fields.some((f) => !f.value)) {
              notify("Choose a version for each changed file.");
              return;
            }
            choices = new Map(
              fields.map((f) => [
                conflicts[Number(f.dataset.conflict)],
                f.value as "mine" | "github",
              ]),
            );
            resolve(true);
            d.close();
          };
        });
        if (!accepted) return;
      }
      for (const path of [...files.keys()]) {
        if (!dirty.has(path) || choices.get(path) === "github")
          files.delete(path);
      }
      for (const [path, choice] of choices)
        if (choice === "github") dirty.delete(path);
      snapshot = remote;
      project = remote.project;
      await readSettings();
      revision++;
      freshness();
      tree();
      if (!allPaths().includes(selected))
        selected = allPaths().includes(main)
          ? main
          : (allPaths().find((p) => p.endsWith(".tex")) ?? allPaths()[0]);
      await showFile(selected);
      await persist();
      updateSaveState();
      notify("Changes refreshed.");
    } finally {
      button.disabled = false;
      refreshing = false;
      if (!disposed) $<HTMLButtonElement>("back").disabled = false;
      updateSaveState();
    }
  }
  function progress(message: string, error = false) {
    if (disposed) return;
    $("build-state").hidden = false;
    $("build-state").classList.toggle("failed", error);
    $("build-label").textContent = message;
    $("build-progress").hidden = error || !busy;
    const match = message.match(/(\d+)%/);
    if (match)
      $<HTMLProgressElement>("build-progress").value = Number(match[1]) / 100;
    else $("build-progress").removeAttribute("value");
  }
  function paging() {
    $<HTMLInputElement>("page").value = String(page);
    $("count").textContent = "/ " + (pdf?.numPages ?? "—");
    $<HTMLButtonElement>("prev").disabled = !pdf || page <= 1;
    $<HTMLButtonElement>("next").disabled = !pdf || page >= pdf.numPages;
  }
  async function render() {
    if (!pdf || disposed) return;
    const v = ++renderVersion;
    renderTask?.cancel();
    try {
      const sheet = await pdf.getPage(page);
      if (v !== renderVersion || disposed) return;
      const scale = Math.max(
        0.2,
        Math.min(
          2.2,
          ($("pdf-scroll").clientWidth - 40) /
            sheet.getViewport({ scale: 1 }).width,
        ),
      );
      const viewport = sheet.getViewport({ scale }),
        canvas = $<HTMLCanvasElement>("pdf"),
        ratio = Math.min(devicePixelRatio, 2);
      canvas.width = viewport.width * ratio;
      canvas.height = viewport.height * ratio;
      canvas.style.width = viewport.width + "px";
      canvas.style.height = viewport.height + "px";
      canvas.hidden = false;
      $("pdf-empty").hidden = true;
      renderTask = sheet.render({
        canvas,
        viewport,
        transform: ratio === 1 ? undefined : [ratio, 0, 0, ratio, 0, 0],
      });
      await renderTask.promise;
      paging();
    } catch (e) {
      if ((e as Error).name !== "RenderingCancelledException") fail(e);
    }
  }
  async function compile() {
    if (busy) return;
    busy = true;
    cancelled = false;
    buildAbort = new AbortController();
    $<HTMLButtonElement>("back").disabled = true;
    const version = revision;
    $<HTMLButtonElement>("build").disabled = true;
    $<HTMLButtonElement>("empty-build").disabled = true;
    $("stop").hidden = false;
    $("build-error").hidden = true;
    $("error-log").hidden = true;
    progress("Loading project…");
    try {
      const all = await loadAll(buildAbort.signal);
      if (cancelled || disposed) throw Error("Build cancelled");
      const result = await compiler.compile(
        all.map((f) => ({
          ...f,
          content:
            typeof f.content === "string" ? f.content : f.content.slice(),
        })),
        main,
        engine,
        progress,
      );
      log = result.log + "\n" + result.logs.map((l) => l.stderr).join("\n");
      if (!result.success || !result.pdf) {
        builtRevision = -1;
        progress("Compilation failed", true);
        $("build-error").textContent =
          log
            .split("\n")
            .filter((l) => /^!|error:|LaTeX Error|^l\.\d+/i.test(l.trim()))
            .slice(0, 4)
            .join("\n")
            .slice(0, 600) ||
          "The compiler could not produce a PDF. Open the build log for details.";
        $("build-error").hidden = false;
        $("error-log").hidden = false;
        freshness();
        return;
      }
      progress("Rendering PDF…");
      renderVersion++;
      renderTask?.cancel();
      await pdfTask?.destroy();
      pdfBytes = result.pdf;
      pdfTask = pdfjs.getDocument({ data: result.pdf.slice() });
      pdf = await pdfTask.promise;
      page = Math.min(page, pdf.numPages);
      builtRevision = version;
      await render();
      freshness();
      $<HTMLButtonElement>("download").disabled = false;
      $<HTMLInputElement>("page").disabled = false;
      $<HTMLInputElement>("page").max = String(pdf.numPages);
      $("build-state").hidden = true;
      $("timing").textContent =
        `${result.compileSeconds.toFixed(2)}s · ${pdf.numPages} page${pdf.numPages === 1 ? "" : "s"}`;
    } catch (e) {
      if (disposed) return;
      builtRevision = -1;
      progress(cancelled ? "Build cancelled" : (e as Error).message, true);
      freshness();
    } finally {
      busy = false;
      if (disposed) return;
      $<HTMLButtonElement>("back").disabled = false;
      $<HTMLButtonElement>("build").disabled = false;
      $<HTMLButtonElement>("empty-build").disabled = false;
      $("stop").hidden = true;
      $("build-progress").hidden = true;
    }
  }
  async function importFiles(input: HTMLInputElement) {
    try {
      const chosen = [...(input.files ?? [])];
      if (!chosen.length) return;
      const root = chosen[0].webkitRelativePath.split("/")[0];
      const prefix = main.startsWith("paper/") ? "paper/" : "";
      const incoming = await Promise.all(
        chosen
          .filter(
            (f) =>
              !f.webkitRelativePath.split("/").some((p) => p.startsWith(".")) &&
              !/\.(aux|log|synctex|gz|fls|fdb_latexmk)$/i.test(f.name),
          )
          .map(async (f) => {
            if (f.size > 20 * 1024 * 1024)
              throw Error(f.name + " exceeds the 20 MB per-file limit.");
            const path = safePath.parse(
              prefix +
                (f.webkitRelativePath
                  ? f.webkitRelativePath.slice(root.length + 1)
                  : f.name),
            );
            return {
              path,
              content: textFile(path)
                ? await f.text()
                : new Uint8Array(await f.arrayBuffer()),
            };
          }),
      );
      const existing = incoming.filter((f) => allPaths().includes(f.path));
      if (existing.length) {
        const d = dialog(
          "Replace existing files?",
          `<p>${existing.map((f) => h(f.path)).join("<br>")}</p><p class="hint">Replaces your browser copies. GitHub changes only when you save.</p><button id="replace" class="primary">Replace files</button>`,
        );
        if (
          !(await new Promise<boolean>((resolve) => {
            d.addEventListener("close", () => resolve(false), { once: true });
            $("replace").onclick = () => {
              resolve(true);
              d.close();
            };
          }))
        )
          return;
      }
      for (const f of incoming) {
        files.set(f.path, f);
        dirty.add(f.path);
      }
      revision++;
      tree();
      freshness();
      const next = inferMain(incoming) || incoming[0]?.path;
      if (next) await showFile(next);
      await persist();
      updateSaveState();
      notify(
        `${incoming.length} file${incoming.length === 1 ? "" : "s"} added.`,
      );
    } finally {
      input.value = "";
    }
  }
  $("back").onclick = () => back();
  $("sync").onclick = () => void sync();
  $("refresh").onclick = $("mobile-refresh").onclick = () => void refresh().catch(fail);
  $("build").onclick = $("empty-build").onclick = () => void compile();
  $("stop").onclick = () => {
    cancelled = true;
    buildAbort?.abort();
    compiler.cancel();
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
    page = Math.max(
      1,
      Math.min(
        pdf?.numPages ?? 1,
        Number($<HTMLInputElement>("page").value) || 1,
      ),
    );
    void render();
  };
  $("download").onclick = () => {
    if (pdfBytes)
      download(
        pdfBytes,
        main
          .split("/")
          .at(-1)!
          .replace(/\.tex$/, ".pdf"),
        "application/pdf",
      );
  };
  $("log-toggle").onclick = $("error-log").onclick = () =>
    dialog("Build log", `<pre class="build-log">${h(log)}</pre>`);
  $("tags").onclick = () => {
    highlight = !highlight;
    $("tags").setAttribute("aria-pressed", String(highlight));
    editor.dispatch({});
    const errors = agentRanges(editor.state.doc.toString()).errors;
    if (errors.length) notify(errors.join(" "));
  };
  $("upload").onclick = () => $<HTMLInputElement>("file-input").click();
  $("upload-folder").onclick = () =>
    $<HTMLInputElement>("folder-input").click();
  for (const id of ["file-input", "folder-input"])
    $<HTMLInputElement>(id).onchange = () =>
      void importFiles($(id)).catch(fail);
  $("export").onclick = () =>
    void (async () => {
      await loadAll();
      download(
        zipSync(
          Object.fromEntries(
            [...files.values()].map((f) => [f.path, bytes(f)]),
          ),
          { level: 6 },
        ),
        project.name + ".zip",
        "application/zip",
      );
    })().catch(fail);
  $("new-file").onclick = () => {
    const d = dialog(
      "New file",
      `<form id="new-file-form"><label class="field">File path<input id="new-path" placeholder="paper/section.tex" required></label><button class="primary wide">Create file</button></form>`,
    );
    $("new-file-form").onsubmit = (e) => {
      e.preventDefault();
      void (async () => {
        const path = safePath.parse($<HTMLInputElement>("new-path").value);
        if (allPaths().includes(path)) throw Error("That file already exists.");
        files.set(path, {
          path,
          content: path.endsWith(".tex")
            ? "% Agents: read the root AGENTS.md. Tag every new or rewritten agent passage.\n"
            : "",
        });
        dirty.add(path);
        d.close();
        tree();
        await showFile(path);
        updateSaveState();
        await persist();
      })().catch(fail);
    };
  };
  $("settings").onclick = () => {
    const d = dialog(
      "Paper settings",
      `<form id="settings-form"><label class="field">Main document<select id="main-select">${allPaths()
        .filter((p) => p.endsWith(".tex"))
        .map((p) => `<option ${p === main ? "selected" : ""}>${h(p)}</option>`)
        .join(
          "",
        )}</select></label><label class="field">Compiler<select id="engine-select"><option value="pdf">pdfLaTeX</option><option value="lua">LuaLaTeX</option><option value="xe">XeLaTeX</option></select></label><button class="primary wide">Done</button></form>`,
    );
    $<HTMLSelectElement>("engine-select").value = engine;
    $("settings-form").onsubmit = (e) => {
      e.preventDefault();
      main = $<HTMLSelectElement>("main-select").value;
      engine = $<HTMLSelectElement>("engine-select").value as Engine;
      files.set(".agentlatex.json", {
        path: ".agentlatex.json",
        content: JSON.stringify({ version: 1, main, engine }, null, 2) + "\n",
      });
      dirty.add(".agentlatex.json");
      revision++;
      freshness();
      tree();
      updateSaveState();
      scheduleDraft();
      d.close();
    };
  };
  $("mobile-files").onclick = () => app.classList.toggle("show-files");
  $("mobile-source").onclick = () => {
    app.classList.remove("show-pdf", "show-files");
    $("mobile-source").setAttribute("aria-pressed", "true");
    $("mobile-pdf").setAttribute("aria-pressed", "false");
  };
  $("mobile-pdf").onclick = () => {
    app.classList.add("show-pdf");
    app.classList.remove("show-files");
    $("mobile-pdf").setAttribute("aria-pressed", "true");
    $("mobile-source").setAttribute("aria-pressed", "false");
    void render();
  };
  function shortcut(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      void compile();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === "s") {
      e.preventDefault();
      void sync();
    }
  }
  function beforeUnload(e: BeforeUnloadEvent) {
    if (dirty.size) {
      e.preventDefault();
      void persist();
    }
  }
  document.addEventListener("keydown", shortcut);
  window.addEventListener("beforeunload", beforeUnload);
  const resize = new ResizeObserver(() => void render());
  resize.observe($("pdf-scroll"));
  tree();
  updateSaveState();
  if (!allPaths().includes(selected))
    selected = allPaths().find((p) => p.endsWith(".tex")) ?? allPaths()[0];
  await showFile(selected);
  // Project settings travel with the source, including edits made outside the browser.
  async function readSettings() {
    if (!allPaths().includes(".agentlatex.json")) return;
    try {
      const f = await getFile(".agentlatex.json");
      const cfg = projectConfig.parse(JSON.parse(String(f.content)));
      if (allPaths().includes(cfg.main)) {
        main = cfg.main;
        engine = cfg.engine;
      }
    } catch {
      notify(
        "Could not read paper settings. Select the main document in Settings.",
      );
    }
  }
  if (!saved?.dirty.length) {
    await readSettings();
    tree();
    if (allPaths().includes(main)) await showFile(main);
  }
  return async () => {
    clearTimeout(timer);
    await persist();
    disposed = true;
    compiler.dispose();
    resize.disconnect();
    document.removeEventListener("keydown", shortcut);
    window.removeEventListener("beforeunload", beforeUnload);
    editor.destroy();
    renderVersion++;
    renderTask?.cancel();
    await pdfTask?.destroy();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    app.classList.remove("show-files", "show-pdf");
  };
}
