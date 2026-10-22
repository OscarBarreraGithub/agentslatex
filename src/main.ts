import { projectListCache, clearProjectList } from "./cache";
import { api, escapeHtml as h, RequestError } from "./api";
import type { Me, Project, Repo, Entry } from "../shared/contracts";
import { newProject as newProjectInput, normalizeProjectName } from "../shared/contracts";
import "./style.css";
import { wordmark } from "./brand";
import { folderPicker } from "./folder-picker";
import { inFolder, joinFolder, defaultMainFolder } from "../shared/workspace";
const app = document.querySelector<HTMLDivElement>("#app")!;
const $ = <T extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id) as T;
let me: Me;
let cachedProjects: Project[] | undefined;
let dispose: undefined | (() => Promise<void>);
const mark = wordmark;
export function toast(message: string) {
  let n = document.getElementById("toast");
  if (!n) {
    n = document.createElement("div");
    n.id = "toast";
    n.setAttribute("role", "alert");
    document.body.append(n);
  }
  n.textContent = message;
  n.hidden = false;
  setTimeout(() => {
    n.hidden = true;
  }, 9000);
}
function failure(e: unknown) {
  toast(e instanceof Error ? e.message : String(e));
}
function shell() {
  app.innerHTML = `<header class="home-header"><a class="brand" href="/">${mark}</a><div class="account"><span>${h(me.user.login)}</span><button id="logout" class="quiet">Sign out</button></div></header><main id="home" class="home"></main><dialog id="modal"></dialog>`;
  $("logout").onclick = () =>
    void (async () => {
      await dispose?.();
      dispose = undefined;
      await api("/auth/logout", {});
      clearProjectList(me.user.id);
      cachedProjects = undefined;
      location.href = "/?signedout=1";
    })().catch(failure);
}
function modal(title: string, content: string) {
  const d = $<HTMLDialogElement>("modal");
  d.innerHTML = `<div class="dialog-title"><h2>${h(title)}</h2><button id="dismiss" class="icon" aria-label="Close">×</button></div>${content}<p id="form-error" class="error" role="alert"></p>`;
  $("dismiss").onclick = () => d.close();
  d.showModal();
  return d;
}
async function projects() {
  await dispose?.();
  dispose = undefined;
  history.replaceState(null, "", "/");
  shell();
  $("home").innerHTML =
    `<div class="page-heading"><h1>Your projects</h1><div class="actions"><button id="connect-existing">Connect existing</button><button id="new" class="primary">＋ New project</button></div></div><div id="project-list" class="project-list"><p class="muted">Loading projects…</p></div>`;
  $("new").onclick = () => newProject();
  $("connect-existing").onclick = () => void existing().catch(failure);
  const list = $("project-list");
  function draw(items: Project[]) {
  list.innerHTML = items.length
    ? items
        .slice().sort((a, b) => (Date.parse(b.updatedAt ?? "") || 0) - (Date.parse(a.updatedAt ?? "") || 0))
        .map(
          (p) =>
            `<button class="project-card" data-project="${p.id}"><span class="project-info"><strong>${h(p.name)}</strong><small>${h(p.owner)} / ${h(p.branch)}</small></span><span class="project-updated" title="Last saved update on GitHub">${p.updatedAt && Number.isFinite(Date.parse(p.updatedAt)) ? `Updated ${h(new Date(p.updatedAt).toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }))}` : ""}</span><span class="arrow" aria-hidden="true">→</span></button>`,
        )
        .join("")
    : `<div class="empty-projects"><span class="empty-symbol">＋</span><h2>A place for your next paper.</h2><button class="primary" id="first-project">Create a project</button></div>`;
  list
    .querySelectorAll<HTMLButtonElement>("[data-project]")
    .forEach(
      (b) =>
        (b.onclick = () =>
          void openProject(Number(b.dataset.project)).catch(failure)),
    );
  if ($("first-project")) $("first-project").onclick = () => newProject();
  }
  cachedProjects ??= projectListCache(me.user.id);
  if (cachedProjects) draw(cachedProjects);
  const items = await api<Project[]>("/projects");
  if (!list.isConnected) return;
  cachedProjects = items;
  projectListCache(me.user.id, items);
  draw(items);
}
function newProject() {
  if (me.installations === 0) {
    installation();
    return;
  }
  const d = modal(
    "New project",
    `<form id="create-form" novalidate><label class="field">Project name<input id="project-name" required maxlength="80" placeholder="my-paper" autocomplete="off" aria-describedby="form-error"></label><p class="hint">A private repository in your GitHub account.</p><button class="primary wide" id="create" type="submit">Create project</button></form>`,
  );
  const requestId = crypto.randomUUID();
  const nameInput = $<HTMLInputElement>("project-name");
  nameInput.focus();
  nameInput.oninput = () => { $("form-error").textContent = ""; nameInput.removeAttribute("aria-invalid"); };
  nameInput.onchange = () => { nameInput.value = normalizeProjectName(nameInput.value); };
  $("create-form").onsubmit = (e) => {
    e.preventDefault();
    const button = $<HTMLButtonElement>("create");
    if (button.disabled) return;
    const input = newProjectInput.safeParse({ name: nameInput.value, requestId });
    if (!input.success) {
      $("form-error").textContent = input.error.issues[0].message;
      nameInput.setAttribute("aria-invalid", "true"); nameInput.focus();
      return;
    }
    nameInput.value = input.data.name;
    void (async () => {
      button.disabled = true;
      button.setAttribute("aria-busy", "true");
      button.innerHTML = '<span class="spinner" aria-hidden="true"></span><span role="status">Creating…</span>';
      nameInput.readOnly = true;
      $("form-error").textContent = "";
      try {
        if (me.installations === undefined) me.installations = (await api<{installations: number}>("/installation-status")).installations;
        if (!me.installations) { d.close(); installation(); return; }
        const p = await api<Project>("/projects", input.data);
        d.close();
        await openProject(p.id);
      } catch (e) {
        $("form-error").textContent = (e as Error).message;
        button.disabled = false;
        button.removeAttribute("aria-busy");
        button.textContent = "Try again";
        nameInput.readOnly = false;
      }
    })();
  };
}
function installation() {
  modal(
    "Connect your repositories",
    `<p class="hint">Choose which repositories AgentsLaTeX can open. New projects are private.</p><a class="button primary wide" href="${h(me.installUrl)}">Continue on GitHub ↗</a>`,
  );
}
async function existing() {
  const d = modal(
    "Connect an existing project",
    `<div id="repos" class="repo-list">Loading repositories…</div><a class="button quiet wide" href="${h(me.installUrl)}">Choose repositories on GitHub ↗</a>`,
  );
  const list = $("repos");
  const [repos, connected] = await Promise.all([api<Repo[]>("/repositories"), api<Project[]>("/projects")]);
  if (!d.open || !list.isConnected) return d;
  const linked = new Set(connected.map(p => p.id));
  const available = repos.filter(repo => !linked.has(repo.id));
  list.innerHTML = (available.length
    ? available
        .map(
          (r) =>
            `<button class="repo-row" data-repo="${r.id}"><span>${h(r.full_name)}</span><span>＋</span></button>`,
        )
        .join("")
    : `<p class="hint">${repos.length ? "All available repositories are already connected." : "Choose repositories on GitHub to make them available here."}</p>`)
    + (connected.length ? `<details class="connected-projects"><summary>Already connected <span>${connected.length}</span></summary>${connected.map(p => `<button class="repo-row" data-connected="${p.id}"><span>${h(p.owner)}/${h(p.name)}</span><span aria-hidden="true">→</span></button>`).join("")}</details>` : "");
  list.querySelectorAll<HTMLButtonElement>("[data-connected]").forEach(button => {
    button.onclick = () => { d.close(); void openProject(Number(button.dataset.connected)).catch(failure); };
  });
  list.querySelectorAll<HTMLButtonElement>("[data-repo]").forEach(
    (b) =>
      (b.onclick = () =>
        void (async () => {
          b.disabled = true;
          try {
            const id = Number(b.dataset.repo);
            const tree = await api<{ files: Entry[] }>(
              "/repositories/" + id + "/files",
            );
            let folder = defaultMainFolder;
            const dialog = modal(
              "Choose your main folder",
              `<form id="connect-form"><div id="connect-folder" class="folder-picker"></div><label class="field">Default document<select id="connect-main"></select></label><p class="hint">Choose your paper folder, or start in agentlatex/main. Existing files stay in place.</p><button class="primary wide" id="connect-submit">Connect project</button></form>`,
            );
            const fillDocuments = () => {
              const preferred = joinFolder(folder, "main.tex");
              $("connect-main").innerHTML = `<option value="">main.tex (default)</option>` + tree.files
                .filter(f => inFolder(f.path, folder) && /\.tex$/i.test(f.path) && f.path !== preferred)
                .map(f => `<option value="${h(f.path)}">${h(folder ? f.path.slice(folder.length + 1) : f.path)}</option>`).join("");
            };
            folderPicker($("connect-folder"), tree.files.map(f => f.path), folder, value => { folder = value; fillDocuments(); });
            fillDocuments();
            $("connect-form").onsubmit = (e) => {
              e.preventDefault();
              void (async () => {
                const btn = $<HTMLButtonElement>("connect-submit");
                btn.disabled = true;
                btn.textContent = "Connecting…";
                try {
                  const p = await api<Project>("/connect", {
                    repositoryId: id,
                    folder,
                    main: $<HTMLSelectElement>("connect-main").value || undefined,
                  });
                  dialog.close();
                  await openProject(p.id);
                } catch (e) {
                  $("form-error").textContent = (e as Error).message;
                  btn.disabled = false;
                  btn.textContent = "Try again";
                }
              })();
            };
          } catch (e) {
            $("form-error").textContent = (e as Error).message;
            b.disabled = false;
          }
        })()),
  );
  return d;
}
async function openProject(id: number) {
  await dispose?.();
  dispose = undefined;
  history.replaceState(null, "", `/?project=${id}`);
  app.innerHTML =
    '<div class="loading-screen" role="status"><span class="spinner" aria-hidden="true"></span><span>Opening paper…</span></div>';
  try {
    const { mountEditor } = await import("./workspace");
    dispose = await mountEditor(
      app,
      id,
      me.user.id,
      () => void projects().catch(failure),
      toast,
    );
  } catch (e) {
    app.innerHTML = `<div class="loading-screen"><p>${h((e as Error).message)}</p><a class="button primary" href="/?project=${id}">Reload project</a><a class="button" href="/">Back to projects</a></div>`;
  }
}
async function start() {
  app.innerHTML = `<div class="landing"><div class="landing-main"><div class="hero-wordmark">${wordmark}</div><h1>Write with agents, revise with confidence.</h1><p>Compile, version control, and collaborate. All in your browser.</p><a class="button primary connect-button" href="/api/auth/login"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M12 .7a11.5 11.5 0 0 0-3.6 22.4c.6.1.8-.2.8-.6v-2.1c-3.3.7-4-1.4-4-1.4-.5-1.3-1.3-1.6-1.3-1.6-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.4-1.3-5.4-5.8 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11.2 11.2 0 0 1 5.8 0c2.2-1.5 3.2-1.2 3.2-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.5-2.8 5.5-5.4 5.8.4.4.8 1.1.8 2.2v3c0 .4.2.7.8.6A11.5 11.5 0 0 0 12 .7Z"/></svg>Connect to GitHub</a></div><footer><a href="https://github.com/OscarBarreraGithub/agentslatex" target="_blank" rel="noopener noreferrer">Source</a></footer></div>`;
  if (new URLSearchParams(location.search).get("signin") === "retry")
    toast(
      "Sign-in did not finish. Please connect to GitHub again. Your drafts are safe.",
    );
  if (new URLSearchParams(location.search).has("signedout")) {
    const note = document.createElement("p");
    note.className = "signin-note";
    note.setAttribute("role", "status");
    note.textContent = "Signed out. Connect again to choose a GitHub account.";
    document.querySelector(".connect-button")!.after(note);
  }
  try {
    me = await api<Me>("/me");
    const params = new URLSearchParams(location.search);
    const id = Number(params.get("project"));
    if (id > 0) await openProject(id);
    else await projects();
  } catch (e) {
    if (!(e instanceof RequestError && e.status === 401)) failure(e);
  }
}
void start();
