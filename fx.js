(function(){
var cards=[].slice.call(document.querySelectorAll('.x-gallery .x-nft'));
cards.forEach(function(c,i){
  var g=c.querySelector('.x-ghost'); g.style.setProperty('--i',i);
  if(c.classList.contains('x-nft--legend')){
    var img=g.querySelector('img'), sh=document.createElement('span'); sh.className='fx-shine'; sh.style.setProperty('--m','url("'+img.getAttribute('src')+'")'); g.appendChild(sh);
    [[14,22],[80,18],[86,62],[10,70],[50,6]].forEach(function(p,k){var s=document.createElement('span');s.className='fx-spark';s.style.left=p[0]+'%';s.style.top=p[1]+'%';s.style.animationDelay=(k*0.45)+'s';g.appendChild(s);});
  }
});
var pool=cards.map(function(c){var t=c.querySelector('.x-rarity');return{src:c.querySelector('img').getAttribute('src'),name:c.querySelector('.x-nft__name').textContent,rar:c.dataset.rarity,cls:t.className,glow:c.querySelector('.x-ghost').style.getPropertyValue('--glow')};});
var W={Legendary:3,Epic:12,Rare:25,Uncommon:30,Common:40};
function pick(){var by={};pool.forEach(function(p){(by[p.rar]=by[p.rar]||[]).push(p);});var tot=0,ks=Object.keys(by);ks.forEach(function(k){tot+=W[k]||10;});var r=Math.random()*tot;for(var i=0;i<ks.length;i++){r-=W[ks[i]]||10;if(r<=0){var a=by[ks[i]];return a[Math.floor(Math.random()*a.length)];}}return pool[0];}
var bb=document.createElement('div'); bb.className='fx-bb'; bb.setAttribute('role','dialog'); bb.setAttribute('aria-modal','true');
bb.innerHTML='<div><div class="fx-stage"><div class="fx-burst"></div><div class="fx-prize"><div class="x-ghost"><img alt=""></div></div><div class="fx-box" role="button" tabindex="0" aria-label="Open"><div class="fx-box__lid"></div><div class="fx-box__body"></div><div class="fx-box__q">?</div></div></div><div class="fx-info"><h3 class="fx-name"></h3><span class="fx-tag"></span><p class="fx-hint">Tap the box to open</p><p class="fx-hint">Demo · not a real mint</p><div class="fx-actions" hidden><button type="button" class="fx-close">Close</button><button type="button" class="fx-again">Open again</button></div></div></div>';
document.body.appendChild(bb); var flash=document.createElement('div'); flash.className='fx-flash'; document.body.appendChild(flash);
var box=bb.querySelector('.fx-box'), busy=false;
function reset(){bb.classList.remove('is-reveal','is-legend');box.className='fx-box';box.style.cssText='';bb.querySelector('.fx-actions').hidden=true;bb.querySelectorAll('.fx-hint')[0].hidden=false;bb.querySelector('.fx-tag').textContent='';bb.querySelector('.fx-name').textContent='';busy=false;}
function openBox(){ if(busy)return; busy=true; var p=pick(); box.classList.add('is-shake');
  setTimeout(function(){ box.classList.remove('is-shake'); box.classList.add('is-open'); flash.classList.remove('go'); void flash.offsetWidth; flash.classList.add('go');
    var g=bb.querySelector('.fx-prize .x-ghost'); g.style.setProperty('--glow',p.glow||'240 185 11'); g.style.setProperty('--glow-a','.4'); var im=g.querySelector('img'); im.src=p.src; im.alt=p.name;
    bb.querySelector('.fx-name').textContent=p.name; var t=bb.querySelector('.fx-tag'); t.className=p.cls; t.textContent=p.rar;
    if(p.rar==='Legendary') bb.classList.add('is-legend');
    bb.classList.add('is-reveal'); bb.querySelectorAll('.fx-hint')[0].hidden=true; bb.querySelector('.fx-actions').hidden=false;
  },1300);
}
box.addEventListener('click',openBox); box.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();openBox();}});
bb.querySelector('.fx-again').addEventListener('click',function(){reset();setTimeout(openBox,150);});
bb.querySelector('.fx-close').addEventListener('click',function(){bb.classList.remove('is-on');reset();});
bb.addEventListener('click',function(e){if(e.target===bb){bb.classList.remove('is-on');reset();}});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&bb.classList.contains('is-on')){bb.classList.remove('is-on');reset();}});
var mb=document.getElementById('mint-btn');
})();
