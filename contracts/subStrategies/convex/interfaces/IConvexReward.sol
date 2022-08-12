// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IConvexReward {
    function getReward(address _account, bool _claimExtras) external returns (bool);

    function withdraw(uint256 amount, bool claim) external returns (bool);
}
