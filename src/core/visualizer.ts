export interface Visualizer {
  init(): void;
  update(time: number, delta: number): void;
  resize(): void;
  dispose(): void;
}

/** Owns one animation loop and one active renderer lifecycle. */
export class VisualizerManager {
  private active: Visualizer | null = null;
  private frameId = 0;
  private timeoutId = 0;
  private lastFrame = 0;
  private slowFrames = 0;
  private smoothFrames = 0;
  private running = false;
  private reducedMotion = false;
  private pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);

  get resolutionScale(): number {
    return this.pixelRatio;
  }

  setActive(visualizer: Visualizer): void {
    this.active?.dispose();
    this.active = visualizer;
    this.active.init();
    this.active.resize();
  }

  setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced;
  }

  resize(): void {
    this.active?.resize();
  }

  start(): void {
    if (this.running || !this.active) return;
    this.running = true;
    this.lastFrame = 0;
    this.schedule();
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.frameId);
    window.clearTimeout(this.timeoutId);
    this.lastFrame = 0;
  }

  dispose(): void {
    this.stop();
    this.active?.dispose();
    this.active = null;
  }

  private schedule(): void {
    if (!this.running) return;
    if (this.reducedMotion) {
      this.timeoutId = window.setTimeout(() => this.render(performance.now()), 250);
    } else {
      this.frameId = requestAnimationFrame((time) => this.render(time));
    }
  }

  private render(time: number): void {
    if (!this.running || !this.active) return;
    const delta = this.lastFrame ? time - this.lastFrame : 16.67;
    this.lastFrame = time;
    if (delta > 34) {
      this.slowFrames++;
      this.smoothFrames = 0;
    } else {
      this.slowFrames = Math.max(0, this.slowFrames - 1);
      this.smoothFrames++;
    }
    if (this.slowFrames >= 24 && this.pixelRatio > 1) {
      this.pixelRatio = 1;
      this.slowFrames = 0;
      this.active.resize();
    } else if (this.smoothFrames >= 900 && this.pixelRatio < Math.min(window.devicePixelRatio || 1, 1.5)) {
      this.pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      this.smoothFrames = 0;
      this.active.resize();
    }
    this.active.update(time, delta);
    this.schedule();
  }
}
