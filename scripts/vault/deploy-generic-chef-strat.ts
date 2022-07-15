import hardhat, { ethers, web3 } from "hardhat";
import { addressBook } from "blockchain-addressbook";
import { predictAddresses } from "../../utils/predictAddresses";
import { setCorrectCallFee } from "../../utils/setCorrectCallFee";
import { setPendingRewardsFunctionName } from "../../utils/setPendingRewardsFunctionName";
import { verifyContract } from "../../utils/verifyContract";
import { BeefyChain } from "../../utils/beefyChain";

const registerSubsidy = require("../../utils/registerSubsidy");

const {
  platforms: { stellaswap, beefyfinance },
  tokens: {
    STELLA: { address: STELLA },
    WELL: { address: WELL },
    GLMR: { address: GLMR },
  },
} = addressBook.moonbeam;

const want = web3.utils.toChecksumAddress("0xb536c1f9a157b263b70a9a35705168acc0271742");
const shouldVerifyOnEtherscan = false;

const vaultParams = {
  mooName: "Moo Stella WELL-GLMR",
  mooSymbol: "mooStellaWellGlmr",
  delay: 21600,
};
  
const strategyParams = {
  want: want,
  poolId: 15,
  masterchef: stellaswap.masterchefV1distributorV2,
  unirouter: stellaswap.router,
  keeper: beefyfinance.keeper,
  strategist: "0xc75E1B127E288f1a33606a52AB5C91BBe64EaAfe", // some address
  beefyFeeRecipient: beefyfinance.beefyFeeRecipient,
  outputToNativeRoute: [STELLA, GLMR],
  outputToLp0Route: [STELLA, GLMR, WELL],
  outputToLp1Route: [STELLA, GLMR],
  rewardToOutPutRoute: [WELL,GLMR,STELLA],
};

const contractNames = {
  vault: "BeefyVaultV6",
  strategy: "StrategyStellaMultiRewardsLP",
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
      // verifyContract(vault.address, vaultConstructorArguments),
      verifyContract(strategy.address, strategyConstructorArguments)
    );
  }
  // await setPendingRewardsFunctionName(strategy, strategyParams.pendingRewardsFunctionName);
  await setCorrectCallFee(strategy, hardhat.network.name as BeefyChain);

  if (strategyParams.rewardToOutPutRoute.length > 0) {
    console.log("adding rewardToNativeRoute");
    await strategy.addRewardRoute(strategyParams.rewardToOutPutRoute);
  }
  console.log(`Transfering Vault Owner to ${beefyfinance.vaultOwner}`);
  await vault.transferOwnership(beefyfinance.vaultOwner);
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
