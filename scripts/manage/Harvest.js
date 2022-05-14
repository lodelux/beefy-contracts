const hardhat = require("hardhat");
const { addressBook } = require("blockchain-addressbook");

const { beefyfinance, pangolin } = addressBook.avax.platforms;

const ethers = hardhat.ethers;
async function main() {
  const Strategy = await ethers.getContractAt(
    ["function harvest() external"],
    "0x2BF1E2BbAbF7704D7C849c76456B208204086D18"
  );

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
