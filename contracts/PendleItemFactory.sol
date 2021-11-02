pragma solidity 0.7.6;
pragma abicoder v2;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./openzeppelin/ERC721.sol";

/*
Mint 100 NFTs initially.

- The initial 100 NFTs will be owned by contract deployer.
- One NFT = 100 reward points
- In one epoch 100, reward points is distributed linearly according to
  your stake in the pool. If you owned 100% of staked pendle, you'll get
  100 reward points
- To make the NFTs valuable, only the initial 100 NFTs are available to redeem

*/

contract PendleItemFactory is Ownable, ERC721 {
    // event
    event NewItem(uint id, string name, uint dna);
    
    struct Item {
        string name; // from Pendle1 to Pendle100
        uint dna; // random. Will be used to generate graphic
    }
    
    // contract owner
    address public contractOwnerAddress;

    // array of items
    Item[] public items;
    
    // map address to how many items this address has
    mapping (address => uint) public addressToNumberOfItems;
    
    // map item id to owner address
    mapping (uint => address) public itemIdToOwnerAddress;

    // map item id to address allowed to transfer item
    mapping (uint => address) itemIdToApprovedOp;

    // constructor will set
    // 1. Contract owner
    // 2. LiquidityMining address (approved to transfer items)
    constructor () ERC721("PendleItem", "PITM") {
        // set important addresses
        contractOwnerAddress = msg.sender;

        // mint 100 NFTs
        for (uint256 i = 1; i<=100; i++) {
            _createNewItem(_appendUintToString("Pendle", i));
        }
    }

    // it must only be used once (during construction of contract)
    function _createNewItem(string memory _name) internal {

        // must be called by contract owner
        require(msg.sender == contractOwnerAddress, 'NOT_OWNER');

        // maximum total items can only be 100
        require(items.length < 100, 'NFTS_MINTED');

        // dna for each item is unique
        uint dna = uint(keccak256(abi.encodePacked(_name)));

        // create new item and save
        items.push(Item(_name, dna));

        // id is just index + 1
        uint id = items.length - 1;
        emit NewItem(id, _name, dna);

        // add number of owned NFTs
        addressToNumberOfItems[msg.sender]++;

        // set newly created item as owner's
        itemIdToOwnerAddress[id] = msg.sender;
    }
    
    // ============================== ERC-721 functions ==============================
    
    // means only token owner or approved address can execute
    modifier isAbleToSend(uint tokenId) {
        require(itemIdToOwnerAddress[tokenId] == msg.sender || getApproved(tokenId) == msg.sender);
        _;
    }
    
    // means only token owner can execute
    modifier isOwner(uint tokenId) {
        require(itemIdToOwnerAddress[tokenId] == msg.sender);
        _;
    }
    
    // get how many tokens owned by an address
    function balanceOf(address owner) override public view returns(uint) {
        return addressToNumberOfItems[owner];
    }
    
    // get the address of a token
    function ownerOf(uint tokenId) override public view returns(address) {
        return itemIdToOwnerAddress[tokenId];
    }
    
    // transfer token
    function safeTransferFrom(address from, address to, uint tokenId) override public isAbleToSend(tokenId) {
        require(itemIdToOwnerAddress[tokenId] == from);
        addressToNumberOfItems[from]--;
        addressToNumberOfItems[to]++;
        itemIdToOwnerAddress[tokenId] = to;

        // once it is transferred, LiquidityMining contract cannot transfer
        // unless explicitly granted by new owner
        itemIdToApprovedOp[tokenId] = address(0); 
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

    // approve an address to transfer all token
    // by right it must be LiquidityMining Address
    function approveForAll(address approvedAddress) public {
        require(msg.sender == contractOwnerAddress, 'NOT_CONTRACT_OWNER');
        for (uint256 i = 0; i<items.length; i++) {
            approve(approvedAddress, i);
        }
    }

    function getOwnedItems() public view returns(uint[] memory) {
        uint256[] memory itemsToReturn = new uint256[](addressToNumberOfItems[msg.sender]);
        uint256 curIndex = 0;
        for (uint256 i = 0; i<items.length; i++) {
            if (itemIdToOwnerAddress[i] == msg.sender) {
                itemsToReturn[curIndex] = i;
                curIndex++;
                if (curIndex == itemsToReturn.length) {
                    return itemsToReturn;
                }
            }
        }
        return itemsToReturn;
    }

    /*
        ============================== HELPERS ==============================
    */

    // create a string with a combination of string and uint256
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
}