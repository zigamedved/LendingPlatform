import { ethers } from "ethers";
import { AppDataSource } from "../database";
import { Loan } from "../entities/Loan";
import LendingPool from "../abi/LendingPool.json";

export class EventListener {
    private provider: ethers.Provider;
    private lendingPool: ethers.Contract;

    constructor() {
        this.provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
        this.lendingPool = new ethers.Contract(
            process.env.LENDING_POOL_ADDRESS!,
            LendingPool.abi,
            this.provider
        );
    }

    async startListening() {
        this.lendingPool.on("LoanCreated", async (borrower: string, amount: bigint, event: any) => {
            const loan = await this.lendingPool.loans(borrower);
            
            const loanEntity = new Loan();
            loanEntity.borrower = borrower;
            loanEntity.collateralToken = loan.collateralToken;
            loanEntity.loanToken = loan.loanToken;
            loanEntity.collateralAmount = Number(ethers.formatEther(loan.collateralAmount));
            loanEntity.loanAmount = Number(ethers.formatEther(loan.loanAmount));
            loanEntity.interestRate = Number(loan.interestRate);
            loanEntity.dueDate = new Date(Number(loan.dueDate) * 1000).toISOString();
            loanEntity.liquidated = loan.liquidated;

            await AppDataSource.manager.save(loanEntity);
            console.log("Loan indexed:", borrower);
        });
    }
} 