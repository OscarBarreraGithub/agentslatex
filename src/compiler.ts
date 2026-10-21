import {
  BusyTexRunner,
  PdfLatex,
  LuaLatex,
  XeLatex,
  type FileInput,
  type CompileResult,
} from "texlyre-busytex";
export type Engine = "pdf" | "lua" | "xe";
export type Bundle = "extra" | "recommended";
export interface Build extends CompileResult {
  loadSeconds: number;
  compileSeconds: number;
  totalSeconds: number;
}
export class Compiler {
  private runner?: BusyTexRunner;
  private active = false;
  private cancelActive?: () => void;
  constructor(private bundle: Bundle = "extra") {}
  cancel() {
    this.cancelActive?.();
  }
  dispose() {
    this.cancel();
    this.runner?.terminate();
    this.runner = undefined;
  }
  async compile(
    files: FileInput[],
    main: string,
    engine: Engine = "pdf",
    progress: (s: string) => void = () => {},
    timeoutMs = 120_000,
    options: { bibtex?: boolean; biber?: boolean } = {},
  ): Promise<Build> {
    if (this.active) throw Error("A build is already running.");
    const source = files.find((f) => f.path === main);
    if (!source || typeof source.content !== "string")
      throw Error("Select a text .tex main file.");
    const sourceText = source.content;
    this.active = true;
    const start = performance.now();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const stopped = new Promise<never>((_, reject) => {
      this.cancelActive = () => {
        this.runner?.terminate();
        this.runner = undefined;
        reject(new Error("Build cancelled"));
      };
      timer = setTimeout(() => {
        this.runner?.terminate();
        this.runner = undefined;
        reject(new Error(`Build stopped after ${timeoutMs / 1000} seconds`));
      }, timeoutMs);
    });
    const work = async () => {
      let loadSeconds = 0;
      if (!this.runner) {
        progress("Loading compiler…");
        const loading = performance.now();
        const asset = (name: string) =>
          new URL("/compiler/" + name, location.origin).href;
        this.runner = new BusyTexRunner({
          engineMode: "combined",
          busytexBasePath: asset(""),
          initRetries: 0,
          preloadDataPackages: [asset("texlive-" + this.bundle + ".js")],
          catalogDataPackages: [],
          onDownloadProgress: (p) =>
            progress("Loading compiler · " + Math.round(p.percent) + "%"),
        });
        await this.runner.initialize(true);
        loadSeconds = (performance.now() - loading) / 1000;
      }
      progress("Compiling…");
      const compiling = performance.now();
      const allSource = files
        .filter((f) => typeof f.content === "string" && f.path.endsWith(".tex"))
        .map((f) => f.content)
        .join("\n");
      const tool =
        engine === "lua"
          ? new LuaLatex(this.runner)
          : engine === "xe"
            ? new XeLatex(this.runner)
            : new PdfLatex(this.runner);
      const biblatex =
        /\\(?:usepackage|RequirePackage)(?:\[[^\]]*\])?\{[^}]*\bbiblatex\b/.test(
          allSource,
        );
      const result = await tool.compile({
        input: sourceText,
        mainTexPath: main,
        additionalFiles: files.filter((f) => f.path !== main),
        rerun: true,
        verbose: "info",
        shellEscape: false,
        bibtex:
          options.bibtex ??
          (!biblatex && /\\bibliography\s*\{/.test(allSource)),
        biber: options.biber ?? biblatex,
      });
      return {
        ...result,
        loadSeconds,
        compileSeconds: (performance.now() - compiling) / 1000,
        totalSeconds: (performance.now() - start) / 1000,
      };
    };
    try {
      return await Promise.race([work(), stopped]);
    } catch (error) {
      this.runner?.terminate();
      this.runner = undefined;
      throw error;
    } finally {
      clearTimeout(timer);
      this.cancelActive = undefined;
      this.active = false;
    }
  }
}
