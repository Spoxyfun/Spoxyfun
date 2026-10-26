(function(){
var C=window.SPOXY_CONFIG||{}; if(!C.NFT_ADDRESS||!window.ethers) return;
var ABI=["function mint(uint256 qty,bool publicTier) payable","function mintOpen() view returns (bool)","function freePrice() view returns (uint256)","function publicPrice() view returns (uint256)","function totalSupply() view returns (uint256)","function legendaryMinted() view returns (uint256)","function minted(address) view returns (uint256)","event Minted(address indexed to,uint256 indexed tokenId,bool legendary,bool publicTier)"];
var btn=document.getElementById('mint-btn'), note=document.getElementById('mint-notice');
var RPCS=[C.RPC,'https://bsc-dataseed1.defibit.io','https://bsc.publicnode.com','https://bsc-dataseed2.binance.org'], ri=0;
function mk(){ return new ethers.Contract(C.NFT_ADDRESS,ABI,new ethers.JsonRpcProvider(RPCS[ri%RPCS.length],56,{staticNetwork:true,batchMaxCount:1})); }
var ro=mk(), prices=null;
function emsg(e){ return (e&&(e.shortMessage||e.reason||(e.info&&e.info.error&&e.info.error.message)||(e.error&&e.error.message)||e.message))||String(e); }
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
  }).catch(function(){ ri++; ro=mk(); });
}
refresh(); setInterval(refresh,20000);
btn.addEventListener('click',async function(e){
  e.stopImmediatePropagation(); e.preventDefault();
  if(!window.ethereum){ say('Buka di browser wallet (MetaMask / Trust Wallet / Binance Wallet).'); return; }
  try{
    var acc=(await ethereum.request({method:'eth_requestAccounts'}))[0], hex='0x'+Number(C.CHAIN_ID).toString(16);
    if((await ethereum.request({method:'eth_chainId'}))!==hex){
      try{ await ethereum.request({method:'wallet_switchEthereumChain',params:[{chainId:hex}]}); }
      catch(se){ if(se&&(se.code===4902||String(se.message).indexOf('Unrecognized')>-1)) await ethereum.request({method:'wallet_addEthereumChain',params:[{chainId:hex,chainName:'BNB Smart Chain',nativeCurrency:{name:'BNB',symbol:'BNB',decimals:18},rpcUrls:['https://bsc-dataseed.binance.org'],blockExplorerUrls:['https://bscscan.com']}]}); else throw se; }
    }
    var bp=new ethers.BrowserProvider(window.ethereum), c=new ethers.Contract(C.NFT_ADDRESS,ABI,await bp.getSigner());
    if(!(await c.mintOpen())){ say('Mint segera dibuka. Pantau akun X resmi SPOXY.'); return; }
    var qty=parseInt((document.getElementById('qty')||{}).textContent||'1',10)||1, pub=isPublic();
    if(Number(await c.minted(acc))+qty>10){ say('Maksimal 10 per wallet.'); return; }
    var price=pub?await c.publicPrice():await c.freePrice(), bal=await bp.getBalance(acc);
    if(bal<price*BigInt(qty)){ say('Saldo BNB tidak cukup. Butuh '+ethers.formatEther(price*BigInt(qty))+' BNB + gas.'); return; }
    say('Periksa detail di wallet lalu konfirmasi…');
    var tx=await c.mint(qty,pub,{value:price*BigInt(qty)}); say('Menunggu konfirmasi…'); var rc=await tx.wait();
    var leg=0; rc.logs.forEach(function(lg){ try{ var ev=c.interface.parseLog(lg); if(ev&&ev.name==='Minted'&&ev.args.legendary) leg++; }catch(_){} });
    say(leg?('🎉 LEGENDARY! Kamu dapat '+leg+' Legendary dari '+qty+' Cyber Spirit.'):('Berhasil! '+qty+' Cyber Spirit masuk ke wallet kamu.'));
    refresh();
  }catch(err){ var m=emsg(err); if(err&&(err.code===4001||err.code==='ACTION_REJECTED'||/reject|denied|cancel/i.test(m))) say('Transaksi dibatalkan di wallet.'); else say('Mint gagal: '+m.slice(0,140)); }
},true);
})();
