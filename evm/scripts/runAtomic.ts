// evm/scripts/runAtomic.ts
import { ethers } from "ethers";
import artifact from "../artifacts/contracts/AtomicExchange.sol/AtomicExchange.json";

async function main() {
  // Connect to Hardhat local node
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

  // Hardhat default accounts
  const seller = new ethers.Wallet(
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    provider
  );

  const buyer = new ethers.Wallet(
    "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
    provider
  );

  // Warm up provider (helps avoid stale nonce reads in some environments)
  await provider.getBlockNumber();

  // Pull "pending" nonces so we never reuse a nonce
  let sellerNonce = await provider.getTransactionCount(seller.address, "pending");
  let buyerNonce = await provider.getTransactionCount(buyer.address, "pending");

  console.log("Seller:", seller.address, "starting nonce:", sellerNonce);
  console.log("Buyer: ", buyer.address, "starting nonce:", buyerNonce);

  // Deploy contract (seller deploys)
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, seller);

  // Use `any` to avoid TS ABI typing noise
  const atomic: any = await factory.deploy({ nonce: sellerNonce++ });
  await atomic.waitForDeployment();

  const addr = await atomic.getAddress();
  console.log("AtomicExchange deployed to:", addr);

  // Create listing (1 ETH)
  const tx1 = await atomic.createListing(ethers.parseEther("1"), { nonce: sellerNonce++ });
  await tx1.wait();
  console.log("Listing created (id should be 0)");

  // Buy listing (NOTE: Solidity function name is buyLisitng)
  const tx2 = await atomic
    .connect(buyer)
    .buyLisitng(0, { value: ethers.parseEther("1"), nonce: buyerNonce++ });
  await tx2.wait();
  console.log("Listing bought");

  // Read listing
  const listing = await atomic.listings(0);
  console.log("Final listing:", listing);

  // Optional: balances
  const sellerBal = await provider.getBalance(seller.address);
  const buyerBal = await provider.getBalance(buyer.address);
  console.log("Seller balance:", ethers.formatEther(sellerBal));
  console.log("Buyer balance: ", ethers.formatEther(buyerBal));
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
