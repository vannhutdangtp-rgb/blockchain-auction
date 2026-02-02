import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./AuctionDetail.css";

function AuctionDetail({
  auction,
  account,
  contract,
  onBack,
  onPlaceBid,
  onEndAuction,
  loading,
}) {
  const [bidAmount, setBidAmount] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [bids, setBids] = useState([]);
  const [refund, setRefund] = useState("0");
  const [withdrawing, setWithdrawing] = useState(false);

  /* ================= LOAD REFUND ================= */
  useEffect(() => {
    const loadRefund = async () => {
      if (!contract || !auction || !account) return;
      try {
        const amount = await contract.getPendingReturn(
          auction.id,
          account
        );
        setRefund(amount.toString());
      } catch (err) {
        console.error("Load refund error:", err);
      }
    };
    loadRefund();
  }, [contract, auction, account]);

  /* ================= LOAD BIDS ================= */
  const loadBids = async () => {
    if (!contract || !auction) return;
    try {
      const auctionBids = await contract.getAuctionBids(auction.id);
      setBids(auctionBids);
    } catch (err) {
      console.error("Load bids error:", err);
    }
  };

  useEffect(() => {
    loadBids();
  }, [contract, auction]);

  /* ================= COUNTDOWN (CHỈ HIỂN THỊ) ================= */
  useEffect(() => {
    if (!auction) return;

    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const remain = Number(auction.endTime) - now;
      setTimeLeft(remain > 0 ? remain : 0);
    }, 1000);

    return () => clearInterval(interval);
  }, [auction]);

  /* ================= PLACE BID ================= */
  const handleSubmitBid = async (e) => {
    e.preventDefault();

    if (!bidAmount || Number(bidAmount) <= 0) {
      alert("Vui lòng nhập số tiền hợp lệ!");
      return;
    }

    try {
      const bidWei = ethers.parseEther(bidAmount);

      if (bidWei <= auction.currentPrice) {
        alert("Giá đặt phải cao hơn giá hiện tại!");
        return;
      }

      await onPlaceBid(auction.id, bidAmount);
      setBidAmount("");
      await loadBids();
    } catch (err) {
      console.error(err);
      alert("Đặt giá thất bại");
    }
  };

  /* ================= WITHDRAW ================= */
  const handleWithdraw = async () => {
    try {
      setWithdrawing(true);
      const tx = await contract.withdraw(auction.id);
      await tx.wait();
      alert("Rút tiền thành công 💰");
      setRefund("0");
    } catch (err) {
      console.error(err);
      alert("Rút tiền thất bại");
    } finally {
      setWithdrawing(false);
    }
  };

  /* ================= UTILS ================= */
  const formatTimeLeft = (seconds) => {
    if (seconds <= 0) return "Hết thời gian";

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (days > 0) return `${days} ngày ${hours} giờ`;
    if (hours > 0) return `${hours} giờ ${minutes} phút`;
    if (minutes > 0) return `${minutes} phút ${secs} giây`;
    return `${secs} giây`;
  };

  const isSeller =
    account &&
    auction &&
    account.toLowerCase() === auction.seller.toLowerCase();

  const isHighestBidder =
    account &&
    auction.highestBidder !== ethers.ZeroAddress &&
    account.toLowerCase() === auction.highestBidder.toLowerCase();

  const now = Math.floor(Date.now() / 1000);
  const isTimeOver = auction && Number(auction.endTime) <= now;

  const canEndAuction =
    auction &&
    isSeller &&
   
    !auction.isCompleted &&
    isTimeOver;

  /* ================= RENDER ================= */
  return (
    <div className="auction-detail">
      <button onClick={onBack} className="btn btn-back">
        ← Quay lại
      </button>

      <div className="detail-container">
        <div className="detail-image">
          {auction.imageUrl ? (
            <img src={auction.imageUrl} alt={auction.name} />
          ) : (
            <div className="image-placeholder">📦</div>
          )}
        </div>

        <div className="detail-info">
          <h1>{auction.name}</h1>

          <div className="status-badges">
            {auction.isCompleted && (
              <span className="badge badge-ended">Đã kết thúc</span>
            )}
            {isSeller && (
              <span className="badge badge-seller">Người bán</span>
            )}
            {isHighestBidder && !auction.isCompleted && (
              <span className="badge badge-winning">Đang dẫn đầu</span>
            )}
          </div>

          <p className="description">{auction.description}</p>

          <div className="detail-stats">
            <div className="stat-box">
              <label>Giá khởi điểm</label>
              <div className="value">
                {ethers.formatEther(auction.startingPrice)} ETH
              </div>
            </div>

            <div className="stat-box highlight">
              <label>Giá hiện tại</label>
              <div className="value">
                {ethers.formatEther(auction.currentPrice)} ETH
              </div>
            </div>

            <div className={`stat-box ${timeLeft <= 300 ? "urgent" : ""}`}>
              <label>Thời gian còn lại</label>
              <div className="value">{formatTimeLeft(timeLeft)}</div>
            </div>
          </div>

          {!auction.isCompleted && !isSeller && (
            <form onSubmit={handleSubmitBid} className="bid-form">
              <h3>Đặt giá</h3>
              <div className="bid-input-group">
                <input
                  type="number"
                  step="0.001"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder={`Cao hơn ${ethers.formatEther(
                    auction.currentPrice
                  )} ETH`}
                  disabled={loading}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? "Đang xử lý..." : "Đặt giá"}
                </button>
              </div>
            </form>
          )}

          {canEndAuction && (
            <button
              onClick={() => onEndAuction(auction.id)}
              className="btn btn-danger btn-block"
              disabled={loading}
            >
              Kết thúc đấu giá
            </button>
          )}
        </div>
      </div>

      {/* ===== REFUND ===== */}
      {refund !== "0" && (
        <div className="refund-box">
          <h3>⚠️ Bạn đã bị vượt giá</h3>
          <p>
            Số tiền được hoàn:
            <b> {ethers.formatEther(refund)} ETH</b>
          </p>
          <button
            className="btn btn-warning"
            onClick={handleWithdraw}
            disabled={withdrawing}
          >
            {withdrawing ? "Đang rút..." : "Rút tiền"}
          </button>
        </div>
      )}

      {/* ===== BID HISTORY ===== */}
      {bids.length > 0 && (
        <div className="bid-history">
          <h3>Lịch sử đặt giá ({bids.length})</h3>
          {[...bids].reverse().map((bid, index) => (
            <div key={index} className="bid-item">
              <span>
                {bid.bidder.substring(0, 8)}...
                {bid.bidder.substring(38)}
              </span>
              <span>{ethers.formatEther(bid.amount)} ETH</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AuctionDetail;
