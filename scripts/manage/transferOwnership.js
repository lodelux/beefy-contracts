const hardhat = require("hardhat");
const { addressBook } = require("blockchain-addressbook");

const { beefyfinance } = addressBook.avax.platforms;

const ethers = hardhat.ethers;

const abi = ["function transferOwnership(address newOwner) public"];

const contracts = ["0x63B72C55994662811E3fcfC49dF879304eB2e808"];

async function main() {
  const vault = await ethers.getContractAt(abi, "0x9C9C14f28F07eDe4d796aED2D7038EF6F23494A8");
  const strategy = await ethers.getContractAt(abi, "0x2BF1E2BbAbF7704D7C849c76456B208204086D18");
  // console.log("transfering vault\n");
  // let tx1 = await vault.transferOwnership(beefyfinance.vaultOwner);
  // console.log("tx1 sent");
  // await tx1.wait();
  // console.log("tx1 done");
  let tx2 = await strategy.transferOwnership(beefyfinance.strategyOwner);
  console.log("tx2 sent");
  await tx2.wait();
  console.log("tx2 done");
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
