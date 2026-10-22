import type { Project } from "../shared/contracts";
import { projectPrompts, reportIssuePrompt, type ProjectPrompt } from "../shared/prompts";
import { escapeHtml as h } from "./api";

export function bindPromptCopy(button: HTMLButtonElement, text: HTMLTextAreaElement, status: HTMLElement) {
  button.onclick = async () => {
    try {
      await navigator.clipboard.writeText(text.value);
      button.textContent = "Copied";
      status.textContent = "Paste it into your agent’s chat.";
    } catch {
      const details = text.closest("details");
      if (details) details.open = true;
      text.focus(); text.select();
      status.textContent = "Automatic copy is unavailable. The prompt is selected; use Copy from your browser or keyboard.";
    }
  };
}

export function openProjectPrompts(project: Project, hasDraft: boolean) {
  openPromptDialog(projectPrompts(project), "Prompts", hasDraft);
}
export function openIssuePrompt(project: Project, hasDraft: boolean) {
  openPromptDialog([reportIssuePrompt(project)], "Report issue", hasDraft);
}
function openPromptDialog(prompts: ProjectPrompt[], title: string, hasDraft: boolean) {
  const dialog = document.createElement("dialog");
  dialog.className = "prompts-dialog";
  dialog.setAttribute("aria-labelledby", "prompts-title");
  dialog.innerHTML = `<div class="dialog-title"><h2 id="prompts-title">${h(title)}</h2><button class="icon" aria-label="Close prompts" autofocus>×</button></div>
    ${prompts.length > 1 ? `<div class="prompt-tasks" role="group" aria-label="Prompt task">${prompts.map((p) => `<button class="quiet" data-task="${p.id}" aria-pressed="false">${h(p.title)}</button>`).join("")}</div>` : ""}
    ${hasDraft ? '<p class="prompt-draft">Save your draft to GitHub before asking an agent to edit.</p>' : ""}
    <div class="prompt-footer"><p class="prompt-destination"></p><button class="prompt-copy">Copy prompt</button></div>
    <details class="prompt-preview"><summary>Read prompt</summary><textarea class="prompt-text" readonly spellcheck="false"></textarea></details>
    <p class="prompt-copy-status" role="status" aria-live="polite"></p>`;
  dialog.querySelector(".dialog-title button")!.addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => dialog.remove(), { once: true });
  const text = dialog.querySelector<HTMLTextAreaElement>(".prompt-text")!;
  const copy = dialog.querySelector<HTMLButtonElement>(".prompt-copy")!;
  const status = dialog.querySelector<HTMLElement>(".prompt-copy-status")!;
  const tasks = [...dialog.querySelectorAll<HTMLButtonElement>("[data-task]")];
  const select = (prompt: typeof prompts[number]) => {
    tasks.forEach(button => button.setAttribute("aria-pressed", String(button.dataset.task === prompt.id)));
    text.value = prompt.text;
    text.scrollTop = 0;
    text.setAttribute("aria-label", `${prompt.title} prompt`);
    dialog.querySelector(".prompt-destination")!.textContent = prompt.destination;
    copy.textContent = "Copy prompt";
    copy.setAttribute("aria-label", `Copy ${prompt.title} prompt`);
    status.textContent = "";
  };
  for (const prompt of prompts) {
    const button = tasks.find(button => button.dataset.task === prompt.id);
    if (button) button.onclick = () => select(prompt);
  }
  select(prompts[0]);
  bindPromptCopy(copy, text, status);
  document.body.append(dialog);
  dialog.showModal();
}
