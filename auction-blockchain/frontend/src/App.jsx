import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './App.css';
import AuctionContract from './contracts/Auction.json';
import contractAddress from './contracts/contract-address.json';
import CreateAuction from './components/CreateAuction';
import AuctionList from './components/AuctionList';
import AuctionDetail from './components/AuctionDetail';
import Navbar from './components/Navbar';

function App() {
  const [account, setAccount] = useState('');
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [auctions, setAuctions] = useState([]);
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    initBlockchain();
  }, []);

  const initBlockchain = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        // Kết nối MetaMask
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        
        const contract = new ethers.Contract(
          contractAddress.Auction,
          AuctionContract.abi,
          signer
        );

        setProvider(provider);
        setSigner(signer);
        setAccount(address);
        setContract(contract);

        // Load danh sách đấu giá
        loadAuctions(contract);

        // Lắng nghe sự kiện thay đổi tài khoản
        window.ethereum.on('accountsChanged', (accounts) => {
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            initBlockchain();
          }
        });

      } else {
        alert('Vui lòng cài đặt MetaMask!');
      }
    } catch (error) {
      console.error('Error initializing blockchain:', error);
    }
  };

  const loadAuctions = async (contractInstance) => {
    try {
      setLoading(true);
      const activeAuctions = await contractInstance.getAllActiveAuctions();
      setAuctions(activeAuctions);
    } catch (error) {
      console.error('Error loading auctions:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshAuctions = () => {
    if (contract) {
      loadAuctions(contract);
    }
  };

  const handleCreateAuction = async (auctionData) => {
    try {
      setLoading(true);
      const tx = await contract.createAuction(
        auctionData.name,
        auctionData.description,
        auctionData.imageUrl,
        ethers.parseEther(auctionData.startingPrice.toString()),
        auctionData.duration
      );
      
      await tx.wait();
      alert('Tạo đấu giá thành công!');
      setShowCreateForm(false);
      refreshAuctions();
    } catch (error) {
      console.error('Error creating auction:', error);
      alert('Lỗi khi tạo đấu giá!');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceBid = async (auctionId, bidAmount) => {
    try {
      setLoading(true);
      const tx = await contract.placeBid(auctionId, {
        value: ethers.parseEther(bidAmount.toString())
      });
      
      await tx.wait();
      alert('Đặt giá thành công!');
      refreshAuctions();
      
      // Refresh chi tiết đấu giá nếu đang xem
      if (selectedAuction && selectedAuction.id === auctionId) {
        const updatedAuction = await contract.getAuction(auctionId);
        setSelectedAuction(updatedAuction);
      }
    } catch (error) {
      console.error('Error placing bid:', error);
      alert('Lỗi khi đặt giá!');
    } finally {
      setLoading(false);
    }
  };

  const handleEndAuction = async (auctionId) => {
    try {
      setLoading(true);
      const tx = await contract.endAuction(auctionId);
      await tx.wait();
      alert('Kết thúc đấu giá thành công!');
      refreshAuctions();
      setSelectedAuction(null);
    } catch (error) {
      console.error('Error ending auction:', error);
      alert('Lỗi khi kết thúc đấu giá!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <Navbar 
        account={account}
        onCreateClick={() => setShowCreateForm(!showCreateForm)}
        showCreateForm={showCreateForm}
      />

      <div className="container">
        {showCreateForm ? (
          <CreateAuction 
            onSubmit={handleCreateAuction}
            onCancel={() => setShowCreateForm(false)}
            loading={loading}
          />
        ) : selectedAuction ? (
          <AuctionDetail
            auction={selectedAuction}
            account={account}
            contract={contract}
            onBack={() => setSelectedAuction(null)}
            onPlaceBid={handlePlaceBid}
            onEndAuction={handleEndAuction}
            loading={loading}
          />
        ) : (
          <AuctionList
            auctions={auctions}
            loading={loading}
            onSelectAuction={setSelectedAuction}
            onRefresh={refreshAuctions}
          />
        )}
      </div>
    </div>
  );
}

export default App;