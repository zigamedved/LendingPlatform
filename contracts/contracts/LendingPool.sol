// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract LendingPool is ReentrancyGuard {
    address public admin;
    mapping(IERC20 => bool) public supportedTokens;
    uint256 public liquidationThreshold = 150; // 150% collateralization
    bool public paused;

    constructor() {
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract paused");
        _;
    }

    function setLiquidationThreshold(uint256 _threshold) external onlyAdmin {
        require(_threshold > 100, "Invalid threshold");
        liquidationThreshold = _threshold;
    }

    function setSupportedToken(
        IERC20 token,
        bool supported
    ) external onlyAdmin {
        require(address(token) != address(0), "Invalid token address");
        require(token.totalSupply() >= 0, "Invalid ERC20");
        supportedTokens[token] = supported;
        emit TokenStatusUpdated(token, supported);
    }

    function setPaused(bool _paused) external onlyAdmin {
        paused = _paused;
    }

    function ping() public pure returns (string memory) {
        return "pong";
    }

    function emergencyWithdraw(IERC20 token) external onlyAdmin {
        uint256 balance = token.balanceOf(address(this));
        require(token.transfer(admin, balance), "Transfer failed");
    }

    struct Loan {
        address borrower;
        IERC20 collateralToken;
        IERC20 loanToken;
        uint256 collateralAmount;
        uint256 loanAmount;
        uint256 interestRate;
        uint256 dueDate;
        bool liquidated;
        uint256 lastInterestUpdate;
        uint256 accruedInterest;
    }
    mapping(address => Loan) public loans;

    event LoanCreated(address indexed borrower, uint256 loanAmount);
    event LoanLiquidated(address indexed borrower);

    mapping(IERC20 => mapping(address => uint256)) public deposits;
    mapping(IERC20 => uint256) public totalDeposits;

    event Deposit(address indexed user, IERC20 indexed token, uint256 amount);
    event Withdraw(address indexed user, IERC20 indexed token, uint256 amount);
    event TokenStatusUpdated(IERC20 indexed token, bool supported);
    event ThresholdUpdated(uint256 newThreshold);

    // not compound interest or variable interest rate
    function calculateInterest(
        Loan storage loan
    ) internal view returns (uint256) {
        uint256 timeElapsed = block.timestamp - loan.lastInterestUpdate;
        return
            (loan.loanAmount * loan.interestRate * timeElapsed) /
            (365 days) /
            100;
    }

    function createLoan(
        IERC20 _collateralToken,
        IERC20 _loanToken,
        uint256 _collateralAmount,
        uint256 _loanAmount,
        uint256 _interestRate,
        uint256 _durationDays
    ) external whenNotPaused {
        require(
            supportedTokens[_collateralToken] && supportedTokens[_loanToken],
            "Collateral or loan token not supported"
        );
        require(
            _interestRate > 0 && _interestRate <= 100,
            "Invalid interest rate"
        );
        require(
            totalDeposits[_loanToken] >= _loanAmount,
            "Insufficient liquidity"
        );
        require(
            _collateralAmount > 0,
            "Collateral amount must be greater than 0"
        );
        bool success = _collateralToken.transferFrom(
            msg.sender,
            address(this),
            _collateralAmount
        );
        require(success, "Transfer failed");

        loans[msg.sender] = Loan({
            borrower: msg.sender,
            collateralToken: _collateralToken,
            loanToken: _loanToken,
            collateralAmount: _collateralAmount,
            loanAmount: _loanAmount,
            interestRate: _interestRate,
            dueDate: block.timestamp + (_durationDays * 1 days),
            liquidated: false,
            lastInterestUpdate: block.timestamp,
            accruedInterest: 0
        });

        bool success2 = _loanToken.transfer(msg.sender, _loanAmount);
        require(success2, "Loan token transfer failed");
        emit LoanCreated(msg.sender, _loanAmount);
    }

    function liquidateLoan(address _borrower) external whenNotPaused {
        Loan storage loan = loans[_borrower];
        require(block.timestamp > loan.dueDate, "Loan not expired");
        require(!loan.liquidated, "Already liquidated");

        // simplified collateral check (use oracles in production)
        uint256 collateralValue = loan.collateralAmount;
        uint256 loanValue = loan.loanAmount + calculateInterest(loan);
        require(
            collateralValue * (100) < loanValue * (liquidationThreshold),
            "Collateral sufficient"
        );

        // protocol gets its loan back
        uint256 repayAmount = loan.loanAmount + calculateInterest(loan);
        require(
            loan.loanToken.transferFrom(msg.sender, address(this), repayAmount),
            "Must repay loan"
        );

        // liquidator gets collateral (which is worth more)
        loan.collateralToken.transfer(msg.sender, loan.collateralAmount);
        loan.liquidated = true;
        emit LoanLiquidated(_borrower);
    }

    function deposit(
        IERC20 token,
        uint256 amount
    ) external nonReentrant whenNotPaused {
        require(supportedTokens[token], "Token not supported");
        require(
            token.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );
        deposits[token][msg.sender] += amount;
        totalDeposits[token] += amount;
        emit Deposit(msg.sender, token, amount);
    }

    function withdraw(
        IERC20 token,
        uint256 amount
    ) external nonReentrant whenNotPaused {
        require(deposits[token][msg.sender] >= amount, "Insufficient balance");
        deposits[token][msg.sender] -= amount;
        totalDeposits[token] -= amount;
        require(token.transfer(msg.sender, amount), "Transfer failed");
        emit Withdraw(msg.sender, token, amount);
    }

    function repayLoan() external nonReentrant {
        Loan storage loan = loans[msg.sender];
        require(!loan.liquidated, "Loan already liquidated");

        uint256 totalDue = loan.loanAmount + calculateInterest(loan);
        require(
            loan.loanToken.transferFrom(msg.sender, address(this), totalDue),
            "Transfer failed"
        );

        // return collateral
        require(
            loan.collateralToken.transfer(msg.sender, loan.collateralAmount),
            "Collateral return failed"
        );

        delete loans[msg.sender];
    }
}
