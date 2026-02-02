import React from 'react';
import './Navbar.css';

function Navbar({ account, onCreateClick, showCreateForm }) {
  const shortAddress = account ? `${account.substring(0, 6)}...${account.substring(38)}` : '';

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <h1>🔨 Auction Blockchain</h1>
        </div>
        
        <div className="navbar-actions">
          <button 
            className={`btn ${showCreateForm ? 'btn-secondary' : 'btn-primary'}`}
            onClick={onCreateClick}
          >
            {showCreateForm ? 'Hủy' : '+ Tạo đấu giá'}
          </button>
          
          {account && (
            <div className="account-info">
              <span className="account-icon">👤</span>
              <span className="account-address">{shortAddress}</span>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;