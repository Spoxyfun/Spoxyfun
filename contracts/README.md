# SPOXY contracts

## SpoxyMarket.sol
Fixed-price marketplace for SPOXY Cyber Spirits on BNB Smart Chain.
- No escrow: NFT stays in seller wallet until sold (seller approves the market once).
- Buyer pays exact price in BNB; royalty (default 5%, max 10%) to `royaltyReceiver`, rest to seller.
- Owner can change royalty/receiver and pause new listings.
- Compiles with solc 0.8.24 (optimizer 200). ABI: `SpoxyMarket.abi.json`.
- NOT AUDITED. Test on BSC testnet (chainId 97) first.

## Deploy (Remix)
1. Deploy the SPOXY ERC-721 contract first.
2. Open remix.ethereum.org, paste `SpoxyMarket.sol`, compile with 0.8.24.
3. Deploy with `nft_` = SPOXY NFT address, `royaltyReceiver_` = your wallet.
4. Put both addresses into `/market-config.js` and push. The Market page leaves preview mode automatically.

## SpoxySpirits.sol (NFT)
- ERC-721 Enumerable + ERC-2981 (5% royalty), OpenZeppelin 5.1, solc 0.8.24, optimizer 200, evm paris.
- 1,031 supply, token IDs 1..1031, max 10 per wallet.
- Phase 0 closed, 1 POA allowlist (0.0007 BNB), 2 public (0.007 BNB).
- Unrevealed URI: https://spoxydev.fun/meta/hidden.json; `reveal("ipfs://CID/")` later -> CID/{id}.json.
- `withdraw()` sends mint BNB to owner.

## Easiest deploy
Open https://spoxydev.fun/deploy.html in a wallet browser, pick BSC Testnet, deploy NFT then Market.

## v2 (current) — SpoxySpirits without allowlist
- Free Mint 0.0007 BNB (Legendary chance = Legendary left / supply left), Public 0.007 BNB (60% Legendary until 66 are minted).
- 66 Legendary cap; rarity rolled on-chain (pseudo-random, prevrandao + blockhash, EOA-only). Not VRF.
- Owner: setMintOpen, setPrices, reveal, setPreviewURIs, setRoyalty, withdraw.
- v1 (0x28218C0C...cAAab, allowlist version) is abandoned; it was never opened.
