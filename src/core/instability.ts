export class InstabilityController {
  private intensity = 0.06;
  private interactionCharge = 0;
  private lastUpdate = 0;
  private startedAt = performance.now();

  get value(): number { return this.intensity; }

  registerInteraction(weight = 0.045): void {
    this.interactionCharge = Math.min(0.48, this.interactionCharge + weight);
  }

  reset(): void {
    this.intensity = 0.06;
    this.interactionCharge = 0;
    this.startedAt = performance.now();
    this.lastUpdate = 0;
    document.documentElement.style.setProperty('--instability', '0.06');
    document.documentElement.style.setProperty('--signal-offset', '0px');
    document.body.classList.remove('system-instability');
  }

  update(audioLevel: number): number {
    const now = performance.now();
    if (now - this.lastUpdate < 90) return this.intensity;
    const elapsed = (now - this.startedAt) / 1000;
    const temporal = Math.min(0.3, elapsed / 240);
    const organic = (Math.sin(now * 0.00031) + Math.sin(now * 0.00011 + 2.4)) * 0.035;
    const target = Math.min(0.92, 0.08 + temporal + this.interactionCharge + Math.min(0.25, audioLevel * 0.36) + organic);
    this.intensity += (target - this.intensity) * 0.14;
    this.interactionCharge = Math.max(0, this.interactionCharge - 0.0008);
    this.lastUpdate = now;

    const root = document.documentElement;
    root.style.setProperty('--instability', this.intensity.toFixed(3));
    root.style.setProperty('--signal-offset', `${Math.sin(now * 0.007) * this.intensity * 4}px`);
    document.body.classList.toggle('system-instability', this.intensity > 0.14);
    document.getElementById('stability-value')?.replaceChildren(document.createTextNode(`${Math.round((1 - this.intensity) * 100)}%`));
    return this.intensity;
  }
}
