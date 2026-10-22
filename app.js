'use strict';
// Song Maker+ — original Web Audio grid sequencer. No frameworks or external assets.
(() => {
const $ = id => document.getElementById(id);
const palette = ['#e94b87','#25b5e9','#edc63c','#7a65d8','#1d927d','#f9a047','#4c68c7'];
const pitchColors = ['#b64fbb','#8054c6','#4c5bd2','#388cba','#168e82','#71b75d','#b4cb41','#f4d43a','#ffa246','#d94f69','#bd4db3','#7761c4','#e34866'];
const pitches = Array.from({length: 13},(_,i) => 72-i);
const noteNames = ['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
const drumNames = ['Kick','Snare','Closed hat','Clap'];
const validVoices = ['piano','synth','bass','bell','pluck'];
let bpm = 120, steps = 32, repeat = 1, masterVolume = .8;
let tracks=[], selectedId=0, nextId=1;
let context=null, mainGain=null, playing=false, timer=null, nextTime=0, stepIndex=0, visualEvents=[], frame=null, renderedStep=-1;
let painting=false, paintTo=true, activePointer=null;
const audioFile=$('audioFile'), projectFile=$('projectFile');
const cloneNotes = rows => Array.from({length:rows},()=>Array(64).fill(false));
const currentTrack = () => tracks.find(t=>t.id===selectedId) || tracks[0];
const rowNames = t => t.type==='drums'?drumNames:t.type==='sample'?['Sample']:pitches.map(n=>noteNames[n%12]+Math.floor(n/12-1));
const toast = msg => {const el=$('toast');el.textContent=msg;el.classList.add('visible');clearTimeout(el._timeout);el._timeout=setTimeout(()=>el.classList.remove('visible'),3200)};
const status = msg => $('status').textContent=msg;
function track(type='instrument', name, voice) {
 const id=nextId++; const nameValue=name || (type==='drums'?'Drum machine':type==='sample'?'My sample':'Instrument '+id);
 const t={id,type,name:nameValue,voice:voice||'piano',color:palette[(id-1)%palette.length],volume:.75,mute:false,solo:false,notes:cloneNotes(type==='drums'?4:type==='sample'?1:13),sampleData:null,sampleBuffer:null};
 tracks.push(t); selectedId=id; render(); return t;
}
function initDemo(){tracks=[];nextId=1; const p=track('instrument','Bright piano','piano');
 for(const [s,r] of [[0,12],[2,8],[4,5],[6,8],[8,10],[10,7],[12,3],[14,7],[16,12],[18,8],[20,5],[22,8],[24,10],[26,7],[28,5],[30,3]])p.notes[r][s]=true;
 const d=track('drums','Drum machine');for(let s=0;s<32;s++){if(s%8===0)d.notes[0][s]=true;if(s%8===4)d.notes[1][s]=true;if(s%2===0)d.notes[2][s]=true;if(s===15||s===31)d.notes[3][s]=true;}
 selectedId=p.id;render();}
function render(){renderTracks();renderEditor();renderDrumStrip();renderDots();}
function renderTracks(){const host=$('tracks');host.replaceChildren();$('trackCount').textContent=tracks.length;
 for(const t of tracks){const card=document.createElement('div');card.className='track'+(t.id===selectedId?' active':'');card.style.setProperty('--trackcolor',t.color);
 card.setAttribute('tabindex','0');card.setAttribute('role','group');card.setAttribute('aria-label','Track '+t.name+'. Press Enter to edit.');
 card.addEventListener('keydown',e=>{if(e.target===card&&(e.key==='Enter'||e.key===' ')){e.preventDefault();selectedId=t.id;render();closePanels();}});
 card.innerHTML='<div class="track-main"><span class="track-icon"></span><span class="track-title"></span><div class="small-actions"><button class="mini mute" title="Mute">M</button><button class="mini solo" title="Solo">S</button><button class="mini delete" title="Delete track">×</button></div></div><div class="track-sub"></div><label class="track-volume">VOL <input aria-label="Track volume" type="range" min="0" max="100"></label>';
 card.querySelector('.track-icon').textContent=t.type==='drums'?'🥁':t.type==='sample'?'◉':'♫';card.querySelector('.track-title').textContent=t.name;
 card.querySelector('.track-sub').textContent=t.type==='drums'?'4 drum sounds':t.type==='sample'?(t.sampleBuffer?'Imported audio':'Upload sample'):t.voice.charAt(0).toUpperCase()+t.voice.slice(1)+' instrument';
 const m=card.querySelector('.mute'),s=card.querySelector('.solo');m.classList.toggle('enabled',t.mute);s.classList.toggle('enabled',t.solo);
 m.addEventListener('click',e=>{e.stopPropagation();t.mute=!t.mute;renderTracks()});s.addEventListener('click',e=>{e.stopPropagation();t.solo=!t.solo;renderTracks()});
 card.querySelector('.delete').addEventListener('click',e=>{e.stopPropagation();if(tracks.length===1){toast('Keep at least one track');return;}tracks=tracks.filter(x=>x!==t);if(selectedId===t.id)selectedId=tracks[0].id;render();});
 const slider=card.querySelector('input');slider.value=Math.round(t.volume*100);slider.addEventListener('input',()=>{t.volume=Number(slider.value)/100});
 card.addEventListener('click',e=>{if(e.target.closest('button')||e.target.tagName==='INPUT')return;selectedId=t.id;render();closePanels()});host.appendChild(card);
 }}
function renderEditor(){const t=currentTrack();if(!t)return;
 $('editorTitle').textContent=t.name;$('editorSubtitle').textContent=t.type==='sample'?'Tap a square to trigger your uploaded sound':t.type==='drums'?'Program kicks, snares, hi-hats and claps':'Click or drag to paint notes';
 const voice=$('voice');voice.closest('.instrument-control').hidden=t.type!=='instrument';voice.value=t.voice;
 const g=$('stepGrid');g.style.setProperty('--steps',steps);g.replaceChildren();g.style.setProperty('--cellcolor',t.color);const names=rowNames(t);
 for(let r=0;r<names.length;r++){
 const label=document.createElement('div');label.className='rlabel';label.textContent=names[r];g.appendChild(label);
 for(let s=0;s<steps;s++){
 const c=document.createElement('button');c.type='button';c.className='cell'+(s%4===0?' beat':'')+(s%16===0?' measure':'')+(t.notes[r][s]?' on':'');c.dataset.r=r;c.dataset.s=s;c.style.setProperty('--cellcolor',t.type==='instrument'?pitchColors[r%pitchColors.length]:t.color);c.setAttribute('aria-label',names[r]+' step '+(s+1));c.setAttribute('aria-pressed',String(t.notes[r][s]));g.appendChild(c);
 }}
 updateNoteCount();renderPlayhead(renderedStep);
}
function updateNoteCount(){const t=currentTrack();const n=t.notes.reduce((sum,row)=>sum+row.slice(0,steps).filter(Boolean).length,0);$('noteCount').textContent=n+' notes';}
function renderDrumStrip(){
 const host=$('drumStrip');host.replaceChildren();host.style.setProperty('--steps',steps);
 const t=tracks.find(x=>x.type==='drums');if(!t){host.hidden=true;return;}host.hidden=false;
 for(const r of [2,0])for(let s=0;s<steps;s++){
  const c=document.createElement('button');c.type='button';
  c.className='cell drum-note'+(r===2?' hat':'')+(s%4===0?' beat':'')+(s%16===0?' measure':'')+(t.notes[r][s]?' on':'');
  c.dataset.track=t.id;c.dataset.r=r;c.dataset.s=s;
  c.setAttribute('aria-label',drumNames[r]+' step '+(s+1));c.setAttribute('aria-pressed',String(t.notes[r][s]));
  host.appendChild(c);
 }
}
function renderDots(){const d=$('beatDots');if(!d)return;d.replaceChildren();for(let i=0;i<steps/4;i++){const el=document.createElement('div');el.className='dot'+(Math.floor(renderedStep/4)===i?' current':'');d.appendChild(el);}}
function setCell(c,value){const t=c?.dataset.track?tracks.find(t=>t.id===Number(c.dataset.track)):currentTrack();if(!c||!c.classList.contains('cell')||!t)return;const r=Number(c.dataset.r),s=Number(c.dataset.s);if(!t.notes[r]||s>=steps||t.notes[r][s]===value)return;t.notes[r][s]=value;c.classList.toggle('on',value);c.setAttribute('aria-pressed',String(value));updateNoteCount();if(value)preview(t,r);}
function addPaintHandlers(el){el.addEventListener('pointerdown',e=>{const c=e.target.closest('.cell');if(!c)return;e.preventDefault();painting=true;activePointer=e.pointerId;paintTo=!c.classList.contains('on');setCell(c,paintTo);});
el.addEventListener('pointermove',e=>{if(!painting||e.pointerId!==activePointer)return;const hit=document.elementFromPoint(e.clientX,e.clientY);if(hit&&el.contains(hit))setCell(hit.closest('.cell'),paintTo);});}
addPaintHandlers($('stepGrid'));
addPaintHandlers($('drumStrip'));
window.addEventListener('pointerup',()=>{painting=false;activePointer=null});window.addEventListener('pointercancel',()=>{painting=false;activePointer=null});
async function audioCtx(){if(!context){context=new (window.AudioContext||window.webkitAudioContext)();mainGain=context.createGain();mainGain.gain.value=masterVolume;mainGain.connect(context.destination);}if(context.state==='suspended')await context.resume();return context;}
const freq = midi => 440*Math.pow(2,(midi-69)/12);
function smooth(param,when,from,to,end){param.setValueAtTime(Math.max(.0001,from),when);param.exponentialRampToValueAtTime(Math.max(.0001,to),end);}
function synth(ctx,out,start,duration,voice,midi,velocity=.8){const f=freq(midi);const osc=ctx.createOscillator(),env=ctx.createGain();osc.type=voice==='synth'?'sawtooth':voice==='bass'?'square':voice==='bell'?'sine':voice==='pluck'?'triangle':'triangle';osc.frequency.setValueAtTime(f,start);if(voice==='bell')osc.frequency.setValueAtTime(f*2,start);
 let attack=.008,rel=.25;if(voice==='piano'){attack=.004;rel=.4}else if(voice==='bass'){rel=.18}else if(voice==='bell'){rel=.85}else if(voice==='pluck'){rel=.11}
 const end=start+Math.max(.05,duration), off=end+rel;env.gain.setValueAtTime(.0001,start);env.gain.linearRampToValueAtTime(velocity*.55,start+attack);env.gain.exponentialRampToValueAtTime(Math.max(.0001,velocity*.05),end);env.gain.exponentialRampToValueAtTime(.0001,off);
 osc.connect(env);env.connect(out);osc.start(start);osc.stop(off+.02);
 if(voice==='piano'||voice==='bell'){const o2=ctx.createOscillator(),g2=ctx.createGain();o2.type='sine';o2.frequency.value=f*(voice==='bell'?3:2);g2.gain.setValueAtTime(velocity*(voice==='bell'?.13:.07),start);g2.gain.exponentialRampToValueAtTime(.0001,off);o2.connect(g2);g2.connect(out);o2.start(start);o2.stop(off+.02);}
}
function noiseBuffer(ctx){if(ctx._songMakerNoise)return ctx._songMakerNoise;const len=Math.floor(ctx.sampleRate*.5),buffer=ctx.createBuffer(1,len,ctx.sampleRate),x=buffer.getChannelData(0);for(let i=0;i<len;i++)x[i]=Math.random()*2-1;try{ctx._songMakerNoise=buffer;}catch{}return buffer;}
function drums(ctx,out,start,row){if(row===0){const o=ctx.createOscillator(),e=ctx.createGain();o.type='sine';o.frequency.setValueAtTime(145,start);o.frequency.exponentialRampToValueAtTime(42,start+.16);e.gain.setValueAtTime(.85,start);e.gain.exponentialRampToValueAtTime(.0001,start+.29);o.connect(e);e.connect(out);o.start(start);o.stop(start+.3);return;}
 const n=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),e=ctx.createGain();n.buffer=noiseBuffer(ctx);filter.type=row===2?'highpass':row===1?'bandpass':'highpass';filter.frequency.value=row===1?1500:row===2?6500:2500;e.gain.setValueAtTime(row===2?.18:row===1?.5:.3,start);const len=row===2?.075:row===1?.18:.22;e.gain.exponentialRampToValueAtTime(.0001,start+len);n.connect(filter);filter.connect(e);e.connect(out);n.start(start);n.stop(start+len+.01);
 if(row===1){const tone=ctx.createOscillator(),ge=ctx.createGain();tone.type='triangle';tone.frequency.value=180;ge.gain.setValueAtTime(.24,start);ge.gain.exponentialRampToValueAtTime(.0001,start+.12);tone.connect(ge);ge.connect(out);tone.start(start);tone.stop(start+.13);}
}
function scheduleStep(ctx,dest,s,at){const anySolo=tracks.some(t=>t.solo);for(const t of tracks){if(t.mute||(anySolo&&!t.solo))continue;const active=t.notes.some(row=>row[s]);if(!active)continue;const gain=ctx.createGain();gain.gain.value=t.volume;gain.connect(dest);const dur=(60/bpm)/4*.9;
 for(let r=0;r<t.notes.length;r++){if(!t.notes[r][s])continue;if(t.type==='drums')drums(ctx,gain,at,r);else if(t.type==='sample'){if(t.sampleBuffer){const src=ctx.createBufferSource();src.buffer=t.sampleBuffer;src.connect(gain);src.start(at);}}else synth(ctx,gain,at,dur,t.voice,pitches[r]);}
 }}
async function preview(t,row){try{const ctx=await audioCtx(),g=ctx.createGain();g.gain.value=t.volume;g.connect(mainGain);if(t.type==='drums')drums(ctx,g,ctx.currentTime,row);else if(t.type==='sample'){if(t.sampleBuffer){const src=ctx.createBufferSource();src.buffer=t.sampleBuffer;src.connect(g);src.start();}}else synth(ctx,g,ctx.currentTime,.15,t.voice,pitches[row],.5);}catch(err){console.warn(err)}}
function renderPlayhead(s){if(renderedStep===s)return;renderedStep=s;document.querySelectorAll('.cell.playing').forEach(c=>c.classList.remove('playing'));if(s>=0){document.querySelectorAll('.cell[data-s="'+s+'"]').forEach(c=>c.classList.add('playing'));}renderDots();}
function animation(){if(!playing)return;const ct=context.currentTime;while(visualEvents.length&&visualEvents[0].time<=ct+.015){renderPlayhead(visualEvents.shift().step)}frame=requestAnimationFrame(animation);}
function schedule(){if(!playing)return;while(nextTime<context.currentTime+.13){scheduleStep(context,mainGain,stepIndex,nextTime);visualEvents.push({step:stepIndex,time:nextTime});nextTime+=(60/bpm)/4;stepIndex=(stepIndex+1)%steps;}}
async function play(){if(playing)return;try{await audioCtx();playing=true;stepIndex=0;nextTime=context.currentTime+.06;visualEvents=[];renderPlayhead(-1);schedule();timer=setInterval(schedule,25);frame=requestAnimationFrame(animation);$('playBtn').textContent='Ⅱ';$('playBtn').setAttribute('aria-label','Pause');status('Playing · '+bpm+' BPM');}catch(err){toast('Audio could not start: '+err.message);}}
function stop(){playing=false;clearInterval(timer);cancelAnimationFrame(frame);visualEvents=[];renderedStep=999;renderPlayhead(-1);$('playBtn').textContent='▶';$('playBtn').setAttribute('aria-label','Play');status('Stopped');}
$('playBtn').addEventListener('click',()=>playing?stop():play());$('stopBtn').addEventListener('click',stop);
$('bpm').addEventListener('input',e=>{bpm=Number(e.target.value);$('bpmValue').textContent=bpm;if(playing)status('Playing · '+bpm+' BPM');});
$('bars').addEventListener('change',e=>{stop();steps=Number(e.target.value);render();});$('repeat').addEventListener('change',e=>repeat=Number(e.target.value));
$('master').addEventListener('input',e=>{masterVolume=Number(e.target.value)/100;if(mainGain)mainGain.gain.value=masterVolume;});
$('voice').addEventListener('change',e=>{const t=currentTrack();t.voice=validVoices.includes(e.target.value)?e.target.value:'piano';renderTracks();});
$('clearTrack').addEventListener('click',()=>{currentTrack().notes=cloneNotes(currentTrack().notes.length);renderEditor();toast('Track cleared');});
$('addInstrument').addEventListener('click',()=>{const t=track('instrument','Instrument '+nextId);toast('Added '+t.name)});
$('addDrums').addEventListener('click',()=>{track('drums','Beat track '+nextId);toast('Beat track added')});
$('addSample').addEventListener('click',()=>audioFile.click());$('uploadBtn').addEventListener('click',()=>audioFile.click());
async function loadSample(file){if(!file)return;if(file.size>20*1024*1024){toast('Choose an audio file under 20 MB');return;}try{status('Decoding '+file.name+'…');const ctx=await audioCtx(),data=await file.arrayBuffer(),buffer=await ctx.decodeAudioData(data.slice(0));const reader=new FileReader();const base64=await new Promise((resolve,reject)=>{reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file)});const t=track('sample',file.name.replace(/\.[^.]+$/,''));t.sampleData=base64;t.sampleBuffer=buffer;render();toast('Sample added: '+file.name);status('Sample ready');}catch(e){toast('Could not decode this audio: '+e.message);status('Ready');}}
audioFile.addEventListener('change',async e=>{await loadSample(e.target.files[0]);e.target.value='';});
window.addEventListener('dragover',e=>{if(e.dataTransfer?.types.includes('Files'))e.preventDefault()});window.addEventListener('drop',e=>{if(e.dataTransfer?.files?.length){e.preventDefault();loadSample(e.dataTransfer.files[0]);}});
function download(name,blob){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);}
function projectData(){return {format:'song-maker-plus',version:1,bpm,steps,repeat,masterVolume,tracks:tracks.map(({id,type,name,voice,color,volume,mute,solo,notes,sampleData})=>({id,type,name,voice,color,volume,mute,solo,notes,sampleData}))};}
function saveProject(){download('song-maker-plus.json',new Blob([JSON.stringify(projectData())],{type:'application/json'}));toast('Project saved, including sample audio');}
$('saveBtn').addEventListener('click',saveProject);$('shareBtn').addEventListener('click',saveProject);$('openBtn').addEventListener('click',()=>projectFile.click());
function decodedDataUrl(dataUrl){const p=dataUrl.indexOf(',');if(p<0)throw Error('Invalid sample');const binary=atob(dataUrl.slice(p+1));const bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);return bytes.buffer;}
async function importProject(file){if(!file)return;try{const data=JSON.parse(await file.text());if(data.format!=='song-maker-plus'||!Array.isArray(data.tracks)||data.tracks.length>100||![16,32,64].includes(data.steps))throw Error('Not a compatible project');stop();bpm=Math.max(50,Math.min(220,Number(data.bpm)||120));steps=data.steps;repeat=[1,2,4].includes(data.repeat)?data.repeat:1;masterVolume=Math.min(1,Math.max(0,Number.isFinite(Number(data.masterVolume))?Number(data.masterVolume):.8));if(mainGain)mainGain.gain.value=masterVolume;
 tracks=[];nextId=1;for(const x of data.tracks){if(!['drums','sample','instrument'].includes(x.type))continue;const t=track(x.type,String(x.name||'Track').slice(0,90),x.voice);t.color=/^#[0-9a-f]{6}$/i.test(x.color)?x.color:t.color;t.volume=Math.max(0,Math.min(1,Number(x.volume)||0));t.mute=Boolean(x.mute);t.solo=Boolean(x.solo);
 if(Array.isArray(x.notes)&&x.notes.length===t.notes.length){for(let r=0;r<t.notes.length;r++){if(Array.isArray(x.notes[r])){for(let s=0;s<64;s++)t.notes[r][s]=Boolean(x.notes[r][s]);}}}
 if(t.type==='sample'&&typeof x.sampleData==='string'&&x.sampleData.startsWith('data:')&&x.sampleData.length<30e6){try{t.sampleData=x.sampleData;t.sampleBuffer=await(await audioCtx()).decodeAudioData(decodedDataUrl(x.sampleData));}catch(e){console.warn('Sample unavailable:',e);}}
 }if(!tracks.length)track('instrument','Piano','piano');selectedId=tracks[0].id;$('bpm').value=bpm;$('bpmValue').textContent=bpm;$('bars').value=steps;$('repeat').value=repeat;$('master').value=masterVolume*100;render();toast('Project opened');status('Project loaded');}catch(e){toast('Could not open project: '+e.message);}}
projectFile.addEventListener('change',async e=>{await importProject(e.target.files[0]);e.target.value='';});
$('newBtn').addEventListener('click',()=>{if(!confirm('Start a new song? Save your current project first if you want to keep it.'))return;stop();tracks=[];nextId=1;const base=track('instrument','Piano','piano');track('drums','Drum kit');selectedId=base.id;render();toast('New song created');});
$('demoBtn').addEventListener('click',()=>{if(!confirm('Replace your current song with the demo beat?'))return;stop();steps=32;$('bars').value=32;initDemo();toast('Demo beat loaded');});
function wavFromBuffer(buffer){const channels=Math.min(buffer.numberOfChannels,2),len=buffer.length,bytes=44+len*2*2,arr=new ArrayBuffer(bytes),view=new DataView(arr);let pos=0;
 const str=s=>{for(let i=0;i<s.length;i++)view.setUint8(pos++,s.charCodeAt(i))};const u16=n=>{view.setUint16(pos,n,true);pos+=2};const u32=n=>{view.setUint32(pos,n,true);pos+=4};
 str('RIFF');u32(bytes-8);str('WAVE');str('fmt ');u32(16);u16(1);u16(2);u32(buffer.sampleRate);u32(buffer.sampleRate*4);u16(4);u16(16);str('data');u32(len*4);
 const l=buffer.getChannelData(0),r=channels===2?buffer.getChannelData(1):l;for(let i=0;i<len;i++){for(const value of [l[i],r[i]]){const s=Math.max(-1,Math.min(1,value));view.setInt16(pos,s<0?s*32768:s*32767,true);pos+=2;}}return new Blob([arr],{type:'audio/wav'});
}
$('exportBtn').addEventListener('click',async()=>{const btn=$('exportBtn');if(btn.disabled)return;btn.disabled=true;const old=btn.textContent;btn.textContent='Rendering…';try{const longestSample=Math.max(0,...tracks.filter(t=>t.type==='sample'&&t.sampleBuffer).map(t=>t.sampleBuffer.duration));const total=steps*repeat*(60/bpm)/4+Math.max(1.4,longestSample+0.1),rate=44100;const Offline=window.OfflineAudioContext||window.webkitOfflineAudioContext;if(!Offline)throw Error('Offline audio export is not supported in this browser');const off=new Offline(2,Math.ceil(total*rate),rate),out=off.createGain();out.gain.value=masterVolume;out.connect(off.destination);
 // AudioBuffers are converted to the offline context's sample rate if necessary.
 const originals=tracks.map(t=>t.sampleBuffer);for(const t of tracks){if(t.type==='sample'&&t.sampleBuffer&&t.sampleBuffer.sampleRate!==rate){const src=t.sampleBuffer,converted=off.createBuffer(src.numberOfChannels,Math.ceil(src.duration*rate),rate);for(let ch=0;ch<src.numberOfChannels;ch++){const from=src.getChannelData(ch),to=converted.getChannelData(ch);for(let i=0;i<to.length;i++){const x=i*src.sampleRate/rate,j=Math.floor(x),a=x-j;to[i]=(from[Math.min(j,from.length-1)]||0)*(1-a)+(from[Math.min(j+1,from.length-1)]||0)*a;}}t.sampleBuffer=converted;}}
 try{for(let s=0;s<steps*repeat;s++)scheduleStep(off,out,s%steps,s*(60/bpm)/4);const result=await off.startRendering();download('song-maker-plus.wav',wavFromBuffer(result));toast('WAV exported successfully');status('WAV export complete');}finally{tracks.forEach((t,i)=>t.sampleBuffer=originals[i]);}
 }catch(e){toast('Export failed: '+e.message);console.error(e);}finally{btn.disabled=false;btn.textContent=old;}});
function closePanels(){
 for(const id of ['sidebar','settingsPanel','aboutPanel'])$(id).hidden=true;
 $('overlay').hidden=true;
 for(const id of ['tracksToggle','settingsToggle','aboutBtn'])$(id).setAttribute('aria-expanded','false');
}
function togglePanel(panelId,buttonId){
 const wasHidden=$(panelId).hidden;closePanels();
 if(wasHidden){$(panelId).hidden=false;$('overlay').hidden=false;$(buttonId).setAttribute('aria-expanded','true');}
}
$('tracksToggle').addEventListener('click',()=>togglePanel('sidebar','tracksToggle'));
$('settingsToggle').addEventListener('click',()=>togglePanel('settingsPanel','settingsToggle'));
$('aboutBtn').addEventListener('click',()=>togglePanel('aboutPanel','aboutBtn'));
$('overlay').addEventListener('click',closePanels);
document.querySelectorAll('[data-close-panel]').forEach(x=>x.addEventListener('click',closePanels));
window.addEventListener('keydown',e=>{if(e.key==='Escape')closePanels()});
window.addEventListener('keydown',e=>{const target=e.target;if(e.code==='Space'&&target.tagName!=='INPUT'&&target.tagName!=='SELECT'&&target.tagName!=='BUTTON'&&!e.repeat){e.preventDefault();playing?stop():play();}});
const base=track('instrument','Piano','piano');track('drums','Drum kit');selectedId=base.id;render();status('Ready to make music');
})();