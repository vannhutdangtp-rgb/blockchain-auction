// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Auction {

    struct AuctionItem {
        uint256 id;
        string name;
        string description;
        string imageUrl;
        uint256 startingPrice;
        uint256 currentPrice;
        uint256 endTime;
        address payable seller;
        address payable highestBidder;
        bool isCompleted; // CHỈ CẦN BIẾN NÀY
    }

    struct Bid {
        address bidder;
        uint256 amount;
        uint256 timestamp;
    }

    mapping(uint256 => AuctionItem) public auctions;
    mapping(uint256 => Bid[]) public auctionBids;

    // Tiền hoàn cho người bị vượt giá
    mapping(uint256 => mapping(address => uint256)) public pendingReturns;

    uint256 public auctionCounter;
    uint256 public platformFeePercent = 2;
    address payable public owner;

    /* ===================== EVENTS ===================== */
    event AuctionCreated(uint256 auctionId, string name, uint256 startingPrice, uint256 endTime);
    event BidPlaced(uint256 auctionId, address bidder, uint256 amount);
    event AuctionEnded(uint256 auctionId, address winner, uint256 finalPrice);
    event FundsWithdrawn(address user, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor() {
        owner = payable(msg.sender);
    }

    /* ===================== CREATE AUCTION ===================== */
    function createAuction(
        string memory _name,
        string memory _description,
        string memory _imageUrl,
        uint256 _startingPrice,
        uint256 _duration
    ) external {
        require(_startingPrice > 0, "Starting price > 0");
        require(_duration >= 300, "Min 5 minutes");

        uint256 auctionId = auctionCounter++;

        auctions[auctionId] = AuctionItem({
            id: auctionId,
            name: _name,
            description: _description,
            imageUrl: _imageUrl,
            startingPrice: _startingPrice,
            currentPrice: _startingPrice,
            endTime: block.timestamp + _duration,
            seller: payable(msg.sender),
            highestBidder: payable(address(0)),
            isCompleted: false
        });

        emit AuctionCreated(
            auctionId,
            _name,
            _startingPrice,
            block.timestamp + _duration
        );
    }

    /* ===================== PLACE BID ===================== */
    function placeBid(uint256 _auctionId) external payable {
        AuctionItem storage auction = auctions[_auctionId];

        require(!auction.isCompleted, "Auction ended");
        require(block.timestamp < auction.endTime, "Auction ended");
        require(msg.sender != auction.seller, "Seller cannot bid");
        require(msg.value > auction.currentPrice, "Bid too low");

        if (auction.highestBidder != address(0)) {
            pendingReturns[_auctionId][auction.highestBidder] += auction.currentPrice;
        }

        auction.currentPrice = msg.value;
        auction.highestBidder = payable(msg.sender);

        auctionBids[_auctionId].push(
            Bid(msg.sender, msg.value, block.timestamp)
        );

        emit BidPlaced(_auctionId, msg.sender, msg.value);
    }

    /* ===================== END AUCTION ===================== */
    function endAuction(uint256 _auctionId) external {
        AuctionItem storage auction = auctions[_auctionId];

        require(!auction.isCompleted, "Already ended");
        require(block.timestamp >= auction.endTime, "Not finished yet");
        require(
            msg.sender == auction.seller || msg.sender == owner,
            "Not authorized"
        );

        auction.isCompleted = true;

        if (auction.highestBidder != address(0)) {
            uint256 platformFee =
                (auction.currentPrice * platformFeePercent) / 100;

            uint256 sellerAmount =
                auction.currentPrice - platformFee;

            auction.seller.transfer(sellerAmount);
            owner.transfer(platformFee);

            emit AuctionEnded(
                _auctionId,
                auction.highestBidder,
                auction.currentPrice
            );
        } else {
            emit AuctionEnded(_auctionId, address(0), 0);
        }
    }

    /* ===================== WITHDRAW REFUND ===================== */
    function withdraw(uint256 _auctionId) external {
        uint256 amount = pendingReturns[_auctionId][msg.sender];
        require(amount > 0, "Nothing to withdraw");

        pendingReturns[_auctionId][msg.sender] = 0;
        payable(msg.sender).transfer(amount);

        emit FundsWithdrawn(msg.sender, amount);
    }

    /* ===================== VIEW FUNCTIONS ===================== */

    // 🟢 ĐANG ĐẤU GIÁ
    function getAllActiveAuctions() external view returns (AuctionItem[] memory) {
        uint256 count;
        for (uint256 i = 0; i < auctionCounter; i++) {
            if (
                !auctions[i].isCompleted &&
                block.timestamp < auctions[i].endTime
            ) {
                count++;
            }
        }

        AuctionItem[] memory result = new AuctionItem[](count);
        uint256 index;

        for (uint256 i = 0; i < auctionCounter; i++) {
            if (
                !auctions[i].isCompleted &&
                block.timestamp < auctions[i].endTime
            ) {
                result[index++] = auctions[i];
            }
        }
        return result;
    }

    // 🟡 CHỜ KẾT THÚC
    function getWaitingEndAuctions() external view returns (AuctionItem[] memory) {
        uint256 count;
        for (uint256 i = 0; i < auctionCounter; i++) {
            if (
                !auctions[i].isCompleted &&
                block.timestamp >= auctions[i].endTime
            ) {
                count++;
            }
        }

        AuctionItem[] memory result = new AuctionItem[](count);
        uint256 index;

        for (uint256 i = 0; i < auctionCounter; i++) {
            if (
                !auctions[i].isCompleted &&
                block.timestamp >= auctions[i].endTime
            ) {
                result[index++] = auctions[i];
            }
        }
        return result;
    }

    // 🔴 ĐÃ KẾT THÚC
    function getCompletedAuctions() external view returns (AuctionItem[] memory) {
        uint256 count;
        for (uint256 i = 0; i < auctionCounter; i++) {
            if (auctions[i].isCompleted) {
                count++;
            }
        }

        AuctionItem[] memory result = new AuctionItem[](count);
        uint256 index;

        for (uint256 i = 0; i < auctionCounter; i++) {
            if (auctions[i].isCompleted) {
                result[index++] = auctions[i];
            }
        }
        return result;
    }

    function getAuction(uint256 _auctionId)
        external
        view
        returns (AuctionItem memory)
    {
        return auctions[_auctionId];
    }

    function getAuctionBids(uint256 _auctionId)
        external
        view
        returns (Bid[] memory)
    {
        return auctionBids[_auctionId];
    }

    function getPendingReturn(uint256 _auctionId, address _user)
        external
        view
        returns (uint256)
    {
        return pendingReturns[_auctionId][_user];
    }

    function updatePlatformFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= 10, "Max 10%");
        platformFeePercent = _newFee;
    }

    receive() external payable {}
}
