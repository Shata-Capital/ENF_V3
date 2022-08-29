// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./interfaces/ICurvePool.sol";
import "../utils/TransferHelper.sol";
import "../interfaces/IRouter.sol";

contract Curve is IRouter, Ownable {
    using SafeMath for uint256;

    string public constant version = "Curve 1";

    // Curve Pool Struct
    struct CurvePool {
        address pool;
        address from;
        int128 i;
        address to;
        int128 j;
    }

    // Array for path indices
    bytes32[] public pathBytes;

    // Mapping for index to CurvePool
    mapping(bytes32 => CurvePool) public pools;

    address public weth;

    address public exchange;

    event AddCurvePool(address pool, address from, address to, int128 i, int128 j);
    event RemoveCurvePool(address pool, address from, address to, int128 i, int128 j);

    constructor(address _weth, address _exchange) {
        weth = _weth;
        exchange = _exchange;
    }

    receive() external payable {}

    /**
        Only exchange can call
     */
    modifier onlyExchange() {
        require(exchange == _msgSender(), "ONLY_EXCHANGE");
        _;
    }

    function setExchange(address _exchange) public onlyOwner {
        require(exchange != address(0), "ZERO_ADDRESS");
        exchange = _exchange;
    }

    /**
        Add Curve Pool
     */
    function addCurvePool(
        address _pool,
        address _from,
        address _to,
        int128 _i,
        int128 _j
    ) public onlyOwner returns (bytes32) {
        // Generate hash index for path
        bytes32 hash = keccak256(abi.encodePacked(_pool, _from, _to, _i, _j));

        // Duplication check
        require(pools[hash].pool == address(0), "ALREADY_EXIST_POOL");

        // Add new Curve pool
        pools[hash] = CurvePool({pool: _pool, from: _from, to: _to, i: _i, j: _j});

        emit AddCurvePool(_pool, _from, _to, _i, _j);

        return hash;
    }

    /**
        Remove Curve Pool
     */
    function removeCurvePool(bytes32 index) public onlyOwner {
        // Duplication check
        require(pools[index].pool != address(0), "NON_EXIST_POOL");

        CurvePool storage curvePool = pools[index];

        delete pools[index];

        // Remove index in the list
        for (uint256 i = 0; i < pathBytes.length; i++) {
            if (pathBytes[i] == index) {
                pathBytes[i] = pathBytes[pathBytes.length - 1];
                pathBytes.pop();
                break;
            }
        }

        emit RemoveCurvePool(curvePool.pool, curvePool.from, curvePool.to, curvePool.i, curvePool.j);
    }

    /**
        Get Path index
     */

    function getPathIndex(
        address _pool,
        address _from,
        address _to,
        int128 _i,
        int128 _j
    ) public view returns (bytes32) {
        bytes32 hash = keccak256(abi.encodePacked(_pool, _from, _to, _i, _j));

        if (pools[hash].pool != address(0)) return 0;
        else return hash;
    }

    /**
        Get input token from path
     */
    function pathFrom(bytes32 index) public view override returns (address) {
        return pools[index].from;
    }

    /**
        Get output token from path
     */
    function pathTo(bytes32 index) public view override returns (address) {
        return pools[index].to;
    }

    /**
        Uniswap V3 Swap 
     */
    function swap(
        address _from,
        address _to,
        bytes32 _index,
        uint256 _amount
    ) external override onlyExchange {
        // Check Path from and to
        require(pathFrom(_index) == _from, "INVALID_FROM_ADDRESS");
        require(pathTo(_index) == _to, "INVALID_TO_ADDRESS");

        // Get Curve Pool address
        CurvePool storage curve = pools[_index];

        ICurvePool(curve.pool).exchange_underlying(curve.i, curve.j, _amount, 0);
    }
}
