// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.9.0;

interface IStellaRouter {


    function swapExactTokensForTokens(
        uint amountIn, 
        uint amountOutMin, 
        address[] calldata path, 
        address to, 
        uint deadline
    ) external returns (uint[] memory amounts);

    function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts);

}