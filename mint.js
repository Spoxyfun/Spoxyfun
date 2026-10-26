(function(){
var C=window.SPOXY_CONFIG||{}; if(!C.NFT_ADDRESS||!window.ethers) return;
var ABI=["function mint(uint256 qty,bool publicTier) payable","function mintOpen() view returns (bool)","function freePrice() view returns (uint256)","function publicPrice() view returns (uint256)","function totalSupply() view returns (uint256)","function legendaryMinted() view returns (uint256)","function minted(address) view returns (uint256)","event Minted(address indexed to,uint256 indexed tokenId,bool legendary,bool publicTier)"];
var btn=document.getElementById('mint-btn'), note=document.getElementById('mint-notice');
var ro=new ethers.Contract(C.NFT_ADDRESS,ABI,new ethers.JsonRpcProvider(C.RPC)), prices=null;
function say(t){ if(note){note.hidden=false;note.textContent=t;} }
function isPublic(){ var b=document.querySelector('.x-tiers button[aria-pressed="true"]'); return !!(b&&b===document.querySelectorAll('.x-tiers button')[1]); }
function refresh(){
  Promise.all([ro.totalSupply(),ro.legendaryMinted(),ro.mintOpen(),ro.freePrice(),ro.publicPrice()]).then(function(r){
    var n=Number(r[0]), l=Number(r[1]); prices=[r[3],r[4]];
    var b=document.querySelector('.x-progress__top b'); if(b) b.textContent=n.toLocaleString('en-US')+' / 1,031';
    var bar=document.querySelector('.x-bar span'); if(bar) bar.style.width=(n/1031*100)+'%';
    var o=document.getElementById('odds-live'); if(o) o.textContent='Legendary tersisa: '+(66-l)+' / 66';
    if(r[2]){ document.querySelectorAll('.x-status').forEach(function(el){ el.textContent='Mint LIVE · '+(66-l)+' Legendary left'; }); btn.textContent='Mint Now'; if(note) note.hidden=true; }
    else btn.textContent='Mint opening soon';
  }).catch(function(){});
}
refresh(); setInterval(refresh,20000);
btn.addEventListener('click',async function(e){
  e.stopImmediatePropagation(); e.preventDefault();
  if(!window.ethereum){ say('Buka di browser wallet (MetaMask / Trust Wallet / Binance Wallet).'); return; }
  try{
    if(!(await ro.mintOpen())){ say('Mint segera dibuka. Pantau akun X resmi SPOXY.'); return; }
    var acc=(await ethereum.request({method:'eth_requestAccounts'}))[0], hex='0x'+Number(C.CHAIN_ID).toString(16);
    if((await ethereum.request({method:'eth_chainId'}))!==hex) await ethereum.request({method:'wallet_switchEthereumChain',params:[{chainId:hex}]});
    var qty=parseInt((document.getElementById('qty')||{}).textContent||'1',10)||1, pub=isPublic();
    if(Number(await ro.minted(acc))+qty>10){ say('Maksimal 10 per wallet.'); return; }
    var price=pub?await ro.publicPrice():await ro.freePrice();
    var c=new ethers.Contract(C.NFT_ADDRESS,ABI,await new ethers.BrowserProvider(window.ethereum).getSigner());
    say('Periksa detail di wallet lalu konfirmasi…');
    var tx=await c.mint(qty,pub,{value:price*BigInt(qty)}); say('Menunggu konfirmasi…'); var rc=await tx.wait();
    var leg=0; rc.logs.forEach(function(lg){ try{ var ev=c.interface.parseLog(lg); if(ev&&ev.name==='Minted'&&ev.args.legendary) leg++; }catch(_){} });
    say(leg?('🎉 LEGENDARY! Kamu dapat '+leg+' Legendary dari '+qty+' Cyber Spirit.'):('Berhasil! '+qty+' Cyber Spirit masuk ke wallet kamu.'));
    refresh();
  }catch(err){ say('Mint gagal atau dibatalkan: '+(err.shortMessage||err.reason||'').slice(0,90)); }
},true);
})();
