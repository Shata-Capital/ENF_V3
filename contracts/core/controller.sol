// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "../interfaces/IController.sol";
import "../interfaces/ISubStrategy.sol";
import "../interfaces/IExchange.sol";
import "../utils/TransferHelper.sol";

import "hardhat/console.sol";

contract Controller is Initializable, IController, OwnableUpgradeable, ReentrancyGuardUpgradeable {
    using SafeMath for uint256;

    string public constant version = "3.0";

    // Vault Address
    address public vault;

    // Asset for deposit
    ERC20 public immutable asset;

    // Exchange Address
    address public exchange;

    // Default mode
    bool public isDefault;

    // Default SS
    uint8 public defaultDepositSS;
    uint8 public defaultWithdrawSS;

    struct SSInfo {
        address subStrategy;
        uint256 allocPoint;
    }

    // Sub Strategy List
    SSInfo[] public subStrategies;

    // Reward Token list
    address[] public rewardTokens;

    uint256[] public apySort;

    uint256 public totalAllocPoint;

    // Withdraw Fee
    uint256 public withdrawFee;

    // Magnifier
    uint256 public constant magnifier = 10000;

    // Treasury Address
    address public treasury;

    event Harvest(uint256 assets, uint256 harvestAt);

    event MoveFund(address from, address to, uint256 withdrawnAmount, uint256 depositAmount, uint256 movedAt);

    event SetAllocPoint(address subStrategy, uint256 allocPoint, uint256 totalAlloc);

    event RegisterSubStrategy(address subStrategy, uint256 allocPoint);

    constructor(){
        _disableInitializers();
    }

    function initialize()(
        address _vault,
        ERC20 _asset,
        address _treasury
    ) initializer public{
        __Ownable_init();
        __ReentrancyGuard_init();

        vault = _vault;

        // Address zero for asset means ETH
        asset = _asset;

        treasury = _treasury;
    }

    modifier onlyVault() {
        require(vault == _msgSender(), "ONLY_VAULT");
        _;
    }

    /**
        Deposit function is only callable by vault
     */
    function deposit(uint256 _amount) external override onlyVault returns (uint256) {
        // Check input amount
        require(_amount > 0, "ZERO AMOUNT");

        // Check substrategy length
        require(subStrategies.length > 0, "INVALID_POOL_LENGTH");

        uint256 depositAmt = _deposit(_amount);
        return depositAmt;
    }

    /**
        _deposit is internal function for deposit action, if default option is set, deposit all requested amount to default sub strategy.
        Unless loop through sub strategies regiestered and distribute assets according to the allocpoint of each SS
     */
    function _deposit(uint256 _amount) internal returns (uint256 depositAmt) {
        if (isDefault) {
            // Check Such default SS exists in current pool
            require(subStrategies.length > defaultDepositSS, "INVALID_POOL_LENGTH");

            // Transfer asset to substrategy
            TransferHelper.safeTransfer(address(asset), subStrategies[defaultDepositSS].subStrategy, _amount);

            // Calls deposit function on SubStrategy
            depositAmt = ISubStrategy(subStrategies[defaultDepositSS].subStrategy).deposit(_amount);
        } else {
            for (uint256 i = 0; i < subStrategies.length; i++) {
                // Calculate how much to deposit in one sub strategy
                uint256 amountForSS = (_amount * subStrategies[i].allocPoint) / totalAllocPoint;

                if (amountForSS == 0) continue;

                // Transfer asset to substrategy
                TransferHelper.safeTransfer(address(asset), subStrategies[i].subStrategy, _amount);

                // Calls deposit function on SubStrategy
                uint256 amount = ISubStrategy(subStrategies[i].subStrategy).deposit(_amount);
                depositAmt += amount;
            }
        }
    }

    /**
        Withdraw requested amount of asset and send to receiver as well as send to treasury
        if default pool has enough asset, withdraw from it. unless loop through SS in the sequence of APY, and try to withdraw
     */
    function withdraw(uint256 _amount, address _receiver) external override onlyVault returns (uint256 withdrawAmt) {
        // Check input amount
        require(_amount > 0, "ZERO AMOUNT");

        // Check substrategy length
        require(subStrategies.length > 0, "INVALID_POOL_LENGTH");

        bool defaultWithdrawable = ISubStrategy(subStrategies[defaultWithdrawSS].subStrategy).withdrawable(_amount);

        if (defaultWithdrawable) {
            withdrawAmt = ISubStrategy(subStrategies[defaultWithdrawSS].subStrategy).withdraw(_amount);
        } else {
            for (uint256 i = 0; i < subStrategies.length; i++) {
                // Prevent duplicate checking of default pool
                if (i == defaultWithdrawSS) continue;
                bool withdrawable = ISubStrategy(subStrategies[apySort[i]].subStrategy).withdrawable(_amount);
                if (!withdrawable) continue;

                withdrawAmt = ISubStrategy(subStrategies[apySort[i]].subStrategy).withdraw(_amount);
                break;
            }
        }

        if (withdrawAmt > 0) {
            require(asset.balanceOf(address(this)) >= withdrawAmt, "INVALID_WITHDRAWN_AMOUNT");

            // Pay Withdraw Fee to treasury and send rest to user
            uint256 fee = (withdrawAmt * withdrawFee) / magnifier;
            TransferHelper.safeTransfer(address(asset), treasury, fee);

            // Transfer withdrawn token to receiver
            uint256 toReceive = withdrawAmt - fee;
            TransferHelper.safeTransfer(address(asset), _receiver, toReceive);
        }
    }

    /**
        Harvest from sub strategies, group similar sub strategies in terms of reward token.
        Then exchange it to asset in this vault, deposit again
     */
    function harvest(
        uint256[] memory _ssIds,
        bytes32[] memory _indexes,
        address _router
    ) public onlyOwner returns (uint256) {
        // Indexes must have same length of reward tokens
        require(_indexes.length == rewardTokens.length, "INVALID_INDEX");
        // Loop Through harvest group
        for (uint256 i = 0; i < _ssIds.length; i++) {
            address subStrategy = subStrategies[_ssIds[i]].subStrategy;

            /**
                Check harvest gap, it must passed over the gap since last harvested
                Harvest gap and latest harvest timestamp is maintained on sub strategy
             */
            require(
                ISubStrategy(subStrategy).latestHarvest() + ISubStrategy(subStrategy).harvestGap() <= block.timestamp,
                "RECENTLY_HARVESTED"
            );

            // Harvest from Individual Sub Strategy
            ISubStrategy(subStrategy).harvest();
        }

        require(exchange != address(0), "EXCHANGE_NOT_SET");

        // Swap Reward token to asset for deposit
        for (uint256 i = 0; i < rewardTokens.length; i++) {
            uint256 amount = IERC20(rewardTokens[i]).balanceOf(address(this));
            console.log("Reward Token: ", rewardTokens[i], amount);
            if (amount == 0) continue;

            // Approve token to Exchange
            IERC20(rewardTokens[i]).approve(exchange, 0);
            IERC20(rewardTokens[i]).approve(exchange, amount);

            // Call Swap on exchange
            IExchange(exchange).swapExactInput(rewardTokens[i], address(asset), _router, _indexes[i], amount);
        }

        // Deposit harvested reward
        uint256 assetsHarvested = getBalance(address(this));
        console.log("USDC harvested: ", assetsHarvested);

        require(assetsHarvested > 0, "ZERO_REWARD_HARVESTED");

        _deposit((assetsHarvested));

        emit Harvest(assetsHarvested, block.timestamp);

        return assetsHarvested;
    }

    function getBalance(address account) internal view returns (uint256) {
        if (address(asset) == address(0)) return address(account).balance;
        else return IERC20(asset).balanceOf(account);
    }

    /**
        Move Fund functionality is to withdraw from one SS and deposit to other SS for fluctuating market contition
     */
    function moveFund(
        uint256 _fromId,
        uint256 _toId,
        uint256 _amount
    ) public onlyOwner {
        address from = subStrategies[_fromId].subStrategy;
        address to = subStrategies[_toId].subStrategy;

        bool withdrawable = ISubStrategy(from).withdrawable(_amount);

        require(withdrawable, "NOT_WITHDRAWABLE_AMOUNT_FROM");
        uint256 withdrawAmt = ISubStrategy(from).withdraw(_amount);

        // Transfer asset to substrategy
        TransferHelper.safeTransfer(address(asset), to, _amount);

        // Calls deposit function on SubStrategy
        uint256 depositAmt = ISubStrategy(to).deposit(_amount);

        emit MoveFund(from, to, withdrawAmt, depositAmt, block.timestamp);
    }

    /**
        Query for total assets deposited in all sub strategies
     */
    function totalAssets() external view override returns (uint256) {
        uint256 total;

        for (uint256 i = 0; i < subStrategies.length; i++) {
            total += ISubStrategy(subStrategies[i].subStrategy).totalAssets();
        }

        return total;
    }

    /**
        Return SubStrategies length
     */
    function subStrategyLength() external view returns (uint256) {
        return subStrategies.length;
    }

    //////////////////////////////////////////
    //           SET CONFIGURATION          //
    //////////////////////////////////////////

    function setVault(address _vault) public onlyOwner {
        require(_vault != address(0), "INVALID_ADDRESS");
        vault = _vault;
    }

    /**
        APY Sort info, owner can set it from offchain while supervising substrategies' status and market condition
        This is to avoid gas consumption while withdraw, no repeatedly doing apy check
     */
    function setAPYSort(uint256[] memory _apySort) public onlyOwner {
        require(_apySort.length == subStrategies.length, "INVALID_APY_SORT");
        apySort = _apySort;
    }

    /**
        Set fee pool address
     */
    function setTreasury(address _treasury) public onlyOwner {
        require(_treasury != address(0), "ZERO_ADDRESS");
        treasury = _treasury;
    }

    /**
        Set exchange address
     */
    function setExchange(address _exchange) public onlyOwner {
        require(_exchange != address(0), "ZERO_ADDRESS");
        exchange = _exchange;
    }

    /**
        Set withdraw fee
     */
    function setWithdrawFee(uint256 _withdrawFee) public onlyOwner {
        require(_withdrawFee < magnifier, "INVALID_WITHDRAW_FEE");
        withdrawFee = _withdrawFee;
    }

    /**
        Set allocation point of a sub strategy and recalculate total allocation point of vault
     */
    function setAllocPoint(uint256 _allocPoint, uint256 _ssId) public onlyOwner {
        require(_ssId < subStrategies.length, "INVALID_SS_ID");

        // Set Alloc point of targeted SS
        subStrategies[_ssId].allocPoint = _allocPoint;

        // Calculate total alloc point
        uint256 total;
        for (uint256 i = 0; i < subStrategies.length; i++) {
            total += subStrategies[i].allocPoint;
        }

        totalAllocPoint = total;

        emit SetAllocPoint(subStrategies[_ssId].subStrategy, _allocPoint, totalAllocPoint);
    }

    /**
        Register Substrategy to controller
     */
    function registerSubStrategy(address _subStrategy, uint256 _allocPoint) public onlyOwner {
        // Prevent duplicate register
        for (uint256 i = 0; i < subStrategies.length; i++) {
            require(subStrategies[i].subStrategy != _subStrategy, "ALREADY_REGISTERED");
        }

        // Push to sub strategy list
        subStrategies.push(SSInfo({subStrategy: _subStrategy, allocPoint: _allocPoint}));

        // Recalculate total alloc point
        totalAllocPoint += _allocPoint;

        emit RegisterSubStrategy(_subStrategy, _allocPoint);
    }

    /**
        Set Default Deposit substrategy
     */
    function setDefaultDepositSS(uint8 _ssId) public onlyOwner {
        require(_ssId < subStrategies.length, "INVALID_SS_ID");
        defaultDepositSS = _ssId;
    }

    /**
        Set Default Deposit mode
     */
    function setDefaultOption(bool _isDefault) public onlyOwner {
        isDefault = _isDefault;
    }

    /**
        Set Default Withdraw substrategy
     */
    function setDefaultWithdrawSS(uint8 _ssId) public onlyOwner {
        require(_ssId < subStrategies.length, "INVALID_SS_ID");
        defaultWithdrawSS = _ssId;
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
