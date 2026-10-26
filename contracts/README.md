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
