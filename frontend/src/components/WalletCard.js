import React, { useState, useEffect } from "react";
import Button from "@mui/material/Button";
import { ethers } from "ethers";
import LendingPool from '../abi/LendingPool.json';


const WalletCard = () => {
    const provider = new ethers.BrowserProvider(window.ethereum)
    const [errorMessage, setErrorMessage] = useState(null);
    const [defaultAccount, setDefaultAccount] = useState(null);
    const [loans, setLoans] = useState([]);
    const [userBalance, setUserBalance] = useState(null);

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
    async function fetchLoans() {
        if (!defaultAccount) {
            return
        }
        try {    
          
            // NOTE: provider is used for READ operations
            // NOTE: signer is used for state changes and transactions
            lendingPool = new ethers.Contract(process.env.REACT_APP_LENDING_POOL_ADDRESS, LendingPool.abi, provider);
            console.log("Contract initialized!")

            // TODO: fix this ugly code
            // TODO: add 2 contract instances, one read one write          
            try {
                const loanData = await lendingPool.loans(defaultAccount); // loanData is array
                console.log(loanData)
                if (loanData) {
                setLoans([{ // TODO, remove hardcoded value
                    id: '1',
                    loanAmount: Number(loanData.loanAmount),
                    dueDate: Number(loanData.dueDate)
                }]);
                }
            } catch (err) {
                console.error(err)
                console.log("No loans found for this account");
                setLoans([]);
            }
        } catch (err) {
          console.error('Error connecting to lending pool:', err);
          setErrorMessage('Error connecting to lending pool contract.');
        }
      
    }
    fetchLoans();
  }, [defaultAccount]);



    const getUserBalance = async (address) => {
        return provider.getBalance(address, "latest");
    };

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

            {loans.length > 1 && (
                <div className="loansDisplay">
                    <h3>Your Loans</h3>
                    {loans.map((loan, index) => (
                        <div key={index} className="loanItem" style={{ 
                            border: '1px solid #ddd',
                            padding: '10px',
                            margin: '10px 0',
                            borderRadius: '5px'
                        }}>
                            <p>Loan Amount: {ethers.formatEther(loan.loanAmount.toString())} ETH</p>
                            <p>Due Date: {new Date(loan.dueDate * 1000).toLocaleDateString()}</p>
                        </div>
                    ))}
                </div>
            )}

            {errorMessage}
        </div>
    );
};
export default WalletCard;