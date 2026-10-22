import type { SourceMapForwardResult } from "./synctex";
import { pdfjs } from "./pdf";
import { EventBus, PDFLinkService, PDFViewer, LinkTarget } from "pdfjs-dist/web/pdf_viewer.mjs";
import "pdfjs-dist/web/pdf_viewer.css";

/** Embed PDF.js's bounded rendering queue and link layer, without its app chrome. */
export class PaperViewer {
  private readonly events = new EventBus();
  private readonly lifetime = new AbortController();
  private readonly links: PDFLinkService;
  private readonly viewer: PDFViewer;
  private readonly resize: ResizeObserver;
  private width = 0;
  private pendingPage?: number;
  private glowTimer?: ReturnType<typeof setTimeout>;
  constructor(private container: HTMLDivElement, pages: HTMLDivElement,
    pageChanged: (page: number) => void, failed: (error: Error) => void, sourceAt: (page: number, x: number, y: number) => void) {
    this.links = new PDFLinkService({ eventBus: this.events,
      externalLinkTarget: LinkTarget.BLANK, externalLinkRel: "noopener noreferrer",
      ignoreDestinationZoom: true });
    // abortSignal is supported by this pinned PDF.js build, but omitted from its types.
    const options = { container, viewer: pages, eventBus: this.events, linkService: this.links,
      annotationMode: pdfjs.AnnotationMode.ENABLE,
      annotationEditorMode: pdfjs.AnnotationEditorType.DISABLE,
      removePageBorders: true, maxCanvasPixels: 4 * 1024 * 1024,
      maxCanvasDim: 4096, enableDetailCanvas: false,
      abortSignal: this.lifetime.signal };
    this.viewer = new PDFViewer(options);
    this.links.setViewer(this.viewer);
    this.events.on("pagechanging", ({ pageNumber }: { pageNumber: number }) => pageChanged(pageNumber));
    this.events.on("pagerendered", ({ error }: { error?: Error }) => { if (error) failed(error); });
    this.resize = new ResizeObserver(() => this.fit());
    this.resize.observe(container);
    container.title = "Double-click the PDF to jump to its source.";
    container.addEventListener("dblclick", event => {
      const target = event.target as Element;
      if (target.closest("a")) return;
      const element = target.closest<HTMLElement>(".page[data-page-number]");
      if (!element) return;
      const number = Number(element.dataset.pageNumber);
      const view = this.viewer.getPageView(number - 1);
      if (!view?.pdfPage) return;
      const rect = element.getBoundingClientRect();
      const [x, y] = view.viewport.convertToPdfPoint(event.clientX - rect.left, event.clientY - rect.top);
      sourceAt(number, x - view.pdfPage.view[0], view.pdfPage.view[3] - y);
    }, { signal: this.lifetime.signal });
  }
  async load(document: pdfjs.PDFDocumentProxy, page: number) {
    // Propagate first-page errors before the viewer's asynchronous initialization.
    await document.getPage(1);
    const ready = new Promise<void>(resolve => this.events.on("pagesinit", resolve, { once: true }));
    this.links.setDocument(document);
    this.viewer.setDocument(document);
    await ready;
    this.width = 0;
    this.fit();
    this.goTo(Math.min(page, document.numPages));
    // Hidden mobile panes render when opened; don't leave Compile waiting for them.
    if (this.container.clientWidth && this.container.clientHeight) {
      let renderError: Error | undefined;
      const watch = ({error}: {error?: Error}) => { if (error) renderError = error; };
      this.events.on("pagerendered", watch);
      try { await this.viewer.onePageRendered; if (renderError) throw renderError; }
      finally { this.events.off("pagerendered", watch); }
    }
  }
  fit() {
    if (!this.viewer.pdfDocument || !this.container.clientWidth) return;
    if (this.width !== this.container.clientWidth) {
      this.width = this.container.clientWidth;
      this.viewer.currentScaleValue = "page-width";
    }
    this.viewer.update();
    if (this.pendingPage !== undefined && this.container.clientHeight) {
      const page = this.pendingPage; this.pendingPage = undefined;
      this.viewer.currentPageNumber = page;
    }
  }
  goTo(page: number) {
    if (!this.viewer.pdfDocument) return;
    if (!this.container.clientWidth || !this.container.clientHeight) { this.pendingPage = page; return; }
    this.viewer.currentPageNumber = page;
  }
  async reveal(result: SourceMapForwardResult) {
    const doc = this.viewer.pdfDocument;
    if (!doc) return;
    const page = await doc.getPage(result.page);
    if (doc !== this.viewer.pdfDocument || this.lifetime.signal.aborted) return;
    this.goTo(result.page);
    const view = this.viewer.getPageView(result.page - 1);
    const viewport = page.getViewport({ scale: view.viewport.scale });
    const rect = result.rects[0];
    if (!rect) return;
    const [x1, y1] = viewport.convertToViewportPoint(page.view[0] + rect.x, page.view[3] - rect.y);
    const [x2, y2] = viewport.convertToViewportPoint(page.view[0] + rect.x + rect.width, page.view[3] - rect.y - rect.height);
    this.container.querySelectorAll(".synctex-glow").forEach(element => element.remove());
    const glow = document.createElement("div"); glow.className = "synctex-glow";
    Object.assign(glow.style, { left: Math.min(x1,x2) + "px", top: Math.min(y1,y2) + "px",
      width: Math.max(4, Math.abs(x2-x1)) + "px", height: Math.max(10, Math.abs(y2-y1)) + "px" });
    view.div.append(glow);
    this.container.scrollTop += glow.getBoundingClientRect().top - this.container.getBoundingClientRect().top - 70;
    clearTimeout(this.glowTimer); this.glowTimer = setTimeout(() => glow.remove(), 1800);
  }
  clear() { this.pendingPage = undefined; this.viewer.setDocument(null); this.links.setDocument(null); }
  dispose() { clearTimeout(this.glowTimer); this.clear(); this.resize.disconnect(); this.lifetime.abort(); }
}
