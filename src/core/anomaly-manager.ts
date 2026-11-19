export interface AnomalyMessage {
  code: string;
  title: string;
  message: string;
  behavior?: 'duplicate' | 'mutate' | 'relocate' | 'loading' | 'spawn' | 'contradict';
}

const signals: AnomalyMessage[] = [
  { code:'ERRO 041', title:'SILÊNCIO DETECTADO', message:'Seu silêncio foi interpretado como consentimento.', behavior:'duplicate' },
  { code:'ERRO 404', title:'IDENTIDADE AUSENTE', message:'Identidade não encontrada. Continue sendo observado.', behavior:'mutate' },
  { code:'ERRO 666', title:'MATÉRIA RESISTENTE', message:'A matéria recusou sua decomposição.', behavior:'relocate' },
  { code:'FALHA CRÍTICA', title:'ORIGEM AMBÍGUA', message:'Não foi possível distinguir o observador do organismo.', behavior:'loading' },
  { code:'ACESSO NEGADO', title:'RAÍZES INSUFICIENTES', message:'Você ainda não criou raízes.', behavior:'spawn' },
  { code:'ERRO 013', title:'CONFIRMAÇÃO RECUSADA', message:'Você confirma que não confirmou?', behavior:'contradict' }
];

interface ActiveWindow {
  id: number;
  data: AnomalyMessage;
  element: HTMLElement;
}

export class AnomalyManager {
  private readonly active = new Map<number, ActiveWindow>();
  private nextId = 1;
  private zIndex = 1;
  private disposed = false;
  private readonly pending = new Set<number>();

  constructor(
    private readonly layer: HTMLElement,
    private readonly onActivity: () => void,
    private readonly maxWindows = 5
  ) {}

  get count(): number { return this.active.size; }

  open(data?: AnomalyMessage): boolean {
    if (this.disposed || this.layer.querySelectorAll('.anomaly-window').length >= this.maxWindows) return false;
    const message = { ...(data ?? signals[Math.floor(Math.random() * signals.length)]) };
    const id = this.nextId++;
    const element = this.createWindow(id, message);
    this.active.set(id, { id, data: message, element });
    this.layer.append(element);
    const offset = (id * 37) % 120;
    element.style.left = `${Math.max(8, (this.layer.clientWidth - element.offsetWidth) / 2 + offset - 60)}px`;
    element.style.top = `${30 + ((id * 61) % 130)}px`;
    requestAnimationFrame(() => element.classList.add('is-open'));
    this.onActivity();
    return true;
  }

  closeAll(animate = true): void {
    for (const timer of this.pending) window.clearTimeout(timer);
    this.pending.clear();
    if (!animate) {
      this.active.clear();
      this.layer.replaceChildren();
      return;
    }
    this.layer.querySelectorAll('.is-closing').forEach((element) => element.remove());
    for (const window of [...this.active.values()]) this.close(window.id, false, animate);
  }

  dispose(): void {
    this.disposed = true;
    this.closeAll(false);
  }

  private createWindow(id: number, data: AnomalyMessage): HTMLElement {
    const window = document.createElement('article');
    window.className = 'anomaly-window';
    window.dataset.anomalyId = String(id);
    window.style.zIndex = String(++this.zIndex);
    const bar = document.createElement('header');
    bar.className = 'anomaly-titlebar';
    bar.innerHTML = `<span class="anomaly-sigil">✳</span><span class="anomaly-title">${data.title}</span><button class="anomaly-x" type="button" aria-label="Fechar janela">×</button>`;
    const body = document.createElement('div');
    body.className = 'anomaly-body';
    const code = document.createElement('div');
    code.className = 'anomaly-code';
    code.textContent = data.code;
    const message = document.createElement('p');
    message.className = 'anomaly-message';
    message.textContent = data.message;
    body.append(code, message);
    if (data.behavior === 'loading') {
      const track = document.createElement('div');
      track.className = 'anomaly-loading';
      track.innerHTML = '<i></i>';
      body.append(track);
    }
    const actions = document.createElement('footer');
    actions.className = 'anomaly-actions';
    const dismiss = document.createElement('button');
    dismiss.type = 'button';
    dismiss.className = 'anomaly-action anomaly-dismiss';
    dismiss.textContent = data.behavior === 'contradict' ? 'CONFIRMAR' : 'NEGAR';
    const acknowledge = document.createElement('button');
    acknowledge.type = 'button';
    acknowledge.className = 'anomaly-action anomaly-ack';
    acknowledge.textContent = data.behavior === 'contradict' ? 'CANCELAR' : 'RECONHECER';
    actions.append(dismiss, acknowledge);
    window.append(bar, body, actions);

    bar.addEventListener('pointerdown', (event) => this.beginDrag(event, window, bar));
    window.addEventListener('pointerdown', () => { window.style.zIndex = String(++this.zIndex); });
    window.querySelector('.anomaly-x')?.addEventListener('click', () => this.close(id, true));
    dismiss.addEventListener('click', () => this.respond(id, 'dismiss'));
    acknowledge.addEventListener('click', () => this.respond(id, 'acknowledge'));
    return window;
  }

  private respond(id: number, action: 'dismiss' | 'acknowledge'): void {
    const item = this.active.get(id);
    if (!item) return;
    const { data, element } = item;
    this.onActivity();
    switch (data.behavior) {
      case 'mutate':
        element.querySelector('.anomaly-message')!.textContent = 'Identidade atualizada: você está do outro lado desta janela.';
        data.behavior = 'relocate';
        return;
      case 'relocate': {
        const maxX = Math.max(0, this.layer.clientWidth - element.offsetWidth);
        element.style.left = `${Math.floor(Math.random() * maxX)}px`;
        element.style.top = `${Math.floor(Math.random() * Math.max(80, this.layer.clientHeight - element.offsetHeight))}px`;
        data.behavior = undefined;
        return;
      }
      case 'spawn':
        this.close(id, false);
        this.open({ code:'ERRO 041-A', title:'ECO DE JANELA', message:'A janela que você fechou continua aberta em outro lugar.', behavior:'duplicate' });
        return;
      case 'contradict':
        this.close(id, false);
        this.open({ code:'ERRO 013-B', title:'RESPOSTA INCOMPATÍVEL', message:action === 'dismiss' ? 'Confirmação recebida. Sua confirmação foi negada.' : 'Cancelamento confirmado. A confirmação continua ativa.', behavior:'mutate' });
        return;
      default:
        this.close(id, data.behavior === 'duplicate');
    }
  }

  private close(id: number, duplicate: boolean, animate = true): void {
    const item = this.active.get(id);
    if (!item) return;
    this.active.delete(id);
    const copy = duplicate ? { ...item.data, title:`${item.data.title} / ECO` } : null;
    if (animate) {
      item.element.classList.add('is-closing');
      this.schedule(() => item.element.remove(), 230);
    } else item.element.remove();
    this.onActivity();
    if (copy && !this.disposed) this.schedule(() => this.open(copy), 280);
  }

  private schedule(callback: () => void, delay: number): void {
    const timer = window.setTimeout(() => {
      this.pending.delete(timer);
      callback();
    }, delay);
    this.pending.add(timer);
  }

  private beginDrag(event: PointerEvent, window: HTMLElement, handle: HTMLElement): void {
    if ((event.target as HTMLElement).closest('button')) return;
    event.preventDefault();
    const startX = event.clientX;
    const startY = event.clientY;
    const bounds = window.getBoundingClientRect();
    const layerBounds = this.layer.getBoundingClientRect();
    handle.setPointerCapture(event.pointerId);
    window.style.zIndex = String(++this.zIndex);
    const move = (next: PointerEvent): void => {
      const x = Math.max(0, Math.min(layerBounds.width - bounds.width, bounds.left - layerBounds.left + next.clientX - startX));
      const y = Math.max(0, Math.min(layerBounds.height - 36, bounds.top - layerBounds.top + next.clientY - startY));
      window.style.left = `${x}px`;
      window.style.top = `${y}px`;
    };
    const end = (): void => {
      handle.removeEventListener('pointermove', move);
      handle.removeEventListener('pointerup', end);
      handle.removeEventListener('pointercancel', end);
    };
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
    this.onActivity();
  }
}
