(function(){
var C=window.SPOXY_CONFIG||{}, LIVE=!!(C.NFT_ADDRESS&&C.MARKET_ADDRESS&&window.ethers);
var MKT_ABI=["function activeListings() view returns (uint256[] ids,address[] sellers,uint256[] prices)","function list(uint256 tokenId,uint256 price)","function cancel(uint256 tokenId)","function buy(uint256 tokenId) payable","function royaltyBps() view returns (uint96)"];
var NFT_ABI=["function tokenURI(uint256) view returns (string)","function ownerOf(uint256) view returns (address)","function isApprovedForAll(address,address) view returns (bool)","function setApprovalForAll(address,bool)"];
var account=null, signer=null, listings=[], roy=500;
var $=function(id){return document.getElementById(id)};
function toast(t){var el=$('toast');el.textContent=t;el.classList.add('on');clearTimeout(el._t);el._t=setTimeout(function(){el.classList.remove('on')},4200);}
function short(a){return a?a.slice(0,6)+'…'+a.slice(-4):''}
var DEMO=[["cut-golden.webp","Legendary","Golden Crown",1,0.88,"240 185 11"],["new-pharaoh.webp","Legendary","Pharaoh Spirit",2,0.75,"240 185 11"],["new-dragon.webp","Legendary","Ember Dragon",3,0.69,"255 156 26"],["new-cosmic.webp","Legendary","Cosmic Void",4,0.72,"110 80 255"],["cut-witch.webp","Rare","Witch Violet",101,0.12,"168 85 247"],["cut-thunder.webp","Rare","Thunder Imp",388,0.095,"59 130 246"],["new-samurai.webp","Rare","Ronin Blade",612,0.11,"239 50 50"],["new-ice.webp","Rare","Frost Wraith",845,0.09,"110 231 249"],["new-dj.webp","Rare","Bass Phantom",903,0.1,"255 45 150"],["cut-agent.webp","Epic","Agent Spirit",777,0.18,"240 185 11"],["cut-pumpkin.webp","Uncommon","Pumpkin Ember",217,0.03,"255 106 26"],["cut-glitch2.webp","Common","Glitch Witch",521,0.012,"34 197 94"]];
function fmt(n){return (+n).toLocaleString('en-US',{maximumFractionDigits:4})}
function ipfs(u){return u&&u.indexOf('ipfs://')===0?C.IPFS_GATEWAY+u.slice(7):u}
var meta={};
async function loadMeta(id){ if(meta[id]) return meta[id]; try{var p=new ethers.JsonRpcProvider(C.RPC),n=new ethers.Contract(C.NFT_ADDRESS,NFT_ABI,p);var u=ipfs(await n.tokenURI(id));var j=await (await fetch(u)).json();meta[id]={img:ipfs(j.image),name:j.name||('Spirit #'+id),rar:(j.attributes||[]).filter(function(a){return /rarity/i.test(a.trait_type)}).map(function(a){return a.value})[0]||''};}catch(e){meta[id]={img:'/cut-witch.webp',name:'Spirit #'+id,rar:''};} return meta[id]; }
function card(l,mode){
  var d=document.createElement('div');d.className='card';
  var tg=l.rar?('<span class="tag '+(l.rar==='Legendary'?'L':l.rar==='Rare'?'R':'')+'">'+l.rar+'</span>'):'';
  d.innerHTML='<div class="art" style="--g:'+(l.glow||'240 185 11')+'"><img loading="lazy" alt=""></div><div class="meta"><div class="row"><span class="name"></span>'+tg+'</div><div class="row"><span class="mut">#'+l.id+(l.seller?' · '+short(l.seller):'')+'</span><span class="price">'+fmt(l.price)+' BNB</span></div><button class="btn '+(mode==='buy'?'solid':'')+'" type="button">'+(mode==='buy'?'Buy Now':'Cancel Listing')+'</button></div>';
  d.querySelector('img').src=l.img; d.querySelector('img').alt=l.name; d.querySelector('.name').textContent=l.name;
  d.querySelector('button').addEventListener('click',function(){ mode==='buy'?buy(l):cancel(l); });
  return d;
}
function render(){
  var q=$('search').value.trim(), s=$('sort').value, arr=listings.slice();
  if(q) arr=arr.filter(function(l){return String(l.id).indexOf(q)>-1});
  arr.sort(function(a,b){return s==='asc'?a.price-b.price:s==='desc'?b.price-a.price:a.id-b.id});
  var g=$('buy-grid');g.innerHTML='';
  if(!arr.length){g.innerHTML='<div class="empty">Belum ada listing.</div>';}
  arr.forEach(function(l){g.appendChild(card(l,'buy'))});
  var m=$('mine-grid');m.innerHTML='';
  var mine=account?listings.filter(function(l){return l.seller&&l.seller.toLowerCase()===account.toLowerCase()}):[];
  if(!account) m.innerHTML='<div class="empty">Connect wallet untuk melihat listing kamu.</div>';
  else if(!mine.length) m.innerHTML='<div class="empty">Kamu belum punya listing.</div>';
  mine.forEach(function(l){m.appendChild(card(l,'mine'))});
  $('s-listed').textContent=listings.length;
  $('s-floor').textContent=listings.length?fmt(Math.min.apply(null,listings.map(function(l){return l.price})))+' BNB':'–';
  $('s-roy').textContent=(roy/100)+'%';
}
async function load(){
  if(!LIVE){ $('demo-banner').hidden=false; listings=DEMO.map(function(r){return{img:'/'+r[0],rar:r[1],name:r[2],id:r[3],price:r[4],glow:r[5],seller:null}}); render(); return; }
  $('f-market').textContent=short(C.MARKET_ADDRESS); $('f-nft').textContent=short(C.NFT_ADDRESS);
  try{
    var p=new ethers.JsonRpcProvider(C.RPC), m=new ethers.Contract(C.MARKET_ADDRESS,MKT_ABI,p);
    roy=Number(await m.royaltyBps()); var r=await m.activeListings();
    listings=r[0].map(function(id,i){return{id:Number(id),seller:r[1][i],price:+ethers.formatEther(r[2][i]),priceWei:r[2][i],img:'/cut-witch.webp',name:'Spirit #'+id,rar:''}});
    render();
    for(const l of listings){ var mm=await loadMeta(l.id); l.img=mm.img;l.name=mm.name;l.rar=mm.rar; } render();
  }catch(e){ toast('Gagal memuat listing. Coba refresh.'); }
}
async function connect(){
  if(!window.ethereum){ toast('Wallet tidak ditemukan. Buka di browser MetaMask / Trust Wallet / Binance Wallet.'); return false; }
  try{
    var accs=await window.ethereum.request({method:'eth_requestAccounts'}); account=accs[0];
    var hex='0x'+Number(C.CHAIN_ID||56).toString(16);
    if((await window.ethereum.request({method:'eth_chainId'}))!==hex){
      try{ await window.ethereum.request({method:'wallet_switchEthereumChain',params:[{chainId:hex}]}); }
      catch(e){ if(e.code===4902) await window.ethereum.request({method:'wallet_addEthereumChain',params:[{chainId:hex,chainName:'BNB Smart Chain',nativeCurrency:{name:'BNB',symbol:'BNB',decimals:18},rpcUrls:[C.RPC],blockExplorerUrls:[C.EXPLORER]}]}); else throw e; }
    }
    if(window.ethers){ signer=await new ethers.BrowserProvider(window.ethereum).getSigner(); }
    $('connect').textContent=short(account); render(); return true;
  }catch(e){ toast('Koneksi wallet dibatalkan.'); return false; }
}
function needLive(){ if(!LIVE){ toast('Market aktif setelah kontrak dideploy.'); return true; } return false; }
async function buy(l){ if(needLive())return; if(!signer&&!(await connect()))return;
  try{ var m=new ethers.Contract(C.MARKET_ADDRESS,MKT_ABI,signer); toast('Konfirmasi pembelian di wallet…'); var tx=await m.buy(l.id,{value:l.priceWei}); toast('Menunggu konfirmasi…'); await tx.wait(); toast('Berhasil! #'+l.id+' sekarang milikmu.'); load(); }
  catch(e){ toast('Transaksi gagal atau dibatalkan.'); } }
async function cancel(l){ if(needLive())return; if(!signer&&!(await connect()))return;
  try{ var m=new ethers.Contract(C.MARKET_ADDRESS,MKT_ABI,signer); var tx=await m.cancel(l.id); toast('Menunggu konfirmasi…'); await tx.wait(); toast('Listing dibatalkan.'); load(); }
  catch(e){ toast('Transaksi gagal atau dibatalkan.'); } }
async function sell(){ if(needLive())return; if(!signer&&!(await connect()))return;
  var id=$('sell-id').value, pr=$('sell-price').value; if(id===''||!(+pr>0)){ toast('Isi token ID dan harga.'); return; }
  try{ var n=new ethers.Contract(C.NFT_ADDRESS,NFT_ABI,signer), m=new ethers.Contract(C.MARKET_ADDRESS,MKT_ABI,signer);
    if((await n.ownerOf(id)).toLowerCase()!==account.toLowerCase()){ toast('Token ini bukan milik wallet kamu.'); return; }
    if(!(await n.isApprovedForAll(account,C.MARKET_ADDRESS))){ toast('Langkah 1: setujui akses market di wallet…'); await (await n.setApprovalForAll(C.MARKET_ADDRESS,true)).wait(); }
    toast('Langkah 2: konfirmasi listing di wallet…'); await (await m.list(id,ethers.parseEther(String(pr)))).wait(); toast('Listing aktif!'); $('sell-id').value='';$('sell-price').value=''; load();
  }catch(e){ toast('Transaksi gagal atau dibatalkan.'); } }
$('connect').addEventListener('click',connect); $('sell-btn').addEventListener('click',sell);
$('sort').addEventListener('change',render); $('search').addEventListener('input',render);
$('sell-price').addEventListener('input',function(){var v=+this.value;$('sell-calc').textContent='Kamu terima: '+(v>0?fmt(v*(1-roy/10000)):'–')+' BNB (setelah royalti '+(roy/100)+'%)';});
document.querySelectorAll('[role=tab]').forEach(function(t){t.addEventListener('click',function(){document.querySelectorAll('[role=tab]').forEach(function(x){x.setAttribute('aria-selected',x===t)});document.querySelectorAll('[data-panel]').forEach(function(p){p.hidden=p.dataset.panel!==t.dataset.tab});});});
if(window.ethereum&&window.ethereum.on) window.ethereum.on('accountsChanged',function(a){account=a[0]||null;signer=null;$('connect').textContent=account?short(account):'Connect Wallet';render();});
load();
})();
