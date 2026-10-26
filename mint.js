(function(){
var C=window.SPOXY_CONFIG||{}; if(!C.NFT_ADDRESS||!window.ethers) return;
var ABI=["function mint(uint256 qty,bool publicTier) payable","function mintOpen() view returns (bool)","function freePrice() view returns (uint256)","function publicPrice() view returns (uint256)","function totalSupply() view returns (uint256)","function legendaryMinted() view returns (uint256)","function minted(address) view returns (uint256)","event Minted(address indexed to,uint256 indexed tokenId,bool legendary,bool publicTier)"];
var btn=document.getElementById('mint-btn'), note=document.getElementById('mint-notice');
var RPCS=['https://bsc-rpc.publicnode.com',C.RPC,'https://bsc-dataseed1.defibit.io','https://bsc-dataseed2.binance.org','https://1rpc.io/bnb'], ri=0;
function mk(){ return new ethers.Contract(C.NFT_ADDRESS,ABI,new ethers.JsonRpcProvider(RPCS[ri%RPCS.length],56,{staticNetwork:true,batchMaxCount:1})); }
var ro=mk(), prices=null;
function emsg(e){ return (e&&(e.shortMessage||e.reason||(e.info&&e.info.error&&e.info.error.message)||(e.error&&e.error.message)||e.message))||String(e); }
function say(t){ if(note){note.hidden=false;note.textContent=t;} }
function isPublic(){ var b=document.querySelector('.x-tiers button[aria-pressed="true"]'); return !!(b&&b===document.querySelectorAll('.x-tiers button')[1]); }
function setStatus(t){ document.querySelectorAll('.x-status').forEach(function(el){ el.textContent=t; }); }
var busy=false;
function refresh(){
  if(busy) return; busy=true;
  Promise.all([ro.totalSupply(),ro.legendaryMinted(),ro.mintOpen()]).then(function(r){
    var n=Number(r[0]), l=Number(r[1]);
    var b=document.querySelector('.x-progress__top b'); if(b) b.textContent=n.toLocaleString('en-US')+' / 1,031';
    var bar=document.querySelector('.x-bar span'); if(bar) bar.style.width=(n/1031*100)+'%';
    var o=document.getElementById('odds-live'); if(o) o.textContent='Legendary left: '+(66-l)+' / 66';
    if(n>=1031){ setStatus('Sold out'); btn.textContent='Sold out'; }
    else if(r[2]){ setStatus('Mint LIVE · '+(66-l)+' Legendary left'); if(btn.textContent!=='Mint Now') btn.textContent='Mint Now'; }
    else { setStatus('Mint paused'); btn.textContent='Mint paused'; }
  }).catch(function(){ ri++; ro=mk(); }).finally(function(){ busy=false; });
}
refresh(); setInterval(function(){ if(!document.hidden) refresh(); },3000);
btn.addEventListener('click',async function(e){
  e.stopImmediatePropagation(); e.preventDefault();
  if(!window.ethereum){ say('Open this page in a wallet browser (MetaMask / Trust Wallet / Binance Wallet).'); return; }
  try{
    var acc=(await ethereum.request({method:'eth_requestAccounts'}))[0], hex='0x'+Number(C.CHAIN_ID).toString(16);
    if((await ethereum.request({method:'eth_chainId'}))!==hex){
      try{ await ethereum.request({method:'wallet_switchEthereumChain',params:[{chainId:hex}]}); }
      catch(se){ if(se&&(se.code===4902||String(se.message).indexOf('Unrecognized')>-1)) await ethereum.request({method:'wallet_addEthereumChain',params:[{chainId:hex,chainName:'BNB Smart Chain',nativeCurrency:{name:'BNB',symbol:'BNB',decimals:18},rpcUrls:['https://bsc-dataseed.binance.org'],blockExplorerUrls:['https://bscscan.com']}]}); else throw se; }
    }
    var bp=new ethers.BrowserProvider(window.ethereum), c=new ethers.Contract(C.NFT_ADDRESS,ABI,await bp.getSigner());
    if(!(await c.mintOpen())){ say('Mint opens soon. Follow the official SPOXY X account.'); return; }
    var qty=parseInt((document.getElementById('qty')||{}).textContent||'1',10)||1, pub=isPublic();
    if(Number(await c.minted(acc))+qty>10){ say('Max 10 per wallet.'); return; }
    var price=pub?await c.publicPrice():await c.freePrice(), bal=await bp.getBalance(acc);
    if(bal<price*BigInt(qty)){ say('Not enough BNB. You need '+ethers.formatEther(price*BigInt(qty))+' BNB + gas.'); return; }
    say('Check the details in your wallet and confirm…');
    var tx=await c.mint(qty,pub,{value:price*BigInt(qty)}); say('Waiting for confirmation…'); var rc=await tx.wait();
    var leg=0; rc.logs.forEach(function(lg){ try{ var ev=c.interface.parseLog(lg); if(ev&&ev.name==='Minted'&&ev.args.legendary) leg++; }catch(_){} });
    say(leg?('🎉 LEGENDARY! You got '+leg+' Legendary out of '+qty+' Cyber Spirit.'):('Success! '+qty+' Cyber Spirit added to your wallet.'));
    refresh();
  }catch(err){ var m=emsg(err); if(err&&(err.code===4001||err.code==='ACTION_REJECTED'||/reject|denied|cancel/i.test(m))) say('Transaction cancelled in wallet.'); else say('Mint failed: '+m.slice(0,140)); }
},true);
})();
