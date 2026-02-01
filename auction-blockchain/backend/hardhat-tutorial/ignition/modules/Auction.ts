import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("AuctionModule", (m) => {
  const counter = m.contract("Auction");
  return { counter };
});
