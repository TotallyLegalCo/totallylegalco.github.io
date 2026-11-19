import { updateSharedState } from './state';
import { CommandRegistry } from './terminal/registry';
import { VisualizerManager } from './core/visualizer';
import { AudioManager } from './core/audio-manager';
import { AnomalyManager } from './core/anomaly-manager';
import { InstabilityController } from './core/instability';

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
  const tracks = [
    { id:'germinacao', title:'Germinação lenta', artist:'padrão 001 · 68.4 Hz', duration:164, base:55, notes:[0,7,12,19], icon:'✳', type:'low' },
    { id:'seiva', title:'Seiva escura', artist:'padrão 002 · 43.1 Hz', duration:207, base:43, notes:[0,3,7,10], icon:'◉', type:'dark' },
    { id:'sala-vazia', title:'A sala vazia', artist:'padrão 003 · 91.8 Hz', duration:188, base:73, notes:[0,5,9,14], icon:'⌁', type:'high' },
    { id:'sonho-radicular', title:'Sonho radicular', artist:'padrão 004 · 32.0 Hz', duration:240, base:32, notes:[0,7,11,18], icon:'◌', type:'drift' },
    { id:'abaixo', title:'Abaixo da raiz', artist:'fragmento oculto · ??? Hz', duration:222, base:38, notes:[0,2,7,13], icon:'✴', type:'secret', hidden:true }
  ];
  const state = {
    connected:false, currentView:'nucleo', currentTrack:null, playing:false, elapsed:0, timer:null, repeat:false, instability:0.06,
    random:false, terminalHistory:[], historyIndex:0,
    unlocked:localStorage.getItem('broccoli-subsoil') === 'yes', discoveries:JSON.parse(localStorage.getItem('broccoli-discoveries') || '[]'),
    reduced:localStorage.getItem('broccoli-reduced') === 'yes' || (localStorage.getItem('broccoli-reduced') === null && window.matchMedia('(prefers-reduced-motion: reduce)').matches), render:'particles', visual:'organismo',
    audio:null, master:null, analyser:null, bins:null, oscillators:[], mouseX:0, mouseY:0, drag:false, sessionStart:Date.now(), lastMessage:Date.now()
  };
  const audioManager = new AudioManager();
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

  // Original synthesized tone beds; no remote audio or third-party recordings.
  async function ensureAudio(){
    const available=await audioManager.resume(Number($('#volume').value));
    state.audio=audioManager.context;state.master=audioManager.master;state.analyser=audioManager.analyser;state.bins=audioManager.bins;
    return available;
  }
  function buildTracks(){
    $('#track-list').innerHTML=tracks.filter(t=>!t.hidden||state.unlocked).map((t,i)=>`<div class="track ${t.hidden?'secret-track':''}" data-track="${t.id}"><button class="track-play" aria-label="Reproduzir ${t.title}">▶</button><div class="track-cover">${t.icon}</div><div class="track-copy"><b>${t.title}</b><span>${t.artist}</span></div><span class="track-length">${formatTime(t.duration)}</span></div>`).join('');
    $$('.track').forEach(el=>el.querySelector('.track-play').addEventListener('click',()=>playTrack(el.dataset.track)));
  }
  function formatTime(n){return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;}
  function stopOscillators(){state.oscillators.forEach(o=>{try{o.stop();}catch(_){}});state.oscillators=[];}
  async function playTrack(id){
    const track=tracks.find(t=>t.id===id); if(!track|| (track.hidden&&!state.unlocked))return;
    if(state.currentTrack?.id===id && state.playing){pauseAudio();return;}
    const resumeAt=state.currentTrack?.id===id&&state.elapsed<state.currentTrack.duration?state.elapsed:0;
    if(!await ensureAudio()){showOracle('Este navegador não disponibilizou a camada sonora.');return;}
    stopOscillators(); state.currentTrack=track; state.elapsed=resumeAt; state.playing=true;
    track.notes.forEach((step,i)=>{
      const osc=state.audio.createOscillator(), gain=state.audio.createGain(), filter=state.audio.createBiquadFilter();
      osc.type=track.type==='high'?'sine':(i===0?'triangle':'sine');
      osc.frequency.value=track.base*Math.pow(2,step/12); filter.type='lowpass'; filter.frequency.value=track.type==='high'?900:390;
      gain.gain.value=i===0?.075:.022; osc.connect(filter); filter.connect(gain); gain.connect(state.master); osc.start(); state.oscillators.push(osc);
      if(track.type==='drift'||track.type==='secret'){const lfo=state.audio.createOscillator(),lg=state.audio.createGain();lfo.frequency.value=.06+i*.035;lg.gain.value=track.base*.12;lfo.connect(lg);lg.connect(osc.frequency);lfo.start();state.oscillators.push(lfo);}
    });
    if(!state.timer)state.timer=setInterval(tickAudio,1000);
    updatePlayer(); navigate('frequencias'); $('#now-playing').textContent=`SINAL ATIVO · ${track.title.toUpperCase()}`;
    $$('.track').forEach(el=>el.classList.toggle('active',el.dataset.track===id));
    if(track.hidden)discover('subsolo-audio'); else discover('frequencia');
  }
  function pauseAudio(){state.playing=false;stopOscillators();updatePlayer();}
  function tickAudio(){
    if(!state.playing)return;
    state.elapsed++;
    if(state.currentTrack&&state.elapsed>=state.currentTrack.duration){
      if(state.repeat){state.elapsed=0;}
      else if(state.random){
        const available=tracks.filter(track=>!track.hidden||state.unlocked).filter(track=>track.id!==state.currentTrack?.id);
        const next=available[Math.floor(Math.random()*available.length)];
        if(next){playTrack(next.id);return;} pauseAudio();
      } else {pauseAudio();state.elapsed=state.currentTrack.duration;}
    }
    updatePlayer();
  }
  function updatePlayer(){
    const t=state.currentTrack; $('#player-title').textContent=t?t.title.toUpperCase():'NENHUMA FREQUÊNCIA';
    $('#player-subtitle').textContent=t?(state.playing?'padrão sintetizado · ao vivo':'sinal pausado'):'selecione um sinal para ouvir';
    $('#player-time').textContent=t?`${formatTime(state.elapsed)} / ${formatTime(t.duration)}`:'00:00';
    $('#play-toggle').textContent=state.playing?'Ⅱ':'▶';$('#play-toggle').setAttribute('aria-label',state.playing?'Pausar':'Reproduzir');$('#player').classList.toggle('playing',state.playing);
    updateSharedState({ playing:state.playing, trackId:t?.id ?? null });
    if(t){$('#trans-frequency').textContent=t.artist.split('·')[1]?.trim()||'??? Hz';}
  }
  $('#play-toggle').addEventListener('click',()=>{if(state.playing)pauseAudio();else if(state.currentTrack)playTrack(state.currentTrack.id);else navigate('frequencias');});
  $('#volume').addEventListener('input',e=>audioManager.setVolume(Number(e.target.value)));
  $('#secret-track').addEventListener('click',()=>playTrack('abaixo'));
  $('#random-track').addEventListener('click',()=>{
    state.random=!state.random;
    $('#random-track').setAttribute('aria-pressed',String(state.random));
    $('#random-track').textContent=`ALEATÓRIA: ${state.random?'SIM':'NÃO'}`;
    const available=tracks.filter(track=>!track.hidden||state.unlocked).filter(track=>track.id!==state.currentTrack?.id);
    if(state.random&&available.length) playTrack(available[Math.floor(Math.random()*available.length)].id);
  });
  $('#repeat-track').addEventListener('click',event=>{
    state.repeat=!state.repeat;
    event.currentTarget.setAttribute('aria-pressed',String(state.repeat));
    event.currentTarget.textContent=`REPETIR: ${state.repeat?'SIM':'NÃO'}`;
  });

  // Render mode controls and reduced-motion preference.
  const renderNames={particles:'PARTÍCULAS',wire:'MALHA',ascii:'ASCII'};
  $$('.render-option').forEach(b=>b.addEventListener('click',()=>{$$('.render-option').forEach(x=>x.classList.toggle('selected',x===b));state.render=b.dataset.render;$('#render-name').textContent=renderNames[state.render];}));
  function applyMotionPreference(reduced){state.reduced=reduced;document.body.classList.toggle('reduced-motion',reduced);visualizers.setReducedMotion(reduced);$('#motion-toggle').setAttribute('aria-pressed',String(reduced));}
  $('#motion-toggle').addEventListener('click',()=>{applyMotionPreference(!state.reduced);localStorage.setItem('broccoli-reduced',state.reduced?'yes':'no');});
  const onSystemMotionChange=event=>{if(localStorage.getItem('broccoli-reduced')===null)applyMotionPreference(event.matches);};
  reduceMotionQuery.addEventListener('change',onSystemMotionChange);
  if(state.reduced){document.body.classList.add('reduced-motion');$('#motion-toggle').setAttribute('aria-pressed','true');}
  $$('.visual-mode').forEach(b=>b.addEventListener('click',()=>{$$('.visual-mode').forEach(x=>x.classList.toggle('chosen',x===b));state.visual=b.dataset.visual;$('#transmission-title').textContent=b.textContent[0]+b.textContent.slice(1).toLowerCase();}));
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

  // Canvas organisms and the five audiovisual transmissions.
  const organism=$('#organism'),org=organism.getContext('2d'),trans=$('#transmission'),tx=trans.getContext('2d');
  function resizeCanvases(){[organism,trans].forEach(c=>{const r=c.getBoundingClientRect(),d=visualizers.resolutionScale;if(r.width&&r.height){c.width=Math.floor(r.width*d);c.height=Math.floor(r.height*d);const ctx=c.getContext('2d');ctx.setTransform(d,0,0,d,0,0);}});ambientShader?.resize();}
  organism.addEventListener('pointerdown',e=>{state.drag=true;organism.setPointerCapture(e.pointerId);});
  organism.addEventListener('pointerup',()=>state.drag=false);
  organism.addEventListener('pointermove',e=>{const r=organism.getBoundingClientRect();state.mouseX=(e.clientX-r.left-r.width/2)/r.width;state.mouseY=(e.clientY-r.top-r.height/2)/r.height;if(state.drag)discover('interacao');});
  function audioLevel(){if(!state.analyser||!state.playing)return .12;state.analyser.getByteFrequencyData(state.bins);let sum=0;for(let i=0;i<state.bins.length;i++)sum+=state.bins[i];return Math.min(.75,sum/state.bins.length/255);}
  function drawOrganism(ctx,w,h,time,mode=state.render){
    const distortion=state.reduced?0:state.instability;
    const cx=w*.5+state.mouseX*w*.10+Math.sin(time*.014)*distortion*8, cy=h*.54+state.mouseY*h*.06+Math.sin(time*.021)*distortion*4, scale=Math.min(w,h)*.35, pulse=1+Math.sin(time*.0018)*.025+audioLevel()*.15+Math.sin(time*.009)*distortion*.045;
    ctx.clearRect(0,0,w,h);ctx.save();ctx.translate(cx,cy);ctx.scale(pulse,pulse);ctx.rotate(state.mouseX*.16+Math.sin(time*.0004)*.04+Math.sin(time*.006)*distortion*.035);
    // branching roots
    ctx.lineWidth=1;for(let i=0;i<13;i++){let a=(i/13-.5)*2.1;ctx.beginPath();ctx.moveTo((i-6)*2,scale*.35);ctx.bezierCurveTo((i-6)*9,scale*.65,Math.sin(i*4)*scale*.55,scale*.76,Math.sin(i*8)*scale*.82,scale*(.75+(i%3)*.07));ctx.strokeStyle=`rgba(167,255,60,${mode==='wire'?.34:.2})`;ctx.stroke();}
    // stalk with veins
    const stem=ctx.createLinearGradient(0,-scale*.1,0,scale*.48);stem.addColorStop(0,'#718c38');stem.addColorStop(1,'#1a2413');ctx.fillStyle=stem;ctx.beginPath();ctx.moveTo(-scale*.11,scale*.42);ctx.quadraticCurveTo(-scale*.07,scale*.05,-scale*.1,-scale*.18);ctx.quadraticCurveTo(0,-scale*.27,scale*.1,-scale*.18);ctx.quadraticCurveTo(scale*.07,scale*.05,scale*.12,scale*.42);ctx.closePath();ctx.fill();
    for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(0,scale*(.28-i*.08));ctx.quadraticCurveTo((i-2)*scale*.08,-scale*.02,(i-2)*scale*.12,-scale*.28);ctx.strokeStyle='#a7ff3c35';ctx.stroke();}
    // dense crown made from overlapping clustered florets
    const lobes=[];for(let i=0;i<8;i++){const a=i*Math.PI/4,rad=scale*(.18+(i%2)*.025);lobes.push([Math.cos(a)*rad,-scale*.48+Math.sin(a)*rad*.68,scale*(.19+(i%3)*.012)]);}lobes.push([0,-scale*.52,scale*.22]);
    for(let k=0;k<lobes.length;k++){const [x,y,r]=lobes[k];let gradient=ctx.createRadialGradient(x-r*.22,y-r*.3,1,x,y,r);gradient.addColorStop(0,'#9ed93c');gradient.addColorStop(.45,k%2?'#42651f':'#527c27');gradient.addColorStop(1,'#172413');ctx.fillStyle=gradient;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
    // particles / wire lattice texture
    for(let i=0;i<470;i++){const a=i*2.39996,rr=Math.sqrt((i+.5)/470),rad=scale*(.50+Math.sin(a*3)*.025),x=Math.cos(a)*rad*rr+Math.sin(time*.012+i)*distortion*3,y=-scale*.47+Math.sin(a)*rad*rr*.67+Math.cos(time*.009+i*.4)*distortion*2;if(y>scale*.15)continue;const alpha=.15+((Math.sin(i*13.2+time*.002*distortion)+1)*.17);if(mode==='ascii'){if(i%3===0){ctx.fillStyle=`rgba(167,255,60,${alpha})`;ctx.font='8px monospace';ctx.fillText(['0','1','*','+','·'][i%5],x,y);}}else{ctx.fillStyle=`rgba(${mode==='wire'?'190,255,111':'167,255,60'},${alpha})`;ctx.beginPath();ctx.arc(x,y,mode==='wire'?1:.8+(i%4)*.25,0,Math.PI*2);ctx.fill();}}
    if(mode==='wire'){ctx.strokeStyle='#a7ff3c30';for(let i=0;i<20;i++){let y=-scale*.78+i*scale*.047,ww=Math.sqrt(Math.max(0,1-Math.pow((y+scale*.48)/(scale*.43),2)))*scale*.46;ctx.beginPath();ctx.ellipse(0,y,ww,Math.max(3,ww*.35),0,0,Math.PI*2);ctx.stroke();}}
    ctx.restore();
  }
  const entityText=['     .-"""-.','    / .===. \\','   / /6 6\\ \\','  | |  .-. | |','   \\ \\_-_/ /','    `-.___.-`','      /|||\\','     / ||| \\','       |||','      / | \\','     /  |  \\'];
  function drawTransmission(time){const r=trans.getBoundingClientRect(),w=r.width,h=r.height;if(!w||!h)return;tx.clearRect(0,0,w,h);const level=audioLevel();
    if(state.visual==='organismo'){drawOrganism(tx,w,h,time,'particles');return;}
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
  visualizers.setActive({
    init:resizeCanvases,
    update(time){state.instability=instability.update(audioLevel());const r=organism.getBoundingClientRect();if(r.width&&r.height)drawOrganism(org,r.width,r.height,time);if(state.currentView==='transmissao'){drawTransmission(time);ambientShader?.update(time,state.instability);}},
    resize:resizeCanvases,
    dispose(){org.clearRect(0,0,organism.width,organism.height);tx.clearRect(0,0,trans.width,trans.height);ambientShader?.dispose();}
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
    anomalies.dispose();
    visualizers.dispose();
    stopOscillators();
    audioManager.dispose();
    updateSharedState({ connected:false, playing:false, trackId:null });
  };
}
