// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "../interfaces/IController.sol";

contract EFVault is ERC20, Ownable, ReentrancyGuard {
    using SafeERC20 for ERC20;
    using SafeMath for uint256;
    using Address for address;

    ERC20 public immutable asset;

    address public controller;

    uint256 public maxDeposit;

    uint256 public maxWithdraw;

    event Deposit(address indexed caller, address indexed owner, uint256 assets, uint256 shares);

    event Withdraw(address indexed caller, address indexed owner, uint256 assets, uint256 shares);

    constructor(
        ERC20 _asset,
        string memory _name,
        string memory _symbol
    ) ERC20(_name, _symbol) {
        asset = _asset;
    }

    function deposit(uint256 assets, address receiver) public virtual nonReentrant returns (uint256 shares) {
        require(assets != 0, "ZERO_ASSETS");

        // Need to transfer before minting or ERC777s could reenter.
        asset.safeTransferFrom(msg.sender, address(controller), assets);

        // Total Assets amount until now
        uint256 totalDeposit = IController(controller).totalAssets();

        // Calls Deposit function on controller
        uint256 newDeposit = IController(controller).deposit(assets);

        require(newDeposit > 0, "INVALID_DEPOSIT_SHARES");

        // Calculate share amount to be mint
        shares = totalSupply() == 0 ? assets : (totalSupply() * newDeposit) / totalDeposit;

        // Mint ENF token to receiver
        _mint(receiver, shares);

        emit Deposit(msg.sender, receiver, assets, shares);
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
}
