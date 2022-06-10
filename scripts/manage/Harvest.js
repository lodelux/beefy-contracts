const hardhat = require("hardhat");
const { addressBook } = require("blockchain-addressbook");

const { beefyfinance, pangolin } = addressBook.bsc.platforms;

const ethers = hardhat.ethers;
async function main() {
  const Strategy = await ethers.getContractAt(
    ["function harvest() external", "function unpause() external", "function paused() public view returns (bool)"],
    "0x60c48584CfAe8e7D5263f2433FFD994e4A8D7C28"
  );

  let paused = await Strategy.paused();
  if (paused) {
    const unpause = await Strategy.unpause();
    await unpause.wait();
  }
  const tx = await Strategy.harvest();
  tx.wait();
  console.log("harvested");
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
