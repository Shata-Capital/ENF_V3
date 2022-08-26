// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IExchange.sol";
import "../interfaces/IRouter.sol";
import "../utils/TransferHelper.sol";

contract Exchange is IExchange, Ownable {
    using SafeMath for uint256;

    string public constant version = "3.0";

    address public controller;

    address[] public routers;

    address public weth;

    constructor(address _weth, address _controller) {
        controller = _controller;
        weth = _weth;
    }

    /**
        Swap Exact Input
     */
    function swapExactInput(
        address _from,
        address _to,
        address _router,
        bytes32 _index,
        uint256 _amount
    ) external override returns (uint256) {
        // Transfer token from controller
        TransferHelper.safeTransferFrom(_from, controller, address(_router), _amount);
        // Approve token to router
        IERC20(_from).approve(_router, 0);
        IERC20(_from).approve(_router, _amount);

        // Swap token using uniswap/sushiswap
        IRouter(_router).swap(_from, _to, _index, _amount);

        // Get Swapped output amount
        uint256 outAmt = getBalance(_to, address(this));

        // Transfer to Controller
        TransferHelper.safeTransfer(_to, controller, outAmt);

        return outAmt;
    }

    function getBalance(address asset, address account) internal view returns (uint256) {
        if (address(asset) == address(weth)) return address(account).balance;
        else return IERC20(asset).balanceOf(account);
    }
}
