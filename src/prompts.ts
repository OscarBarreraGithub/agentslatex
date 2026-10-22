import type { Project } from "../shared/contracts";
import { projectPrompts } from "../shared/prompts";
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
  const prompts = projectPrompts(project);
  const dialog = document.createElement("dialog");
  dialog.className = "prompts-dialog";
  dialog.setAttribute("aria-labelledby", "prompts-title");
  dialog.innerHTML = `<div class="dialog-title"><h2 id="prompts-title">Prompts</h2><button class="icon" aria-label="Close prompts" autofocus>×</button></div>
    <p class="prompt-project">${h(project.owner)}/${h(project.name)}</p>
    <p class="hint">Choose a task. Copy the prompt into your agent.</p>
    ${hasDraft ? '<p class="prompt-draft">You have a browser draft. Save to GitHub before asking an agent to edit it.</p>' : ""}
    <div class="prompt-list">${prompts.map((p) => `<details class="prompt-card"><summary>${h(p.title)}</summary><p class="prompt-destination">${h(p.destination)}</p><div class="prompt-terminal"><div class="prompt-terminal-bar"><span>Agent prompt</span><button data-copy="${p.id}" aria-label="Copy ${h(p.title)} prompt">Copy prompt</button></div><textarea readonly spellcheck="false" aria-label="${h(p.title)} prompt">${h(p.text)}</textarea><p class="prompt-copy-status" role="status" aria-live="polite"></p></div></details>`).join("")}</div>`;
  dialog.querySelector(".dialog-title button")!.addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => dialog.remove(), { once: true });
  for (const prompt of prompts) {
    const button = dialog.querySelector<HTMLButtonElement>(`[data-copy="${prompt.id}"]`)!;
    const terminal = button.closest(".prompt-terminal")!;
    const text = terminal.querySelector("textarea")!;
    const status = terminal.querySelector<HTMLElement>(".prompt-copy-status")!;
    bindPromptCopy(button, text, status);
  }
  document.body.append(dialog);
  dialog.showModal();
}
