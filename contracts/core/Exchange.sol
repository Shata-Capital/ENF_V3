// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IUniswapV2Router.sol";
import "../interfaces/IUniswapV3Router.sol";
import "../interfaces/IExchange.sol";
import "../utils/TransferHelper.sol";

contract Exchange is IExchange, Ownable {
    using SafeMath for uint256;

    string public constant version = "3.0";

    address public weth;

    address public controller;

    struct PathInfo {
        uint256 version;
        address router;
        address[] path;
    }

    mapping(bytes32 => PathInfo) public paths;
    bytes32[] public pathBytes;

    event AddPath(bytes32 hash, uint256 version, address router, address[] path);

    event RemovePath(bytes32 hash, uint256 version, address router, address[] path);

    constructor(address _weth, address _controller) {
        weth = _weth;
        controller = _controller;
    }

    /**
        Get input token from path
     */
    function pathFrom(bytes32 index) internal view returns (address) {
        return paths[index].path[0];
    }

    /**
        Get output token from path
     */
    function pathTo(bytes32 index) internal view returns (address) {
        return paths[index].path[paths[index].path.length - 1];
    }

    /**
        Add path to list
     */
    function addPath(
        uint256 _version,
        address _router,
        address[] memory _path
    ) public onlyOwner returns (bytes32) {
        // Generate hash index for path
        bytes32 hash = keccak256(abi.encodePacked(_router, _path));

        // Duplication check
        require(paths[hash].path.length == 0, "ALREADY_EXIST_PATH");

        // Register path
        pathBytes.push(hash);
        paths[hash].path = _path;
        paths[hash].router = _router;
        paths[hash].version = _version;

        emit AddPath(hash, _version, _router, _path);

        return hash;
    }

    function getPathIndex(address _router, address[] memory _path) public view returns (bytes32) {
        bytes32 hash = keccak256(abi.encodePacked(_router, _path));

        if (paths[hash].path.length == 0) return 0;
        else return hash;
    }

    /**
        Remove path from list
     */
    function removePath(bytes32 index) public onlyOwner {
        require(paths[index].path.length != 0, "NON_EXIST_PATH");

        PathInfo storage path = paths[index];
        // Delete path record from mapping
        delete paths[index];

        // Remove index in the list
        for (uint256 i = 0; i < pathBytes.length; i++) {
            if (pathBytes[i] == index) {
                pathBytes[i] = pathBytes[pathBytes.length - 1];
                pathBytes.pop();
                break;
            }
        }

        emit RemovePath(index, path.version, path.router, path.path);
    }

    /**
        Swap Exact Input
     */

    function swapExactInput(
        address _from,
        address _to,
        bytes32 _index,
        uint256 _amount
    ) external override returns (uint256) {
        // Get router and version
        address router = paths[_index].router;
        uint256 _version = paths[_index].version;

        // Transfer token from controller
        TransferHelper.safeTransferFrom(_from, controller, address(this), _amount);

        // Approve token to router
        IERC20(_from).approve(router, 0);
        IERC20(_from).approve(router, _amount);

        // Swap token using uniswap/sushiswap
        if (_version == 2) {
            // If version 2 use uniswap v2 interface
            if (_to == weth) {
                // If target token is Weth
                // Ignore front-running
                IUniswapV2Router(router).swapExactTokensForETHSupportingFeeOnTransferTokens(
                    _amount,
                    0,
                    paths[_index].path,
                    address(this),
                    block.timestamp + 3600
                );
            } else {
                IUniswapV2Router(router).swapExactTokensForTokensSupportingFeeOnTransferTokens(
                    _amount,
                    0,
                    paths[_index].path,
                    address(this),
                    block.timestamp + 3600
                );
            }
        } else {
            IUniswapV3Router(router).exactInputSingle(
                IUniswapV3Router.ExactInputSingleParams({
                    tokenIn: _from,
                    tokenOut: _to,
                    fee: 0,
                    recipient: address(this),
                    deadline: block.timestamp + 3600,
                    amountIn: _amount,
                    amountOutMinimum: 0,
                    sqrtPriceLimitX96: 0
                })
            );
        }

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
