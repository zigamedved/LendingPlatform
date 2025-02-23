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

  const userAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"; // Hardhat generated public/private key pair
  await collateralToken.transfer(userAddress, ethers.parseEther("1000")); // pre-fund user account with collateral 

  await loanToken.approve(lendingPoolAddress, ethers.parseEther("10000")); // approve loan token for lending pool
  await lendingPool.deposit(loanAddress, ethers.parseEther("10000")); // deposit loan token to lending pool (adding liquidity)

  console.log("Deployment addresses:");
  console.log("REACT_APP_LENDING_POOL_ADDRESS=", lendingPoolAddress);
  console.log("REACT_APP_COLLATERAL_TOKEN=", collateralAddress);
  console.log("REACT_APP_LOAN_TOKEN=", loanAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


// Run with: 
// npx hardhat compile
// npx hardhat run scripts/deploy.ts --network localhostt