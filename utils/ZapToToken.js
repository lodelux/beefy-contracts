import { addressBook } from "blockchain-addressbook";
import { ethers } from "hardhat";

const { zapNativeToToken, getVaultWant, unpauseIfPaused, getUnirouterData } = require("./testHelpers");

const chainName = "moonbeam";
const chainData = addressBook[chainName];

const config = {
  vault: "0xcdD1e9B5EfC1D586E9Ba4c425248864969D313db",
  vaultContract: "BeefyVaultV6",
  strategyContract: "StrategyStellaswapDualRewardLP",
  testAmount: ethers.utils.parseEther("10000"),
  wnative: chainData.tokens.WNATIVE.address,
};

let deployer, other;
async function main() {
  [deployer, other] = await ethers.getSigners();
  const vault = await ethers.getContractAt(config.vaultContract, config.vault);
  const strategyAddr = await vault.strategy();
  const strategy = await ethers.getContractAt(config.strategyContract, strategyAddr);

  const unirouterAddr = await strategy.unirouter();
  const unirouterData = getUnirouterData(unirouterAddr);
  const unirouter = await ethers.getContractAt(unirouterData.interface, unirouterAddr);
  const want = await getVaultWant(vault, config.wnative);

  zapNativeToToken({
    amount: config.testAmount,
    want,
    nativeTokenAddr: config.wnative,
    unirouter,
    swapSignature: unirouterData.swapSignature,
    recipient: deployer.address,
  });
}

main();
