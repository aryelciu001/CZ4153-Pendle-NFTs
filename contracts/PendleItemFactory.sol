pragma solidity 0.7.6;
pragma abicoder v2;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./openzeppelin/ERC721.sol";

contract PendleItemFactory is Ownable, ERC721 {
    event NewItem(uint id, string name, uint dna);
    
    struct Item {
        string name;
        uint dna;
    }
    
    // contract owner
    address public contractOwner;

    // array of items
    Item[] items;
    
    // map address to how many items this address has
    mapping (address => uint) public addressToNumberOfItems;
    
    // map item id to owner address
    mapping (uint => address) public itemIdToAddress;

    // map item id to address allowed to transfer item
    mapping (uint => address) itemIdToApprovedOp;

    // when contract is deployed
    // this will be run
    constructor () ERC721("PendleItem", "PITM") {
        contractOwner = msg.sender;
        for (uint256 i = 1; i<=100; i++) {
            _createNewItem(_appendUintToString("Pendle", i));
        }
    }

    // this should be called by pendle reward system
    // because every item is created internally, 
    // contract needs to send the item to address 
    // by triggering safeTransferFrom function
    function _createNewItem(string memory _name) internal {
        require(msg.sender == contractOwner);
        uint dna = uint(keccak256(abi.encodePacked(_name)));
        items.push(Item(_name, dna));
        uint id = items.length - 1;
        emit NewItem(id, _name, dna);
        addressToNumberOfItems[msg.sender]++;
        itemIdToAddress[id] = msg.sender;
    }

    function getContractOwner() public view returns(address) {
        return contractOwner;
    }

    function _appendUintToString(string memory inStr, uint v) internal returns (string memory str) {
        uint maxlength = 100;
        bytes memory reversed = new bytes(maxlength);
        uint i = 0;
        while (v != 0) {
            uint remainder = v % 10;
            v = v / 10;
            reversed[i++] = byte(uint8(48 + remainder));
        }
        bytes memory inStrb = bytes(inStr);
        bytes memory s = new bytes(inStrb.length + i);
        uint j;
        for (j = 0; j < inStrb.length; j++) {
            s[j] = inStrb[j];
        }
        for (j = 0; j < i; j++) {
            s[j + inStrb.length] = reversed[i - 1 - j];
        }
        str = string(s);
    }

    function getAllItems() public view returns(Item [] memory) {
        return items;
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