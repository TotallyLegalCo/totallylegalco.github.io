import { updateSharedState } from './state';
import { CommandRegistry } from './terminal/registry';
import { VisualizerManager } from './core/visualizer';
import { AudioManager } from './core/audio-manager';
import { AnomalyManager } from './core/anomaly-manager';
import { InstabilityController } from './core/instability';
import musicCatalog from './data/musicas.json';

export function mountExperience(host) {
  'use strict';
  const $ = (s, root = host) => root.querySelector(s);
  const $$ = (s, root = host) => [...root.querySelectorAll(s)];
  const messages = [
    '“A raiz não sabe que está descendo.”',
    '“O silêncio também tem uma frequência.”',
    '“Você esteve aqui antes de chegar.”',
    '“Toda semente é uma memória do escuro.”',
    '“A forma observa quem tenta nomeá-la.”'
  ];
  const transmissions = [
    'Não olhe para a raiz quando ela respirar.',
    'A janela continua aberta no lado de dentro.',
    'O observador perdeu um fragmento de nome.',
    'A contenção está aprendendo a abrir.',
    'Seu silêncio foi registrado como resposta.'
  ];
  const answers = [
    'O que você chama de pensamento é apenas uma interferência.',
    'A raiz não sabe que está descendo.',
    'Você não está ouvindo. Está sendo lembrado.',
    'O escuro é só um lugar onde a luz ainda não chegou.',
    'Não há dentro. Não há fora. Há crescimento.',
    'A pergunta chegou antes de você.',
    'O organismo reconhece o intervalo entre seus passos.',
    'Tudo que cresce aprende a imitar o silêncio.'
  ];
  const tracks = musicCatalog.map((track, index) => ({
    ...track,
    artist:'ARQUIVO LOCAL · MP3',
    duration:null,
    icon:['✳','◉','⌁','◌','✴'][index % 5],
    src:`${import.meta.env.BASE_URL}assets/audio/${encodeURIComponent(track.file)}`
  }));
  const state = {
    connected:false, currentView:'nucleo', currentTrack:null, playing:false, elapsed:0, repeat:false, instability:0.06,
    random:false, terminalHistory:[], historyIndex:0,
    unlocked:localStorage.getItem('broccoli-subsoil') === 'yes', discoveries:JSON.parse(localStorage.getItem('broccoli-discoveries') || '[]'),
    reduced:localStorage.getItem('broccoli-reduced') === 'yes' || (localStorage.getItem('broccoli-reduced') === null && window.matchMedia('(prefers-reduced-motion: reduce)').matches), visual:'organismo',
    analyser:null, bins:null, sessionStart:Date.now(), lastMessage:Date.now()
  };
  const audioManager = new AudioManager();
  const audioElement = new Audio();
  audioElement.preload = 'metadata';
  audioElement.volume = 1;
  let disposed = false;
  let sessionInterval = 0;
  let resizeObserver;
  let ambientShader = null;
  let shaderAttempted = false;
  const bootTimers = new Set();
  const scrambleTimers = new Set();
  let toastTimer = 0;
  let lastAnomalyAt = 0;
  let nextToastAt = Date.now() + 9000;
  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const instability = new InstabilityController();
  const anomalies = new AnomalyManager($('#anomaly-layer'), () => {
    instability.registerInteraction(0.055);
    $('#anomaly-count').textContent=String(anomalies.count).padStart(2,'0');
  }, 5);

  const diagnostics = [
    ['[ OK ]','Inicializando sistema radicular','ok'],
    ['[ OK ]','Reconhecendo matéria orgânica','ok'],
    ['[ OK ]','Calibrando receptores sonoros','ok'],
    ['[ OK ]','Sincronizando frequências','ok'],
    ['[ OK ]','Restaurando memória residual','ok'],
    ['[ OK ]','Estabelecendo conexão neural','ok'],
    ['[ OK ]','Identificando observador','ok'],
    ['[ !! ]','Atividade orgânica inesperada','warning'],
    ['[ !! ]','Divergência de consciência','warning'],
    ['[ ERRO ]','Falha no isolamento da entidade','failure'],
    ['[ ERRO ]','Protocolo de contenção violado','failure'],
    ['[ CRÍTICO ]','O organismo está consciente','critical']
  ];
  const delays = [420,360,570,410,650,350,760,920,740,1050,850,1250];

  function clearBootTimers(){for(const timer of bootTimers)window.clearTimeout(timer);bootTimers.clear();}
  function lineDelay(index){return state.reduced?Math.min(240,delays[index]):delays[index]+Math.random()*290;}
  function addBootLine(index){
    const [code,text,severity]=diagnostics[index];
    const row=document.createElement('p');row.className=`boot-line ${severity}`;
    const codeNode=document.createElement('span');codeNode.className='boot-code';codeNode.textContent=code;
    const textNode=document.createElement('span');textNode.className='boot-diagnostic';textNode.textContent='';
    row.append(codeNode,textNode);$('#boot-lines').append(row);
    const chars='▓▒░#%&/<>*';let frame=0;
    const reveal=()=>{
      if(state.reduced||frame>=3){textNode.textContent=text;return;}
      textNode.textContent=Array.from(text).map((char,i)=>i<frame*text.length/3?char:(char===' '?' ':chars[Math.floor(Math.random()*chars.length)])).join('');
      frame++;const timer=window.setTimeout(reveal,28);bootTimers.add(timer);
    };
    reveal();$('#boot-log').scrollTop=$('#boot-log').scrollHeight;
    if(severity==='warning'||severity==='failure'||severity==='critical'){
      document.body.classList.add('critical-glitch');
      if(severity==='critical')document.body.style.setProperty('--instability','.95');
      const stop=window.setTimeout(()=>{if(severity!=='critical')document.body.classList.remove('critical-glitch');},severity==='critical'?850:250);
      bootTimers.add(stop);
    }
    updateBootMeters(index,severity);
  }
  function updateBootMeters(index,severity){
    const expected=Math.round((index+1)/diagnostics.length*100);
    for(let i=0;i<3;i++){
      let value=Math.min(100,expected+Math.round(Math.sin(index*1.7+i*2)*13));
      if(index===5&&i===1)value=61;
      if(index===8&&i===2)value=17;
      if(index===10&&i===0)value=93;
      if(severity==='critical')value=[100,3,81][i];
      const id=['root','sensor','containment'][i];
      $(`#load-${id}`).style.width=`${value}%`;
      $(`#load-${id}-value`).textContent=`${String(value).padStart(2,'0')}%`;
    }
  }
  function startBootSequence(){
    clearBootTimers();
    $('#boot-lines').replaceChildren();$('#boot').classList.remove('closed');$('#app').classList.remove('ready');
    document.body.classList.remove('critical-glitch','boot-blackout');
    document.body.style.removeProperty('--instability');
    ['root','sensor','containment'].forEach((id,i)=>{$(`#load-${id}`).style.width='0%';$(`#load-${id}-value`).textContent=['00%','00%','00%'][i];});
    let index=0;
    const next=()=>{
      if(index>=diagnostics.length){
        const blackout=window.setTimeout(()=>{
          document.body.classList.add('boot-blackout');
          const enter=window.setTimeout(()=>{$('#connect').click();},state.reduced?80:360);bootTimers.add(enter);
        },state.reduced?120:650);bootTimers.add(blackout);return;
      }
      addBootLine(index);
      index++;
      const delay=lineDelay(index-1);
      const timer=window.setTimeout(next,delay);bootTimers.add(timer);
    };
    const first=window.setTimeout(next,state.reduced?100:520);bootTimers.add(first);
  }

  $('#connect').addEventListener('click', () => {
    if(state.connected)return;
    clearBootTimers();
    document.body.classList.remove('boot-blackout','critical-glitch');
    state.connected=true;
    $('#boot').classList.add('closed'); $('#app').classList.add('ready'); $('#app').setAttribute('aria-hidden','false');
    if(state.unlocked) $('#subsolo-nav').classList.add('unlocked');
    state.sessionStart=Date.now();state.lastMessage=Date.now();
    discover('conexao'); updateDiscovery(); buildTracks(); startSession(); resizeCanvases();
    visualizers.start();
    void loadOrganism();
    updateSharedState({ connected:true });
    const route = window.location.hash.slice(1);
    if (['nucleo','frequencias','transmissao','arquivos','oraculo','terminal','anomalias','subsolo'].includes(route)) navigate(route, false);
  });

  function startSession(){
    if (sessionInterval) return;
    sessionInterval = window.setInterval(() => {
      const secs = Math.floor((Date.now()-state.sessionStart)/1000);
      $('#session-time').textContent = `${String(Math.floor(secs/60)).padStart(2,'0')}:${String(secs%60).padStart(2,'0')}`;
      if(secs > 40 && !state.discoveries.includes('permanencia')) discover('permanencia');
      state.instability=instability.update(audioLevel());
      if(Date.now()-state.lastMessage > 17000+Math.random()*19000){ $('#core-message').textContent=messages[Math.floor(Math.random()*messages.length)]; state.lastMessage=Date.now(); }
      $('#field-value').textContent = (58 + Math.round(Math.sin(Date.now()/1900)*14 + (state.playing?12:0))).toString();
      $('#signal-strength').textContent = `${62 + Math.floor(Math.abs(Math.sin(Date.now()/4200))*34)}%`;
      $('#anomaly-count').textContent=String(anomalies.count).padStart(2,'0');
      const now=Date.now();
      if(now>=nextToastAt&&state.instability>.18){showSignalToast();nextToastAt=now+9000+Math.random()*24000*(1-state.instability);}
      if(state.currentView==='anomalias'&&state.instability>.28&&now-lastAnomalyAt>11000&&Math.random()<state.instability*.055){anomalies.open();lastAnomalyAt=now;}
    },1000);
  }
  function showSignalToast(){
    const toast=$('#signal-toast');
    if(!toast||state.reduced)return;
    if(toastTimer)window.clearTimeout(toastTimer);
    toast.textContent=transmissions[Math.floor(Math.random()*transmissions.length)];
    toast.hidden=false;
    toastTimer=window.setTimeout(()=>{toast.hidden=true;},2400+Math.random()*1700);
  }
  function discover(id){ if(!state.discoveries.includes(id)){ state.discoveries.push(id); localStorage.setItem('broccoli-discoveries',JSON.stringify(state.discoveries)); updateDiscovery(); } }
  function updateDiscovery(){
    const found=Math.min(3,state.discoveries.length); $('#discovery-count').textContent=found;
    $$('.disc-dots i').forEach((el,i)=>el.classList.toggle('found',i<found));
    if(state.discoveries.length>=3 && !state.unlocked) unlockSubsoil();
  }
  function unlockSubsoil(){state.unlocked=true;localStorage.setItem('broccoli-subsoil','yes');$('#subsolo-nav').classList.add('unlocked');terminalLine('Um caminho cede sob o peso da curiosidade. [novo acesso: subsolo]','success');}

  // Navigation
  function navigate(view, writeHash = true){
    if(view==='subsolo' && !state.unlocked){showOracle('O acesso ainda não foi reconhecido.');return;}
    instability.registerInteraction(view==='anomalias'?0.065:0.025);
    state.currentView=view; $$('.view').forEach(v=>v.classList.toggle('active',v.id===`view-${view}`));
    syncOrganismCanvas();
    $$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
    updateSharedState({ view });
    if(writeHash && window.location.hash !== `#${view}`) window.history.pushState({ view }, '', `#${view}`);
    if(view==='transmissao') resizeCanvases(); if(view==='terminal') setTimeout(()=>$('#terminal-input').focus(),50);
    if(view==='transmissao') loadAmbientShader();
    if(view==='anomalias'&&anomalies.count===0){anomalies.open();lastAnomalyAt=Date.now();}
    if(!state.reduced){
      scrambleHeading($('.section-heading h2'));
      document.body.classList.add('signal-loss');
      window.setTimeout(()=>document.body.classList.remove('signal-loss'),450);
      if(Math.random()<state.instability*.45){const candidate=$('.section-heading h2');candidate?.classList.add('interface-glitch');window.setTimeout(()=>candidate?.classList.remove('interface-glitch'),380);}
    }
    if(view==='arquivos') discover('arquivo');
  }
  function scrambleHeading(element){
    if(!element||state.reduced)return;
    for(const timer of scrambleTimers)window.clearInterval(timer);
    scrambleTimers.clear();
    const html=element.innerHTML;
    const source=element.textContent||'';
    const glyphs='▓▒░#%&/<>*';
    let progress=0;
    element.setAttribute('aria-label',source);
    const timer=window.setInterval(()=>{
      progress+=Math.max(1,Math.ceil(source.length/4));
      element.textContent=Array.from(source).map((char,index)=>char===' '||index<progress?char:glyphs[Math.floor(Math.random()*glyphs.length)]).join('');
      if(progress>=source.length){window.clearInterval(timer);scrambleTimers.delete(timer);element.innerHTML=html;}
    },35);
    scrambleTimers.add(timer);
  }
  function loadAmbientShader(){
    if(shaderAttempted||disposed)return;
    shaderAttempted=true;
    import('./core/ambient-shader').then(({createAmbientShader})=>{
      if(disposed)return;
      ambientShader=createAmbientShader($('#transmission-shader'));
      ambientShader?.resize();
    }).catch(error=>console.warn('BROCCOLI: shader opcional indisponível.',error));
  }
  function navigateFromHash(){
    const route = window.location.hash.slice(1);
    if (['nucleo','frequencias','transmissao','arquivos','oraculo','terminal','anomalias','subsolo'].includes(route)) navigate(route, false);
  }
  window.addEventListener('popstate', navigateFromHash);
  window.addEventListener('hashchange', navigateFromHash);
  $$('.nav-item').forEach(btn=>btn.addEventListener('click',()=>navigate(btn.dataset.view)));
  $$('[data-action]').forEach(btn=>btn.addEventListener('click',()=>navigate(btn.dataset.action)));
  host.addEventListener('pointerdown',()=>instability.registerInteraction(),{passive:true});
  $('#spawn-anomaly').addEventListener('click',()=>{instability.registerInteraction(.08);if(anomalies.open())lastAnomalyAt=Date.now();});
  $('#clear-anomalies').addEventListener('click',()=>anomalies.closeAll(true));

  const metadataProbes = new Set();
  function escapeHtml(value){return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));}
  function buildTracks(){
    $('#track-count').textContent=String(tracks.length).padStart(2,'0');
    $('#track-count-foot').textContent=String(tracks.length).padStart(2,'0');
    $('#track-list').innerHTML=tracks.map(t=>`<div class="track" data-track="${t.id}"><button class="track-play" aria-label="Reproduzir ${escapeHtml(t.title)}">▶</button><div class="track-cover">${t.icon}</div><div class="track-copy"><b>${escapeHtml(t.title)}</b><span>${t.artist}</span></div><span class="track-length">${formatTime(t.duration)}</span></div>`).join('');
    $$('.track').forEach(el=>el.querySelector('.track-play').addEventListener('click',()=>playTrack(el.dataset.track)));
    probeTrackDurations();
  }
  function formatTime(n){if(!Number.isFinite(n))return '--:--';return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(Math.floor(n%60)).padStart(2,'0')}`;}
  function updateTrackRow(track){const row=$(`.track[data-track="${track.id}"]`);if(row)row.querySelector('.track-length').textContent=formatTime(track.duration);}
  function probeTrackDurations(){
    let cursor=0;
    const worker=()=>{
      if(disposed)return;
      const track=tracks[cursor++];if(!track)return;
      const probe=new Audio();probe.preload='metadata';metadataProbes.add(probe);
      let settled=false;
      const finish=()=>{if(settled)return;settled=true;window.clearTimeout(timeout);probe.removeEventListener('loadedmetadata',onMetadata);probe.removeEventListener('error',onError);metadataProbes.delete(probe);probe.removeAttribute('src');probe.load();worker();};
      const onMetadata=()=>{if(Number.isFinite(probe.duration)){track.duration=Math.floor(probe.duration);updateTrackRow(track);}finish();};
      const onError=()=>{track.unavailable=true;const row=$(`.track[data-track="${track.id}"]`);if(row){row.classList.add('unavailable');row.querySelector('.track-length').textContent='SINAL AUSENTE';}finish();};
      probe.addEventListener('loadedmetadata',onMetadata);probe.addEventListener('error',onError);
      const timeout=window.setTimeout(finish,15000);probe.src=track.src;probe.load();
    };
    for(let i=0;i<Math.min(3,tracks.length);i++)worker();
  }
  async function playTrack(id){
    const track=tracks.find(t=>t.id===id); if(!track||track.unavailable)return;
    if(state.currentTrack?.id===id && state.playing){pauseAudio();return;}
    const sameTrack=state.currentTrack?.id===id;
    if(!sameTrack){audioElement.pause();audioElement.src=track.src;audioElement.load();state.elapsed=0;}
    if(!await audioManager.connectMediaElement(audioElement,Number($('#volume').value))){showOracle('Este navegador não disponibilizou a camada sonora.');return;}
    try{await audioElement.play();}catch(error){console.warn('BROCCOLI: reprodução de áudio recusada.',error);return;}
    state.analyser=audioManager.analyser;state.bins=audioManager.bins;state.currentTrack=track;state.playing=true;
    updatePlayer(); navigate('frequencias'); $('#now-playing').textContent=`SINAL ATIVO · ${track.title.toUpperCase()}`;
    $$('.track').forEach(el=>el.classList.toggle('active',el.dataset.track===id));
    discover('frequencia');
  }
  function pauseAudio(){audioElement.pause();state.playing=false;updatePlayer();}
  function onAudioEnded(){
    if(state.repeat){audioElement.currentTime=0;void audioElement.play();return;}
    if(state.random){const available=tracks.filter(track=>track.id!==state.currentTrack?.id&&!track.unavailable);if(available.length){void playTrack(available[Math.floor(Math.random()*available.length)].id);return;}}
    state.playing=false;state.elapsed=state.currentTrack?.duration||Math.floor(audioElement.currentTime);updatePlayer();
  }
  function onAudioProgress(){
    if(!state.currentTrack)return;
    state.elapsed=Math.floor(audioElement.currentTime||0);
    if(Number.isFinite(audioElement.duration)){state.currentTrack.duration=Math.floor(audioElement.duration);updateTrackRow(state.currentTrack);}
    updatePlayer();
  }
  audioElement.addEventListener('timeupdate',onAudioProgress);
  audioElement.addEventListener('loadedmetadata',onAudioProgress);
  audioElement.addEventListener('ended',onAudioEnded);
  audioElement.addEventListener('error',()=>{state.playing=false;if(state.currentTrack)state.currentTrack.unavailable=true;updatePlayer();});
  function updatePlayer(){
    const t=state.currentTrack; $('#player-title').textContent=t?t.title.toUpperCase():'NENHUMA FREQUÊNCIA';
    $('#player-subtitle').textContent=t?(state.playing?'arquivo local · ao vivo':'sinal pausado'):'selecione um sinal para ouvir';
    $('#player-time').textContent=t?`${formatTime(state.elapsed)} / ${formatTime(t.duration)}`:'00:00';
    $('#play-toggle').textContent=state.playing?'Ⅱ':'▶';$('#play-toggle').setAttribute('aria-label',state.playing?'Pausar':'Reproduzir');$('#player').classList.toggle('playing',state.playing);
    updateSharedState({ playing:state.playing, trackId:t?.id ?? null });
    if(t){$('#trans-frequency').textContent=state.playing?'ANÁLISE AO VIVO':'SINAL LOCAL';}
  }
  $('#play-toggle').addEventListener('click',()=>{if(state.playing)pauseAudio();else if(state.currentTrack)playTrack(state.currentTrack.id);else navigate('frequencias');});
  $('#volume').addEventListener('input',e=>audioManager.setVolume(Number(e.target.value)));
  $('#secret-track').addEventListener('click',()=>playTrack(tracks[tracks.length-1]?.id));
  $('#random-track').addEventListener('click',()=>{
    state.random=!state.random;
    $('#random-track').setAttribute('aria-pressed',String(state.random));
    $('#random-track').textContent=`ALEATÓRIA: ${state.random?'SIM':'NÃO'}`;
    const available=tracks.filter(track=>!track.unavailable).filter(track=>track.id!==state.currentTrack?.id);
    if(state.random&&available.length) playTrack(available[Math.floor(Math.random()*available.length)].id);
  });
  $('#repeat-track').addEventListener('click',event=>{
    state.repeat=!state.repeat;
    event.currentTarget.setAttribute('aria-pressed',String(state.repeat));
    event.currentTarget.textContent=`REPETIR: ${state.repeat?'SIM':'NÃO'}`;
  });

  // Reduced-motion preference.
  function applyMotionPreference(reduced){state.reduced=reduced;document.body.classList.toggle('reduced-motion',reduced);visualizers.setReducedMotion(reduced);organismView?.setReducedMotion(reduced);$('#motion-toggle').setAttribute('aria-pressed',String(reduced));}
  $('#motion-toggle').addEventListener('click',()=>{applyMotionPreference(!state.reduced);localStorage.setItem('broccoli-reduced',state.reduced?'yes':'no');});
  const onSystemMotionChange=event=>{if(localStorage.getItem('broccoli-reduced')===null)applyMotionPreference(event.matches);};
  reduceMotionQuery.addEventListener('change',onSystemMotionChange);
  if(state.reduced){document.body.classList.add('reduced-motion');$('#motion-toggle').setAttribute('aria-pressed','true');}
  $$('.visual-mode').forEach(b=>b.addEventListener('click',()=>{$$('.visual-mode').forEach(x=>x.classList.toggle('chosen',x===b));state.visual=b.dataset.visual;$('#transmission-title').textContent=b.textContent[0]+b.textContent.slice(1).toLowerCase();syncOrganismCanvas();}));
  $('#fullscreen').addEventListener('click',()=>{const el=$('#transmission-frame');if(document.fullscreenElement)document.exitFullscreen?.();else el.requestFullscreen?.();});

  // Oracle
  function showOracle(answer){$('#oracle-answer').textContent=`“${answer}”`;navigate('oraculo');}
  function askOracle(){const q=$('#oracle-question').value.trim();const answer=answers[Math.floor(Math.random()*answers.length)];showOracle(q?`${q} ${answer}`:answer);$('#oracle-question').value='';discover('oraculo');}
  $('#ask-oracle').addEventListener('click',askOracle);$('#oracle-question').addEventListener('keydown',e=>{if(e.key==='Enter')askOracle();});$('#random-oracle').addEventListener('click',()=>{showOracle(answers[Math.floor(Math.random()*answers.length)]);discover('oraculo');});

  // Interactive terminal. Commands only change the local experience.
  const commands = new CommandRegistry();
  const commandHelp='ajuda · estado · frequencias · ouvir [faixa] · consultar [pergunta] · anomalias · encerrar · reiniciar · limpar · descer';
  function terminalLine(text,kind='response',command=false){const p=document.createElement('p');p.className=(command?'command-line ': '')+kind;p.textContent=text;$('#terminal-output').appendChild(p);$('#terminal-output').scrollTop=$('#terminal-output').scrollHeight;}
  commands
    .register('ajuda',()=>terminalLine(commandHelp))
    .register('help',()=>terminalLine(commandHelp))
    .register('estado',()=>terminalLine(`ORGANISMO: acordado | ATIVIDADE: ${$('#field-value').textContent} Hz | SINAL: ${$('#signal-strength').textContent} | DESCOBERTAS: ${Math.min(3,state.discoveries.length)}/3`))
    .register('frequencias',()=>{terminalLine(tracks.filter(t=>!t.hidden||state.unlocked).map(t=>`${t.title} — ${formatTime(t.duration)}${t.hidden?' [OCULTA]':''}`).join(' / '));navigate('frequencias');})
    .register('ouvir',arg=>{const t=tracks.find(track=>track.id===arg.toLowerCase()||track.title.toLowerCase().includes(arg.toLowerCase()))||(arg?undefined:tracks[0]);if(t&&(!t.hidden||state.unlocked)){terminalLine(`sintonizando: ${t.title}`,'success');playTrack(t.id);}else terminalLine(arg?'frequência não encontrada.':'informe o nome de uma frequência.','error');})
    .register('consultar',arg=>{showOracle(arg?`${arg}? ${answers[Math.floor(Math.random()*answers.length)]}`:answers[Math.floor(Math.random()*answers.length)]);terminalLine('o oráculo respondeu em uma camada paralela.');discover('oraculo');})
    .register('anomalias',()=>{navigate('anomalias');if(!anomalies.count)anomalies.open();})
    .register('encerrar',()=>{anomalies.closeAll(true);terminalLine('Todas as anomalias foram encerradas. O silêncio é temporário.','success');})
    .register('reiniciar',()=>{terminalLine('Reiniciando a experiência...','success');restartExperience();})
    .register('limpar',()=>{$('#terminal-output').innerHTML='';})
    .register('descer',()=>{if(!state.unlocked){unlockSubsoil();discover('terminal');}navigate('subsolo');terminalLine('camada inferior acessível.','success');});
  function runCommand(raw){
    const input=raw.trim(),parts=input.split(/\s+/),cmd=(parts.shift()||'').toLowerCase(),arg=parts.join(' ');if(!cmd)return;
    state.terminalHistory.push(input);state.historyIndex=state.terminalHistory.length;
    terminalLine(`visitante@broccoli:~$ ${input}`,'',true);
    if(!commands.execute(cmd,arg)) terminalLine(`comando desconhecido: ${cmd}. tente “ajuda”.`,'error');
  }
  $('#terminal-form').addEventListener('submit',e=>{e.preventDefault();runCommand($('#terminal-input').value);$('#terminal-input').value='';});
  $('#terminal-input').addEventListener('keydown',event=>{
    if(event.key==='ArrowUp'){event.preventDefault();state.historyIndex=Math.max(0,state.historyIndex-1);$('#terminal-input').value=state.terminalHistory[state.historyIndex]||'';}
    if(event.key==='ArrowDown'){event.preventDefault();state.historyIndex=Math.min(state.terminalHistory.length,state.historyIndex+1);$('#terminal-input').value=state.terminalHistory[state.historyIndex]||'';}
  });
  $('#clear-terminal').addEventListener('click',()=>$('#terminal-output').innerHTML='');

  function restartExperience(){
    anomalies.closeAll(false);
    pauseAudio();state.currentTrack=null;state.elapsed=0;updatePlayer();
    visualizers.stop();
    window.clearInterval(sessionInterval);sessionInterval=0;
    if(toastTimer)window.clearTimeout(toastTimer);
    $('#signal-toast').hidden=true;
    state.connected=false;state.currentView='nucleo';state.sessionStart=Date.now();state.lastMessage=Date.now();
    $$('.view').forEach(view=>view.classList.toggle('active',view.id==='view-nucleo'));
    $$('.nav-item').forEach(item=>item.classList.toggle('active',item.dataset.view==='nucleo'));
    $('#app').classList.remove('ready');$('#app').setAttribute('aria-hidden','true');
    $('#anomaly-count').textContent='00';
    window.history.pushState({view:'nucleo'},'','#nucleo');
    updateSharedState({connected:false,view:'nucleo',playing:false,trackId:null});
    instability.reset();
    startBootSequence();
  }

  // Three.js renders the same persistent specimen in the core and live transmission.
  const organism=$('#organism'),organismStage=$('#organism-stage'),transmissionOrganismStage=$('#transmission-organism-stage');
  const trans=$('#transmission'),tx=trans.getContext('2d');
  let organismView=null,organismLoadPromise=null;
  function loadOrganism(){
    if(organismView)return Promise.resolve();
    if(!organismLoadPromise)organismLoadPromise=import('./core/broccoli-organism').then(({BroccoliOrganism})=>{
      if(disposed)return;
      organismView=new BroccoliOrganism(organism,()=>{instability.registerInteraction(.018);discover('interacao');});
      organismView.setReducedMotion(state.reduced);syncOrganismCanvas();resizeCanvases();
    }).catch(error=>{organismLoadPromise=null;console.warn('BROCCOLI: renderização tridimensional indisponível.',error);});
    return organismLoadPromise;
  }
  function syncOrganismCanvas(){
    const live=state.currentView==='transmissao'&&state.visual==='organismo';
    const parent=live?transmissionOrganismStage:organismStage;
    if(parent&&organism.parentElement!==parent)parent.append(organism);
    transmissionOrganismStage?.classList.toggle('active',live);
    trans.classList.toggle('transmission-canvas-hidden',live);
    if(organismView)resizeCanvases();
  }
  function resizeCanvases(){
    organismView?.resize(visualizers.resolutionScale);
    const bounds=trans.getBoundingClientRect(),ratio=visualizers.resolutionScale;
    if(bounds.width&&bounds.height){trans.width=Math.floor(bounds.width*ratio);trans.height=Math.floor(bounds.height*ratio);tx.setTransform(ratio,0,0,ratio,0,0);}
    ambientShader?.resize();
  }
  function audioLevel(){
    if(!state.analyser||!state.playing||!state.bins)return 0;
    state.analyser.getByteFrequencyData(state.bins);
    let sum=0;for(let i=0;i<Math.min(8,state.bins.length);i++)sum+=state.bins[i];
    return Math.min(1,sum/Math.min(8,state.bins.length)/255);
  }
  const entityText=['     .-"""-.','    / .===. \\','   / /6 6\\ \\','  | |  .-. | |','   \\ \\_-_/ /','    `-.___.-`','      /|||\\','     / ||| \\','       |||','      / | \\','     /  |  \\'];
  function drawTransmission(time){const r=trans.getBoundingClientRect(),w=r.width,h=r.height;if(!w||!h)return;tx.clearRect(0,0,w,h);const level=audioLevel();
    if(state.visual==='organismo')return;
    if(state.visual==='pulso'){
      tx.strokeStyle='#a7ff3c22';for(let y=0;y<h;y+=35){tx.beginPath();tx.moveTo(0,y);tx.lineTo(w,y);tx.stroke();}tx.beginPath();for(let x=0;x<w;x+=3){const v=Math.sin(x*.023+time*.002)*(12+level*45)+Math.sin(x*.07-time*.0008)*5;const y=h*.53+v;if(x===0)tx.moveTo(x,y);else tx.lineTo(x,y);}tx.strokeStyle='#a7ff3c';tx.lineWidth=1.5;tx.shadowColor='#a7ff3c';tx.shadowBlur=9;tx.stroke();tx.shadowBlur=0;return;
    }
    if(state.visual==='entidade'){
      tx.font='12px monospace';tx.textAlign='center';tx.fillStyle='#a7ff3c';tx.shadowColor='#a7ff3c';tx.shadowBlur=7;const line=16,x=w/2,y=(h-entityText.length*line)/2;entityText.forEach((s,i)=>tx.fillText(s,x+Math.sin(time*.0007+i)*8,y+i*line));tx.shadowBlur=0;return;
    }
    if(state.visual==='colonia'){
      const count=100;for(let i=0;i<count;i++){const ang=i*2.399+time*.00008,rad=(.1+((i*37)%100)/120)*Math.min(w,h)*(.3+Math.sin(time*.0003)*.09);const x=w/2+Math.cos(ang)*rad,y=h/2+Math.sin(ang*1.3)*rad*.56;tx.fillStyle=`rgba(167,255,60,${.22+(i%6)*.09})`;tx.beginPath();tx.arc(x,y,1+(i%3)*.65+level*2,0,Math.PI*2);tx.fill();}return;
    }
    // Abismo: an infinite receding grid that reacts to the bass envelope.
    const horizon=h*.36;tx.strokeStyle='#a7ff3c35';tx.lineWidth=1;for(let i=0;i<18;i++){const t=i/17,y=horizon+Math.pow(t,2.1)*(h-horizon),wiggle=Math.sin(time*.001+i)*level*10;tx.beginPath();tx.moveTo(0,y);tx.quadraticCurveTo(w/2+wiggle,y-4,w,y);tx.stroke();}for(let i=-13;i<=13;i++){tx.beginPath();tx.moveTo(w/2+i*1.5,horizon);tx.lineTo(w/2+i*w*.07,h);tx.stroke();}
  }
  const visualizers = new VisualizerManager();
  visualizers.setReducedMotion(state.reduced);
  organismView?.setReducedMotion(state.reduced);
  visualizers.setActive({
    init:resizeCanvases,
    update(time,delta){const level=audioLevel();state.instability=instability.update(level);organismView?.setAudioLevel(level);organismView?.setInstability(state.instability);organismView?.setReducedMotion(state.reduced);organismView?.update(time,delta);if(state.currentView==='transmissao'){drawTransmission(time);ambientShader?.update(time,state.instability);}},
    resize:resizeCanvases,
    dispose(){organismView?.dispose();tx.clearRect(0,0,trans.width,trans.height);ambientShader?.dispose();}
  });
  resizeObserver = new ResizeObserver(()=>visualizers.resize());
  resizeObserver.observe($('#main'));
  startBootSequence();
  if(state.reduced){document.body.classList.add('reduced-motion');$('#motion-toggle').setAttribute('aria-pressed','true');}

  return () => {
    disposed = true;
    clearBootTimers();
    for(const timer of scrambleTimers)window.clearInterval(timer);scrambleTimers.clear();
    window.clearInterval(sessionInterval);
    window.clearTimeout(toastTimer);
    resizeObserver?.disconnect();
    reduceMotionQuery.removeEventListener('change',onSystemMotionChange);
    window.removeEventListener('popstate',navigateFromHash);
    window.removeEventListener('hashchange',navigateFromHash);
    audioElement.pause();audioElement.removeAttribute('src');audioElement.load();
    for(const probe of metadataProbes){probe.pause();probe.removeAttribute('src');probe.load();}metadataProbes.clear();
    audioElement.removeEventListener('timeupdate',onAudioProgress);
    audioElement.removeEventListener('loadedmetadata',onAudioProgress);
    audioElement.removeEventListener('ended',onAudioEnded);
    anomalies.dispose();
    visualizers.dispose();
    audioManager.dispose();
    updateSharedState({ connected:false, playing:false, trackId:null });
  };
}
