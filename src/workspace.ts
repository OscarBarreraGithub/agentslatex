import { EditorView, basicSetup } from "codemirror";
import { Decoration, ViewPlugin, lineNumbers, type DecorationSet } from "@codemirror/view";
import { StreamLanguage } from "@codemirror/language";
import { stex } from "@codemirror/legacy-modes/mode/stex";
import { Compartment } from "@codemirror/state";
import { folderPicker } from "./folder-picker";
import { renderMarkdown } from "./markdown";
import { parentFolder, inFolder, joinFolder, workspaceConfig, workspacePaths, fileDestination, renamedPath, missingExtension, unlinkReference } from "../shared/workspace";
import { fileContent } from "./file-content";
import { oneDark } from "@codemirror/theme-one-dark";
import { zipSync, strToU8 } from "fflate";
import type { FileInput } from "texlyre-busytex";
import { Compiler, type Engine } from "./compiler";
import { pdfjs } from "./pdf";
import { pdfCache, buildSignature, type CachedBuild } from "./cache";
import { parseSynctex, type SourceMapData } from "./synctex";
import { PaperViewer } from "./pdf-viewer";
import { api, request, RequestError, escapeHtml as h } from "./api";
import { projectDraft, cachedDraftFiles } from "./drafts";
import { conflictingPaths } from "./merge";
import { openProjectPrompts, openIssuePrompt, bindPromptCopy } from "./prompts";
import { buildFailurePrompt } from "./build-prompt";
import { AutoRefresh } from "./auto-refresh";
import { agentRanges } from "../shared/tagging";
import {
  safePath,
  type Snapshot,
  type Entry,
} from "../shared/contracts";
import { inferMain } from "./project.mjs";
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
  const key = userId + ":" + id;
  const [remote, saved, cachedBuild] = await Promise.all([
    api<Snapshot>("/projects/" + id),
    projectDraft(key).catch(() => undefined),
    pdfCache(key).catch(() => undefined),
  ]);
  let snapshot = remote,
    project = snapshot.project,
    main = project.main,
    engine: Engine = project.engine;
  let folder = parentFolder(main), references: string[] = [], builtPath = "", markdownTimer: ReturnType<typeof setTimeout> | undefined;
  const language = new Compartment();
  let selected = main,
    files = new Map<string, FileInput>(cachedDraftFiles(saved, snapshot.files).map(f => [f.path, f])),
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
  let pendingRemote = false, refreshErrorShown = false, fileLoads = 0;
  let lastActivity = Date.now();
  const pollingAbort = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  if (saved?.dirty.length) {
    snapshot = { ...snapshot, revision: saved.revision, files: saved.entries };
    files = new Map(saved.files.map((f) => [f.path, f]));
    dirty = new Set(saved.dirty);
    selected = saved.selected;
    main = saved.main;
    engine = saved.engine;
    folder = saved.folder ?? parentFolder(main);
    references = saved.references ?? [];
  }
  const compiler = new Compiler();
  let buildAbort: AbortController | undefined;
  let lastBuild: CachedBuild | undefined;
  let sourceMap: SourceMapData | undefined;
  let pdf: pdfjs.PDFDocumentProxy | undefined,
    pdfTask: ReturnType<typeof pdfjs.getDocument> | undefined,
    pdfBytes: Uint8Array | undefined,
    page = 1;
  app.innerHTML = `<header class="workspace-header"><button id="back" class="icon" aria-label="Back to projects">←</button><div class="project-title"><strong>${h(project.name)}</strong></div><div class="workspace-status"><span id="save-state" class="save-state">Synced</span><button id="settings" class="icon" aria-label="Project settings" title="Main folder and default document">⚙</button></div><div class="actions"><button id="refresh" title="Get changes from GitHub">Refresh</button><button id="sync">Save to GitHub</button><button id="build" class="primary">Compile <kbd>⌘ ↵</kbd></button><button id="stop" hidden>Stop</button></div></header>
 <div class="mobile-tabs"><button id="mobile-files">Files</button><button id="mobile-source" aria-pressed="true">Source</button><button id="mobile-pdf" aria-pressed="false">PDF</button></div>
 <main class="workspace"><aside class="file-pane"><div class="pane-bar"><span id="folder-label">Files</span><div class="actions"><button class="icon" id="new-file" title="New file" aria-label="New file">＋</button><button class="icon" id="upload" title="Upload files or a folder" aria-label="Upload" aria-haspopup="dialog">↑</button></div></div><nav id="file-tree" aria-label="Main folder files"></nav><button id="show-repo" class="quiet" aria-expanded="false">See entire repo</button><section id="repo-explorer" hidden><nav id="repo-tree" aria-label="Entire repository files"></nav></section><div class="file-bottom"><button id="mobile-refresh" class="quiet">Refresh from GitHub</button><a class="button quiet" href="${h(project.url)}/settings/access" target="_blank" rel="noopener">Collaborators ↗</a><a class="button quiet" href="${h(project.url)}" target="_blank" rel="noopener">GitHub ↗</a><button id="export" class="quiet" title="Download main-folder files, linked files and browser edits as a ZIP; excludes Git history">Download source ZIP ↓</button></div></aside>
 <section class="source-pane"><div class="pane-bar"><button id="filename" class="quiet" aria-label="Rename selected file"></button><div class="actions"><button id="file-actions" class="icon" title="File actions" aria-label="File actions" aria-haspopup="dialog">⋯</button><button id="tags" class="quiet" aria-pressed="false" title="Show tagged AI-written passages">Show AI</button></div></div><div id="editor"></div><div id="file-preview" hidden></div><div class="pane-footer"><span id="main-label"></span></div></section>
 <section class="pdf-pane"><div class="pane-bar"><span><span id="preview-title">PDF</span> <span id="freshness" class="muted">Not compiled</span></span><div class="pagination"><button id="prev" class="icon" disabled aria-label="Previous PDF page">‹</button><input id="page" type="number" min="1" value="1" aria-label="PDF page" disabled><span id="count">/ —</span><button id="next" class="icon" disabled aria-label="Next PDF page">›</button><button id="download" disabled aria-label="Download PDF" title="Download current PDF">↓ Download</button></div></div>
 <div id="build-state" class="build-state" role="status" hidden><span id="build-label"></span><progress id="build-progress" hidden></progress><p id="build-error" hidden></p><div id="build-fix" class="prompt-terminal" hidden><div class="prompt-terminal-bar"><span>Fix with your agent</span><button id="copy-build-prompt">Copy prompt for agent</button></div><details id="build-prompt-preview"><summary>View prompt</summary><textarea id="build-prompt-text" readonly spellcheck="false" aria-label="Compilation fix prompt"></textarea></details><p id="build-prompt-status" class="prompt-copy-status" role="status"></p></div><button id="error-log" hidden>Show build log</button></div><div id="extension-hint" hidden><p>Your file doesn't have an extension. It should end with <code>.tex</code> or <code>.md</code>.</p><button id="rename-missing">Rename file</button></div><article id="markdown-preview" class="markdown-preview" hidden></article><div id="pdf-region"><div id="pdf-empty"><span class="paper-glyph">Aa</span><p>Ready when you are.</p><button id="empty-build" class="primary">Compile</button></div><div id="pdf-scroll" tabindex="0" role="region" aria-label="PDF pages" hidden><div id="pdf-pages" class="pdfViewer"></div></div></div><div class="pane-footer"><span id="timing"></span><button id="log-toggle" class="quiet">Build log</button></div></section></main>
 <dialog id="editor-dialog"></dialog><input id="file-input" type="file" multiple hidden><input id="folder-input" type="file" multiple webkitdirectory hidden>`;
  const paperViewer = new PaperViewer($("pdf-scroll"), $("pdf-pages"), value => { page = value; paging(); }, fail, (page, x, y) => void reverseSync(page, x, y).catch(fail));
  let log = "No build yet.",
    cancelled = false;
  bindPromptCopy($("copy-build-prompt"), $("build-prompt-text"), $("build-prompt-status"));
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
      lineNumbers({ domEventHandlers: { click: (view, line) => {
        if (!/\.tex$/i.test(selected)) return false;
        void forwardSync(view.state.doc.lineAt(line.from).number).catch(fail);
        return true;
      } } }),
      language.of(StreamLanguage.define(stex)),
      oneDark,
      EditorView.lineWrapping,
      tagPlugin,
      EditorView.contentAttributes.of({ "aria-label": "Source editor" }),
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
        if (/\.md$/i.test(selected)) { clearTimeout(markdownTimer); markdownTimer = setTimeout(previewMarkdown, 250); }
      }),
    ],
    parent: $("editor"),
  });
  function currentSourceMap() {
    if (!lastBuild?.synctex || !pdf) { notify("Compile this document first to link the PDF and source."); return; }
    if (builtRevision !== revision) { notify("The source has changed. Compile again before jumping between source and PDF."); return; }
    sourceMap ??= parseSynctex(lastBuild.synctex, builtPath, visiblePaths());
    return sourceMap;
  }
  async function forwardSync(line: number) {
    const map = currentSourceMap(); if (!map) return;
    const match = map.forward(selected, line);
    if (!match) { notify("No PDF position for this line in the current build."); return; }
    if (matchMedia("(max-width: 760px)").matches) $("mobile-pdf").click();
    await paperViewer.reveal(match);
  }
  async function reverseSync(page: number, x: number, y: number) {
    const map = currentSourceMap(); if (!map) return;
    const match = map.reverse(page, x, y);
    if (!match || !visiblePaths().includes(match.file)) { notify("No source position at this point in the current build."); return; }
    const version = revision;
    await showFile(match.file);
    if (disposed || revision !== version) return;
    if (matchMedia("(max-width: 760px)").matches) $("mobile-source").click();
    const line = editor.state.doc.line(Math.min(editor.state.doc.lines, Math.max(1, match.line)));
    editor.dispatch({ selection: { anchor: line.from, head: line.to }, effects: EditorView.scrollIntoView(line.from, { y: "center" }) });
    editor.focus();
  }
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
      folder,
      references,
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
    updateBuildControls();
  }
  function updateBuildControls() {
    const tex = /\.tex$/i.test(selected), md = /\.md$/i.test(selected);
    for (const id of ["build", "empty-build"]) {
      const button = $<HTMLButtonElement>(id);
      button.disabled = busy || refreshing || syncing || !(tex || md) || !files.has(selected);
      button.textContent = md ? "Preview" : "Compile";
      button.title = tex ? "Compile " + selected : md ? "Preview " + selected : "Select a .tex or .md file";
    }
    $<HTMLButtonElement>("tags").disabled = !tex;
    const unavailable = busy || syncing || refreshing || !project.writable || !selected || !allPaths().includes(selected);
    $<HTMLButtonElement>("file-actions").disabled = unavailable;
    $<HTMLButtonElement>("filename").disabled = unavailable || !inFolder(selected, folder);
    $<HTMLButtonElement>("rename-missing").disabled = unavailable || !inFolder(selected, folder);
  }
  function previewMarkdown() {
    if (disposed || !/\.md$/i.test(selected)) return;
    const source = files.get(selected)?.content;
    if (typeof source === "string") $("markdown-preview").innerHTML = renderMarkdown(source);
  }
  function previewMode() {
    const md = /\.md$/i.test(selected);
    const missing = missingExtension(selected), alternate = md || missing;
    $("markdown-preview").hidden = !md;
    $("extension-hint").hidden = !missing;
    $("rename-missing").hidden = !inFolder(selected, folder);
    $("pdf-region").hidden = alternate;
    $("preview-title").textContent = md ? "Markdown" : missing ? "Preview" : "PDF";
    $("freshness").hidden = alternate;
    document.querySelector<HTMLElement>(".pagination")!.hidden = alternate;
    $("log-toggle").hidden = alternate;
    $("timing").hidden = alternate;
    if (alternate) $("build-state").hidden = true;
    if (md) previewMarkdown();
  }
  function freshness() {
    const same = builtPath === selected;
    $("freshness").textContent = !pdf ? "Not compiled" : !same
      ? "From " + builtPath.split("/").at(-1)
      : builtRevision === revision ? "Up to date" : "Earlier edit";
    $("freshness").className = pdf && same && builtRevision === revision ? "current" : "muted";
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
      .sort((a, b) => a.localeCompare(b));
  const visiblePaths = () => workspacePaths(allPaths(), folder, references);
  function tree() {
    const expanded = new Map([...app.querySelectorAll<HTMLDetailsElement>("[data-folder]")].map(d => [d.dataset.folder!, d.open]));
    type Node = { dirs: Map<string, Node>; paths: string[] };
    function draw(paths: string[], base: string, repo: boolean) {
      const root: Node = { dirs: new Map(), paths: [] };
      for (const path of paths) {
        const relative = base ? path.slice(base.length + 1) : path;
        const parts = relative.split("/"); let node = root;
        for (const name of parts.slice(0, -1)) {
          if (!node.dirs.has(name)) node.dirs.set(name, { dirs: new Map(), paths: [] });
          node = node.dirs.get(name)!;
        }
        if (!path.endsWith("/.gitkeep")) node.paths.push(path);
      }
      function renderFolder(node: Node, prefix: string, depth: number): string {
        return [...node.dirs].sort(([a], [b]) => a.localeCompare(b)).map(([name, child]) => {
          const path = prefix ? prefix + "/" + name : name, key = (repo ? "repo:" : "main:") + path;
          const open = expanded.get(key) ?? selected.startsWith(path + "/");
          return `<details data-folder="${h(key)}" ${open ? "open" : ""}><summary data-drop-folder="${repo ? "" : h(path)}" style="padding-left:${8 + depth * 10}px">${h(name)}</summary>${renderFolder(child, path, depth + 1)}</details>`;
        }).join("") + node.paths.sort((a, b) => Number(b === main) - Number(a === main) || a.localeCompare(b)).map(path => {
          const content = `<span class="file-type">${/\.tex$/i.test(path) ? "T" : "≡"}</span><span>${h(path.split("/").at(-1)!)}</span>${path === main ? '<span class="main-dot" title="Default document">•</span>' : ""}`;
          return repo ? `<div class="repo-file"><a class="file-row" style="--depth:${depth}" draggable="true" data-reference="${h(path)}" href="${h(project.url)}/blob/${encodeURIComponent(project.branch)}/${path.split("/").map(encodeURIComponent).join("/")}" target="_blank" rel="noopener noreferrer" title="Open ${h(path)} on GitHub">${content}</a>${inFolder(path, folder) ? "" : `<button class="link-file icon" data-link="${h(path)}" aria-label="Link ${h(path)} to main folder" title="Link original file">＋</button>`}</div>`
            : `<button class="file-row ${path === selected ? "selected" : ""}" style="--depth:${depth}" draggable="true" data-path="${h(path)}" title="${h(path)}" aria-current="${path === selected ? "page" : "false"}">${content}</button>`;
        }).join("");
      }
      return renderFolder(root, base, 0);
    }
    $("folder-label").textContent = folder || "Repository root";
    $("folder-label").title = "Main folder: " + (folder || "repository root");
    $("file-tree").innerHTML = draw(allPaths().filter(p => inFolder(p, folder)), folder, false) || '<p class="tree-empty">No files in this folder.</p>';
    const linked = visiblePaths().filter(p => !inFolder(p, folder));
    if (linked.length) $("file-tree").insertAdjacentHTML("beforeend", `<div class="folder-label">Linked files</div>${linked.map(p => `<button class="file-row" data-path="${h(p)}" title="Original repository file"><span>↗</span><span>${h(p)}</span></button>`).join("")}`);
    $("repo-tree").innerHTML = draw(allPaths(), "", true);
    app.querySelectorAll<HTMLButtonElement>("[data-path]").forEach(b => b.onclick = () => void showFile(b.dataset.path!).catch(fail));
    app.querySelectorAll<HTMLButtonElement>("[data-link]").forEach(b => b.onclick = () => void linkFile(b.dataset.link!).catch(fail));
    app.querySelectorAll<HTMLElement>("[draggable=true]").forEach(el => el.ondragstart = e => {
      e.dataTransfer?.setData("application/x-agentlatex-file", JSON.stringify({ path: el.dataset.path ?? el.dataset.reference, reference: !!el.dataset.reference }));
      if (e.dataTransfer) e.dataTransfer.effectAllowed = "all";
    });
    app.querySelectorAll<HTMLElement>("#file-tree [data-drop-folder]").forEach(el => dropTarget(el, el.dataset.dropFolder!));
    dropTarget($("file-tree"), folder);
    $("main-label").textContent = "Opens: " + main.split("/").at(-1) + " · " + { pdf: "pdfLaTeX", lua: "LuaLaTeX", xe: "XeLaTeX" }[engine];
  }
  function writeSettings() {
    const previous = files.get(".agentlatex.json")?.content;
    const preserved = typeof previous === "string" ? JSON.parse(previous) : {};
    files.set(".agentlatex.json", { path: ".agentlatex.json", content: JSON.stringify({ ...preserved, version: 1, folder, main, references, engine }, null, 2) + "\n" });
    dirty.add(".agentlatex.json");
  }
  function changed() { revision++; tree(); freshness(); updateSaveState(); scheduleDraft(); }
  function removeDraftFile(path: string) {
    files.delete(path);
    // Unsaved new files have no GitHub entry to delete.
    if (snapshot.files.some(f => f.path === path)) dirty.add(path);
    else dirty.delete(path);
  }
  async function linkFile(path: string) {
    if (!allPaths().includes(path) || busy || syncing || refreshing) throw Error("Try again when the project is ready.");
    if (!inFolder(path, folder) && !references.includes(path)) { references.push(path); writeSettings(); changed(); }
    await showFile(path); notify("Linked the original file. Nothing was copied.");
  }
  function clearSelection() {
    selected = ""; loadingEditor = true;
    editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: "" } });
    loadingEditor = false;
    $("editor").hidden = false; $("file-preview").hidden = true;
    $("filename").textContent = "Choose or create a file";
    tree(); updateBuildControls(); previewMode(); freshness();
  }
  async function moveFile(path: string, destination: string) {
    if (busy || refreshing || syncing) throw Error("Wait for the current operation to finish.");
    if (!inFolder(path, folder) || (destination !== folder && !inFolder(destination, folder))) throw Error("Move files within the main folder.");
    const target = fileDestination(path, destination, allPaths());
    await relocateFile(path, target);
  }
  async function relocateFile(path: string, target: string) {
    if (busy || refreshing || syncing || fileLoads || !project.writable) throw Error("Wait for the project to be ready for editing.");
    if (path === target) return;
    const before = revision;
    const file = await getFile(path);
    if (revision !== before || busy || syncing || refreshing || allPaths().includes(target)) throw Error("The project changed. Please try the move again.");
    files.set(target, { path: target, content: fileContent(target, bytes(file)) }); removeDraftFile(path);
    dirty.add(target);
    if (main === path) { main = target; writeSettings(); }
    if (selected === path) selected = target;
    changed(); await showFile(selected, true); await persist();
    notify((parentFolder(path) === parentFolder(target) ? "Renamed." : "Moved.") + " Save to GitHub to publish.");
  }
  function renameSelected() {
    const path = selected;
    if (!path || !inFolder(path, folder) || !project.writable || busy || syncing || refreshing || fileLoads) return;
    const d = dialog("Rename file", `<form id="rename-form"><label class="field">File name<input id="rename-path" value="${h(path.split("/").at(-1)!)}" required></label><p id="rename-error" class="inline-error" role="alert" hidden></p><button class="primary wide">Rename</button></form>`);
    $<HTMLInputElement>("rename-path").select();
    $("rename-form").onsubmit = e => {
      e.preventDefault();
      $("rename-error").hidden = true;
      void (async () => {
        const target = renamedPath(path, $<HTMLInputElement>("rename-path").value, allPaths());
        await relocateFile(path, target); d.close();
      })().catch(e => { $("rename-error").textContent = (e as Error).message; $("rename-error").hidden = false; });
    };
  }
  function removeSelected() {
    const path = selected, linked = !inFolder(path, folder);
    if (!path || !project.writable || busy || syncing || refreshing || fileLoads) return;
    const action = linked ? "Unlink" : "Delete";
    const d = dialog(action + " file?", `<p>${h(path)}</p><p class="hint">${linked ? "The original file stays in the repository." : "Removed from your draft. GitHub changes only when you Save to GitHub."}${path === main ? " Choose another default document in settings afterward." : ""}</p><div class="dialog-actions"><button id="cancel-remove">Cancel</button><button id="confirm-remove" class="${linked ? "" : "danger"}">${action}</button></div>`);
    $("cancel-remove").onclick = () => d.close();
    $("confirm-remove").onclick = () => void (async () => {
      if (busy || syncing || refreshing || fileLoads || !allPaths().includes(path)) throw Error("The project changed. Please try again.");
      if (linked) {
        references = unlinkReference(path, references, allPaths()); writeSettings();
      } else {
        const oldMain = main, oldReferences = JSON.stringify(references);
        removeDraftFile(path);
        references = unlinkReference(path, references, allPaths());
        if (main === path) main = visiblePaths().find(p => /\.tex$/i.test(p)) ?? joinFolder(folder, "main.tex");
        if (main !== oldMain || JSON.stringify(references) !== oldReferences) writeSettings();
      }
      selectionVersion++; d.close(); changed();
      const next = visiblePaths().includes(main) ? main : visiblePaths().find(p => !p.endsWith("/.gitkeep"));
      if (next) await showFile(next); else clearSelection();
      await persist(); notify(linked ? "Unlinked in your draft. The original file is unchanged." : "Deleted from your draft. Save to GitHub when ready.");
    })().catch(fail);
  }
  function dropTarget(el: HTMLElement, destination: string) {
    el.ondragover = e => {
      if (!e.dataTransfer?.types.includes("application/x-agentlatex-file")) return;
      e.preventDefault(); e.stopPropagation();
      e.dataTransfer.dropEffect = "move";
    };
    el.ondrop = e => {
      const raw = e.dataTransfer?.getData("application/x-agentlatex-file"); if (!raw) return;
      e.preventDefault(); e.stopPropagation();
      void (async () => {
        const value = JSON.parse(raw), path = safePath.parse(value.path);
        if (!allPaths().includes(path) || busy || syncing || refreshing) throw Error("Try again when the project is ready.");
        if (value.reference) {
          await linkFile(path);
        } else await moveFile(path, destination);
      })().catch(fail);
    };
  }

  async function fetchFile(entry: Entry, signal?: AbortSignal) {
    if (entry.size > 20 * 1024 * 1024)
      throw Error(entry.path + " exceeds the 20 MB per-file limit.");
    const r = await request(`/projects/${id}/file?sha=${entry.sha}`, { signal });
    const content = fileContent(entry.path, new Uint8Array(await r.arrayBuffer()));
    return { path: entry.path, content };
  }
  async function getFile(path: string, signal?: AbortSignal) {
    signal?.throwIfAborted();
    const cached = files.get(path);
    if (cached) return cached;
    const entry = snapshot.files.find((f) => f.path === path);
    if (!entry) throw Error("File not found: " + path);
    const f = await fetchFile(entry, signal);
    files.set(path, f);
    return f;
  }
  async function showFile(path: string, preserveView = false) {
    const v = ++selectionVersion;
    let f: FileInput;
    fileLoads++;
    try { f = await getFile(path); } finally { fileLoads--; }
    if (disposed || v !== selectionVersion) return;
    selected = path;
    editor.dispatch({ effects: language.reconfigure(/\.tex$/i.test(path) ? StreamLanguage.define(stex) : []) });
    const scrollTop = editor.scrollDOM.scrollTop;
    const cursor = editor.state.selection.main.head;
    loadingEditor = true;
    editor.dispatch({
      changes: {
        from: 0,
        to: editor.state.doc.length,
        insert: typeof f.content === "string" ? f.content : "",
      },
      ...(preserveView ? { selection: { anchor: Math.min(cursor, typeof f.content === "string" ? f.content.length : 0) } } : {}),
    });
    loadingEditor = false;
    if (preserveView) editor.scrollDOM.scrollTop = scrollTop;
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
    updateBuildControls(); previewMode(); freshness();
    scheduleDraft();
    if (!preserveView) {
      app.classList.remove("show-files", "show-pdf");
      $("mobile-source").setAttribute("aria-pressed", "true");
      $("mobile-pdf").setAttribute("aria-pressed", "false");
    }
  }
  async function loadAll(signal?: AbortSignal) {
    const paths = visiblePaths();
    for (const path of paths) await getFile(path, signal);
    return paths.map(path => files.get(path)!);
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
  function markRemote(pending: boolean) {
    pendingRemote = pending;
    $("refresh").textContent = pending ? "Updates available" : "Refresh";
    $("mobile-refresh").textContent = pending ? "Updates available · Refresh" : "Refresh from GitHub";
  }
  async function refresh(automatic = false) {
    if (syncing || refreshing || busy) return;
    refreshing = true;
    $<HTMLButtonElement>("back").disabled = true;
    updateSaveState();
    const button = $<HTMLButtonElement>("refresh");
    button.disabled = true;
    try {
      const remote = await api<Snapshot>("/projects/" + id);
      if (disposed) return;
      if (remote.revision === snapshot.revision) {
        markRemote(false);
        if (!automatic) notify("Already up to date.");
        return;
      }
      if (automatic) {
        // Prepare changed visible content before touching state. Typing, switching files,
        // opening a dialog, or starting a build while fetching postpones the update.
        const before = revision, selection = selectionVersion;
        if (dirty.size) { markRemote(true); return; }
        const prepared = new Map<string, FileInput>();
        const settings = remote.files.find(f => f.path === ".agentlatex.json");
        if (settings) {
          const cached = snapshot.files.find(f => f.path === settings.path)?.sha === settings.sha ? files.get(settings.path) : undefined;
          prepared.set(settings.path, cached ?? await fetchFile(settings, pollingAbort.signal));
        }
        let nextMain = remote.project.main, nextEngine = remote.project.engine, nextFolder = parentFolder(nextMain), nextReferences: string[] = [];
        const settingFile = prepared.get(".agentlatex.json");
        if (settingFile) {
          const cfg = workspaceConfig(JSON.parse(String(settingFile.content)), remote.project.main);
          nextMain = cfg.main; nextEngine = cfg.engine; nextFolder = cfg.folder; nextReferences = cfg.references;
        }
        const remoteVisible = workspacePaths(remote.files.map(f => f.path), nextFolder, nextReferences);
        const nextPath = remoteVisible.includes(selected) ? selected :
          remoteVisible.includes(nextMain) ? nextMain : remoteVisible[0];
        if (!nextPath) { markRemote(true); return; }
        const entry = remote.files.find(f => f.path === nextPath)!;
        const unchanged = snapshot.files.find(f => f.path === nextPath)?.sha === entry.sha && files.has(nextPath);
        if (!unchanged) prepared.set(nextPath, await fetchFile(entry, pollingAbort.signal));
        if (disposed) return;
        if (dirty.size || revision !== before || selectionVersion !== selection || fileLoads || busy || document.hidden || document.querySelector("dialog[open]")) {
          markRemote(true); return;
        }
        for (const path of files.keys())
          if (snapshot.files.find(f => f.path === path)?.sha !== remote.files.find(f => f.path === path)?.sha) files.delete(path);
        for (const [path, file] of prepared) files.set(path, file);
        snapshot = remote; project = remote.project; main = nextMain; engine = nextEngine; folder = nextFolder; references = nextReferences;
        revision++; freshness(); tree(); markRemote(false);
        // An unchanged open file keeps its exact editor state and scroll position.
        if (!unchanged) await showFile(nextPath, true);
        await persist();
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
      if (!visiblePaths().includes(selected))
        selected = visiblePaths().includes(main)
          ? main
          : (visiblePaths().find((p) => p.endsWith(".tex")) ?? visiblePaths()[0] ?? "");
      if (selected) await showFile(selected);
      else clearSelection();
      await persist();
      updateSaveState();
      markRemote(false);
      notify("Changes refreshed.");
    } finally {
      refreshing = false;
      if (!disposed) { button.disabled = false; $<HTMLButtonElement>("back").disabled = false; }
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
  async function compile() {
    if (busy || syncing || refreshing) return;
    if (/\.md$/i.test(selected)) { previewMode(); previewMarkdown(); return; }
    if (!/\.tex$/i.test(selected) || !files.has(selected)) return;
    const target = selected;
    const buildEngine = engine, baseRevision = snapshot.revision, buildHasDraft = dirty.size > 0;
    const showFixPrompt = () => {
      $<HTMLTextAreaElement>("build-prompt-text").value = buildFailurePrompt(project, target, buildEngine, baseRevision, buildHasDraft, log);
      $("build-fix").hidden = false;
      $("error-log").hidden = false;
    };
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
    $("build-fix").hidden = true;
    $<HTMLDetailsElement>("build-prompt-preview").open = false;
    $("copy-build-prompt").textContent = "Copy prompt for agent";
    $("build-prompt-status").textContent = "";
    log = "No compiler log was produced for this attempt.";
    progress("Loading project…");
    try {
      const all = await loadAll(buildAbort.signal);
      if (cancelled || disposed) throw Error("Build cancelled");
      const buildFiles = all.map(f => ({ ...f, content: typeof f.content === "string" ? f.content : f.content.slice() }));
      const signature = await buildSignature(buildFiles.map(f => f.path), snapshot.files, new Map(buildFiles.map(f => [f.path, f])), new Set(dirty), target, buildEngine);
      const result = await compiler.compile(
        buildFiles,
        target,
        buildEngine,
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
        showFixPrompt();
        freshness();
        return;
      }
      sourceMap = undefined;
      lastBuild = { pdf: result.pdf, synctex: result.synctex, signature, path: target,
        engine: buildEngine, seconds: result.compileSeconds, page, savedAt: Date.now() };
      void pdfCache(key, lastBuild).catch(() => { /* Builds are disposable; source persistence reports separately. */ });
      progress("Rendering PDF…");
      paperViewer.clear();
      await pdfTask?.destroy();
      pdfBytes = result.pdf;
      pdfTask = pdfjs.getDocument({ data: result.pdf.slice() });
      pdf = await pdfTask.promise;
      page = Math.min(page, pdf.numPages);
      builtRevision = version;
      builtPath = target;
      $("pdf-empty").hidden = true;
      $("pdf-scroll").hidden = false;
      await paperViewer.load(pdf, page);
      paging();
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
      if (!cancelled) { log = (e as Error).message + "\n\n" + log; showFixPrompt(); }
      freshness();
    } finally {
      busy = false;
      if (disposed) return;
      $<HTMLButtonElement>("back").disabled = false;
      updateBuildControls();
      $("stop").hidden = true;
      $("build-progress").hidden = true;
    }
  }
  async function importFiles(input: HTMLInputElement) {
    try {
      const chosen = [...(input.files ?? [])];
      if (!chosen.length) return;
      const root = chosen[0].webkitRelativePath.split("/")[0];
      const prefix = folder ? folder + "/" : "";
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
              content: fileContent(path, new Uint8Array(await f.arrayBuffer())),
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
  const promptsButton = document.createElement("button");
  promptsButton.id = "prompts";
  promptsButton.textContent = "Prompts";
  promptsButton.setAttribute("aria-haspopup", "dialog");
  promptsButton.onclick = () => openProjectPrompts({ ...project, main, engine }, dirty.size > 0);
  document.querySelector(".workspace-header .actions")!.prepend(promptsButton);
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
    paperViewer.goTo(page);
  };
  $("next").onclick = () => {
    page++;
    paperViewer.goTo(page);
  };
  $<HTMLInputElement>("page").onchange = () => {
    page = Math.max(
      1,
      Math.min(
        pdf?.numPages ?? 1,
        Number($<HTMLInputElement>("page").value) || 1,
      ),
    );
    paperViewer.goTo(page);
  };
  $("download").onclick = () => {
    if (pdfBytes)
      download(
        pdfBytes,
        builtPath
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
  $("upload").onclick = () => {
    const d = dialog("Upload", '<div class="upload-choices"><button id="choose-upload-files">Files…</button><button id="choose-upload-folder">Folder…</button></div>');
    for (const [button, input] of [["choose-upload-files", "file-input"], ["choose-upload-folder", "folder-input"]]) {
      $(button).onclick = () => { d.close(); $<HTMLInputElement>(input).click(); };
    }
  };
  for (const id of ["file-input", "folder-input"])
    $<HTMLInputElement>(id).onchange = () =>
      void importFiles($(id)).catch(fail);
  $("export").onclick = () =>
    void (async () => {
      const exported = await loadAll();
      for (const p of [".agentlatex.json", ...allPaths().filter(path => /^agents\.md$/i.test(path)), "CLAUDE.md", "latex-specs.md", "IMPORTS.md", "skills/agentslatex-import-conversation/SKILL.md", "skills/GitHub-setup.md"]) if (allPaths().includes(p) && !exported.some(f => f.path === p)) exported.push(await getFile(p));
      download(
        zipSync(
          Object.fromEntries(
            exported.map((f) => [f.path, bytes(f)]),
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
      `<form id="new-file-form"><label class="field">File name<input id="new-path" placeholder="section.tex" required></label><p class="hint">Added to ${h(folder || "repository root")}. Drag it into a subfolder to move it.</p><button class="primary wide">Create file</button></form>`,
    );
    $("new-file-form").onsubmit = (e) => {
      e.preventDefault();
      void (async () => {
        const name = $<HTMLInputElement>("new-path").value.trim();
        if (name.includes("/") || name.includes("\\")) throw Error("Enter a file name; move it into a folder afterward.");
        const path = joinFolder(folder, name);
        if (allPaths().includes(path)) throw Error("That file already exists.");
        files.set(path, {
          path,
          content: path.endsWith(".tex")
            ? "% Agents: read the root AGENTS.md. Wrap new or rewritten passages in % agent:begin / % agent:end comments.\n"
            : "",
        });
        dirty.add(path);
        d.close();
        revision++; freshness(); tree();
        await showFile(path);
        updateSaveState();
        await persist();
      })().catch(fail);
    };
  };
  $("show-repo").onclick = () => {
    const open = $("repo-explorer").hidden;
    $("repo-explorer").hidden = !open;
    $("show-repo").setAttribute("aria-expanded", String(open));
    $("show-repo").textContent = open ? "Hide entire repo" : "See entire repo";
  };
  function moveSelected() {
    let destination = folder;
    const d = dialog("Move file", `<p class="hint">${h(selected)}</p><div id="move-picker" class="folder-picker"></div><button id="confirm-move" class="primary wide">Move here</button>`);
    folderPicker($("move-picker"), allPaths().filter(p => inFolder(p, folder)), folder, p => { destination = p; });
    $("confirm-move").onclick = () => void moveFile(selected, destination).then(() => d.close()).catch(fail);
  }
  $("filename").onclick = $("rename-missing").onclick = renameSelected;
  $("file-actions").onclick = () => {
    const linked = !inFolder(selected, folder);
    const d = dialog("File actions", `<p class="hint">${h(selected)}</p><div class="file-action-list">${linked ? "" : '<button id="rename-file">Rename…</button><button id="move-file">Move…</button>'}<button id="remove-file" class="${linked ? "" : "danger"}">${linked ? "Unlink" : "Delete"}…</button></div>`);
    if (!linked) {
      $("rename-file").onclick = () => { d.close(); renameSelected(); };
      $("move-file").onclick = () => { d.close(); moveSelected(); };
    }
    $("remove-file").onclick = () => { d.close(); removeSelected(); };
  };
  $("settings").onclick = () => {
    let nextFolder = folder;
    const d = dialog("Project settings", `<form id="settings-form"><label class="field">Main folder</label><div id="settings-folder" class="folder-picker"></div><label class="field">Default document<select id="main-select"></select></label><label class="field">Compiler<select id="engine-select"><option value="pdf">pdfLaTeX</option><option value="lua">LuaLaTeX</option><option value="xe">XeLaTeX</option></select></label><button class="primary wide">Done</button></form><a class="button wide project-rename" href="${h(project.url)}/settings" target="_blank" rel="noopener noreferrer" title="Rename the repository on GitHub, then reopen this project">Rename project on GitHub ↗</a>`);
    function choices(preserve = false) {
      const defaultPath = joinFolder(nextFolder, "main.tex");
      $("main-select").innerHTML = `<option value="">main.tex (default)</option>` + allPaths().filter(p => inFolder(p, nextFolder) && /\.tex$/i.test(p) && p !== defaultPath).map(p => `<option value="${h(p)}">${h(nextFolder ? p.slice(nextFolder.length + 1) : p)}</option>`).join("");
      if (preserve && main !== defaultPath) $<HTMLSelectElement>("main-select").value = main;
    }
    const report = document.createElement("button");
    report.className = "button wide project-rename";
    report.textContent = "Report issue";
    report.onclick = () => { d.close(); openIssuePrompt(project, dirty.size > 0); };
    d.append(report);
    folderPicker($("settings-folder"), allPaths(), folder, p => { nextFolder = p; choices(); });
    choices(true);
    $<HTMLSelectElement>("engine-select").value = engine;
    $("settings-form").onsubmit = e => {
      e.preventDefault();
      void (async () => {
        folder = nextFolder;
        main = $<HTMLSelectElement>("main-select").value || joinFolder(folder, "main.tex");
        engine = $<HTMLSelectElement>("engine-select").value as Engine;
        writeSettings(); changed(); d.close();
        if (allPaths().includes(main)) await showFile(main);
        else { clearSelection(); notify("No main.tex in this folder yet. Create it or choose a default document in settings."); }
        await persist();
      })().catch(fail);
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
    paperViewer.fit();
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
  // Read portable settings before choosing the opening document.
  async function readSettings() {
    folder = parentFolder(project.main); main = project.main; references = []; engine = project.engine;
    if (!allPaths().includes(".agentlatex.json")) return;
    try {
      const f = await getFile(".agentlatex.json");
      const cfg = workspaceConfig(JSON.parse(String(f.content)), project.main);
      folder = cfg.folder; main = cfg.main; engine = cfg.engine; references = cfg.references;
    } catch { notify("Could not read project settings. Open the settings icon beside Synced."); }
  }
  if (!saved?.dirty.length) { await readSettings(); selected = main; }
  tree(); updateSaveState();
  if (!visiblePaths().includes(selected)) {
    if (selected) notify("The opening document was not found. Choose a file or update Project settings.");
    selected = "";
  }
  if (selected) await showFile(selected);
  else clearSelection();
  if (cachedBuild) {
    try {
      pdfBytes = cachedBuild.pdf;
      pdfTask = pdfjs.getDocument({ data: pdfBytes.slice() });
      pdf = await pdfTask.promise;
      builtPath = cachedBuild.path;
      const signature = await buildSignature(visiblePaths(), snapshot.files, files, dirty, builtPath, engine);
      builtRevision = signature === cachedBuild.signature ? revision : -1;
      lastBuild = cachedBuild;
      $("pdf-empty").hidden = true; $("pdf-scroll").hidden = false;
      page = Math.min(cachedBuild.page, pdf.numPages);
      await paperViewer.load(pdf, page);
      paging(); freshness();
      $<HTMLButtonElement>("download").disabled = false;
      $<HTMLInputElement>("page").disabled = false;
      $<HTMLInputElement>("page").max = String(pdf.numPages);
      $("timing").textContent = `${cachedBuild.seconds.toFixed(2)}s · ${pdf.numPages} pages · Saved PDF`;
    } catch {
      paperViewer.clear(); await pdfTask?.destroy(); pdfTask = undefined; pdf = undefined; pdfBytes = undefined;
      $("pdf-empty").hidden = false; $("pdf-scroll").hidden = true; freshness();
    }
  }
  const autoRefresh = new AutoRefresh({
    visible: () => !document.hidden && navigator.onLine,
    idle: () => Date.now() - lastActivity > 120_000,
    ready: () => !disposed && !syncing && !refreshing && !busy && !fileLoads && !pendingRemote && !document.querySelector("dialog[open]"),
    check: async () => {
      const response = await request(`/projects/${id}/head`, { signal: pollingAbort.signal }, false);
      const remote = await response.json() as { revision: string };
      if (disposed) return;
      if (remote.revision !== snapshot.revision) {
        if (dirty.size) markRemote(true);
        else await refresh(true);
      }
      refreshErrorShown = false;
    },
    error: (error) => {
      if (!refreshErrorShown) {
        notify("Automatic refresh paused. Your draft is safe. " + (error instanceof Error ? error.message : "Use Refresh to try again."));
        refreshErrorShown = true;
      }
      if (error instanceof RequestError && [401, 403, 404].includes(error.status)) return false;
      return error instanceof RequestError ? error.retryAfterMs : 0;
    },
  });
  const activity = () => { lastActivity = Date.now(); autoRefresh.wake(); };
  const visibility = () => autoRefresh.wake();
  document.addEventListener("pointerdown", activity);
  document.addEventListener("keydown", activity);
  document.addEventListener("visibilitychange", visibility);
  window.addEventListener("online", visibility);
  window.addEventListener("offline", visibility);
  autoRefresh.wake();
  return async () => {
    autoRefresh.stop(); pollingAbort.abort();
    document.removeEventListener("pointerdown", activity);
    document.removeEventListener("keydown", activity);
    document.removeEventListener("visibilitychange", visibility);
    window.removeEventListener("online", visibility);
    window.removeEventListener("offline", visibility);
    clearTimeout(timer); clearTimeout(markdownTimer);
    await persist();
    if (lastBuild && lastBuild.page !== page) void pdfCache(key, { ...lastBuild, page }).catch(() => {});
    disposed = true;
    compiler.dispose();
    paperViewer.dispose();
    document.removeEventListener("keydown", shortcut);
    window.removeEventListener("beforeunload", beforeUnload);
    editor.destroy();
    await pdfTask?.destroy();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    app.classList.remove("show-files", "show-pdf");
  };
}
