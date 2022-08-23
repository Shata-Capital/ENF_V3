// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./interfaces/IBalancer.sol";
import "../utils/TransferHelper.sol";
import "../interfaces/IRouter.sol";

contract BalancerV2 is IRouter, Ownable {
    using SafeMath for uint256;

    string public constant version = "BalancerV2 1";

    address public router;

    // Struct Pool info for Balancer
    mapping(bytes32 => BatchSwapStep[]) public balancerSwaps;

    mapping(bytes32 => IAsset[]) public balancerAssets;

    // Array for path indices
    bytes32[] public pathBytes;

    event AddBalancerSwap(bytes32 hash, IAsset[] assets);

    event RemoveBalancerSwap(bytes32 hash, IAsset[] assets);

    constructor(address _router) {
        router = _router;
    }

    /**
        add balancer swaps and assets 
     */
    function addBalancerSwap(BatchSwapStep[] memory _swaps, IAsset[] memory _assets)
        public
        onlyOwner
        returns (bytes32)
    {
        // Generate hash index for path
        bytes32 hash = keccak256(abi.encodePacked(_assets));

        // Duplication check
        require(balancerSwaps[hash].length == 0 && balancerAssets[hash].length == 0, "ALREADY_EXIST_PATH");

        balancerSwaps[hash] = _swaps;
        balancerAssets[hash] = _assets;

        emit AddBalancerSwap(hash, _assets);

        return hash;
    }

    function getPathIndex(IAsset[] memory _assets) public view returns (bytes32) {
        bytes32 hash = keccak256(abi.encodePacked(_assets));

        if (balancerAssets[hash].length == 0) return 0;
        else return hash;
    }

    /**
        Remove univ2 path from list
     */
    function removePath(bytes32 index) public onlyOwner {
        require(balancerAssets[index].length != 0, "NON_EXIST_PATH");

        // TempSave for assets info
        IAsset[] storage assets = balancerAssets[index];

        // Delete path record from mapping
        delete balancerAssets[index];
        delete balancerSwaps[index];

        // Remove index in the list
        for (uint256 i = 0; i < pathBytes.length; i++) {
            if (pathBytes[i] == index) {
                pathBytes[i] = pathBytes[pathBytes.length - 1];
                pathBytes.pop();
                break;
            }
        }

        emit RemoveBalancerSwap(index, assets);
    }

    /**
        Get input token from path
     */
    function pathFrom(bytes32 index) internal view returns (address) {
        return address(balancerAssets[index][0]);
    }

    /**
        Get output token from path
     */
    function pathTo(bytes32 index) internal view returns (address) {
        return address(balancerAssets[index][balancerAssets[index].length - 1]);
    }

    function swap(
        address _from,
        address _to,
        bytes32 _index,
        uint256 _amount
    ) external override {
        // Check Path from and to
        require(pathFrom(_index) == _from, "INVALID_FROM_ADDRESS");
        require(pathTo(_index) == _to, "INVALID_TO_ADDRESS");

        // Get Swaps and assets info from registered
        BatchSwapStep[] memory swaps = balancerSwaps[_index];
        IAsset[] memory assets = balancerAssets[_index];

        uint256 length = assets.length;

        // Create fund structure
        FundManagement memory funds = FundManagement({
            sender: address(this),
            fromInternalBalance: false,
            recipient: payable(address(this)),
            toInternalBalance: false
        });

        // Create limit output
        int256[] memory limits = new int256[](length);

        for (uint256 i = 0; i < length; i++) {
            limits[i] = i == 0 ? int256(_amount) : int256(0);
        }
        // Call batch swap in balancer
        IBalancer(router).batchSwap(0, swaps, assets, funds, limits, block.timestamp + 3600);
    }
}
