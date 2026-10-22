/** One serial check per visible project; no polling while hidden/offline. */
export class AutoRefresh {
  private timer?: ReturnType<typeof setTimeout>;
  private stopped = false;
  private running = false;
  private lastCheck = Date.now();
  private notBefore = 0;
  private failures = 0;
  constructor(private options: {
    visible: () => boolean;
    idle: () => boolean;
    ready: () => boolean;
    check: () => Promise<void>;
    // false means sign-in/access needs attention; otherwise retry no sooner than ms.
    error: (error: unknown) => number | false;
  }) {}
  wake() {
    clearTimeout(this.timer);
    if (this.stopped || this.running || !this.options.visible()) return;
    const interval = this.options.idle() ? 120_000 : 30_000;
    const due = Math.max(this.lastCheck + interval, this.notBefore);
    this.timer = setTimeout(() => void this.tick(), Math.max(0, due - Date.now()));
  }
  private async tick() {
    if (this.stopped || !this.options.visible()) return;
    this.lastCheck = Date.now();
    if (!this.options.ready()) { this.wake(); return; }
    this.running = true;
    try {
      await this.options.check();
      this.failures = 0;
      this.notBefore = 0;
    } catch (error) {
      if (this.stopped) return;
      const wait = this.options.error(error);
      if (wait === false) this.stopped = true;
      else {
        this.failures++;
        this.notBefore = Date.now() + Math.max(wait, Math.min(900_000, 60_000 * 2 ** Math.min(this.failures - 1, 4)));
      }
    } finally {
      this.running = false;
      this.wake();
    }
  }
  stop() { this.stopped = true; clearTimeout(this.timer); }
}
