import { Compiler, type Engine, type Bundle } from "./compiler";
import { inspectPdf } from "./pdf";
import { isTextFile } from "./project.mjs";
import { zipSync, strToU8 } from "fflate";
import type { FileInput } from "texlyre-busytex";
import "./style.css";
type Case = {
  id: string;
  label: string;
  files: string[];
  engine: Engine;
  expect: "pass" | "fail" | "timeout";
  pages: number;
  contains?: string;
  timeoutMs?: number;
  group?: string;
  reason?: string;
  noBibliography?: boolean;
  resolvedReferences?: boolean;
};
const root = document.querySelector<HTMLElement>("#tests")!;
root.innerHTML = `<div class="test-page"><a href="/">← Editor</a><h1>Compiler checks</h1><p>Real browser builds. Success requires PDF page/text checks; expected failures must fail. Times separate package loading from compilation. No AI calls.</p><div class="test-controls"><label>Bundle <select id="bundle"><option value="extra">Complete authoring bundle</option><option value="recommended">Smaller recommended bundle (probe)</option></select></label><label>Cases <select id="scope"><option value="all">All fixtures</option><option value="core">Core and failure/retry</option><option value="stress">Large files / 200 pages</option><option value="tikz">TikZ and plots</option></select></label><button id="run" class="primary">Run checks</button><button id="stop" disabled>Stop</button><button id="download-results" disabled>Download evidence</button></div><p id="state" role="status">Ready</p><p id="heartbeat">UI heartbeat</p><table><thead><tr><th>Case</th><th>Result</th><th>Compile</th><th>Load</th><th>Pages / PDF</th><th>UI delay</th></tr></thead><tbody id="rows"></tbody></table><pre id="details"></pre></div>`;
const css = document.createElement("style");
css.textContent =
  ".test-page{max-width:1200px;margin:40px auto;padding:0 24px}.test-page p{line-height:1.6;color:#aab7c7}.test-page a{color:#c3d5e9}.test-controls{display:flex;flex-wrap:wrap;gap:12px;align-items:center}table{width:100%;border-collapse:collapse;margin-top:24px}td,th{text-align:left;padding:12px;border-bottom:1px solid #343c48;font-size:13px}.pass{color:#b5d3a9}.fail{color:#f0b1a2}td a{color:#c3d5e9}";
document.head.append(css);
const $ = <T extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id) as T;
let active: Compiler | undefined,
  stopping = false,
  tick = 0,
  last = performance.now(),
  maxLag = 0,
  backgrounded = false;
addEventListener("visibilitychange", () => {
  last = performance.now();
  if (document.hidden) backgrounded = true;
});
setInterval(() => {
  const now = performance.now();
  if (!document.hidden) maxLag = Math.max(maxLag, now - last - 100);
  last = now;
  $("heartbeat").textContent = "UI heartbeat " + ++tick;
}, 100);
const evidence: Record<string, Uint8Array> = {};
let run = "",
  saveFailed = false;
async function save(name: string, bytes: Uint8Array | string) {
  const value = typeof bytes === "string" ? strToU8(bytes) : bytes;
  evidence[name] = value;
  try {
    const response = await fetch(`/__test-results/${run}/${name}`, {
      method: "POST",
      body: value.slice().buffer as ArrayBuffer,
      headers: { "Content-Type": "application/octet-stream" },
    });
    if (!response.ok) throw Error("Not saved");
  } catch {
    saveFailed = true; /* Static previews retain downloadable evidence in memory. */
  }
}
$("stop").onclick = () => {
  stopping = true;
  active?.cancel();
};
$("download-results").onclick = () => {
  const url = URL.createObjectURL(
    new Blob([zipSync(evidence, { level: 0 }).buffer as ArrayBuffer], {
      type: "application/zip",
    }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = run + ".zip";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
};
$("run").onclick = async () => {
  $<HTMLButtonElement>("run").disabled = true;
  $<HTMLButtonElement>("stop").disabled = false;
  stopping = false;
  saveFailed = false;
  $("rows").replaceChildren();
  for (const key of Object.keys(evidence)) delete evidence[key];
  const bundle = $<HTMLSelectElement>("bundle").value as Bundle,
    scope = $<HTMLSelectElement>("scope").value;
  run = new Date().toISOString().replace(/[:.]/g, "-") + "-" + bundle;
  const all: Case[] = await (await fetch("/fixtures/manifest.json")).json();
  const cases = all.filter(
    (c) =>
      scope === "all" ||
      (scope === "core" && c.group !== "stress") ||
      (scope === "stress" && c.group === "stress") ||
      (scope === "tikz" &&
        [
          "demo",
          "tikz",
          "flowchart",
          "pgfplots-2d",
          "pgfplots-3d",
          "circuits",
          "feynman-manual",
          "lua-graph",
        ].includes(c.id)),
  );
  const compiler = (active = new Compiler(bundle)),
    results: Record<string, unknown>[] = [],
    start = performance.now();
  try {
    for (const fixture of cases) {
      if (stopping) break;
      $("state").textContent = "Reading " + fixture.label;
      const inputs: FileInput[] = await Promise.all(
        fixture.files.map(async (path) => {
          const response = await fetch("/fixtures/" + fixture.id + "/" + path);
          if (!response.ok) throw Error("Missing fixture " + path);
          return {
            path,
            content: isTextFile(path)
              ? await response.text()
              : new Uint8Array(await response.arrayBuffer()),
          };
        }),
      );
      maxLag = 0;
      backgrounded = document.hidden;
      let phase = "compile";
      const started = performance.now();
      let row: Record<string, unknown>;
      try {
        const result = await compiler.compile(
          inputs,
          "main.tex",
          fixture.engine,
          (s) => ($("state").textContent = fixture.label + " · " + s),
          fixture.timeoutMs,
        );
        phase = "pdf-validation";
        const info =
          result.success && result.pdf
            ? await inspectPdf(result.pdf)
            : undefined;
        const lastTexLog = result.logs.filter(l => /^(pdf|xe|lua)/.test(l.cmd)).at(-1)?.log ?? "";
        const bibliographyCorrect = !fixture.noBibliography || !result.logs.some(l => /^(bibtex|biber)/.test(l.cmd));
        const referencesResolved = !fixture.resolvedReferences || (!!lastTexLog && !/Citation[^\n]*undefined|There were undefined references/.test(lastTexLog));
        const pass = bibliographyCorrect && referencesResolved && (
          fixture.expect === "pass"
            ? !!result.success &&
              info?.pages === fixture.pages &&
              (!fixture.contains || info.text.includes(fixture.contains))
            : fixture.expect === "fail" && !result.success);
        row = {
          id: fixture.id,
          label: fixture.label,
          expected: fixture.expect,
          pass,
          compiled: result.success,
          engine: fixture.engine,
          loadSeconds: result.loadSeconds,
          compileSeconds: result.compileSeconds,
          elapsedSeconds: (performance.now() - started) / 1000,
          pages: info?.pages,
          pdfBytes: result.pdf?.length ?? 0,
          synctexBytes: result.synctex?.length ?? 0,
          maxUiDelayMs: backgrounded ? null : Math.round(maxLag),
          text: info?.text,
          warnings: result.log
            .split("\n")
            .filter((l) => /Warning:|Overfull \\/.test(l)),
          reason: fixture.reason,
          bibliographyCorrect,
          referencesResolved,
          commands: result.logs.map(l => l.cmd),
        };
        await save(
          fixture.id + ".log",
          result.log + "\n" + JSON.stringify(result.logs, null, 2),
        );
        if (result.pdf) await save(fixture.id + ".pdf", result.pdf);
        if (result.synctex) await save(fixture.id + ".gz", result.synctex);
      } catch (e) {
        const message = (e as Error).message;
        row = {
          id: fixture.id,
          label: fixture.label,
          expected: fixture.expect,
          pass:
            fixture.expect === "timeout" && message.includes("stopped after"),
          error: message,
          phase,
          stack: (e as Error).stack,
          elapsedSeconds: (performance.now() - started) / 1000,
          maxUiDelayMs: backgrounded ? null : Math.round(maxLag),
        };
      }
      results.push(row);
      await save(fixture.id + ".json", JSON.stringify(row, null, 2));
      const tr = document.createElement("tr");
      tr.className = row.pass ? "pass" : "fail";
      for (const value of [
        fixture.label,
        row.pass ? "PASS" : "FAIL",
        row.compileSeconds
          ? Number(row.compileSeconds).toFixed(2) + "s"
          : (row.error ?? "—"),
        row.loadSeconds ? Number(row.loadSeconds).toFixed(2) + "s" : "warm",
        row.pdfBytes
          ? `${row.pages} / ${(Number(row.pdfBytes) / 1048576).toFixed(2)} MiB`
          : "—",
        row.maxUiDelayMs === null ? "background" : row.maxUiDelayMs + "ms",
      ]) {
        const td = document.createElement("td");
        td.textContent = String(value);
        tr.append(td);
      }
      $("rows").append(tr);
      $("details").textContent = JSON.stringify(row, null, 2);
    }
  } catch (e) {
    $("details").textContent = (e as Error).stack ?? String(e);
  } finally {
    compiler.dispose();
    active = undefined;
    const passed = results.filter((r) => r.pass).length;
    const report = {
      date: new Date().toISOString(),
      browser: navigator.userAgent,
      bundle,
      scope,
      complete: results.length === cases.length,
      passed,
      total: cases.length,
      totalSeconds: (performance.now() - start) / 1000,
      results,
      resourceAssets: performance
        .getEntriesByType("resource")
        .filter((e) => e.name.includes("/compiler/"))
        .map((e) => ({
          url: new URL(e.name).pathname,
          duration: e.duration,
          bytes: (e as PerformanceResourceTiming).decodedBodySize,
        })),
      timingNote:
        "Loopback asset delivery; not internet cold-load timing. PDF parsing is outside compileSeconds.",
    };
    await save("report.json", JSON.stringify(report, null, 2));
    $("state").textContent =
      `Finished: ${passed}/${cases.length} checks passed${stopping ? " (stopped)" : ""}. ${saveFailed ? "Use Download evidence; automatic save was unavailable." : "Evidence saved locally."}`;
    $<HTMLButtonElement>("run").disabled = false;
    $<HTMLButtonElement>("stop").disabled = true;
    $<HTMLButtonElement>("download-results").disabled = false;
  }
};
