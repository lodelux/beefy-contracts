const hardhat = require("hardhat");
const { addressBook } = require("blockchain-addressbook");

const {
  platforms: { joe, beefyfinance },
  tokens: {
    AVAX: { address: AVAX },
    JOE: { address: JOE },
  },
} = addressBook.avax;

const BTCb = web3.utils.toChecksumAddress("0x152b9d0fdc40c096757f570a51e494bd4b943e50");
const want = web3.utils.toChecksumAddress("0x2fD81391E30805Cc7F2Ec827013ce86dc591B806");
const shouldVerifyOnEtherscan = true;

const vaultParams = {
  mooName: "Moo Joe BTC.b-AVAX",
  mooSymbol: "mooJoeBTCbAVAX",
  delay: 21600,
};

const strategyParams = {
  want: want,
  poolId: 13,
  masterchef: joe.boostedMasterChef,
  boostStaker: joe.boostStaker,
  unirouter: joe.router,
  keeper: beefyfinance.keeper,
  strategist: "0xc75E1B127E288f1a33606a52AB5C91BBe64EaAfe", // some address
  beefyFeeRecipient: beefyfinance.beefyFeeRecipient,
  outputToNativeRoute: [JOE, AVAX],
  nativeToLp0Route: [AVAX, BTCb],
  nativeToLp1Route: [AVAX],
  rewardToNativeRoute: [],
};

const contractNames = {
  vault: "BeefyVaultV6",
  strategy: "StrategyTraderJoeBoostedLP",
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
    address: "0x8Bd3876A1C6079d35103bC1a7FD450F8024D5deD",
    constructorArguments: [
      strategyParams.want,
      strategyParams.poolId,
      strategyParams.masterchef,
      strategyParams.boostStaker,
      "0x10d52685E9f55884a67a88f2b5Ed2215D607d0a2",
      strategyParams.unirouter,
      strategyParams.keeper,
      strategyParams.strategist,
      strategyParams.beefyFeeRecipient,
      strategyParams.outputToNativeRoute,
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
