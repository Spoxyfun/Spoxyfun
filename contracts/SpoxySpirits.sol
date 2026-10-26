// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/*
  SPOXY · Cyber Spirits — 1,031 NFTs on BNB Smart Chain.
  Phases: 0 = closed, 1 = POA / Agent ID (allowlist, 0.0007 BNB), 2 = public (0.007 BNB).
  Max 10 per wallet (across phases). Unrevealed until owner calls reveal().
  NOT AUDITED. Test on BSC testnet first.
*/
contract SpoxySpirits is ERC721Enumerable, ERC2981, Ownable, ReentrancyGuard {
    using Strings for uint256;

    uint256 public constant MAX_SUPPLY = 1031;
    uint256 public constant MAX_PER_WALLET = 10;
    uint256 public poaPrice = 0.0007 ether;
    uint256 public publicPrice = 0.007 ether;

    uint8 public phase;              // 0 closed, 1 POA, 2 public
    bool public revealed;
    string private _baseTokenURI;    // e.g. ipfs://CID/  -> ipfs://CID/1.json
    string public unrevealedURI;     // e.g. ipfs://CID/hidden.json

    mapping(address => bool) public allowlist;
    mapping(address => uint256) public minted;

    event PhaseChanged(uint8 phase);
    event Revealed(string baseURI);

    constructor(string memory unrevealedURI_, address royaltyReceiver)
        ERC721("SPOXY Cyber Spirits", "SPOXY")
        Ownable(msg.sender)
    {
        unrevealedURI = unrevealedURI_;
        _setDefaultRoyalty(royaltyReceiver, 500); // 5%
    }

    function mint(uint256 qty) external payable nonReentrant {
        require(phase == 1 || phase == 2, "mint closed");
        require(qty > 0, "qty 0");
        require(totalSupply() + qty <= MAX_SUPPLY, "sold out");
        require(minted[msg.sender] + qty <= MAX_PER_WALLET, "max 10 per wallet");
        uint256 price;
        if (phase == 1) { require(allowlist[msg.sender], "not on POA list"); price = poaPrice; }
        else { price = publicPrice; }
        require(msg.value == price * qty, "wrong BNB amount");
        minted[msg.sender] += qty;
        uint256 next = totalSupply();
        for (uint256 i = 1; i <= qty; i++) _safeMint(msg.sender, next + i); // token IDs 1..1031
    }

    // ---- owner ----
    function setPhase(uint8 p) external onlyOwner { require(p <= 2, "bad phase"); phase = p; emit PhaseChanged(p); }
    function setAllowlist(address[] calldata addrs, bool on) external onlyOwner { for (uint256 i; i < addrs.length; i++) allowlist[addrs[i]] = on; }
    function setPrices(uint256 poa, uint256 pub) external onlyOwner { poaPrice = poa; publicPrice = pub; }
    function reveal(string calldata baseURI_) external onlyOwner { _baseTokenURI = baseURI_; revealed = true; emit Revealed(baseURI_); }
    function setUnrevealedURI(string calldata u) external onlyOwner { unrevealedURI = u; }
    function setRoyalty(address receiver, uint96 bps) external onlyOwner { require(bps <= 1000, "max 10%"); _setDefaultRoyalty(receiver, bps); }
    function ownerMint(address to, uint256 qty) external onlyOwner {
        require(totalSupply() + qty <= MAX_SUPPLY, "sold out");
        uint256 next = totalSupply();
        for (uint256 i = 1; i <= qty; i++) _safeMint(to, next + i);
    }
    function withdraw() external onlyOwner nonReentrant {
        (bool ok, ) = payable(owner()).call{value: address(this).balance}("");
        require(ok, "withdraw failed");
    }

    // ---- views ----
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        if (!revealed) return unrevealedURI;
        return string.concat(_baseTokenURI, tokenId.toString(), ".json");
    }

    function supportsInterface(bytes4 id) public view override(ERC721Enumerable, ERC2981) returns (bool) {
        return super.supportsInterface(id);
    }
}
