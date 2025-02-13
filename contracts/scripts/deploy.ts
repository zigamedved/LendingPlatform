import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const TestToken = await ethers.getContractFactory("TestToken");

  const collateralToken = await TestToken.deploy("Test Collateral", "TCOL");
  await collateralToken.waitForDeployment();
  const collateralAddress = await collateralToken.getAddress();
  
  const loanToken = await TestToken.deploy("Test Loan", "TLOAN");
  await loanToken.waitForDeployment();
  const loanAddress = await loanToken.getAddress();

  const LendingPool = await ethers.getContractFactory("LendingPool");
  const lendingPool = await LendingPool.deploy();
  await lendingPool.waitForDeployment();

  const lendingPoolAddress = await lendingPool.getAddress();
  await lendingPool.setSupportedToken(collateralAddress, true);
  await lendingPool.setSupportedToken(loanAddress, true);

  console.log("Collateral Token deployed to:", collateralAddress);
  console.log("Loan Token deployed to:", loanAddress);
  console.log("LendingPool deployed to:", lendingPoolAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


// Run with: 
// npx hardhat compile
// npx hardhat run scripts/deploy.ts --network hardhat