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
    Chip,
    Stack,
    Grid2,
    Alert
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { ethers } from "ethers";
import LendingPool from '../abi/LendingPool.json';
import TestToken from '../abi/TestToken.json';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TokenIcon from '@mui/icons-material/Token';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PaymentIcon from '@mui/icons-material/Payment';

const StyledCard = styled(Card)(({ theme }) => ({
    maxWidth: 800,
    margin: '40px auto',
    padding: theme.spacing(3),
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
    borderRadius: '16px',
}));

const BalanceCard = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(3),
    borderRadius: '12px',
    background: 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%)',
    marginBottom: theme.spacing(2),
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
    '& .MuiOutlinedInput-root': {
        borderRadius: '12px',
    },
}));

const StyledChip = styled(Chip)(({ theme }) => ({
    width: '100%',
    height: 'auto',
    padding: '12px',
    borderRadius: '12px',
    backgroundColor: theme.palette.background.default,
    '& .MuiChip-label': {
        display: 'block',
        whiteSpace: 'normal',
        wordBreak: 'break-all',
        fontSize: '1.1rem',
        fontFamily: 'monospace',
        padding: '4px'
    }
}));

const LoanCard = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(3),
    borderRadius: '12px',
    background: 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%)',
    marginTop: theme.spacing(3),
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

    const hasActiveLoan = loans.length > 0;

   return (
        <Container maxWidth="md">
            <StyledCard>
                <CardContent>
                    <Typography 
                        variant="h3" 
                        gutterBottom 
                        align="center" 
                        color="primary"
                        sx={{ 
                            fontWeight: 600,
                            mb: 4
                        }}
                    >
                        DeFi Lending Platform
                    </Typography>

                    <Box mb={4} display="flex" justifyContent="center">
                        <Button
                            variant="contained"
                            color={defaultAccount ? "success" : "primary"}
                            onClick={connectwalletHandler}
                            size="large"
                            startIcon={<AccountBalanceWalletIcon />}
                            sx={{
                                borderRadius: '12px',
                                padding: '12px 24px',
                                fontSize: '1.1rem'
                            }}
                        >
                            {defaultAccount ? "Connected!" : "Connect Wallet"}
                        </Button>
                    </Box>

                    {defaultAccount && (
                        <>
                            <Stack spacing={3}>
                                <BalanceCard elevation={2}>
                                    <Stack spacing={2}>
                                        <Box>
                                            <Typography 
                                                variant="subtitle2" 
                                                color="textSecondary" 
                                                gutterBottom
                                                sx={{ fontSize: '1rem' }}
                                            >
                                                Wallet Address
                                            </Typography>
                                            <StyledChip 
                                                label={defaultAccount}
                                                variant="outlined"
                                            />
                                        </Box>

                                        <Box display="flex" gap={4}>
                                            <Box flex={1}>
                                                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                                    ETH Balance
                                                </Typography>
                                                <Typography variant="h5" display="flex" alignItems="center" gap={1}>
                                                    <TokenIcon color="primary" />
                                                    {userBalance ?? 0} ETH
                                                </Typography>
                                            </Box>
                                            <Box flex={1}>
                                                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                                    Collateral Balance
                                                </Typography>
                                                <Typography variant="h5" display="flex" alignItems="center" gap={1}>
                                                    <AccountBalanceIcon color="primary" />
                                                    {collateralBalance ?? 0} TCOL
                                                </Typography>
                                            </Box>
                                            <Box flex={1}>
                                                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                                    Loan Balance
                                                </Typography>
                                                <Typography variant="h5" display="flex" alignItems="center" gap={1}>
                                                    <TokenIcon color="primary" />
                                                    {loanBalance ?? 0} TLOAN
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Stack>
                                </BalanceCard>

                                <Box>
                                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                                        Create New Loan
                                    </Typography>
                                    {hasActiveLoan ? (                     
                                        <Alert variant="filled" severity="warning">
                                            You already have an active loan. Please repay it before creating a new one.
                                        </Alert>                         
                                    ) : (
                                        <Box 
                                            component="form" 
                                            sx={{ 
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: 2,
                                                mt: 2
                                            }}
                                        >
                                            <StyledTextField
                                                fullWidth
                                                label="Collateral Amount"
                                                type="number"
                                                value={collateralAmount}
                                                onChange={(e) => setCollateralAmount(e.target.value)}
                                                variant="outlined"
                                                placeholder="Enter amount of TCOL"
                                                disabled={hasActiveLoan}
                                            />
                                            <StyledTextField
                                                fullWidth
                                                label="Loan Amount"
                                                type="number"
                                                value={loanAmount}
                                                onChange={(e) => setLoanAmount(e.target.value)}
                                                variant="outlined"
                                                placeholder="Enter amount of TLOAN"
                                                disabled={hasActiveLoan}
                                            />
                                            <Button
                                                fullWidth
                                                variant="contained"
                                                onClick={createLoan}
                                                disabled={hasActiveLoan}
                                                sx={{ 
                                                    mt: 2,
                                                    height: '56px',
                                                    borderRadius: '12px',
                                                    fontSize: '1.1rem',
                                                    opacity: hasActiveLoan ? 0.6 : 1
                                                }}
                                            >
                                                Create Loan
                                            </Button>
                                        </Box>
                                    )}
                                </Box>

                                {loans.length > 0 && (
                                    <LoanCard elevation={2}>
                                        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                                            Active Loan
                                        </Typography>
                                        {loans.map((loan, index) => (
                                            <Box key={index} sx={{ mt: 2 }}>
                                                <Grid2 container spacing={2}>
                                                    <Grid2 xs={12} md={4}>
                                                        <Typography variant="subtitle2" color="textSecondary">
                                                            Loan Amount
                                                        </Typography>
                                                        <Typography variant="h6">
                                                            {ethers.formatUnits(loan.loanAmount, 18)} TLOAN
                                                        </Typography>
                                                    </Grid2>
                                                    <Grid2 xs={12} md={4}>
                                                        <Typography variant="subtitle2" color="textSecondary">
                                                            Due Date
                                                        </Typography>
                                                        <Typography variant="h6">
                                                            {new Date(Number(loan.dueDate) * 1000).toLocaleDateString()}
                                                        </Typography>
                                                    </Grid2>
                                                </Grid2>

                                                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                                                    <Button
                                                        fullWidth
                                                        variant="contained"
                                                        color="secondary"
                                                        onClick={repayLoan}
                                                        startIcon={<PaymentIcon />}
                                                        sx={{ 
                                                            height: '48px',
                                                            borderRadius: '12px',
                                                            fontSize: '1.1rem'
                                                        }}
                                                    >
                                                        Repay Loan
                                                    </Button>
                                                </Box>
                                            </Box>
                                        ))}
                                    </LoanCard>
                                )}
                            </Stack>

                            {errorMessage && (
                                <Typography 
                                    color="error" 
                                    sx={{ 
                                        mt: 3,
                                        p: 2,
                                        bgcolor: 'error.light',
                                        borderRadius: 2,
                                        color: 'error.contrastText'
                                    }}
                                >
                                    {errorMessage}
                                </Typography>
                            )}
                        </>
                    )}
                </CardContent>
            </StyledCard>
        </Container>
    );
};

export default WalletCard;