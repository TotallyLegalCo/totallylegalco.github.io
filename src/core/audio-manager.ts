export class AudioManager {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private frequencyBins: Uint8Array<ArrayBuffer> | null = null;
  private mediaSource: MediaElementAudioSourceNode | null = null;

  get context(): AudioContext | null { return this.audioContext; }
  get master(): GainNode | null { return this.masterGain; }
  get analyser(): AnalyserNode | null { return this.analyserNode; }
  get bins(): Uint8Array<ArrayBuffer> | null { return this.frequencyBins; }

  async resume(initialVolume: number): Promise<boolean> {
    if (!this.audioContext) {
      const Context = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Context) return false;
      this.audioContext = new Context();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = this.toGain(initialVolume);
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 1024;
      this.frequencyBins = new Uint8Array(this.analyserNode.frequencyBinCount);
      this.masterGain.connect(this.analyserNode);
      this.analyserNode.connect(this.audioContext.destination);
    }
    if (this.audioContext.state === 'suspended') await this.audioContext.resume();
    return true;
  }

  async connectMediaElement(element: HTMLMediaElement, initialVolume: number): Promise<boolean> {
    if (!await this.resume(initialVolume) || !this.audioContext || !this.masterGain) return false;
    if (!this.mediaSource) {
      this.mediaSource = this.audioContext.createMediaElementSource(element);
      this.mediaSource.connect(this.masterGain);
    }
    return true;
  }

  setVolume(value: number): void {
    if (!this.audioContext || !this.masterGain) return;
    this.masterGain.gain.setTargetAtTime(this.toGain(value), this.audioContext.currentTime, 0.05);
  }

  dispose(): void {
    this.mediaSource?.disconnect();
    void this.audioContext?.close();
    this.audioContext = null;
    this.masterGain = null;
    this.analyserNode = null;
    this.frequencyBins = null;
    this.mediaSource = null;
  }

  private toGain(value: number): number {
    return Math.max(0, Math.min(100, value)) / 100 * 0.22;
  }
}
