import { useState, useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import { Contract, utils } from 'ethers';
import LendingPoolABI from './abi/LendingPool.json';
import { metamask } from './connectors/hooks';

interface Loan {
  id: string;
  loanAmount: number;
  dueDate: number;
}

export default function LoanDashboard() {
  const { account, provider } = useWeb3React();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    async function fetchLoans() {
      if (account && provider) {
        try {

          const lendingPool = new Contract(
            process.env.REACT_APP_LENDING_POOL_ADDRESS || '',
            LendingPoolABI.abi,
            provider.getSigner()
          );
          
          const loanData = await lendingPool.loans(account);
          console.log("Loan data:", loanData);

          if (loanData) {
            setLoans([{
              id: '1',
              loanAmount: Number(loanData.loanAmount),
              dueDate: Number(loanData.dueDate)
            }]);
          }
        } catch (err) {
          console.error('Error fetching loans:', err);
          setError('Error loading loans. Make sure the contract is deployed.');
        }
      }
    }
    fetchLoans();
  }, [account, provider]);

  const connectWallet = async () => {
    try {
      await metamask.activate();
    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError('Failed to connect wallet');
    }
  };

  const createSampleLoan = async () => {
    if (!account || !provider) return;
    
    try {
      const lendingPool = new Contract(
        process.env.REACT_APP_LENDING_POOL_ADDRESS || '',
        LendingPoolABI.abi,
        provider.getSigner()
      );

      const collateralToken = "0xdac17f958d2ee523a2206206994597c13d831ec7"; 
      const loanToken = "00xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.";    
      const collateralAmount = utils.parseEther("1.0");  // 1 token
      const loanAmount = utils.parseEther("0.5");        // 0.5 token
      const interestRate = 5;  // 5%
      const durationDays = 30; // 30 days

      const tx = await lendingPool.createLoan(
        collateralToken,
        loanToken,
        collateralAmount,
        loanAmount,
        interestRate,
        durationDays
      );

      await tx.wait();
      console.log("Loan created successfully!");
    } catch (err) {
      console.error('Error creating loan:', err);
      setError('Failed to create loan');
    }
  };

  if (!account) {
    return (
      <div>
        <button onClick={connectWallet}>Connect Wallet</button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <h2>Your Loans</h2>
      <button onClick={createSampleLoan}>Create Sample Loan</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {loans.length > 0 ? (
        loans.map((loan) => (
          <div key={loan.id}>
            <h3>Loan Amount: {loan.loanAmount}</h3>
            <p>Due Date: {new Date(loan.dueDate * 1000).toLocaleDateString()}</p>
          </div>
        ))
      ) : (
        <p>No active loans found</p>
      )}
    </div>
  );
}