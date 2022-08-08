// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IUniswapV2Router.sol";
import "../interfaces/IUniswapV3Router.sol";
import "../interfaces/IExchange.sol";
import "../utils/TransferHelper.sol";

contract Exchange is IExchange, Ownable {
    using SafeMath for uint256;

    string public constant version = "3.0";

    address public weth;

    struct PathInfo {
        uint256 version;
        address router;
        address[] path;
    }

    mapping(bytes32 => PathInfo) public paths;
    bytes32[] public pathBytes;

    event AddPath(bytes32 hash, uint256 version, address router, address[] path);

    event RemovePath(bytes32 hash, uint256 version, address router, address[] path);

    constructor(address _weth) {
        weth = _weth;
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
        uint256 _amount
    ) external override returns (uint256) {}
}
