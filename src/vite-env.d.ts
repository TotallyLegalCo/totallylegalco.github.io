/// <reference types="vite/client" />

declare module '*.html?raw' {
  const content: string;
  export default content;
}

declare module '*.glsl?raw' {
  const content: string;
  export default content;
}

declare module '*.js' {
  export function mountExperience(host: HTMLElement): () => void;
}
