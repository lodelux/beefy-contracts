import { chainCallFeeMap } from "../../utils/chainCallFeeMap";

const hardhat = require("hardhat");

const ethers = hardhat.ethers;

const abi = ["function callReward() public view returns (uint256)","function rewardsAvailable() public view returns (address[] memory, uint256[] memory)"];

const contracts = ["0x9deb1Fedcf49557FdaC52e545b6a72b31D5D6785"];

async function main() {
  for (const address of contracts) {
    const contract = await ethers.getContractAt(abi, address);
    const callReward = await contract.rewardsAvailable();
    console.log(callReward);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
