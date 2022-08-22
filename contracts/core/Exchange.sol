// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IUniswapV2Router.sol";
import "../interfaces/IUniswapV3Router.sol";
import "../interfaces/IBalancer.sol";
import "../interfaces/IExchange.sol";
import "../utils/TransferHelper.sol";

contract Exchange is IExchange, Ownable {
    using SafeMath for uint256;

    string public constant version = "3.0";

    address public weth;

    address public controller;

    struct PathInfo {
        RouterType routerType;
        address router;
        address[] path;
    }

    mapping(bytes32 => PathInfo) public paths;
    bytes32[] public pathBytes;

    enum RouterType {
        uniswapV2,
        uniswapV3,
        balancer,
        curve
    }

    event AddPath(bytes32 hash, RouterType routerType, address router, address[] path);

    event RemovePath(bytes32 hash, RouterType routerType, address router, address[] path);

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
        RouterType _routerType,
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
        paths[hash].routerType = _routerType;

        emit AddPath(hash, _routerType, _router, _path);

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

        emit RemovePath(index, path.routerType, path.router, path.path);
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
        RouterType _routerType = paths[_index].routerType;

        // Transfer token from controller
        TransferHelper.safeTransferFrom(_from, controller, address(this), _amount);
        // Approve token to router
        IERC20(_from).approve(router, 0);
        IERC20(_from).approve(router, _amount);

        // Swap token using uniswap/sushiswap
        if (_routerType == RouterType.uniswapV2) {
            // If version 2 use uniswap v2 interface
            uniV2Swap(_to, _amount, _index);
        } else if (_routerType == RouterType.uniswapV3) {
            univ3Swap(router, _from, _to, _amount);
        } else if (_routerType == RouterType.balancer) {
            balancerSwap();
        }

        // Get Swapped output amount
        uint256 outAmt = getBalance(_to, address(this));

        // Transfer to Controller
        TransferHelper.safeTransfer(_to, controller, outAmt);

        return outAmt;
    }

    function uniV2Swap(
        address _to,
        uint256 _amount,
        bytes32 _index
    ) internal {
        if (_to == weth) {
            // If target token is Weth
            // Ignore front-running
            IUniswapV2Router(paths[_index].router).swapExactTokensForETHSupportingFeeOnTransferTokens(
                _amount,
                0,
                paths[_index].path,
                address(this),
                block.timestamp + 3600
            );
        } else {
            IUniswapV2Router(paths[_index].router).swapExactTokensForTokensSupportingFeeOnTransferTokens(
                _amount,
                0,
                paths[_index].path,
                address(this),
                block.timestamp + 3600
            );
        }
    }

    function univ3Swap(
        address router,
        address _from,
        address _to,
        uint256 _amount
    ) internal {
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

    function balancerSwap(address router, uint256 _amount, bytes32 _index) internal {
        // Get Path info
        address memory path[] = paths[_index];

        BatchSwapStep memroy swaps[];
        
        // Make swap struct
        for (uint i = 0; i < path.length; i++) {
            swaps.push(BatchSwapStep{
                poolId: path[i],
                assetInIndex: i,
                assetOutIndex: i + 1,
                amount: i == 0? _amount : 0,
                userData: 0
            });
        }

        // Call batch swap in balancer
        IBalancer(router).batchSwap(0, swaps, path, funds, limits, deadline);
    }

    function getBalance(address asset, address account) internal view returns (uint256) {
        if (address(asset) == address(weth)) return address(account).balance;
        else return IERC20(asset).balanceOf(account);
    }
}
