import { mkdir, readFile, writeFile } from "node:fs/promises";
import MarkdownIt from "markdown-it";

// Publish the canonical repo guides as static, login-free HTML and plain Markdown.
// No separate service or copied guide files in user projects.
const guides = [
  ["AGENTS", "Agent instructions", "docs/AGENT_GUIDE.md"],
  ["latex-specs", "LaTeX requirements", "latex-specs.md"],
  ["GitHub-setup", "Connect your agent", "skills/GitHub-setup.md"],
  ["import-conversation", "Import a conversation", "skills/agentslatex-import-conversation/SKILL.md"],
  ["project-reminder", "Canonical project reminder", "shared/project-reminder.json"],
];
const md = new MarkdownIt({ html: false, linkify: true });
const stylesheet = `:root{color-scheme:dark;font:17px/1.65 system-ui,sans-serif;color:#e5e4ee;background:#14141a}
*{box-sizing:border-box}body{max-width:860px;margin:0 auto;padding:28px clamp(20px,5vw,48px) 80px}
nav{display:flex;gap:24px;align-items:center;padding-bottom:34px;border-bottom:1px solid #383640;margin-bottom:40px}
a{color:#bfacff;text-underline-offset:4px}a:hover{color:#ded1ff}a:focus-visible{outline:2px solid #bfacff;outline-offset:4px}
nav a{text-decoration:none}nav a:first-child{color:#eee;font-weight:650;margin-right:auto}h1{font-size:2rem;line-height:1.2;letter-spacing:-.04em}
h2{font-size:1.2rem;margin-top:2.2em}h3{font-size:1.05rem}li{margin:.45em 0}p,li{overflow-wrap:anywhere}
pre{overflow:auto;padding:18px;background:#202028;border-radius:8px;font-size:.83rem;line-height:1.5}code{font-size:.9em;color:#ddd0ff}
table{display:block;overflow:auto;border-collapse:collapse;font-size:.9em}td,th{text-align:left;padding:8px 12px;border-bottom:1px solid #383640}
.raw{font-size:.9rem;color:#aaa6b6}footer{margin-top:48px;border-top:1px solid #383640;padding-top:20px;font-size:.85rem}
@media(max-width:480px){nav{gap:16px}h1{font-size:1.7rem}body{padding-top:20px}}`;
function page(title, content) {
  return `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} — agent latex</title><link rel="icon" type="image/png" sizes="192x192" href="/alien-icon.png"><link rel="stylesheet" href="/docs/style.css"></head><body><nav aria-label="Navigation"><a href="/">AgentsLaTeX</a><a href="/docs/">Docs</a><a href="https://github.com/OscarBarreraGithub/agentslatex">Source</a></nav><main>${content}</main><footer>Shared instructions stay here. Your paper and preferences stay in your repository.</footer></body></html>`;
}
await mkdir("public/docs", { recursive: true });
await writeFile("public/docs/style.css", stylesheet);
for (const [slug, title, source] of guides) {
  const raw = await readFile(source, "utf8");
  const text = (source.endsWith(".json") ? JSON.parse(raw).join("\n") : raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "")).trim() + "\n";
  await writeFile(`public/docs/${slug}.md`, text);
  await writeFile(`public/docs/${slug}.html`, page(title, `<p class="raw"><a href="/docs/${slug}.md">Plain Markdown for agents</a></p>` + md.render(slug === "project-reminder" ? "```markdown\n" + text + "```" : text)));
}
await writeFile("public/docs/index.html", page("Documentation", `<h1>Work with your agent</h1><p>Read the current instructions here. No sign-in required.</p><ul>${guides.map(([slug, title]) => `<li><a href="/docs/${slug}">${title}</a> · <a class="raw" href="/docs/${slug}.md">Markdown</a></li>`).join("")}</ul><p>Start with Agent instructions and LaTeX requirements. The other guides cover setup and imports when needed.</p>`));
