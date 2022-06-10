const hardhat = require("hardhat");

const ethers = hardhat.ethers;

const abi = ["function panic() public", "function paused() public view returns (bool)"];

const contracts = ["0x60c48584CfAe8e7D5263f2433FFD994e4A8D7C28"];

async function main() {
  const [deployer, _] = await ethers.getSigners();

  for (const contract of contracts) {
    const strategy = await ethers.getContractAt(abi, contract);
    try {
      const paused = await strategy.paused();

      if (!paused) {
        let tx = await strategy.panic({ gasLimit: 3500000 });
        tx = await tx.wait();
        tx.status === 1
          ? console.log(`Strat ${contract} panic() with tx: ${tx.transactionHash}`)
          : console.log(`Could not panic ${contract}} with tx: ${tx.transactionHash}`);
      }
    } catch (err) {
      console.log(`Errr calling panic on ${contract} due to: ${err}`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
