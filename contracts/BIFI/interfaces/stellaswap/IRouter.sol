// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.9.0;

interface IRouter {

function swapFromBase(
        address pool,
        address basePool,
        uint8 tokenIndexFrom,
        uint8 tokenIndexTo,
        uint256 dx,
        uint256 minDy,
        uint256 deadline
    ) external returns (uint256);

}