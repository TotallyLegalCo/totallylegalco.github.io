<script lang="ts">
  import { onMount } from 'svelte';
  import template from './template.html?raw';
  import { appState } from './state';

  let host: HTMLDivElement;
  let cleanup: (() => void) | undefined;
  let disposed = false;

  onMount(() => {
    void import('./legacy.js').then(({ mountExperience }) => {
      const dispose = mountExperience(host);
      if (disposed) dispose();
      else cleanup = dispose;
    });
    return () => {
      disposed = true;
      cleanup?.();
    };
  });
</script>

<div
  class="experience-host"
  data-connected={$appState.connected}
  data-current-view={$appState.view}
  bind:this={host}
>{@html template}</div>
