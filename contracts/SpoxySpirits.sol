// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/*
  SPOXY · Cyber Spirits v2 — 1,031 NFTs on BNB Smart Chain. No allowlist.
  Two tiers, open to every wallet while mint is open:
    - Free Mint  (0.0007 BNB): Legendary chance = Legendary left / supply left (random).
    - Public     (0.007 BNB):  60% Legendary chance per NFT, until all 66 Legendary are minted.
  Max 10 per wallet (both tiers combined). Rarity is rolled on-chain at mint and stored (isLegendary).
  Randomness uses block.prevrandao + blockhash; contracts cannot mint (EOA only) to block revert-on-roll tricks.
  It is pseudo-random, not VRF. NOT AUDITED.
*/
contract SpoxySpirits is ERC721Enumerable, ERC2981, Ownable, ReentrancyGuard {
    using Strings for uint256;

    uint256 public constant MAX_SUPPLY = 1031;
    uint256 public constant MAX_LEGENDARY = 66;
    uint256 public constant MAX_PER_WALLET = 10;
    uint256 public constant PUBLIC_LEGENDARY_BPS = 6000; // 60%

    uint256 public freePrice = 0.0007 ether;
    uint256 public publicPrice = 0.007 ether;
    bool public mintOpen;
    bool public revealed;
    uint256 public legendaryMinted;

    string private _baseTokenURI;
    string public unrevealedURI;
    string public legendaryPreviewURI;

    mapping(address => uint256) public minted;
    mapping(uint256 => bool) public isLegendary;

    event Minted(address indexed to, uint256 indexed tokenId, bool legendary, bool publicTier);

    constructor(string memory unrevealedURI_, string memory legendaryPreviewURI_, address royaltyReceiver)
        ERC721("SPOXY Cyber Spirits", "SPOXY")
        Ownable(msg.sender)
    {
        unrevealedURI = unrevealedURI_;
        legendaryPreviewURI = legendaryPreviewURI_;
        _setDefaultRoyalty(royaltyReceiver, 500); // 5%
    }

    function mint(uint256 qty, bool publicTier) external payable nonReentrant {
        require(mintOpen, "mint closed");
        require(msg.sender == tx.origin, "EOA only");
        require(qty > 0, "qty 0");
        require(totalSupply() + qty <= MAX_SUPPLY, "sold out");
        require(minted[msg.sender] + qty <= MAX_PER_WALLET, "max 10 per wallet");
        require(msg.value == (publicTier ? publicPrice : freePrice) * qty, "wrong BNB amount");
        minted[msg.sender] += qty;

        for (uint256 i; i < qty; i++) {
            uint256 id = totalSupply() + 1; // 1..1031
            bool leg = _roll(id, publicTier);
            if (leg) { isLegendary[id] = true; legendaryMinted++; }
            _safeMint(msg.sender, id);
            emit Minted(msg.sender, id, leg, publicTier);
        }
    }

    function _roll(uint256 id, bool publicTier) private view returns (bool) {
        uint256 legLeft = MAX_LEGENDARY - legendaryMinted;
        if (legLeft == 0) return false;
        uint256 supplyLeft = MAX_SUPPLY - (id - 1);
        if (legLeft >= supplyLeft) return true; // guarantee all 66 exist
        uint256 r = uint256(keccak256(abi.encodePacked(block.prevrandao, blockhash(block.number - 1), msg.sender, id))) % 10000;
        if (publicTier) return r < PUBLIC_LEGENDARY_BPS;
        return r < (legLeft * 10000) / supplyLeft;
    }

    // ---- owner ----
    function setMintOpen(bool open) external onlyOwner { mintOpen = open; }
    function setPrices(uint256 free_, uint256 pub_) external onlyOwner { freePrice = free_; publicPrice = pub_; }
    function reveal(string calldata baseURI_) external onlyOwner { _baseTokenURI = baseURI_; revealed = true; }
    function setPreviewURIs(string calldata hidden_, string calldata legendary_) external onlyOwner { unrevealedURI = hidden_; legendaryPreviewURI = legendary_; }
    function setRoyalty(address receiver, uint96 bps) external onlyOwner { require(bps <= 1000, "max 10%"); _setDefaultRoyalty(receiver, bps); }
    function withdraw() external onlyOwner nonReentrant {
        (bool ok, ) = payable(owner()).call{value: address(this).balance}("");
        require(ok, "withdraw failed");
    }

    // ---- views ----
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        if (revealed) return string.concat(_baseTokenURI, tokenId.toString(), ".json");
        return isLegendary[tokenId] ? legendaryPreviewURI : unrevealedURI;
    }

    function supportsInterface(bytes4 id) public view override(ERC721Enumerable, ERC2981) returns (bool) {
        return super.supportsInterface(id);
    }
}
