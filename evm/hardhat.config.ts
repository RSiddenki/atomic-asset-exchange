import { defineConfig } from "hardhat/config";
import hardhatEthers from "@nomicfoundation/hardhat-ethers";

export default defineConfig({
  plugins: [hardhatEthers],

  paths: {
    sources: "./contracts",
    artifacts: "./artifacts",
    cache: "./cache",
  },

  solidity: "0.8.20",

  networks: {
    localhost: {
      type: "http",
      url: "http://127.0.0.1:8545",
    },
  },
});
