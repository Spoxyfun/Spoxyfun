(function(){
var C=window.SPOXY_CONFIG||{}; if(!C.NFT_ADDRESS||!window.ethers) return;
var ABI=["function mint(uint256 qty) payable","function phase() view returns (uint8)","function poaPrice() view returns (uint256)","function publicPrice() view returns (uint256)","function totalSupply() view returns (uint256)","function allowlist(address) view returns (bool)"];
var btn=document.getElementById('mint-btn'), note=document.getElementById('mint-notice');
var ro=new ethers.Contract(C.NFT_ADDRESS,ABI,new ethers.JsonRpcProvider(C.RPC));
function say(t){ if(note){note.hidden=false;note.textContent=t;} }
ro.totalSupply().then(function(n){ document.querySelectorAll('*').forEach(function(el){ if(el.children.length===0&&/^0 \/ 1,031$/.test(el.textContent.trim())) el.textContent=Number(n).toLocaleString('en-US')+' / 1,031'; }); var bar=document.querySelector('.x-bar span'); if(bar) bar.style.width=(Number(n)/1031*100)+'%'; }).catch(function(){});
ro.phase().then(function(p){ p=Number(p); if(p===0){ btn.textContent='Mint opens 31 Oct 2026'; return; }
  var live=p===1?'Mint LIVE · POA / Agent ID 0.0007 BNB':'Mint LIVE · Public 0.007 BNB';
  document.querySelectorAll('.x-status').forEach(function(el){ el.textContent=live; });
  btn.textContent='Mint Now';
  if(p===2){ var pub=document.querySelector('.x-tiers button[data-price="0.007"]'); if(pub) pub.click(); }
  var n=document.getElementById('mint-notice'); if(n){ n.hidden=true; }
}).catch(function(){});
btn.addEventListener('click',async function(e){
  e.stopImmediatePropagation(); e.preventDefault();
  if(!window.ethereum){ say('Buka di browser wallet (MetaMask / Trust Wallet / Binance Wallet).'); return; }
  try{
    var p=Number(await ro.phase()); if(p===0){ say('Mint belum dibuka. Mint dibuka 31 Oktober 2026.'); return; }
    var acc=(await ethereum.request({method:'eth_requestAccounts'}))[0], hex='0x'+Number(C.CHAIN_ID).toString(16);
    if((await ethereum.request({method:'eth_chainId'}))!==hex) await ethereum.request({method:'wallet_switchEthereumChain',params:[{chainId:hex}]});
    if(p===1 && !(await ro.allowlist(acc))){ say('Wallet ini belum terdaftar POA / Agent ID. Tunggu fase publik.'); return; }
    var qty=parseInt((document.getElementById('qty')||{}).textContent||'1',10)||1;
    var price=p===1?await ro.poaPrice():await ro.publicPrice();
    var c=new ethers.Contract(C.NFT_ADDRESS,ABI,await new ethers.BrowserProvider(window.ethereum).getSigner());
    say('Periksa detail di wallet lalu konfirmasi…');
    var tx=await c.mint(qty,{value:price*BigInt(qty)}); say('Menunggu konfirmasi…'); await tx.wait();
    say('Berhasil! '+qty+' Cyber Spirit masuk ke wallet kamu.');
  }catch(err){ say('Mint gagal atau dibatalkan: '+(err.shortMessage||err.reason||'').slice(0,90)); }
},true);
})();
