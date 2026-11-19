import { writable } from 'svelte/store';

export type ViewId = 'nucleo' | 'frequencias' | 'transmissao' | 'arquivos' | 'oraculo' | 'terminal' | 'anomalias' | 'subsolo';

export interface SharedState {
  connected: boolean;
  view: ViewId;
  playing: boolean;
  trackId: string | null;
}

export const appState = writable<SharedState>({
  connected: false,
  view: 'nucleo',
  playing: false,
  trackId: null
});

export function updateSharedState(update: Partial<SharedState>): void {
  appState.update((current) => ({ ...current, ...update }));
}
