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
  const CRONOS_TESTNET = {
  chainId: '0x152', // 338
  chainName: 'Cronos Testnet',
  rpcUrls: ['https://evm-t3.cronos.org'],
  nativeCurrency: {
    name: 'TCRO',
    symbol: 'TCRO',
    decimals: 18,
  },
  blockExplorerUrls: ['https://testnet.cronoscan.com'],
};


  const initBlockchain = async () => {
  try {
    if (!window.ethereum) {
      alert('Vui lòng cài MetaMask!');
      return;
    }

    // Lấy chain hiện tại
    const currentChainId = await window.ethereum.request({
      method: 'eth_chainId',
    });

    // Nếu KHÔNG phải Cronos Testnet thì yêu cầu chuyển
    if (currentChainId !== '0x152') {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x152' }],
        });
      } catch (switchError) {
        // Nếu chưa add network thì add mới
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [CRONOS_TESTNET],
          });
        } else {
          throw switchError;
        }
      }
    }

    // Request account
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

    loadAuctions(contract);

  } catch (error) {
    console.error(error);
    alert('Không kết nối được blockchain');
  }
  };


  const loadAuctions = async (contractInstance) => {
    try {
      setLoading(true);
      
      // Load tất cả auctions bằng cách loop qua auctionCounter
      const counter = await contractInstance.auctionCounter();
      console.log('Total auction counter:', Number(counter));
      
      const allPromises = [];
      for (let i = 0; i < Number(counter); i++) {
        allPromises.push(contractInstance.getAuction(i));
      }
      
      const allAuctions = await Promise.all(allPromises);
      console.log('Loaded auctions:', allAuctions);
      
      setAuctions(allAuctions);
      
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