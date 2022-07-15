const hardhat = require("hardhat");
const { addressBook } = require("blockchain-addressbook");

const {
  platforms: { joe, beefyfinance },
} = addressBook.avax;

const ethers = hardhat.ethers;
// searchedPool as checksummed from web3
const searchedPool = web3.utils.toChecksumAddress("0x2fd81391e30805cc7f2ec827013ce86dc591b806");

let found = [];
async function main() {
  const masterchef = await ethers.getContractAt(
    [
      "function poolInfo ( uint256 ) external view returns ( address lpToken, uint256 allocPoint, uint256 lastRewardBlock, uint256 accCakePerShare )",
      "function poolLength (  ) external view returns ( uint256 )",
    ],
    joe.masterchefV3
  );
  const poolLength = await masterchef.poolLength();
  for (let i = poolLength; i >= 0; i--) {
    if (i % 10 == 0) {
      console.log(i);
    }
    try {
      const LPaddress = await masterchef.poolInfo(i);
      console.log(LPaddress[0]);
      if (LPaddress[0] == searchedPool) {
        console.log("found at ", i);
      }
      continue;
    } catch (e) {
      console.log(e);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
