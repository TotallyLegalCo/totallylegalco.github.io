# BROCCOLI

Experiência audiovisual interativa em português. O site combina uma sequência automática de diagnóstico, navegação por hash, um núcleo procedural em Canvas 2D, shader GLSL opcional, áudio sintetizado localmente, terminal, janelas de anomalia arrastáveis e progressão salva no navegador.

## Requisitos

- Node.js 22.12 ou superior (Vite 8).
- npm.

## Desenvolvimento

```sh
npm ci
npm run dev
```

O comando `npm run dev` inicia o servidor local do Vite.

## Verificações e build

```sh
npm run check
npm run build
npm run preview
```

`check` executa `svelte-check` e a verificação TypeScript. `build` valida os tipos e gera os arquivos estáticos em `dist/`. `preview` serve o build local para inspeção.

## Publicação no GitHub Pages

O workflow `.github/workflows/pages.yml` valida e publica automaticamente quando há push para `main`; pull requests executam tipagem e build sem publicar. Em **Settings → Pages**, escolha **GitHub Actions** como fonte de publicação. O Vite calcula `base` pelo nome do repositório em Actions, incluindo o caso especial de um repositório `owner.github.io`.

## Organização

- `src/App.svelte`: ponto de entrada Svelte, markup existente e montagem/desmontagem da experiência.
- `src/state.ts`: estado compartilhado da conexão, área ativa e áudio.
- `src/legacy.js`: controladores existentes, integrados incrementalmente ao store e ao ciclo de vida Svelte.
- `src/core/visualizer.ts`: ciclo padronizado `init`, `update`, `resize`, `dispose`, controle de resolução e loop único.
- `src/core/instability.ts`: controlador de instabilidade visual relacionado a tempo, áudio e interação.
- `src/core/anomaly-manager.ts`: janelas fictícias arrastáveis com limite simultâneo e descarte controlado.
- `src/core/ambient-shader.ts` e `src/shaders/`: shader GLSL da transmissão, carregado somente ao abrir essa área.
- `src/terminal/registry.ts`: registro extensível de comandos.
- `css/style.css`: identidade visual original preservada.

### Expandir o terminal

Registre um comando em `src/legacy.js` usando `commands.register('nome', (argumento) => { ... })`. O argumento contém o restante da linha após o nome do comando.

Os comandos `encerrar` e `reiniciar` fecham as anomalias e reiniciam a sequência automática, respectivamente. O áudio continua dependendo de uma interação explícita.

### Expandir visualizadores

Implemente `Visualizer` com `init`, `update`, `resize` e `dispose` em `src/core/visualizer.ts`. O `VisualizerManager` mantém uma única agenda de animação e encerra o renderer ao desmontar a aplicação.

## Áudio e compatibilidade

O sintetizador usa um único `AudioContext` e só começa após interação do visitante. Alternar áreas ou visualizadores preserva a reprodução. Se WebGL não estiver disponível, a transmissão 2D continua funcionando. O shader não usa texturas externas; geometrias e programas WebGL são descartados no ciclo de desmontagem.
