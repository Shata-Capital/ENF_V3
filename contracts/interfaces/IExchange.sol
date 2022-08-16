// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IExchange {
    function swapExactInput(
        address _from,
        address _to,
        bytes32 _index,
        uint256 _amount
    ) external returns (uint256);
}
