'use strict';
const $=s=>document.querySelector(s),NS='http://www.w3.org/2000/svg';
const arts={carlo:'São Carlo Acutis',jose:'São José',miguel:'São Miguel Arcanjo',jesus:'Sagrado Coração de Jesus',teresinha:'Santa Teresinha'};
const colors=[['#f5bb3e','Amarelo'],['#ed8745','Laranja'],['#e65962','Vermelho'],['#d96799','Rosa'],['#a084ca','Lilás'],['#7068c9','Roxo'],['#5893d4','Azul'],['#71c4d2','Azul claro'],['#6baf86','Verde'],['#9bbd60','Verde claro'],['#f6dfa3','Creme'],['#dfb391','Pele clara'],['#b77b59','Caramelo'],['#7b5045','Marrom'],['#543d39','Marrom escuro'],['#ffffff','Branco'],['#c8cdd5','Cinza claro'],['#8993a5','Cinza'],['#545c70','Cinza escuro'],['#292a36','Preto']];
let current='carlo',color=colors[0][0],tool='bucket',paintMode='inside',svg,activeStroke=null,busy=false,toastTimer,pointerId=null;
const templates={},states={};const fresh=()=>({fills:{},strokes:[]});
for(const id of Object.keys(arts))states[id]={now:fresh(),undo:[],redo:[]};
const state=()=>states[current],clone=x=>JSON.parse(JSON.stringify(x));

const SAVE_PREFIX='que-nem-santo:painting:v1:';
let storageFailed=false;
function storageNotice(failed=false){
 storageFailed=failed;
 document.querySelectorAll('[data-save-notice]').forEach(el=>el.textContent=failed?'Não foi possível salvar neste navegador. Baixe sua pintura antes de sair.':'Salvo automaticamente neste navegador, só neste aparelho. Limpar os dados do site apaga as pinturas. Use Recomeçar para apagar o desenho atual.');
}
function validPainting(value){
 const hex=v=>typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v);
 return value&&value.version===1&&value.painting&&typeof value.painting.fills==='object'&&value.painting.fills!==null&&!Array.isArray(value.painting.fills)&&Object.entries(value.painting.fills).every(([k,v])=>/^\d+$/.test(k)&&hex(v))&&Array.isArray(value.painting.strokes)&&value.painting.strokes.every(s=>s&&typeof s.d==='string'&&/^[MLQZ0-9.,e\s+\-]+$/i.test(s.d)&&hex(s.color)&&(s.fill===true||(Number.isFinite(s.size)&&s.size>=1&&s.size<=200))&&(s.region==null||/^\d+$/.test(s.region))&&(!s.texture||['solid','pencil','crayon'].includes(s.texture)));
}
for(const id of Object.keys(arts)){
 try{const raw=localStorage.getItem(SAVE_PREFIX+(id+'-upload-v2'));if(raw){const data=JSON.parse(raw);if(validPainting(data))states[id].now=data.painting;else storageNotice(true)}}catch{storageNotice(true)}
}
function savePainting(){
 if(!svg)return;
 try{localStorage.setItem(SAVE_PREFIX+(current+'-upload-v2'),JSON.stringify({version:1,painting:state().now}));localStorage.setItem(SAVE_PREFIX+'last',current);if(storageFailed)storageNotice(false)}catch{if(!storageFailed)say('O navegador não conseguiu salvar. Baixe sua pintura para guardar.');storageNotice(true)}
}
window.addEventListener('pagehide',savePainting);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')savePainting()});

function say(message){$('#status').textContent=message;$('#status').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#status').classList.remove('show'),3200)}
function controls(){$('#undo').disabled=!state().undo.length||busy;$('#redo').disabled=!state().redo.length||busy;$('#download').disabled=busy;$('#reset').disabled=busy}
function remember(){const s=state();s.undo.push(clone(s.now));if(s.undo.length>40)s.undo.shift();s.redo=[];controls()}
function chooseColor(value){if(!/^#[0-9a-f]{6}$/i.test(value))throw Error('Cor inválida');color=value.toLowerCase();$('#activeColor').style.background=color;$('#customColor').value=color;if($('#dockColor'))$('#dockColor').style.background=color;document.querySelectorAll('.swatch').forEach(b=>{const on=b.dataset.color===color;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',on)})}
$('#palette').innerHTML=colors.map(([c,n])=>`<button class="swatch" data-color="${c}" style="background:${c};--check:${['#ffffff','#f6dfa3','#c8cdd5'].includes(c)?'#403855':'#fff'}" aria-label="${n}" title="${n}" aria-pressed="false"></button>`).join('');
$('#palette').addEventListener('click',e=>{const c=e.target.closest('[data-color]');if(c)chooseColor(c.dataset.color)});$('#customColor').addEventListener('input',e=>chooseColor(e.target.value));chooseColor(color);
function updateHint(){if($('#quickFree'))$('#quickFree').setAttribute('aria-pressed',tool==='brush'&&paintMode==='free');$('#paintHint').textContent=tool==='bucket'?'Escolha uma cor e toque para preencher.':paintMode==='free'?(tool==='eraser'?'Apague livremente pela folha.':'Pinte por toda a folha, até fora dos contornos!'):(tool==='eraser'?'Apague dentro da área escolhida.':'Pinte à vontade: a cor fica dentro dos limites.')}
function setTool(value){if(!['bucket','brush','eraser'].includes(value))throw Error('Ferramenta inválida');tool=value;document.querySelectorAll('[data-tool]').forEach(b=>{const on=b.dataset.tool===tool;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',on)});$('#brushControls').hidden=tool==='bucket';updateHint()}
document.querySelectorAll('[data-tool]').forEach(b=>b.addEventListener('click',()=>setTool(b.dataset.tool)));$('#brushSize').addEventListener('input',e=>$('#sizeValue').value=e.target.value);
function setPaintMode(mode){if(!['inside','free'].includes(mode))throw Error('Modo inválido');finishStroke();paintMode=mode;document.querySelectorAll('[data-mode]').forEach(b=>{const on=b.dataset.mode===mode;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',on)});if(tool==='bucket')setTool('brush');updateHint()}
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>setPaintMode(b.dataset.mode)));
function node(tag,attrs){const el=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))el.setAttribute(k,v);return el}
function textureMask(kind){
 const id='texture-'+kind,defs=svg.querySelector('defs');if(svg.querySelector('#'+id))return id;
 const pattern=node('pattern',{id:id+'-grain',patternUnits:'userSpaceOnUse',width:48,height:48});
 pattern.append(node('rect',{width:48,height:48,fill:kind==='pencil'?'#c4c4c4':'white'}));
 let seed=kind==='pencil'?731:219;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
 for(let i=0;i<(kind==='pencil'?95:75);i++){const x=random()*48,y=random()*48;
 if(kind==='pencil')pattern.append(node('path',{d:`M${x},${y}l${2+random()*5},${.5+random()*1.5}`,stroke:random()>.3?'#252525':'white','stroke-width':.8+random()*1.2,opacity:.25+random()*.65}));
 else pattern.append(node('ellipse',{cx:x,cy:y,rx:.7+random()*2.1,ry:.5+random()*1.7,fill:'black',opacity:.3+random()*.7}));}
 const mask=node('mask',{id,maskUnits:'userSpaceOnUse',x:0,y:0,width:1132,height:1600,'mask-type':'luminance'});mask.append(node('rect',{width:1132,height:1600,fill:`url(#${id}-grain)`}));defs.append(pattern,mask);return id;
}
function strokeNode(s,index){if(s.fill){const p=node('path',{d:s.d,fill:s.color,'fill-rule':'evenodd'});svg.querySelector('#strokes').append(p);return p}let clip=null;if(s.region){const region=svg.querySelector(`#r${s.region}`);if(region){const id=`clip-${index}`;clip=node('clipPath',{id});clip.append(node('path',{d:region.getAttribute('d'),'clip-rule':'evenodd'}));svg.querySelector('defs').append(clip)}}const p=node('path',{d:s.d,fill:'none',stroke:s.color,'stroke-width':s.size,'stroke-linecap':'round','stroke-linejoin':'round'});if(s.texture&&s.texture!=='solid')p.setAttribute('mask',`url(#${textureMask(s.texture)})`);if(clip)p.setAttribute('clip-path',`url(#clip-${index})`);svg.querySelector('#strokes').append(p);return p}
function render(){if(!svg)return;const s=state().now;svg.querySelectorAll('[data-region]').forEach(p=>p.setAttribute('fill',s.fills[p.dataset.region]||'#ffffff'));svg.querySelector('#strokes').replaceChildren();svg.querySelector('defs').replaceChildren();s.strokes.forEach(strokeNode);controls();savePainting()}

function smoothVector(doc){
 for(const path of doc.querySelectorAll('path[d]')){
  const d=path.getAttribute('d');if(/[QCASHV]/i.test(d))continue;
  path.setAttribute('d',d.replace(/M([^Z]+)Z/g,(_,loop)=>{
   const pts=loop.split('L').map(v=>v.split(',').map(Number));
   if(pts.length<3||pts.some(p=>p.length!==2||p.some(v=>!Number.isFinite(v))))return 'M'+loop+'Z';
   const enter=[],exit=[],fmt=p=>p.map(v=>Number(v.toFixed(2))).join(',');
   pts.forEach((p,i)=>{const toward=q=>{const t=Math.min(.25,.65/Math.max(.001,Math.hypot(q[0]-p[0],q[1]-p[1])));return[p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t]};enter.push(toward(pts[(i+pts.length-1)%pts.length]));exit.push(toward(pts[(i+1)%pts.length]))});
   return 'M'+fmt(enter[0])+pts.map((p,i)=>(i?'L'+fmt(enter[i]):'')+'Q'+fmt(p)+' '+fmt(exit[i])).join('')+'Z';
  }));
 }
}
async function selectArt(id){if(!arts[id])throw Error('Desenho inválido');if(busy)return;finishStroke();busy=true;controls();document.body.classList.add('loading');try{if(!templates[id]){const response=await fetch(`assets/${id}.svg?v=20261006-artes4`);if(!response.ok)throw Error('Falha ao abrir');templates[id]=await response.text()}const doc=new DOMParser().parseFromString(templates[id],'image/svg+xml');if(doc.querySelector('parsererror'))throw Error('Desenho inválido');current=id;svg=document.importNode(doc.documentElement,true);$('#board').replaceChildren(svg);$('#artTitle').textContent=arts[id];$('#board').setAttribute('aria-label',`${arts[id]}. Toque para pintar. No teclado, use as setas para mover o cursor e espaço para pintar.`);document.querySelectorAll('[data-art]').forEach(b=>{const on=b.dataset.art===id;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',on)});render();window.resetZoom?.()}catch(e){say('Não foi possível abrir o desenho. Tente novamente.');console.error(e)}finally{busy=false;document.body.classList.remove('loading');controls()}}
$('#gallery').addEventListener('click',e=>{const b=e.target.closest('[data-art]');if(b)selectArt(b.dataset.art)});
function point(e){const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const t=p.matrixTransform(svg.getScreenCTM().inverse());return[Math.round(t.x*10)/10,Math.round(t.y*10)/10]}
function regionAt(e){return document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-region]')}
function fillRegion(region,value){if(!region||busy)return;const id=region.dataset.region;if((state().now.fills[id]||'#ffffff')===value&&!state().now.strokes.length)return;remember();state().now.fills[id]=value;if(state().now.strokes.length)state().now.strokes.push({d:region.getAttribute('d'),color:value,region:id,fill:true});render()}
function startStroke(e){if(busy||!svg||e.button>0||pointerId!==null)return;const region=regionAt(e);if(!region&&(tool==='bucket'||paintMode==='inside'))return;e.preventDefault();if(tool==='bucket'){fillRegion(region,color);return}remember();const[x,y]=point(e);const s={d:`M${x},${y}L${x+.01},${y}`,color:tool==='eraser'?'#ffffff':color,size:Number($('#brushSize').value),texture:tool==='eraser'?'solid':$('#brushTexture').value,region:paintMode==='inside'?region.dataset.region:null};state().now.strokes.push(s);activeStroke={data:s,node:strokeNode(s,state().now.strokes.length-1)};pointerId=e.pointerId;$('#board').setPointerCapture(e.pointerId)}
function moveStroke(e){if(!activeStroke||pointerId!==e.pointerId)return;e.preventDefault();const[x,y]=point(e);activeStroke.data.d+=`L${x},${y}`;activeStroke.node.setAttribute('d',activeStroke.data.d)}
function finishStroke(e){if(e&&pointerId!==e.pointerId)return;activeStroke=null;if(pointerId!==null&&$('#board').hasPointerCapture(pointerId))$('#board').releasePointerCapture(pointerId);pointerId=null;controls();savePainting()}
$('#board').addEventListener('pointerdown',startStroke);$('#board').addEventListener('pointermove',moveStroke);$('#board').addEventListener('pointerup',finishStroke);$('#board').addEventListener('pointercancel',finishStroke);$('#board').addEventListener('lostpointercapture',()=>{activeStroke=null;pointerId=null});
function undo(){finishStroke();const s=state();if(!s.undo.length||busy)return;s.redo.push(clone(s.now));s.now=s.undo.pop();render()}function redo(){finishStroke();const s=state();if(!s.redo.length||busy)return;s.undo.push(clone(s.now));s.now=s.redo.pop();render()}
$('#undo').addEventListener('click',undo);$('#redo').addEventListener('click',redo);document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'&&!['INPUT','TEXTAREA'].includes(e.target.tagName)){e.preventDefault();e.shiftKey?redo():undo()}});
$('#reset').addEventListener('click',()=>$('#confirmDialog').showModal());$('#cancelReset').addEventListener('click',()=>$('#confirmDialog').close());$('#confirmReset').addEventListener('click',()=>{remember();state().now=fresh();render();$('#confirmDialog').close();say('Tudo pronto para novas cores!')});
function downloadFile(url,name){const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove()}
$('#print').addEventListener('click',()=>downloadFile(`assets/${current}.pdf`,`Que-nem-Santo-${current}-para-imprimir.pdf`));
async function exportPNG(blank=false){if(!svg||busy)return;finishStroke();const id=current;$('#download').disabled=true;let url;try{const copy=svg.cloneNode(true);copy.setAttribute('viewBox','0 0 1132 1600');copy.setAttribute('width','2264');copy.setAttribute('height','3200');if(blank){copy.querySelectorAll('[data-region]').forEach(p=>p.setAttribute('fill','white'));copy.querySelector('#strokes').replaceChildren();copy.querySelector('defs').replaceChildren()}copy.querySelector('#keyboardCursor')?.remove();const data=new XMLSerializer().serializeToString(copy);url=URL.createObjectURL(new Blob([data],{type:'image/svg+xml;charset=utf-8'}));const im=new Image();im.src=url;await im.decode();const canvas=document.createElement('canvas');canvas.width=2264;canvas.height=3200;const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,2264,3200);ctx.drawImage(im,0,0,2264,3200);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('Falha ao exportar');const png=URL.createObjectURL(blob);downloadFile(png,`${blank?"Para-colorir":"Minha-pintura"}-${id}-Que-nem-Santo.png`);setTimeout(()=>URL.revokeObjectURL(png),60000);say('Sua pintura está pronta para guardar!')}catch(e){console.error(e);say('Não foi possível baixar. Você também pode tirar um print.')}finally{if(url)URL.revokeObjectURL(url);controls()}}
$('#download').addEventListener('click',()=>exportPNG());$('#downloadBlank').addEventListener('click',()=>exportPNG(true));
let cursor=[566,600];$('#board').addEventListener('keydown',e=>{if(!svg||busy)return;const dirs={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};if(dirs[e.key]){e.preventDefault();const d=dirs[e.key],step=e.shiftKey?5:25;cursor=[Math.max(1,Math.min(1131,cursor[0]+d[0]*step)),Math.max(1,Math.min(1599,cursor[1]+d[1]*step))];let ring=svg.querySelector('#keyboardCursor');if(!ring){ring=node('circle',{id:'keyboardCursor',r:14,fill:'none',stroke:'#5750bd','stroke-width':4,'pointer-events':'none'});svg.append(ring)}ring.setAttribute('cx',cursor[0]);ring.setAttribute('cy',cursor[1])}else if(e.key===' '||e.key==='Enter'){e.preventDefault();const p=svg.createSVGPoint();[p.x,p.y]=cursor;const s=p.matrixTransform(svg.getScreenCTM());fillRegion(regionAt({clientX:s.x,clientY:s.y}),tool==='eraser'?'#ffffff':color)}});$('#board').addEventListener('blur',()=>svg?.querySelector('#keyboardCursor')?.remove());
if(document.modelContext?.registerTool){try{Promise.resolve(document.modelContext.registerTool({name:'configure_coloring',title:'Escolher desenho e material',description:'Seleciona um desenho e configura a cor e a ferramenta, preservando as pinturas da sessão.',inputSchema:{type:'object',properties:{drawing:{type:'string',enum:Object.keys(arts)},color:{type:'string',pattern:'^#[0-9a-fA-F]{6}$'},tool:{type:'string',enum:['bucket','brush','eraser']}},additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:async input=>{if(!input||typeof input!=='object'||Object.keys(input).some(k=>!['drawing','color','tool'].includes(k))||(input.drawing!==undefined&&!arts[input.drawing])||(input.color!==undefined&&!/^#[0-9a-f]{6}$/i.test(input.color))||(input.tool!==undefined&&!['bucket','brush','eraser'].includes(input.tool)))throw Error('Configuração inválida');if(busy)throw Error('Aguarde carregar');if(input.drawing)await selectArt(input.drawing);if(input.color)chooseColor(input.color);if(input.tool)setTool(input.tool);return{drawing:current,color,tool}}})).catch(()=>{})}catch{}}
let restoredArt='carlo';try{const last=localStorage.getItem(SAVE_PREFIX+'last');if(arts[last])restoredArt=last}catch{}
selectArt(restoredArt);


$('#brushTexture').addEventListener('change',()=>{finishStroke();setTool('brush');say('Material selecionado para os próximos traços.')});
