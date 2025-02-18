import React, { useState, useEffect } from "react";
import { 
    Button, 
    TextField, 
    Card, 
    CardContent, 
    Typography, 
    Box,
    Container,
    Paper,
    Divider
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { ethers } from "ethers";
import LendingPool from '../abi/LendingPool.json';
import TestToken from '../abi/TestToken.json';


const StyledCard = styled(Card)(({ theme }) => ({
    maxWidth: 600,
    margin: '20px auto',
    padding: theme.spacing(2),
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
}));

const WalletCard = () => {
    const provider = new ethers.BrowserProvider(window.ethereum)
    const [errorMessage, setErrorMessage] = useState(null);
    const [defaultAccount, setDefaultAccount] = useState(null);
    const [loans, setLoans] = useState([]);
    const [userBalance, setUserBalance] = useState(null);
    const [loanAmount, setLoanAmount] = useState('');
    const [collateralAmount, setCollateralAmount] = useState('');

    const [loanBalance, setLoanBalance] = useState(null);
    const [collateralBalance, setCollateralBalance] = useState(null);   

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

        const collateralBalance = await getCollateralBalance(address)
        setCollateralBalance(ethers.formatEther(collateralBalance));

        const loanBalance = await getLoanBalance(address)
        setLoanBalance(ethers.formatEther(loanBalance));
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
                setLoanBalance(ethers.formatEther(await getLoanBalance(defaultAccount)));
                setCollateralBalance(ethers.formatEther(await getCollateralBalance(defaultAccount)));
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

    const getCollateralBalance = async (address) => {
        const collateralToken = new ethers.Contract(
            process.env.REACT_APP_COLLATERAL_TOKEN,
            TestToken.abi,
            provider
        );

        const balance = await collateralToken.balanceOf(address);
        return balance;
    };

    const getLoanBalance = async (address) => {
        const loanToken = new ethers.Contract(
            process.env.REACT_APP_LOAN_TOKEN,
            TestToken.abi,
            provider
        );

        const balance = await loanToken.balanceOf(address);
        return balance;
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
            
            console.log("Collateral token balance:", ethers.formatEther(await getCollateralBalance(userAddress)));
            console.log("Loan balance before:", ethers.formatEther(await getLoanBalance(userAddress)));

            const collateralToken = new ethers.Contract(
                process.env.REACT_APP_COLLATERAL_TOKEN,
                TestToken.abi,
                signer
            );
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

            console.log("Collateral token after:", ethers.formatEther(await getCollateralBalance(userAddress)));
            console.log("Loan balance after:", ethers.formatEther(await getLoanBalance( userAddress)));
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
        <Container maxWidth="md">
            <StyledCard>
                <CardContent>
                    <Typography variant="h4" gutterBottom align="center" color="primary">
                        DeFi Lending Platform
                    </Typography>

                    <Box mb={3} display="flex" justifyContent="center">
                        <Button
                            variant="contained"
                            color={defaultAccount ? "success" : "primary"}
                            onClick={connectwalletHandler}
                            size="large"
                        >
                            {defaultAccount ? "Connected!" : "Connect Wallet"}
                        </Button>
                    </Box>

                    {defaultAccount && (
                        <>
                            <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
                                <Typography variant="subtitle1" color="textSecondary">
                                    Wallet Address
                                </Typography>
                                <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                                    {defaultAccount}
                                </Typography>
                                
                                <Divider sx={{ my: 1 }} />
                                
                                <Typography variant="subtitle1" color="textSecondary">
                                    Balance
                                </Typography>
                                <Typography variant="h6">
                                    {userBalance ?? 0} ETH
                                </Typography>

                                <Divider sx={{ my: 1 }} />

                                <Typography variant="subtitle1" color="textSecondary">
                                    Collateral Balance
                                </Typography>
                                <Typography variant="h6">
                                    { collateralBalance ?? 0} TCOL
                                </Typography>

                                <Divider sx={{ my: 1 }} />

                                <Typography variant="subtitle1" color="textSecondary">
                                    Loan Balance
                                </Typography>
                                <Typography variant="h6">
                                    { loanBalance ?? 0} TLOAN
                                </Typography>

                            </Paper>

                            <Box sx={{ mb: 3 }}>
                                <Typography variant="h5" gutterBottom>
                                    Create New Loan
                                </Typography>
                                {isLoanCreationDisabled ? (
                                    <Typography color="error">
                                        You already have an active loan. Repay it first.
                                    </Typography>
                                ) : (
                                    <Box component="form" sx={{ '& > :not(style)': { m: 1 } }}>
                                        <TextField
                                            fullWidth
                                            label="Collateral Amount"
                                            type="number"
                                            value={collateralAmount}
                                            onChange={(e) => setCollateralAmount(e.target.value)}
                                            disabled={isLoanCreationDisabled}
                                            variant="outlined"
                                        />
                                        <TextField
                                            fullWidth
                                            label="Loan Amount"
                                            type="number"
                                            value={loanAmount}
                                            onChange={(e) => setLoanAmount(e.target.value)}
                                            disabled={isLoanCreationDisabled}
                                            variant="outlined"
                                        />
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            onClick={createLoan}
                                            disabled={isLoanCreationDisabled}
                                            sx={{ mt: 2 }}
                                        >
                                            Create Loan
                                        </Button>
                                    </Box>
                                )}
                            </Box>

                            {loans.length > 0 && (
                                <Box>
                                    <Typography variant="h5" gutterBottom>
                                        Active Loans
                                    </Typography>
                                    {loans.map((loan, index) => (
                                        <Paper key={index} elevation={2} sx={{ p: 2, mb: 2 }}>
                                            <Typography variant="subtitle2" color="textSecondary">
                                                Loan Amount
                                            </Typography>
                                            <Typography variant="h6">
                                                {ethers.formatUnits(loan.loanAmount, 18)} ETH
                                            </Typography>
                                            
                                            <Typography variant="subtitle2" color="textSecondary" sx={{ mt: 1 }}>
                                                Due Date
                                            </Typography>
                                            <Typography variant="body1">
                                                {new Date(loan.dueDate * 1000).toLocaleDateString()}
                                            </Typography>
                                            
                                            <Button
                                                variant="contained"
                                                color="secondary"
                                                onClick={repayLoan}
                                                sx={{ mt: 2 }}
                                            >
                                                Repay Loan
                                            </Button>
                                        </Paper>
                                    ))}
                                </Box>
                            )}
                        </>
                    )}

                    {errorMessage && (
                        <Typography color="error" sx={{ mt: 2 }}>
                            {errorMessage}
                        </Typography>
                    )}
                </CardContent>
            </StyledCard>
        </Container>
    );
};

export default WalletCard;