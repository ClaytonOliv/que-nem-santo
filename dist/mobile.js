const compact=matchMedia('(max-width:1100px)');
const galleryHome=document.querySelector('.gallery'),actionsHome=document.querySelector('.header');
const actionBar=document.querySelector('.header-actions'),galleryList=document.querySelector('#gallery');
const mobileMenu=document.querySelector('#mobileMenu');
function closeFloating(){document.body.classList.remove('tools-open','colors-open');$('#toolsToggle').setAttribute('aria-expanded','false');$('#colorsToggle').setAttribute('aria-expanded','false')}
function closeMenu(){mobileMenu.close();$('#menuToggle').setAttribute('aria-expanded','false')}
function arrange(){closeFloating();closeMenu();if(compact.matches){$('#menuGallery').append(galleryList);$('#menuActions').append(actionBar)}else{galleryHome.append(galleryList);actionsHome.append(actionBar)}}
compact.addEventListener('change',arrange);arrange();
$('#menuToggle').onclick=()=>{closeFloating();mobileMenu.showModal();$('#menuToggle').setAttribute('aria-expanded','true')};
$('#closeMenu').onclick=closeMenu;mobileMenu.addEventListener('close',()=>$('#menuToggle').setAttribute('aria-expanded','false'));
mobileMenu.addEventListener('click',e=>{if(e.target===mobileMenu){const r=mobileMenu.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeMenu()}});
galleryList.addEventListener('click',e=>{if(e.target.closest('[data-art]'))closeMenu()});
actionBar.addEventListener('click',e=>{if(e.target.closest('button'))closeMenu()});
function togglePanel(kind){const was=document.body.classList.contains(kind+'-open');closeFloating();if(!was){document.body.classList.add(kind+'-open');$('#'+kind+'Toggle').setAttribute('aria-expanded','true')}}
$('#toolsToggle').onclick=()=>togglePanel('tools');$('#colorsToggle').onclick=()=>togglePanel('colors');$('#closeTools').onclick=closeFloating;
$('#quickFree').onclick=()=>{const next=tool==='brush'&&paintMode==='free'?'inside':'free';setTool('brush');setPaintMode(next);closeFloating();say(next==='free'?'Pintura livre: pode sair dos contornos!':'Pintura dentro dos limites ativada.')};
$('#palette').addEventListener('click',e=>{if(compact.matches&&e.target.closest('[data-color]'))closeFloating()});
document.addEventListener('pointerdown',e=>{if(compact.matches&&!e.target.closest('.tools,.floating-dock'))closeFloating()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeFloating()});
$('#dockColor').style.background=color;

'use strict';
// Capture navigation gestures before the painting handlers receive them.
(()=>{
 const board=document.querySelector('#board'), touches=new Map();
 let zoom=1,x=0,y=0,pan=false,drag=null,pinch=null,pending=null,suppress=false,touchSnapshot=null;
 function apply(){if(!svg)return;const w=1132/zoom,h=1600/zoom;x=Math.max(0,Math.min(1132-w,x));y=Math.max(0,Math.min(1600-h,y));svg.setAttribute('viewBox',`${x} ${y} ${w} ${h}`);$('#zoomReset').textContent=Math.round(zoom*100)+'%';$('#zoomOut').disabled=zoom<=1;$('#zoomIn').disabled=zoom>=5}
 function change(next,anchor){if(!svg)return;finishStroke();const z=zoom;next=Math.max(1,Math.min(5,next));anchor=anchor||[x+566/z,y+800/z];x=anchor[0]-(anchor[0]-x)*z/next;y=anchor[1]-(anchor[1]-y)*z/next;zoom=next;apply()}
 window.resetZoom=()=>{zoom=1;x=y=0;apply()};
 $('#zoomIn').onclick=()=>change(zoom*1.4);$('#zoomOut').onclick=()=>change(zoom/1.4);$('#zoomReset').onclick=window.resetZoom;
 $('#panToggle').onclick=()=>{finishStroke();pan=!pan;$('#panToggle').setAttribute('aria-pressed',pan);board.style.cursor=pan?'grab':''};
 const stop=e=>{e.preventDefault();e.stopImmediatePropagation()};
 const metrics=()=>{const a=[...touches.values()];return {distance:Math.hypot(a[0].clientX-a[1].clientX,a[0].clientY-a[1].clientY),cx:(a[0].clientX+a[1].clientX)/2,cy:(a[0].clientY+a[1].clientY)/2}};
 board.addEventListener('pointerdown',e=>{
 if(!svg||busy)return;
 if(e.pointerType==='touch'){
 if(!touches.size)touchSnapshot=clone(state());touches.set(e.pointerId,e);board.setPointerCapture(e.pointerId);
 if(touches.size===2){clearTimeout(pending?.timer);pending=null;finishStroke();if(touchSnapshot){Object.assign(state(),touchSnapshot);render()}const m=metrics();pinch={...m,zoom,x,y,anchor:point({clientX:m.cx,clientY:m.cy})};suppress=true;stop(e);return}
 if(suppress){stop(e);return}
 if(!pan){const initial=e;pending={event:e,timer:setTimeout(()=>{pending=null;if(!pinch&&!suppress)startStroke(initial)},110)};stop(e);return}
 }
 if(pan){finishStroke();drag={id:e.pointerId,cx:e.clientX,cy:e.clientY,x,y};board.setPointerCapture(e.pointerId);stop(e)}
 },true);
 board.addEventListener('pointermove',e=>{
 if(touches.has(e.pointerId))touches.set(e.pointerId,e);
 if(pinch&&touches.size>=2){const m=metrics(),rect=board.getBoundingClientRect();zoom=Math.max(1,Math.min(5,pinch.zoom*m.distance/pinch.distance));x=pinch.anchor[0]-(m.cx-rect.left)/rect.width*1132/zoom;y=pinch.anchor[1]-(m.cy-rect.top)/rect.height*1600/zoom;apply();stop(e);return}
 if(suppress){stop(e);return}
 if(pending){clearTimeout(pending.timer);const initial=pending.event;pending=null;startStroke(initial)}
 if(drag&&drag.id===e.pointerId){const r=board.getBoundingClientRect();x=drag.x-(e.clientX-drag.cx)*1132/zoom/r.width;y=drag.y-(e.clientY-drag.cy)*1600/zoom/r.height;apply();stop(e)}
 },true);
 function end(e){if(pending){clearTimeout(pending.timer);if(e.type==='pointerup'&&!suppress)startStroke(pending.event);pending=null}touches.delete(e.pointerId);if(drag?.id===e.pointerId)drag=null;if(suppress){finishStroke();if(!touches.size){suppress=false;pinch=null}stop(e)}else finishStroke(e)}
 board.addEventListener('pointerup',end,true);board.addEventListener('pointercancel',end,true);
 board.addEventListener('wheel',e=>{if(!svg)return;e.preventDefault();change(zoom*Math.exp(-e.deltaY*.002),point(e))},{passive:false});
})();
