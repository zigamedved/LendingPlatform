# Decentralized Lending Platform with Collateralized Loans

Tech Stack: Solidity, TypeScript, Hardhat, Docker, PostgreSQL, React, GraphQL, IPFS

## Project Overview

This project is a decentralized lending platform that allows users to lend and borrow cryptocurrencies with collateralized loans. The platform is built on the Ethereum blockchain and uses the ERC20 standard for tokens.

## Architecture

### Three-Tier System

#### 1. Smart Contracts (Blockchain Layer)
- Collateralized loan logic (deposit, borrow, repay, liquidate)
- Interest rate models (e.g., algorithmic rates based on utilization)
- ERC-20 token integration for collateral and stablecoins
- **Tools**: Solidity, Hardhat, OpenZeppelin libraries

#### 2. Backend (Logic Layer)
- Index blockchain events (e.g., loans created, repayments)
- REST/GraphQL API for frontend interaction
- Risk monitoring (collateral ratios, liquidation triggers)
- **Tools**: Node.js/TypeScript, The Graph Protocol, PostgreSQL

#### 3. Frontend (Presentation Layer)
- User dashboard for managing loans
- Real-time analytics (loan health, interest accrual)
- Wallet integration (MetaMask, WalletConnect)
- **Tools**: React, ethers.js, Web3-UI components



# IMPORTANT
Metamask has to be connected to the localhost:8545 network 

