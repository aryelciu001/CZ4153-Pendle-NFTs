pragma solidity 0.7.6;

import "./openzeppelin/access/Ownable.sol";
import "./openzeppelin/token/ERC721/ERC721.sol";
// import "./core/abstractV2/PendleLiquidityMiningBaseV2.sol";

contract PendleItemFactory is Ownable, ERC721 {
    event NewItem(uint id, string name, uint dna);
    
    struct Item {
        string name;
        uint dna;
    }
    
    // array of items
    Item[] items;
    
    // map address to how many items this address has
    mapping (address => uint) addressToNumberOfItems;
    
    // map cat id to owner address
    mapping (uint => address) itemIdToAddress;
    
    // map cat id to approved operator
    mapping (uint => address) itemIdToApprovedOp;
    
    // this should be called by pendle reward system
    // because every item is created internally, 
    // contract needs to send the item to address 
    // by triggering safeTransferFrom function
    function createNewItem(string memory _name) public {
        uint dna = uint(keccak256(abi.encodePacked(_name)));
        items.push(Item(_name, dna));
        uint id = items.length - 1;
        emit NewItem(id, _name, dna);
        addressToNumberOfItems[msg.sender]++;
        itemIdToAddress[id] = msg.sender;
    }

    // when contract is deployed
    // this will be run
    constructor () ERC721("PendleItem", "PITM") {
        // createNewItem("first");
    }
    
    // ERC-721 functions
    
    // means only token owner or approved address can execute
    modifier isAbleToSend(uint tokenId) {
        require(itemIdToAddress[tokenId] == msg.sender || getApproved(tokenId) == msg.sender);
        _;
    }
    
    // means only token owner can execute
    modifier isOwner(uint tokenId) {
        require(itemIdToAddress[tokenId] == msg.sender);
        _;
    }
    
    // get how many tokens owned by an address
    function balanceOf(address owner) override public view returns(uint) {
        return addressToNumberOfItems[owner];
    }
    
    // get the address of a token
    function ownerOf(uint tokenId) override public view returns(address) {
        return itemIdToAddress[tokenId];
    }
    
    // transfer token
    function safeTransferFrom(address from, address to, uint tokenId) override public isAbleToSend(tokenId) {
        require(itemIdToAddress[tokenId] == from);
        addressToNumberOfItems[from]--;
        addressToNumberOfItems[to]++;
        itemIdToAddress[tokenId] = to;
        emit Transfer(from, to, tokenId);
    }

    // approve an address to transfer a token
    function approve(address to, uint tokenId) override public isOwner(tokenId) {
        itemIdToApprovedOp[tokenId] = to;
        emit Approval(msg.sender, to, tokenId);
    }

    // get approved address for a token
    function getApproved(uint tokenId) override public view returns(address) {
        return itemIdToApprovedOp[tokenId];
    }
    
    // ERC-721 functions
}