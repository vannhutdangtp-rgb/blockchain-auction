import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("MyTokenModule", (m) => {
  const counter = m.contract("MyToken");
  return { counter };
});
