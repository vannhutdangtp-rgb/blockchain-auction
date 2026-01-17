import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const AuctionModule = buildModule("AuctionModule", (m) => {
  // Tham số constructor
  const itemName = m.getParameter("itemName", "Laptop Gaming");
  const biddingTime = m.getParameter("biddingTime", 300); // giây

  const auction = m.contract("Auction", [itemName, biddingTime]);

  return { auction };
});

export default AuctionModule;
