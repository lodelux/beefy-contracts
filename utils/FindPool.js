const hardhat = require("hardhat");
const { addressBook } = require("blockchain-addressbook");

const {
  platforms: { ape, beefyfinance },
  tokens: {
    BUSD: { address: BUSD },
    USDT: { address: USDT },
    WBNB: { address: WBNB },
  },
} = addressBook.bsc;

const ethers = hardhat.ethers;
const searched0 = "0xcfcEcFe2bD2FED07A9145222E8a7ad9Cf1Ccd22A";
const searched1 = true;
async function main() {
  const masterchef = await ethers.getContractAt(
    [
      "function poolInfo ( uint256 ) external view returns ( address lpToken, uint256 allocPoint, uint256 lastRewardBlock, uint256 accCakePerShare )",
      "function poolLength (  ) external view returns ( uint256 )",
    ],
    ape.masterape
  );
  const poolLength = await masterchef.poolLength();
  for (let i = poolLength; i >= 0; i--) {
    console.log(i);
    try {
      const LPaddress = await masterchef.poolInfo(i);

      const LP = await ethers.getContractAt(
        ["function token0() external view returns (address)", "function token1() external view returns (address)"],
        LPaddress[0]
      );
      const token0 = await LP.token0();
      const token1 = await LP.token1();
      if ((token0 == searched0 && token1 == searched1) || (token0 == searched1 && token1 == searched0)) {
        console.log(`poolId: ${i} \n want: ${LPaddress[0]} \n lp0: ${token0} lp1 : ${token1}`);
        return;
      }
    } catch {
      console.log("error");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
