const hardhat = require("hardhat");
const { addressBook } = require("blockchain-addressbook");

const {
  platforms: { babyswap, beefyfinance },
  tokens: {
    NEAR: { address: NEAR },
    ATOM: { address: ATOM },
    FTM: { address: FTM },
    AVAX: { address: AVAX },

    USDT: { address: USDT },
    WBNB: { address: WBNB },
  },
} = addressBook.bsc;

const ethers = hardhat.ethers;
const searchedPools = [["0xc85471a1bC8ae143b29fcDe6539507FBED075b15", false]];
// const searchedPools = [
//   [NEAR, USDT],
//   [NEAR, WBNB],
//   [ATOM, USDT],
//   [ATOM, WBNB],
//   [FTM, USDT],
//   [FTM, WBNB],
//   [AVAX, USDT],
//   [AVAX, WBNB],
// ];

let found = [];
async function main() {
  const masterchef = await ethers.getContractAt(
    [
      "function poolInfo ( uint256 ) external view returns ( address lpToken, uint256 allocPoint, uint256 lastRewardBlock, uint256 accCakePerShare )",
      "function poolLength (  ) external view returns ( uint256 )",
    ],
    "0xdfAa0e08e357dB0153927C7EaBB492d1F60aC730"
  );
  const poolLength = await masterchef.poolLength();
  for (let i = poolLength; i >= 0; i--) {
    // if (i % 10 == 0) {
    //   console.log(i);
    // }
    try {
      const LPaddress = await masterchef.poolInfo(i);
      if (LPaddress[0] == searchedPools[0][0]) {
        console.log(i);
      }
      continue;
      const LP = await ethers.getContractAt(
        ["function token0() external view returns (address)", "function token1() external view returns (address)"],
        LPaddress[0]
      );

      const token0 = await LP.token0();
      const token1 = await LP.token1();
      for (const searchedPool of searchedPools) {
        if (searchedPool[1]) {
          if (
            (token0 == searchedPool[0] && token1 == searchedPool[1]) ||
            (token0 == searchedPool[0] && token1 == searchedPool[1])
          ) {
            console.log(`poolId: ${i} \n want: ${LPaddress[0]} \n lp0: ${token0} lp1 : ${token1}`);
            found.push(LPaddress[0]);
            break;
          }
        } else {
          if (LPaddress[0] == searchedPool[0]) {
            console.log(`poolId: ${i} \n want: ${LPaddress[0]} \n lp0: ${token0} lp1 : ${token1}`);
            found.push(LPaddress[0]);
            break;
          }
        }
      }
    } catch (e) {}
  }

  console.log(...found);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

/*
FTM-BNB
poolId: 190 
 want: 0x9283F1CF65Ea0D1D1D42a80427A66a73e0055a55 
 lp0: 0xAD29AbB318791D579433D831ed122aFeAf29dcfe lp1 : 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c

 ATOM-BNB
poolId: 189 
 want: 0x1550567293d3D95a33e1FE9B250617FA06E1BeD9 
 lp0: 0x0Eb3a705fc54725037CC9e008bDede697f62F335 lp1 : 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c

 NEAR-BNB
poolId: 188 
 want: 0x7ef84d60F41fa47a6582Ddcf5724bA61B67f9e75 
 lp0: 0x1Fa4a73a3F0133f0025378af00236f3aBDEE5D63 lp1 : 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c
 
 AVAX-BNB
poolId: 187 
 want: 0x70Ef2ea7500e81DCB77eb7E33F4343eE494dA89a 
 lp0: 0x1CE0c2827e2eF14D5C4f29a091d735A204794041 lp1 : 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c

 ATOM-USDT
 poolId: 104 
 want: 0x42932A3c73DF05586aa5cfD4f3a9a61655c98b45 
 lp0: 0x0Eb3a705fc54725037CC9e008bDede697f62F335 lp1 : 0x55d398326f99059fF775485246999027B3197955

 NEAR-USDT
 poolId: 25 
 want: 0x1E0F11671362E4163eb5530ffFA2f01d4028cdf9 
 lp0: 0x1Fa4a73a3F0133f0025378af00236f3aBDEE5D63 lp1 : 0x55d398326f99059fF775485246999027B3197955

 AVAX-USDT
poolId: 24 
 want: 0x74c4DA0DAca1A9e52Faec732d96BC7dEA9FB3ac1 
 lp0: 0x1CE0c2827e2eF14D5C4f29a091d735A204794041 lp1 : 0x55d398326f99059fF775485246999027B3197955

 FTM-USDT
poolId: 102 
 want: 0xc85471a1bC8ae143b29fcDe6539507FBED075b15 
 lp0: 0x55d398326f99059ff775485246999027b3197955 lp1 : 0xad29abb318791d579433d831ed122afeaf29dcfe

*/
