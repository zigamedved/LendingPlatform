# Decentralized Lending Platform with Collateralized Loans

Tech Stack: Solidity, TypeScript, Hardhat, Docker, PostgreSQL, React, GraphQL

## Project Overview

This project is a decentralized lending platform that allows users to lend and borrow cryptocurrencies with collateralized loans. The platform is built on the Ethereum blockchain and uses the ERC20 standard for tokens.

## Architecture

### Three-Tier System

#### 1. Smart Contracts (Blockchain Layer)
- Collateralized loan logic (deposit, borrow, repay, liquidate)
- Interest rate models (e.g., algorithmic rates based on utilization)
- ERC-20 token integration for collateral and stable coins
- **Tools**: Solidity, Hardhat, OpenZeppelin libraries

#### 2. Backend (Logic Layer)
- Index blockchain events (e.g., loans created, repayments)
- REST/GraphQL API for frontend interaction
- **Tools**: Node.js/TypeScript, The Graph Protocol, PostgreSQL

#### 3. Frontend (Presentation Layer)
- User dashboard for managing loans
- Wallet integration (MetaMask)
- Integrated borrowing and loan repayment
- **Tools**: React, ethers.js, Web3-UI components

# Running the blockchain
- open terminal, go to /contracts and run `npx hardhat node`
- open new terminal, go to /contracts and run `npx hardhat run scripts/deploy.ts --network localhost`
- copy and paste the output of the deploy.ts script into your `.env` files inside the frontend and backend folders
- also copy and paste the generated abi's (artifacts/contracts/..) into backend and frontend abi folders

# Running the backend
- go to /backend and run `npm install`
- go to /docker and run `docker compose up -d`
- go back to /backend and run `npm run start`

# Running the frontend
- open new terminal, go to /frontend and run `npm run start`

# IMPORTANT
Metamask has to be connected to the local hardhat network: ![alt text](/src/hardhatNetwork.png)

# DAPP

![alt text](/src/appLanding.png)

![alt text](/src/appConnected.png)

![alt text](/src/appLoanCreated.png)

# API

![alt text](/src/apiCall.png)

# CERTIFIED on 20.03.2025

![alt text](/src/certificate.png)