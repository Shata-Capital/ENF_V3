// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "../../interfaces/ISubStrategy.sol";
import "../../utils/TransferHelper.sol";
import "./interfaces/INotionalProxy.sol";
import "./interfaces/INusdc.sol";
import "hardhat/console.sol";

contract CUSDC is OwnableUpgradeable, ISubStrategy {
    using SafeMath for uint256;

    // Sub Strategy name
    string public constant poolName = "CUSDC V3";

    // Controller address
    address public controller;

    // USDC token address
    address public usdc;

    // USDC token Decimal
    uint256 public usdcDecimal = 1e6;

    // NoteToken Decimal
    uint256 public noteDecimal = 1e8;

    // Notional Proxy address
    address public notionalProxy;

    // Slippages for deposit and withdraw
    uint256 public depositSlippage;
    uint256 public withdrawSlippage;

    // Constant magnifier
    uint256 public constant magnifier = 10000;

    // Harvest Gap
    uint256 public override harvestGap;

    // Latest Harvest
    uint256 public override latestHarvest;

    // NoteToken Address
    address public note;

    // nUSDC address
    address public nUSDC;

    // USDC Currency ID
    uint16 public currencyId;

    // Max Deposit
    uint256 public override maxDeposit;

    event OwnerDeposit(uint256 lpAmount);

    event EmergencyWithdraw(uint256 amount);

    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _usdc,
        address _controller,
        address _notionalProxy,
        address _note,
        address _nusdc,
        uint16 _currencyId
    ) public initializer {
        __Ownable_init();
        usdc = _usdc;
        controller = _controller;
        notionalProxy = _notionalProxy;
        note = _note;
        nUSDC = _nusdc;
        currencyId = _currencyId;

        // Set Max Deposit as max uin256
        maxDeposit = type(uint256).max;
    }

    /**
        Only controller can call
     */
    modifier onlyController() {
        require(controller == _msgSender(), "ONLY_CONTROLLER");
        _;
    }

    //////////////////////////////////////////
    //          VIEW FUNCTIONS              //
    //////////////////////////////////////////

    /**
        External view function of total USDC deposited in Covex Booster
     */
    function totalAssets() external view override returns (uint256) {
        return _totalAssets();
    }

    /**
        Internal view function of total USDC deposited
    */
    function _totalAssets() internal view returns (uint256) {
        uint256 nTokenBal = IERC20(nUSDC).balanceOf(address(this));

        uint256 nTokenTotal = IERC20(nUSDC).totalSupply();

        uint256 underlyingDenominated = INusdc(nUSDC).getPresentValueUnderlyingDenominated();

        return ((nTokenBal * underlyingDenominated) * usdcDecimal) / noteDecimal / nTokenTotal;
    }

    /**
        Deposit function of USDC
     */
    function deposit(uint256 _amount) external override onlyController returns (uint256) {
        uint256 deposited = _deposit(_amount);
        return deposited;
    }

    /**
        Deposit internal function
     */
    function _deposit(uint256 _amount) internal returns (uint256) {
        // Get Prev Deposit Amt
        uint256 prevAmt = _totalAssets();

        // Check Max Deposit
        require(prevAmt + _amount <= maxDeposit, "EXCEED_MAX_DEPOSIT");

        // Check whether transferred sufficient usdc from controller
        require(IERC20(usdc).balanceOf(address(this)) >= _amount, "INSUFFICIENT_USDC_TRANSFER");

        // Make Balance Action
        BalanceAction[] memory actions = new BalanceAction[](1);
        actions[0] = BalanceAction({
            actionType: DepositActionType.DepositUnderlyingAndMintNToken,
            currencyId: currencyId,
            depositActionAmount: _amount,
            withdrawAmountInternalPrecision: 0,
            withdrawEntireCashBalance: false,
            redeemToUnderlying: false
        });

        // Approve USDC to notional proxy
        IERC20(usdc).approve(notionalProxy, 0);
        IERC20(usdc).approve(notionalProxy, _amount);

        // Calls batch balance action
        INotionalProxy(notionalProxy).batchBalanceAction(address(this), actions);

        // Get new total assets amount
        uint256 newAmt = _totalAssets();

        // Deposited amt
        uint256 deposited = newAmt - prevAmt;
        uint256 minOutput = (_amount * (magnifier - depositSlippage)) / magnifier;

        require(deposited >= minOutput, "DEPOSIT_SLIPPAGE_TOO_BIG");

        return deposited;
    }

    /**
        Withdraw function of USDC
     */
    function withdraw(uint256 _amount) external override onlyController returns (uint256) {
        // Get Current Deposit Amt
        uint256 total = _totalAssets();
        uint256 totalLP = IERC20(nUSDC).balanceOf(address(this));
        uint256 lpAmt = (totalLP * _amount) / total;
        console.log("LP AMt: ", lpAmt);

        // Withdraw nUSDC
        _withdraw(lpAmt);
        // Transfer withdrawn USDC to controller
        uint256 asset = IERC20(usdc).balanceOf(address(this));
        console.log("asset AMt: ", asset);

        // Deposited amt
        uint256 withdrawn = asset;
        uint256 minOutput = (_amount * (magnifier - withdrawSlippage)) / magnifier;

        require(withdrawn >= minOutput, "WITHDRAW_SLIPPAGE_TOO_BIG");

        // Transfer USDC to Controller
        TransferHelper.safeTransfer(usdc, controller, asset);

        console.log("asset AMt: ", asset);
        return asset;
    }

    /**
        Withdraw internal function
     */
    function _withdraw(uint256 _amount) internal {
        // Make Balance Action
        BalanceAction[] memory actions = new BalanceAction[](1);
        actions[0] = BalanceAction({
            actionType: DepositActionType.RedeemNToken,
            currencyId: currencyId,
            depositActionAmount: _amount,
            withdrawAmountInternalPrecision: 0,
            withdrawEntireCashBalance: true,
            redeemToUnderlying: true
        });

        // Calls batch balance action
        INotionalProxy(notionalProxy).batchBalanceAction(address(this), actions);

        // Deduct total LP Amount is not needed
    }

    /**
        Harvest reward token from convex booster
     */
    function harvest() external override onlyController {
        // Call incentive earning
        INotionalProxy(notionalProxy).nTokenClaimIncentives();

        // Transfer Reward tokens to controller
        uint256 noteBal = IERC20(note).balanceOf(address(this));
        TransferHelper.safeTransfer(note, controller, noteBal);

        // Update latest block timestamp
        latestHarvest = block.timestamp;
    }

    /**
        Emergency Withdraw LP token from convex booster and send to owner
     */
    function emergencyWithdraw() public onlyOwner {
        uint256 totalLP = IERC20(nUSDC).balanceOf(address(this));
        // If totalLP is zero, return
        if (totalLP == 0) return;

        _withdraw(totalLP);
        // Transfer withdrawn USDC to controller
        uint256 asset = IERC20(usdc).balanceOf(address(this));
        TransferHelper.safeTransfer(usdc, owner(), asset);

        // Emit Event
        emit EmergencyWithdraw(totalLP);
    }

    /**
        Check withdrawable status of required amount
     */
    function withdrawable(uint256 _amount) external view override returns (bool) {
        // Get Current Deposit Amt
        uint256 total = _totalAssets();

        // If requested amt is bigger than total asset, return false
        if (_amount > total) return false;
        // Todo Have to check withdrawable amount
        else return true;
    }

    /**
        Deposit by owner not issueing any ENF token
     */
    function ownerDeposit(uint256 _amount) public onlyOwner {
        // Transfer token from owner
        TransferHelper.safeTransferFrom(usdc, owner(), address(this), _amount);

        // Call deposit
        _deposit(_amount);

        emit OwnerDeposit(_amount);
    }

    //////////////////////////////////////////////////
    //               SET CONFIGURATION              //
    //////////////////////////////////////////////////

    /**
        Set Controller
     */
    function setController(address _controller) public onlyOwner {
        require(_controller != address(0), "INVALID_LP_TOKEN");
        controller = _controller;
    }

    /**
        Set Deposit Slipage
     */
    function setDepositSlippage(uint256 _slippage) public onlyOwner {
        require(_slippage < magnifier, "INVALID_SLIPPAGE");

        depositSlippage = _slippage;
    }

    /**
        Set Withdraw Slipage
     */
    function setWithdrawSlippage(uint256 _slippage) public onlyOwner {
        require(_slippage < magnifier, "INVALID_SLIPPAGE");

        withdrawSlippage = _slippage;
    }

    /**
        Set Harvest Gap
     */
    function setHarvestGap(uint256 _harvestGap) public onlyOwner {
        require(_harvestGap > 0, "INVALID_HARVEST_GAP");
        harvestGap = _harvestGap;
    }

    /**
        Set Max Deposit
     */
    function setMaxDeposit(uint256 _maxDeposit) public onlyOwner {
        require(_maxDeposit > 0, "INVALID_MAX_DEPOSIT");
        maxDeposit = _maxDeposit;
    }
}
