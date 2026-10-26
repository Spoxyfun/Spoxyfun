// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/*
  SpoxyMarket — simple fixed-price marketplace for SPOXY Cyber Spirits on BNB Chain.
  - Seller keeps the NFT in their wallet until sold (no escrow); seller must approve this contract.
  - Buyer pays in BNB. Royalty (default 5%) goes to royaltyReceiver, rest to seller.
  - Owner can change royalty (max 10%) and receiver, and pause new listings.
  NOT AUDITED. Get a security review before deploying with real funds.
*/

interface IERC721 {
    function ownerOf(uint256 tokenId) external view returns (address);
    function getApproved(uint256 tokenId) external view returns (address);
    function isApprovedForAll(address owner, address operator) external view returns (bool);
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
}

contract SpoxyMarket {
    struct Listing { address seller; uint256 price; }

    IERC721 public immutable nft;
    address public owner;
    address public royaltyReceiver;
    uint96  public royaltyBps = 500; // 5%
    bool    public paused;

    mapping(uint256 => Listing) public listings;
    uint256[] private _active;
    mapping(uint256 => uint256) private _idx; // tokenId => index+1

    uint256 private _lock = 1;

    event Listed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event Cancelled(uint256 indexed tokenId, address indexed seller);
    event Sold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price, uint256 royalty);

    modifier onlyOwner() { require(msg.sender == owner, "not owner"); _; }
    modifier nonReentrant() { require(_lock == 1, "reentrant"); _lock = 2; _; _lock = 1; }

    constructor(address nft_, address royaltyReceiver_) {
        nft = IERC721(nft_);
        owner = msg.sender;
        royaltyReceiver = royaltyReceiver_;
    }

    function list(uint256 tokenId, uint256 price) external {
        require(!paused, "paused");
        require(price > 0, "price 0");
        require(nft.ownerOf(tokenId) == msg.sender, "not token owner");
        require(nft.getApproved(tokenId) == address(this) || nft.isApprovedForAll(msg.sender, address(this)), "approve market first");
        listings[tokenId] = Listing(msg.sender, price);
        if (_idx[tokenId] == 0) { _active.push(tokenId); _idx[tokenId] = _active.length; }
        emit Listed(tokenId, msg.sender, price);
    }

    function cancel(uint256 tokenId) external {
        Listing memory l = listings[tokenId];
        require(l.seller != address(0), "not listed");
        require(l.seller == msg.sender || nft.ownerOf(tokenId) != l.seller, "not seller");
        _remove(tokenId);
        emit Cancelled(tokenId, l.seller);
    }

    function buy(uint256 tokenId) external payable nonReentrant {
        Listing memory l = listings[tokenId];
        require(l.seller != address(0), "not listed");
        require(msg.value == l.price, "wrong price");
        require(nft.ownerOf(tokenId) == l.seller, "seller no longer owns");
        require(msg.sender != l.seller, "own listing");
        _remove(tokenId);
        uint256 royalty = (l.price * royaltyBps) / 10000;
        nft.safeTransferFrom(l.seller, msg.sender, tokenId);
        if (royalty > 0) _pay(royaltyReceiver, royalty);
        _pay(l.seller, l.price - royalty);
        emit Sold(tokenId, l.seller, msg.sender, l.price, royalty);
    }

    function activeListings() external view returns (uint256[] memory ids, address[] memory sellers, uint256[] memory prices) {
        uint256 n = _active.length;
        ids = new uint256[](n); sellers = new address[](n); prices = new uint256[](n);
        for (uint256 i; i < n; i++) { uint256 t = _active[i]; ids[i] = t; sellers[i] = listings[t].seller; prices[i] = listings[t].price; }
    }

    function setRoyalty(address receiver, uint96 bps) external onlyOwner { require(bps <= 1000, "max 10%"); royaltyReceiver = receiver; royaltyBps = bps; }
    function setPaused(bool p) external onlyOwner { paused = p; }
    function transferOwnership(address n) external onlyOwner { require(n != address(0)); owner = n; }

    function _remove(uint256 tokenId) private {
        delete listings[tokenId];
        uint256 i = _idx[tokenId];
        if (i != 0) {
            uint256 last = _active[_active.length - 1];
            _active[i - 1] = last; _idx[last] = i;
            _active.pop(); delete _idx[tokenId];
        }
    }

    function _pay(address to, uint256 amt) private { (bool ok, ) = payable(to).call{value: amt}(""); require(ok, "pay failed"); }
}
