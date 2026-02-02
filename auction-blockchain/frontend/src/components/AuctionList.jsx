import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./AuctionList.css";

function AuctionList({ auctions, loading, onSelectAuction, onRefresh }) {
  const [timeLeft, setTimeLeft] = useState({});
  const [activeTab, setActiveTab] = useState("active");

  /* ================= CURRENT TIME ================= */
  const now = Math.floor(Date.now() / 1000);

  /* ================= COUNTDOWN ================= */
  useEffect(() => {
    const interval = setInterval(() => {
      const current = Math.floor(Date.now() / 1000);
      const newTimeLeft = {};

      auctions.forEach((auction) => {
        const remain = Number(auction.endTime) - current;
        newTimeLeft[auction.id] = remain > 0 ? remain : 0;
      });

      setTimeLeft(newTimeLeft);
    }, 1000);

    return () => clearInterval(interval);
  }, [auctions]);

  /* ================= UTILS ================= */
  const formatTimeLeft = (seconds) => {
    if (seconds <= 0) return "Hết thời gian";

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (days > 0) return `${days} ngày ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}p`;
    if (minutes > 0) return `${minutes}p ${secs}s`;
    return `${secs}s`;
  };

  /* ================= FILTER BY TAB ================= */
  const filteredAuctions = auctions.filter((auction) => {
    const endTime = Number(auction.endTime);

    if (activeTab === "active") {
      return !auction.isCompleted && now < endTime;
    }

    if (activeTab === "waiting") {
      return !auction.isCompleted && now >= endTime;
    }

    if (activeTab === "completed") {
      return auction.isCompleted;
    }

    return false;
  });

  /* ================= COUNT BY STATUS ================= */
  const getCounts = () => {
    const active = auctions.filter(a => !a.isCompleted && now < Number(a.endTime)).length;
    const waiting = auctions.filter(a => !a.isCompleted && now >= Number(a.endTime)).length;
    const completed = auctions.filter(a => a.isCompleted).length;
    return { active, waiting, completed };
  };

  const counts = getCounts();

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Đang tải danh sách đấu giá...</p>
      </div>
    );
  }

  /* ================= RENDER ================= */
  return (
    <div className="auction-list">
      {/* ===== HEADER ===== */}
      <div className="list-header">
        <div className="header-left">
          <h2>Danh sách đấu giá</h2>
          <span className="total-count">Tổng: {auctions.length} đấu giá</span>
        </div>
        <button onClick={onRefresh} className="btn btn-refresh">
          <span className="refresh-icon">🔄</span>
          <span>Làm mới</span>
        </button>
      </div>

      {/* ===== TABS ===== */}
      <div className="auction-tabs">
        <button
          className={`tab ${activeTab === "active" ? "active" : ""}`}
          onClick={() => setActiveTab("active")}
        >
          <span className="tab-icon">🟢</span>
          <div className="tab-content">
            <span className="tab-label">Đang đấu giá</span>
            <span className="tab-count">{counts.active}</span>
          </div>
        </button>

        <button
          className={`tab ${activeTab === "waiting" ? "active" : ""}`}
          onClick={() => setActiveTab("waiting")}
        >
          <span className="tab-icon">🟡</span>
          <div className="tab-content">
            <span className="tab-label">Chờ kết thúc</span>
            <span className="tab-count">{counts.waiting}</span>
          </div>
        </button>

        <button
          className={`tab ${activeTab === "completed" ? "active" : ""}`}
          onClick={() => setActiveTab("completed")}
        >
          <span className="tab-icon">🔴</span>
          <div className="tab-content">
            <span className="tab-label">Đã kết thúc</span>
            <span className="tab-count">{counts.completed}</span>
          </div>
        </button>
      </div>

      {/* ===== EMPTY STATE ===== */}
      {filteredAuctions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <p className="empty-title">Không có đấu giá nào</p>
          <p className="empty-subtitle">
            {activeTab === "active" && "Hiện tại không có phiên đấu giá nào đang diễn ra"}
            {activeTab === "waiting" && "Không có phiên đấu giá nào đang chờ kết thúc"}
            {activeTab === "completed" && "Chưa có phiên đấu giá nào hoàn thành"}
          </p>
        </div>
      ) : (
        <div className="auction-grid">
          {filteredAuctions.map((auction) => {
            const remainingTime = timeLeft[auction.id] || 0;
            const isUrgent = remainingTime > 0 && remainingTime <= 300;
            const isEnded = remainingTime === 0 && !auction.isCompleted;

            return (
              <div
                key={auction.id}
                className={`auction-card ${isUrgent ? 'urgent' : ''} ${isEnded ? 'ended' : ''}`}
                onClick={() => onSelectAuction(auction)}
              >
                {/* Status Badge */}
                {isUrgent && (
                  <div className="status-badge urgent-badge">
                    ⚡ Sắp kết thúc
                  </div>
                )}
                {isEnded && (
                  <div className="status-badge ended-badge">
                    ⏰ Hết giờ
                  </div>
                )}
                {auction.isCompleted && (
                  <div className="status-badge completed-badge">
                    ✓ Đã kết thúc
                  </div>
                )}

                {/* Image */}
                {auction.imageUrl ? (
                  <img
                    src={auction.imageUrl}
                    alt={auction.name}
                    className="auction-image"
                  />
                ) : (
                  <div className="auction-image-placeholder">
                    <span className="placeholder-icon">📦</span>
                    <span className="placeholder-text">Không có hình ảnh</span>
                  </div>
                )}

                {/* Info */}
                <div className="auction-info">
                  <h3 className="auction-title">{auction.name}</h3>

                  <div className="auction-stats">
                    <div className="stat stat-price">
                      <div className="stat-header">
                        <span className="stat-icon">💰</span>
                        <span className="label">Giá hiện tại</span>
                      </div>
                      <span className="value price-value">
                        {ethers.formatEther(auction.currentPrice)} ETH
                      </span>
                    </div>

                    <div className="stat stat-time">
                      <div className="stat-header">
                        <span className="stat-icon">⏱️</span>
                        <span className="label">Thời gian còn lại</span>
                      </div>
                      <span className={`value time-value ${isUrgent ? "urgent" : ""}`}>
                        {formatTimeLeft(remainingTime)}
                      </span>
                    </div>
                  </div>

                  <button className="btn btn-primary btn-block btn-detail">
                    <span>Xem chi tiết</span>
                    <span className="arrow">→</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AuctionList;