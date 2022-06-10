const hardhat = require("hardhat");
const { addressBook } = require("blockchain-addressbook");


//SET!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
const { beefyfinance } = addressBook.moonbeam.platforms;

const ethers = hardhat.ethers;

const abi = ["function transferOwnership(address newOwner) public"];

const contracts = ["0x3CFe04A49a4A52F5ec1904a9e6fDB7fF6E1195B1"];

async function main() {
  // const vault = await ethers.getContractAt(abi, "0x7a20f3d9a95C07130078DB77484AC2DD694cB9d9");
  const strategy = await ethers.getContractAt(abi, "0x860Aae950eE05c230f806099E314ecB919EDbf57");
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
