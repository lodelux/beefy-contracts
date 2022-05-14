const hardhat = require("hardhat");
const { addressBook } = require("blockchain-addressbook");

const {
  platforms: { pangolin, beefyfinance },
  tokens: {
    WAVAX: { address: WAVAX },
    PNG: { address: PNG },
    KLO: { address: KLO },
  },
} = addressBook.avax;

const want = web3.utils.toChecksumAddress("0x6745d7F9289d7d75B5121876B1b9D8DA775c9a3E");

const strategyParams = {
  want,
  poolId: 12,
  unirouter: pangolin.router,
  strategist: "0xc75E1B127E288f1a33606a52AB5C91BBe64EaAfe", // some address
  keeper: beefyfinance.keeper,
  beefyFeeRecipient: beefyfinance.beefyFeeRecipient,
  outputToNativeRoute: [PNG, WAVAX],
  nativeToLp0Route: [WAVAX, KLO],
  nativeToLp1Route: [WAVAX],
  rewardToNativeRoutes: [[KLO, WAVAX]],
  // pendingRewardsFunctionName: "pendingTri", // used for rewardsAvailable(), use correct function name from masterchef
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
    address: "0x2BF1E2BbAbF7704D7C849c76456B208204086D18",
    constructorArguments: [
      strategyParams.want,
      strategyParams.poolId,
      "0x9C9C14f28F07eDe4d796aED2D7038EF6F23494A8",
      strategyParams.unirouter,
      strategyParams.keeper,
      strategyParams.strategist,
      strategyParams.beefyFeeRecipient,
      strategyParams.outputToNativeRoute,
      strategyParams.rewardToNativeRoutes,
      strategyParams.nativeToLp0Route,
      strategyParams.nativeToLp1Route,
      ],
  });
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
