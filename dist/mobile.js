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
