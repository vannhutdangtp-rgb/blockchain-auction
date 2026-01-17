// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Auction {
    address public owner;
    string public itemName;
    uint256 public endTime;

    address public highestBidder;
    uint256 public highestBid;

    bool public ended;

    mapping(address => uint256) public pendingReturns;

    event HighestBidIncreased(address bidder, uint256 amount);
    event AuctionEnded(address winner, uint256 amount);

    constructor(string memory _itemName, uint256 _biddingTime) {
        owner = msg.sender;
        itemName = _itemName;
        endTime = block.timestamp + _biddingTime;
    }

    modifier onlyBeforeEnd() {
        require(block.timestamp < endTime, "Auction already ended");
        _;
    }

    modifier onlyAfterEnd() {
        require(block.timestamp >= endTime, "Auction not yet ended");
        _;
    }

    function bid() external payable onlyBeforeEnd {
        require(msg.value > highestBid, "Bid must be higher than current");

        if (highestBid != 0) {
            pendingReturns[highestBidder] += highestBid;
        }

        highestBidder = msg.sender;
        highestBid = msg.value;

        emit HighestBidIncreased(msg.sender, msg.value);
    }

    function withdraw() external returns (bool) {
        uint256 amount = pendingReturns[msg.sender];
        require(amount > 0, "Nothing to withdraw");

        pendingReturns[msg.sender] = 0;
        payable(msg.sender).transfer(amount);

        return true;
    }

    function endAuction() external onlyAfterEnd {
        require(!ended, "Auction already ended");
        require(msg.sender == owner, "Only owner can end");

        ended = true;
        emit AuctionEnded(highestBidder, highestBid);

        payable(owner).transfer(highestBid);
    }
}
