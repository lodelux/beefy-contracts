const hardhat = require("hardhat");
const { addressBook } = require("blockchain-addressbook");

const { beefyfinance, pangolin } = addressBook.avax.platforms;

const ethers = hardhat.ethers;
const searched = "0xb27c8941a7Df8958A1778c0259f76D1F8B711C35";
async function main() {
  const minichef = await ethers.getContractAt(
    ["function lpTokens() external view returns (address[])"],
    pangolin.minichef
  );
  const lpTokens = await minichef.lpTokens();
  for (const [index, lpToken] of lpTokens.entries()) {
    const PGL = await ethers.getContractAt(
      ["function token0() external view returns (address)", "function token1() external view returns (address)"],
      lpToken
    );
    const token0 = await PGL.token0();
    const token1 = await PGL.token1();
    if (token0 == searched || token1 == searched) {
      console.log(`poolId: ${index} \n want: ${lpToken} \n lp0: ${token0} lp1 : ${token1}`);
      return;
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
