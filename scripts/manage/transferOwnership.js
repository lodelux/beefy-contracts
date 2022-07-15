const hardhat = require("hardhat");
const { addressBook } = require("blockchain-addressbook");

//SET!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
const address = "0xaE862EdbC1CB9c039155017A080AD35E8eeb3ac5";
const { beefyfinance } = addressBook[hardhat.network.name].platforms;
const ethers = hardhat.ethers;

const abi = ["function transferOwnership(address newOwner) public"];

const newVaultOwner = beefyfinance.vaultOwner;
const newStrategyOwner = beefyfinance.strategyOwner;


async function main() {
  const strategy = await ethers.getContractAt(abi, address);
  let tx2 = await strategy.transferOwnership(newStrategyOwner);
  console.log("tx2 sent");
  await tx2.wait();
  console.log("tx2 done");
}

console.log(`Transferring ownership of ${address} , on network ${hardhat.network.name}`);
// wait 1 sec
setTimeout(main, 1000);
