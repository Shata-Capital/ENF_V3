// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "../../interfaces/ISubStrategy.sol";

contract Alusd is Ownable, ISubStrategy {
    using SafeMath for uint256;

    address public controller;

    constructor(address _controller) {
        controller = _controller;
    }

    modifier onlyController() {
        require(controller == _msgSender(), "ONLY_CONTROLLER");
        _;
    }

    function deposit(uint256 _amount) external override returns (uint256) {}
}
