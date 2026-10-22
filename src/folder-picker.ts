import { directories } from "../shared/workspace";
import { escapeHtml as h } from "./api";

/** A folder-only browser. Selection is separate from the default document. */
export function folderPicker(container: HTMLElement, paths: string[], initial: string, change: (folder: string) => void) {
  const dirs = new Set([...directories(paths), ...directories([initial + "/main.tex"]), initial]);
  let current = initial;
  function draw() {
    const children = [...dirs].filter(p => p && p !== current &&
      p.split("/").slice(0, -1).join("/") === current).sort();
    container.innerHTML = `<div class="folder-location"><button type="button" aria-label="Back to parent folder" ${current ? "" : "disabled"}>← Back</button><strong>${h(current || "Repository root")}</strong></div><div class="folder-choices">${children.map(p => `<button type="button" data-dir="${h(p)}">▸ ${h(p.split("/").at(-1)!)}</button>`).join("") || '<p class="muted">No subfolders</p>'}</div>`;
    container.querySelector(".folder-location button")!.addEventListener("click", () => {
      current = current.split("/").slice(0, -1).join("/"); draw(); change(current);
    });
    container.querySelectorAll<HTMLButtonElement>("[data-dir]").forEach(b => b.onclick = () => {
      current = b.dataset.dir!; draw(); change(current);
    });
  }
  draw();
}
