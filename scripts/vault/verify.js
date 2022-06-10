const hardhat = require("hardhat");
const { addressBook } = require("blockchain-addressbook");

const {
  platforms: { stellaswap, beefyfinance },
  tokens: {
    WGLMR: { address: WGLMR },
    STELLA: { address: STELLA },
    WBTC: { address: WBTC },
  },
} = addressBook.moonbeam;

const shouldVerifyOnEtherscan = true;

const want = web3.utils.toChecksumAddress("0xE28459075c806b1bFa72A38E669CCd6Fb4125f6a");

const vaultParams = {
  mooName: "Moo Stellaswap WBTCmad-GLMR",
  mooSymbol: "mooStellaswapWBTCmad-GLMR",
  delay: 21600,
};

const strategyParams = {
  want,
  poolId: 13,
  masterchef: stellaswap.masterchefV1distributorV2,
  unirouter: stellaswap.router,
  strategist: "0xc75E1B127E288f1a33606a52AB5C91BBe64EaAfe", // some address
  keeper: beefyfinance.keeper,
  beefyFeeRecipient: beefyfinance.beefyFeeRecipient,
  outputToNativeRoute: [STELLA, WGLMR],
  outputToLp0Route: [STELLA, WGLMR, WBTC],
  outputToLp1Route: [STELLA, WGLMR],
  rewardToOutputRoute: [WGLMR, STELLA],
  // pendingRewardsFunctionName: "pendingCake", // used for rewardsAvailable(), use correct function name from masterchef
};

const contractNames = {
  vault: "BeefyVaultV6",
  strategy: "StrategyStellaMultiRewardsLP",
};


async function main() {
  if (Object.values(config).some(v => v === undefined)) {
    console.error("one of config values undefined");
    return;
  }

  await hardhat.run("compile");

  // await hardhat.run("verify:verify", {
  //   address: "0x9C9C14f28F07eDe4d796aED2D7038EF6F23494A8",
  //   constructorArguments: [
  //     config.want,
  //     "0xc8DfDD41B706A6897Ff17BF99e2e94Bb661da92c",
  //     config.mooName,
  //     config.mooSymbol,
  //     config.delay,
  //   ],
  // })

  await hardhat.run("verify:verify", {
    address: "0x3CFe04A49a4A52F5ec1904a9e6fDB7fF6E1195B1",
    constructorArguments: [
      strategyParams.want,
      strategyParams.poolId,
      strategyParams.masterchef,
      "0x6A12CC9224426B15C43Bfa5e539BB452c1A17A11",
      strategyParams.unirouter,
      strategyParams.keeper,
      strategyParams.strategist,
      strategyParams.beefyFeeRecipient,
      strategyParams.outputToNativeRoute,
      strategyParams.outputToLp0Route,
      strategyParams.outputToLp1Route,
    ],
  });
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
