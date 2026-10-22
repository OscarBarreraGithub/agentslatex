import { api, escapeHtml as h, RequestError } from "./api";
import type { Me, Project, Repo, Entry } from "../shared/contracts";
import "./style.css";
const app = document.querySelector<HTMLDivElement>("#app")!;
const $ = <T extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id) as T;
let me: Me;
let dispose: undefined | (() => Promise<void>);
const mark = '<span class="mark" aria-hidden="true">a<span>λ</span></span>';
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
  app.innerHTML = `<header class="home-header"><a class="brand" href="/">${mark}<span>agentslatex</span></a><div class="account"><span>${h(me.user.login)}</span><button id="logout" class="quiet">Sign out</button></div></header><main id="home" class="home"></main><dialog id="modal"></dialog>`;
  $("logout").onclick = () =>
    void (async () => {
      await dispose?.();
      dispose = undefined;
      await api("/auth/logout", {});
      location.href = "/";
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
  const items = await api<Project[]>("/projects");
  $("project-list").innerHTML = items.length
    ? items
        .map(
          (p) =>
            `<button class="project-card" data-project="${p.id}"><span class="document-icon">≡</span><span><strong>${h(p.name)}</strong><small>${h(p.owner)} / ${h(p.branch)}</small></span><span class="arrow">↗</span></button>`,
        )
        .join("")
    : `<div class="empty-projects"><span class="empty-symbol">＋</span><h2>A place for your next paper.</h2><button class="primary" id="first-project">Create a project</button></div>`;
  document
    .querySelectorAll<HTMLButtonElement>("[data-project]")
    .forEach(
      (b) =>
        (b.onclick = () =>
          void openProject(Number(b.dataset.project)).catch(failure)),
    );
  if ($("first-project")) $("first-project").onclick = () => newProject();
}
function newProject() {
  if (me.installations === 0) {
    installation();
    return;
  }
  const d = modal(
    "New project",
    `<form id="create-form"><label class="field">Project name<input id="project-name" required maxlength="80" placeholder="my-paper" autocomplete="off" pattern="[A-Za-z0-9_][A-Za-z0-9_.-]*"></label><p class="hint">A private repository in your GitHub account.</p><button class="primary wide" id="create" type="submit">Create project</button></form>`,
  );
  const requestId = crypto.randomUUID();
  $<HTMLInputElement>("project-name").focus();
  $("create-form").onsubmit = (e) => {
    e.preventDefault();
    void (async () => {
      const button = $<HTMLButtonElement>("create");
      button.disabled = true;
      button.textContent = "Creating…";
      try {
        const p = await api<Project>("/projects", {
          name: $<HTMLInputElement>("project-name").value.trim(),
          requestId,
        });
        d.close();
        await openProject(p.id);
      } catch (e) {
        $("form-error").textContent = (e as Error).message;
        button.disabled = false;
        button.textContent = "Try again";
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
    "Connect an existing paper",
    `<div id="repos" class="repo-list">Loading repositories…</div><a class="button quiet wide" href="${h(me.installUrl)}">Choose repositories on GitHub ↗</a>`,
  );
  const repos = await api<Repo[]>("/repositories");
  $("repos").innerHTML = repos.length
    ? repos
        .map(
          (r) =>
            `<button class="repo-row" data-repo="${r.id}"><span>${h(r.full_name)}</span><span>＋</span></button>`,
        )
        .join("")
    : '<p class="hint">Choose repositories on GitHub to make them available here.</p>';
  document.querySelectorAll<HTMLButtonElement>("[data-repo]").forEach(
    (b) =>
      (b.onclick = () =>
        void (async () => {
          b.disabled = true;
          try {
            const id = Number(b.dataset.repo);
            const tree = await api<{ files: Entry[] }>(
              "/repositories/" + id + "/files",
            );
            const tex = tree.files.filter((f) => f.path.endsWith(".tex"));
            if (!tex.length)
              throw Error(
                "This repository has no .tex file yet. Add your paper in GitHub, then connect it.",
              );
            const preferred =
              tex.find((f) => f.path === "paper/main.tex") ??
              tex.find((f) => f.path === "main.tex") ??
              tex[0];
            const dialog = modal(
              "Choose the main document",
              `<form id="connect-form"><label class="field">Main .tex file<select id="connect-main">${tex.map((f) => `<option ${f.path === preferred.path ? "selected" : ""}>${h(f.path)}</option>`).join("")}</select></label><p class="hint">Keeps your files in place and adds agent instructions.</p><button class="primary wide" id="connect-submit">Connect project</button></form>`,
            );
            $("connect-form").onsubmit = (e) => {
              e.preventDefault();
              void (async () => {
                const btn = $<HTMLButtonElement>("connect-submit");
                btn.disabled = true;
                btn.textContent = "Connecting…";
                try {
                  const p = await api<Project>("/connect", {
                    repositoryId: id,
                    main: $<HTMLSelectElement>("connect-main").value,
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
    '<div class="loading-screen"><span class="spinner"></span><span>Opening paper…</span></div>';
  const { mountEditor } = await import("./workspace");
  try {
    dispose = await mountEditor(
      app,
      id,
      me.user.id,
      () => void projects().catch(failure),
      toast,
    );
  } catch (e) {
    app.innerHTML = `<div class="loading-screen"><p>${h((e as Error).message)}</p><a class="button primary" href="/">Back to projects</a></div>`;
  }
}
async function start() {
  app.innerHTML = `<div class="landing"><a class="brand" href="/">${mark}<span>agentslatex</span></a><div class="landing-main"><div class="hero-mark">a<span>λ</span></div><h1>Your next paper.</h1><p>LaTeX, together.</p><a class="button primary connect-button" href="/api/auth/login"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M12 .7a11.5 11.5 0 0 0-3.6 22.4c.6.1.8-.2.8-.6v-2.1c-3.3.7-4-1.4-4-1.4-.5-1.3-1.3-1.6-1.3-1.6-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.4-1.3-5.4-5.8 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11.2 11.2 0 0 1 5.8 0c2.2-1.5 3.2-1.2 3.2-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.5-2.8 5.5-5.4 5.8.4.4.8 1.1.8 2.2v3c0 .4.2.7.8.6A11.5 11.5 0 0 0 12 .7Z"/></svg>Connect to GitHub</a></div><footer>Built around your files. Compiled in your browser. <a href="/source.zip">Source</a></footer></div>`;
  if (new URLSearchParams(location.search).get("signin") === "retry")
    toast(
      "Sign-in did not finish. Please connect to GitHub again. Your drafts are safe.",
    );
  try {
    me = await api<Me>("/me");
    const params = new URLSearchParams(location.search);
    const id = Number(params.get("project"));
    if (id > 0) await openProject(id);
    else {
      await projects();
      if (
        params.has("welcome") &&
        !localStorage.getItem("agentslatex-onboarded:" + me.user.id)
      ) {
        localStorage.setItem("agentslatex-onboarded:" + me.user.id, "1");
        modal(
          "Have a paper already?",
          `<div class="onboard-actions"><button id="bring" class="primary">Connect existing</button><button id="fresh">Start fresh</button></div>`,
        );
        $("bring").onclick = () => {
          $<HTMLDialogElement>("modal").close();
          void existing().catch(failure);
        };
        $("fresh").onclick = () => $<HTMLDialogElement>("modal").close();
      }
    }
  } catch (e) {
    if (!(e instanceof RequestError && e.status === 401)) failure(e);
  }
}
void start();
