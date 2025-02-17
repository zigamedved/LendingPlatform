import React, { useState, useEffect } from "react";
import Button from "@mui/material/Button";
import { ethers } from "ethers";
import LendingPool from '../abi/LendingPool.json';
import TestToken from '../abi/TestToken.json';


const WalletCard = () => {
    const provider = new ethers.BrowserProvider(window.ethereum)
    const [errorMessage, setErrorMessage] = useState(null);
    const [defaultAccount, setDefaultAccount] = useState(null);
    const [loans, setLoans] = useState([]);
    const [userBalance, setUserBalance] = useState(null);
    const [loanAmount, setLoanAmount] = useState('');
    const [collateralAmount, setCollateralAmount] = useState('');

    let signer;
    const connectwalletHandler = () => {
        if (window.ethereum) {
            provider.send("eth_requestAccounts", []).then(async () => {
                signer = await provider.getSigner(0)
                await accountChangedHandler(signer);
            });
        } else {
            setErrorMessage("Please Install Metamask!!!");
        }
    };

    const accountChangedHandler = async (newAccount) => {
        const address = await newAccount.getAddress();
        setDefaultAccount(address);

        const balance = await getUserBalance(address)
        setUserBalance(ethers.formatEther(balance));
    };

    let lendingPool;

    useEffect(() => {
        const checkConnection = async () => {
            if (window.ethereum) {
                const accounts = await provider.listAccounts();
                if (accounts.length > 0) {
                    const signer = await provider.getSigner(0);
                    await accountChangedHandler(signer);
                }
            }
        };
        
        checkConnection();
    }, []);

    useEffect(() => {
        console.log("my loans: ", loans);
    }, [loans]);

    const fetchLoans = async () => {
        if (!defaultAccount) {
            return;
        }
        try {    
            lendingPool = new ethers.Contract(
                process.env.REACT_APP_LENDING_POOL_ADDRESS, 
                LendingPool.abi, 
                provider
            );
            
            try {
                const loanData = await lendingPool.loans(defaultAccount);
                if (loanData && loanData.loanAmount.toString() !== "0") {
                    setLoans([{
                        id: '1',
                        loanAmount: loanData.loanAmount,
                        dueDate: Number(loanData.dueDate)
                    }]);
                    setLoanAmount('');
                    setCollateralAmount('');
                } else {
                    setLoans([]);
                }
            } catch (err) {
                console.log("No loans found for this account");
                setLoans([]);
            }
        } catch (err) {
            console.error('Error:', err);
            setErrorMessage(err.message);
        }
    };

    useEffect(() => {
        fetchLoans();
    }, [defaultAccount]);

    const getUserBalance = async (address) => {
        return provider.getBalance(address, "latest");
    };


    const createLoan = async () => {
        try {
            signer = await provider.getSigner(0)
            if(!signer || !provider){
                return;
            }

            console.log("amount of collateral:", collateralAmount)
            console.log("amount of loan:", loanAmount)

            const userAddress = await signer.getAddress();
            console.log("User address:", userAddress);
            
            const collateralToken = new ethers.Contract(
                process.env.REACT_APP_COLLATERAL_TOKEN,
                TestToken.abi,
                signer
            );

            const balance = await collateralToken.balanceOf(userAddress);
            console.log("Collateral token balance:", ethers.formatEther(balance));


            const loanToken = new ethers.Contract(
                process.env.REACT_APP_LOAN_TOKEN,
                TestToken.abi,
                provider
            );
            const loanBalanceBefore = await loanToken.balanceOf(userAddress);
            console.log("Loan balance before:", ethers.formatEther(loanBalanceBefore));

            const approveTx = await collateralToken.approve(
                process.env.REACT_APP_LENDING_POOL_ADDRESS,
                ethers.parseEther(collateralAmount)
            );
            await approveTx.wait();

            lendingPool = new ethers.Contract(process.env.REACT_APP_LENDING_POOL_ADDRESS, LendingPool.abi, signer);
            console.log("Contract initialized!")

            const tx = await lendingPool.createLoan(
                process.env.REACT_APP_COLLATERAL_TOKEN,
                process.env.REACT_APP_LOAN_TOKEN,
                ethers.parseEther(collateralAmount),
                ethers.parseEther(loanAmount),
                5, // % interest rate
                30 // days duration
            );
            await tx.wait();
            await fetchLoans();
            setLoanAmount('');
            setCollateralAmount('');

            const loanBalanceAfter = await loanToken.balanceOf(userAddress);
            console.log("Loan balance after:", ethers.formatEther(loanBalanceAfter));
        } catch (err) {
            console.error("Error creating loan:", err);
            setErrorMessage("Failed to create loan");
        }
    };

    const repayLoan = async () => {
        try {
            signer = await provider.getSigner();
            const userAddress = await signer.getAddress();
            
            const loanToken = new ethers.Contract(
                process.env.REACT_APP_LOAN_TOKEN,
                TestToken.abi,
                signer
            );

            lendingPool = new ethers.Contract(
                process.env.REACT_APP_LENDING_POOL_ADDRESS, 
                LendingPool.abi, 
                signer
            );
            
            const balance = await loanToken.balanceOf(userAddress);
            
            const loanData = await lendingPool.loans(userAddress);
         
            if (balance < loanData.loanAmount) { // add interest
                throw new Error(`Insufficient loan tokens. Need ${ethers.formatUnits(loanData.loanAmount, 18)} but have ${ethers.formatUnits(balance, 18)}`);
            }


            const approveTx = await loanToken.approve(
                process.env.REACT_APP_LENDING_POOL_ADDRESS,
                loanData.loanAmount
            );
            await approveTx.wait();
        

            const tx = await lendingPool.repayLoan();
            await tx.wait();
           
            
            await fetchLoans();
        } catch (err) {
            console.error("Error repaying loan:", err);
            setErrorMessage("Failed to repay loan: " + err.message);
        }
    };

    const isLoanCreationDisabled = loans.length > 0;

    return (
        <div className="WalletCard">
            <h3 className="h4">Welcome to React DApp Metamask</h3>
            <Button
                style={{ background: defaultAccount ? "#A5CC82" : "white" }}
                onClick={connectwalletHandler}
            >
                {defaultAccount ? "Connected!" : "Connect"}
            </Button>
            <div className="displayAccount">
                <h4 className="walletAddress">Address:{defaultAccount}</h4>
                <div className="balanceDisplay">
                    <h3>Wallet Amount: {userBalance ?? 0}</h3>
                </div>
            </div>

            <div className="loanCreation" style={{ marginTop: "20px" }}>
                <h3>Create New Loan</h3>
                {isLoanCreationDisabled ? (
                    <p style={{ color: 'red' }}>You already have an active loan. Repay it first.</p>
                ) : (
                    <>
                        <input 
                            type="number"
                            placeholder="Collateral Amount"
                            value={collateralAmount}
                            onChange={(e) => setCollateralAmount(e.target.value)}
                            style={{ margin: "10px 0" }}
                            disabled={isLoanCreationDisabled}
                        />
                        <input 
                            type="number"
                            placeholder="Loan Amount"
                            value={loanAmount}
                            onChange={(e) => setLoanAmount(e.target.value)}
                            style={{ margin: "10px 0" }}
                            disabled={isLoanCreationDisabled}
                        />
                        <Button
                            onClick={createLoan}
                            style={{ 
                                background: isLoanCreationDisabled ? "#ccc" : "#4CAF50", 
                                color: "white" 
                            }}
                            disabled={isLoanCreationDisabled}
                        >
                            Create Loan
                        </Button>
                    </>
                )}
            </div>

            {loans.length > 0 && (
                <div className="loansDisplay">
                    <h3>Your Active Loans</h3>
                    {loans.map((loan, index) => (
                        <div key={index} className="loanItem">
                            <p>Loan Amount: {
                                loan.loanAmount.toString() === "0" 
                                    ? "0" 
                                    : ethers.formatUnits(loan.loanAmount, 18)
                            } ETH</p>
                            <p>Due Date: {new Date(loan.dueDate * 1000).toLocaleDateString()}</p>
                            <Button
                                onClick={repayLoan}
                                style={{ background: "#2196F3", color: "white" }}
                            >
                                Repay Loan
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            {errorMessage}
        </div>
    );
};
export default WalletCard;