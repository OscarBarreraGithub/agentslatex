import MarkdownIt from "markdown-it";
const markdown = new MarkdownIt({ html: false, linkify: false, typographer: false });
// Never load remote images/tracking pixels from a manuscript preview.
markdown.renderer.rules.image = (tokens, i) => `<span class="markdown-image">[Image: ${markdown.utils.escapeHtml(tokens[i].content || "figure")}]</span>`;
const link = markdown.renderer.rules.link_open ?? ((tokens, i, options, _env, self) => self.renderToken(tokens, i, options));
markdown.renderer.rules.link_open = (tokens, i, options, env, self) => {
  const href = String(tokens[i].attrGet("href") ?? "");
  if (!/^https?:\/\//i.test(href)) tokens[i].attrSet("href", "#");
  tokens[i].attrSet("target", "_blank");
  tokens[i].attrSet("rel", "noopener noreferrer");
  return link(tokens, i, options, env, self);
};
export function renderMarkdown(source: string) {
  if (source.length > 500_000) return '<p>Markdown preview is limited to 500 KB. The full source remains editable.</p>';
  return markdown.render(source);
}
