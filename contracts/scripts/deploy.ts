import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const LendingPool = await ethers.getContractFactory("LendingPool");
  const lendingPool = await LendingPool.deploy();
  await lendingPool.waitForDeployment();

  const address = await lendingPool.getAddress();
  console.log("LendingPool deployed to:", address);
  console.log("Verify this matches your .env file:", process.env.REACT_APP_LENDING_POOL_ADDRESS);

  // optional, set up initial configurations
  // await lendingPool.setSupportedToken(tokenAddress, true);
  // await lendingPool.setLiquidationThreshold(150);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


// Run with: 
// npx hardhat compile
// npx hardhat run scripts/deploy.ts --network hardhat