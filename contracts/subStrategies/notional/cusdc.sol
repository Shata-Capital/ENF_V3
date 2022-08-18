// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "../../interfaces/ISubStrategy.sol";
import "../../utils/TransferHelper.sol";

contract CUSDC is Ownable, ISubStrategy {
    using SafeMath for uint256;

    // Sub Strategy name
    string public constant poolName = "CUSDC V3";

    // Controller address
    address public controller;

    // USDC token address
    address public usdc;

    // Notional Proxy address
    address public notionalProxy;

    // Slippages for deposit and withdraw
    uint256 public depositSlippage;
    uint256 public withdrawSlippage;

    // Constant magnifier
    uint256 public constant magnifier = 10000;

    // Total LP token deposit to convex booster
    uint256 public totalLP;

    // Harvest Gap
    uint256 public override harvestGap;

    // Latest Harvest
    uint256 public override latestHarvest;

    // Reward Token list
    address[] public rewardTokens;

    // Max Deposit
    uint256 public override maxDeposit;

    event OwnerDeposit(uint256 lpAmount);

    event EmergencyWithdraw(uint256 amount);

    constructor(
        address _usdc,
        address _controller,
        address _notionalProxy
    ) {
        usdc = _usdc;
        controller = _controller;
        notionalProxy = _notionalProxy;
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
    function _totalAssets() internal view returns (uint256) {}

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

    // Add reward token to list
    function addRewardToken(address _token) public onlyOwner {
        require(_token != address(0), "ZERO_ADDRESS");

        for (uint256 i = 0; i < rewardTokens.length; i++) {
            require(rewardTokens[i] != _token, "DUPLICATE_REWARD_TOKEN");
        }
        rewardTokens.push(_token);
    }

    // Remove reward token from list
    function removeRewardToken(address _token) public onlyOwner {
        require(_token != address(0), "ZERO_ADDRESS");

        bool succeed;

        for (uint256 i = 0; i < rewardTokens.length; i++) {
            if (rewardTokens[i] == _token) {
                rewardTokens[i] = rewardTokens[rewardTokens.length - 1];
                rewardTokens.pop();

                succeed = true;
                break;
            }
        }

        require(succeed, "REMOVE_REWARD_TOKEN_FAIL");
    }
}
