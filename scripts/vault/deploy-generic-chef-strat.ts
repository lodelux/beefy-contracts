import hardhat, { ethers, web3 } from "hardhat";
import { addressBook } from "blockchain-addressbook";
import { predictAddresses } from "../../utils/predictAddresses";
import { setCorrectCallFee } from "../../utils/setCorrectCallFee";
import { setPendingRewardsFunctionName } from "../../utils/setPendingRewardsFunctionName";
import { verifyContract } from "../../utils/verifyContract";
import { BeefyChain } from "../../utils/beefyChain";

const registerSubsidy = require("../../utils/registerSubsidy");

const {
  platforms: { beamswap, beefyfinance },
  tokens: {
    WGLMR: { address: WGLMR },
    GLINT: { address: GLINT },
    xcDOT: { address: xcDOT },
    USDCs: { address: USDCs },
  },
} = addressBook.moonbeam;

const shouldVerifyOnEtherscan = true;

const want = web3.utils.toChecksumAddress("0x6Ba38f006aFe746B9A0d465e53aB4182147AC3D7");

const vaultParams = {
  mooName: "Moo Beam USDCmad-WGLMR",
  mooSymbol: "mooBeamWUSDCmad-WGLMR",
  delay: 21600,
};

const strategyParams = {
  want,
  poolId: 15,
  masterchef: beamswap.masterchef,
  unirouter: beamswap.router,
  strategist: "0xc75E1B127E288f1a33606a52AB5C91BBe64EaAfe", // some address
  keeper: beefyfinance.keeper,
  beefyFeeRecipient: beefyfinance.beefyFeeRecipient,
  outputToNativeRoute: [GLINT, WGLMR],
  outputToLp0Route: [GLINT, WGLMR, USDCs],
  outputToLp1Route: [GLINT, WGLMR],
  // rewardToOutputRoute: [WGLMR, STELLA],
  // pendingRewardsFunctionName: "pendingCake", // used for rewardsAvailable(), use correct function name from masterchef
};

const contractNames = {
  vault: "BeefyVaultV6",
  strategy: "StrategyBeamChefLP",
};

async function main() {
  if (
    Object.values(vaultParams).some(v => v === undefined) ||
    Object.values(strategyParams).some(v => v === undefined) ||
    Object.values(contractNames).some(v => v === undefined)
  ) {
    console.error("one of config values undefined");
    return;
  }

  await hardhat.run("compile");

  const Vault = await ethers.getContractFactory(contractNames.vault);
  const Strategy = await ethers.getContractFactory(contractNames.strategy);

  const [deployer, other] = await ethers.getSigners();

  console.log("Deploying:", vaultParams.mooName);

  const predictedAddresses = await predictAddresses({ creator: deployer.address });
  const vaultConstructorArguments = [
    predictedAddresses.strategy,
    vaultParams.mooName,
    vaultParams.mooSymbol,
    vaultParams.delay,
  ];
  const vault = await Vault.deploy(...vaultConstructorArguments);
  await vault.deployed();
  const strategyConstructorArguments = [
    strategyParams.want,
    strategyParams.poolId,
    strategyParams.masterchef,
    vault.address,
    strategyParams.unirouter,
    strategyParams.keeper,
    strategyParams.strategist,
    strategyParams.beefyFeeRecipient,
    strategyParams.outputToNativeRoute,
    strategyParams.outputToLp0Route,
    strategyParams.outputToLp1Route,
  ];
  const strategy = await Strategy.deploy(...strategyConstructorArguments);
  await strategy.deployed();

  const Lp1 = await strategy.outputToLp1();
  // add this info to PR
  console.log();
  console.log("Vault:", vault.address);
  console.log("Strategy:", strategy.address);
  console.log("Want:", strategyParams.want);
  console.log("PoolId:", strategyParams.poolId);

  console.log();
  console.log("Running post deployment");

  const verifyContractsPromises: Promise<any>[] = [];
  if (shouldVerifyOnEtherscan) {
    // skip await as this is a long running operation, and you can do other stuff to prepare vault while this finishes
    verifyContractsPromises.push(
      verifyContract(vault.address, vaultConstructorArguments),
      verifyContract(strategy.address, strategyConstructorArguments)
    );
  }
  // await setPendingRewardsFunctionName(strategy, strategyParams.pendingRewardsFunctionName);
  await setCorrectCallFee(strategy, hardhat.network.name as BeefyChain);
  // await strategy.addRewardRoute(strategyParams.rewardToOutputRoute);
  console.log(`Transfering Vault Owner to ${beefyfinance.vaultOwner}`);
  await vault.transferOwnership(beefyfinance.vaultOwner);
  // await strategy.transferOwnership(beefyfinance.strategyOwner);
  console.log();

  await Promise.all(verifyContractsPromises);

  // if (hardhat.network.name === "bsc") {
  //   await registerSubsidy(vault.address, deployer);
  //   await registerSubsidy(strategy.address, deployer);
  // }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
