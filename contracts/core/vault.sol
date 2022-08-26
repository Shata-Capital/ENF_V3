// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "../interfaces/IController.sol";
import "../utils/TransferHelper.sol";

import "hardhat/console.sol";

contract EFVault is Initializable, ERC20Upgradeable, OwnableUpgradeable, ReentrancyGuardUpgradeable {
    using SafeERC20 for ERC20;
    using SafeMath for uint256;
    using Address for address;

    ERC20 public immutable asset;

    string public constant version = "3.0";

    address public depositApprover;

    address public controller;

    uint256 public maxDeposit;

    uint256 public maxWithdraw;

    event Deposit(address indexed caller, address indexed owner, uint256 assets, uint256 shares);

    event Withdraw(address indexed caller, address indexed owner, uint256 assets, uint256 shares);

    constructor(
    ) {
        _disableInitializers();
    }

    function initialize(
        ERC20 _asset,
        string memory _name,
        string memory _symbol
    ) initializer public{

        __ERC20_init(_name, _symbol);
        __Ownable_init();
        __ReentrancyGuard_init();
        asset = _asset;
    }

    function deposit(uint256 assets, address receiver) public virtual nonReentrant returns (uint256 shares) {
        require(assets != 0, "ZERO_ASSETS");

        require(getBalance(address(this)) >= assets, "INSUFFICIENT_TRANSFER");

        // Need to transfer before minting or ERC777s could reenter.
        TransferHelper.safeTransfer(address(asset), address(controller), assets);

        // Total Assets amount until now
        uint256 totalDeposit = IController(controller).totalAssets();
        // Calls Deposit function on controller
        uint256 newDeposit = IController(controller).deposit(assets);

        require(newDeposit > 0, "INVALID_DEPOSIT_SHARES");

        // Calculate share amount to be mint
        shares = totalSupply() == 0 || totalDeposit == 0 ? assets : (totalSupply() * newDeposit) / totalDeposit;

        // Mint ENF token to receiver
        _mint(receiver, shares);

        emit Deposit(msg.sender, receiver, assets, shares);
    }

    function getBalance(address account) internal view returns (uint256) {
        // Asset is zero address when it is ether
        if (address(asset) == address(0)) return address(account).balance;
        else return IERC20(asset).balanceOf(account);
    }

    function withdraw(uint256 assets, address receiver) public virtual nonReentrant returns (uint256 shares) {
        require(assets != 0, "ZERO_ASSETS");

        // Total Assets amount until now
        uint256 totalDeposit = IController(controller).totalAssets();

        // Calls Withdraw function on controller
        uint256 withdrawn = IController(controller).withdraw(assets, receiver);

        require(withdrawn > 0, "INVALID_WITHDRAWN_SHARES");

        // Calculate share amount to be burnt
        shares = (totalSupply() * withdrawn) / totalDeposit;

        _burn(receiver, shares);

        emit Withdraw(msg.sender, receiver, assets, shares);
    }

    function totalAssets() public view virtual returns (uint256) {
        return IController(controller).totalAssets();
    }

    function convertToShares(uint256 assets) public view virtual returns (uint256) {
        uint256 supply = totalSupply();

        return supply == 0 ? assets : (assets * supply) / totalAssets();
    }

    function convertToAssets(uint256 shares) public view virtual returns (uint256) {
        uint256 supply = totalSupply();

        return supply == 0 ? shares : (shares / supply) * totalAssets();
    }

    /*//////////////////////////////////////////////////////////////
                     SET CONFIGURE LOGIC
    //////////////////////////////////////////////////////////////*/

    function setMaxDeposit(uint256 _maxDeposit) public onlyOwner {
        require(_maxDeposit > 0, "INVALID_MAX_DEPOSIT");
        maxDeposit = _maxDeposit;
    }

    function setMaxWithdraw(uint256 _maxWithdraw) public onlyOwner {
        require(_maxWithdraw > 0, "INVALID_MAX_WITHDRAW");
        maxWithdraw = _maxWithdraw;
    }

    function setController(address _controller) public onlyOwner {
        require(_controller != address(0), "INVALID_ZERO_ADDRESS");
        controller = _controller;
    }

    function setDepositApprover(address _approver) public onlyOwner {
        require(_approver != address(0), "INVALID_ZERO_ADDRESS");
        depositApprover = _approver;
    }
}
