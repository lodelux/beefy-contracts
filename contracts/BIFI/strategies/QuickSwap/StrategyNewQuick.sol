// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

import "../../interfaces/common/IUniswapRouterETH.sol";
import "../../interfaces/common/IUniswapV2Pair.sol";
import "../../interfaces/common/IRewardPool.sol";
import "../../interfaces/quick/IQuickConverter.sol";
import "../Common/StratManager.sol";
import "../Common/FeeManager.sol";

contract StrategyNewQuick is StratManager, FeeManager {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    // Tokens used
    address public native;
    address public output;
    address public want;
    address public oldWant;

    // Third party contracts
    address public rewardPool;
    address public quickConverter;
    bool public convert = true;

    // Routes
    address[] public outputToNativeRoute;
    address[] public outputToWantRoute;
    address[] public outputToOldWantRoute;

    bool public harvestOnDeposit;
    uint256 public lastHarvest;

    event StratHarvest(address indexed harvester, uint256 wantHarvested, uint256 tvl);
    event Deposit(uint256 tvl);
    event Withdraw(uint256 tvl);
    event ChargedFees(uint256 callFees, uint256 beefyFees, uint256 strategistFees);

    constructor(
        address _want,
        address _rewardPool,
        address _quickConverter,
        address _vault,
        address _unirouter,
        address _keeper,
        address _strategist,
        address _beefyFeeRecipient,
        address[] memory _outputToNativeRoute,
        address[] memory _outputToWantRoute,
        address[] memory _outputToOldWantRoute
    ) StratManager(_keeper, _strategist, _unirouter, _vault, _beefyFeeRecipient) public {
        want = _want;
        rewardPool = _rewardPool;
        quickConverter = _quickConverter;

        output = _outputToNativeRoute[0];
        native = _outputToNativeRoute[_outputToNativeRoute.length - 1];
        oldWant = _outputToOldWantRoute[_outputToOldWantRoute.length - 1];
        outputToNativeRoute = _outputToNativeRoute;

        require(_outputToWantRoute[0] == output, "toDeposit[0] != output");
        require(_outputToWantRoute[_outputToWantRoute.length - 1] == want, "!want");
        outputToWantRoute = _outputToWantRoute;

        require(_outputToOldWantRoute[0] == output, "toOldWant[0] != output");
        outputToOldWantRoute = _outputToOldWantRoute;

        _giveAllowances();
    }

    // puts the funds to work
    function deposit() public whenNotPaused {
        uint256 wantBal = balanceOfWant();

        if (wantBal > 0) {
            IRewardPool(rewardPool).stake(wantBal);
            emit Deposit(wantBal);
        }
    }

    function withdraw(uint256 _amount) external {
        require(msg.sender == vault, "!vault");

        uint256 wantBal = balanceOfWant();

        if (wantBal < _amount) {
            IRewardPool(rewardPool).withdraw(_amount.sub(wantBal));
            wantBal = balanceOfWant();
        }

        if (wantBal > _amount) {
            wantBal = _amount;
        }

        if (tx.origin != owner() && !paused()) {
            uint256 withdrawalFeeAmount = wantBal.mul(withdrawalFee).div(WITHDRAWAL_MAX);
            wantBal = wantBal.sub(withdrawalFeeAmount);
        }

        IERC20(want).safeTransfer(vault, wantBal);

        emit Withdraw(balanceOf());
    }

    function beforeDeposit() external virtual override {
        if (harvestOnDeposit) {
            require(msg.sender == vault, "!vault");
            _harvest(tx.origin);
        }
    }

    function harvest() external virtual {
        _harvest(tx.origin);
    }

    function harvest(address callFeeRecipient) external virtual {
        _harvest(callFeeRecipient);
    }

    function managerHarvest() external onlyManager {
        _harvest(tx.origin);
    }

    // compounds earnings and charges performance fee
    function _harvest(address callFeeRecipient) internal whenNotPaused {
        IRewardPool(rewardPool).getReward();

        uint256 outputBal = IERC20(output).balanceOf(address(this));
        if (outputBal > 0) {
            chargeFees(callFeeRecipient);
            swapRewards();
            uint256 wantHarvested = balanceOfWant();
            deposit();

            lastHarvest = block.timestamp;
            emit StratHarvest(msg.sender, wantHarvested, balanceOf());
        }
    }

    // performance fees
    function chargeFees(address callFeeRecipient) internal {
        uint256 toNative = IERC20(output).balanceOf(address(this)).mul(45).div(1000);
        IUniswapRouterETH(unirouter).swapExactTokensForTokens(toNative, 0, outputToNativeRoute, address(this), now);

        uint256 nativeBal = IERC20(native).balanceOf(address(this));

        uint256 callFeeAmount = nativeBal.mul(callFee).div(MAX_FEE);
        IERC20(native).safeTransfer(callFeeRecipient, callFeeAmount);

        uint256 beefyFeeAmount = nativeBal.mul(beefyFee).div(MAX_FEE);
        IERC20(native).safeTransfer(beefyFeeRecipient, beefyFeeAmount);

        uint256 strategistFeeAmount = nativeBal.mul(STRATEGIST_FEE).div(MAX_FEE);
        IERC20(native).safeTransfer(strategist, strategistFeeAmount);

        emit ChargedFees(callFeeAmount, beefyFeeAmount, strategistFeeAmount);
    }

    // swap rewards to want
    function swapRewards() internal {
        if (want != output) {
            uint256 outputBal = IERC20(output).balanceOf(address(this));
            if (convert) {
                IUniswapRouterETH(unirouter).swapExactTokensForTokens(outputBal, 0, outputToOldWantRoute, address(this), now);
                uint256 oldWantBal = IERC20(oldWant).balanceOf(address(this));
                IQuickConverter(quickConverter).quickToQuickX(oldWantBal);
            } else {
                IUniswapRouterETH(unirouter).swapExactTokensForTokens(outputBal, 0, outputToWantRoute, address(this), now);
            }
        }
    }

    // calculate the total underlaying 'want' held by the strat.
    function balanceOf() public view returns (uint256) {
        return balanceOfWant().add(balanceOfPool());
    }

    // it calculates how much 'want' this contract holds.
    function balanceOfWant() public view returns (uint256) {
        return IERC20(want).balanceOf(address(this));
    }

    // it calculates how much 'want' the strategy has working in the farm.
    function balanceOfPool() public view returns (uint256) {
        return IRewardPool(rewardPool).balanceOf(address(this));
    }

    // returns rewards unharvested
    function rewardsAvailable() public view returns (uint256) {
        return IRewardPool(rewardPool).earned(address(this));
    }

    // native reward amount for calling harvest
    function callReward() public view returns (uint256) {
        uint256 outputBal = rewardsAvailable();
        uint256 nativeOut;
        if (outputBal > 0) {
            uint256[] memory amountOut = IUniswapRouterETH(unirouter).getAmountsOut(outputBal, outputToNativeRoute);
            nativeOut = amountOut[amountOut.length -1];
        }

        return nativeOut.mul(45).div(1000).mul(callFee).div(MAX_FEE);
    }

    // called as part of strat migration. Sends all the available funds back to the vault.
    function retireStrat() external {
        require(msg.sender == vault, "!vault");

        IRewardPool(rewardPool).withdraw(balanceOfPool());

        uint256 wantBal = balanceOfWant();
        IERC20(want).transfer(vault, wantBal);
    }

    function setHarvestOnDeposit(bool _harvestOnDeposit) external onlyManager {
        harvestOnDeposit = _harvestOnDeposit;

        if (harvestOnDeposit == true) {
            super.setWithdrawalFee(0);
        } else {
            super.setWithdrawalFee(10);
        }
    }

    // pauses deposits and withdraws all funds from third party systems.
    function panic() public onlyManager {
        pause();
        IRewardPool(rewardPool).withdraw(balanceOfPool());
    }

    function pause() public onlyManager {
        _pause();

        _removeAllowances();
    }

    function unpause() external onlyManager {
        _unpause();

        _giveAllowances();

        deposit();
    }

    function outputToNative() public view returns (address[] memory) {
        return outputToNativeRoute;
    }

    function outputToWant() public view returns (address[] memory) {
        return outputToWantRoute;
    }

    function outputToOldWant() public view returns (address[] memory) {
        return outputToWantRoute;
    }

    function _giveAllowances() internal {
        IERC20(want).safeApprove(rewardPool, uint256(-1));
        IERC20(output).safeApprove(unirouter, uint256(-1));
        IERC20(oldWant).safeApprove(quickConverter, uint256(-1));
    }

    function _removeAllowances() internal {
        IERC20(want).safeApprove(rewardPool, 0);
        IERC20(output).safeApprove(unirouter, 0);
        IERC20(oldWant).safeApprove(quickConverter, 0);
    }

    function setConvert(bool _convert) external onlyManager {
        convert = _convert;

        if (convert) {
            IERC20(oldWant).safeApprove(quickConverter, 0);
            IERC20(oldWant).safeApprove(quickConverter, uint256(-1));
        } else {
            IERC20(oldWant).safeApprove(quickConverter, 0);
        }
    }

    function swapRewardPool(
        address _rewardPool,
        address[] memory _outputToNativeRoute,
        address[] memory _outputToWantRoute
    ) external onlyOwner {
        require(want == IRewardPool(_rewardPool).stakingToken(), "Proposal not valid for this Vault");
        require((_outputToNativeRoute[0] == IRewardPool(_rewardPool).rewardsToken())
            && (_outputToWantRoute[0] == IRewardPool(_rewardPool).rewardsToken()),
            "Proposed output in route is not valid");
        require(_outputToWantRoute[_outputToWantRoute.length - 1] == want, "Proposed want in route is not valid");

        IRewardPool(rewardPool).withdraw(balanceOfPool());
        _removeAllowances();

        rewardPool = _rewardPool;
        output = _outputToNativeRoute[0];
        outputToNativeRoute = _outputToNativeRoute;
        outputToWantRoute = _outputToWantRoute;

        _giveAllowances();
        IRewardPool(rewardPool).stake(balanceOfWant());
    }
}