import { ethers } from "ethers";
import * as dotenv from "dotenv";
import * as fs from "node:fs";
import * as path from "node:path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

type History = {
  sourceChainId: number;
  txHash: string;
  status: string;
  executionHash?: string;
  error?: string;
};
const sources = [
  {
    name: "Base Sepolia deposit",
    chainId: 84532,
    rpc: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
    gateway: process.env.BASE_SEPOLIA_GATEWAY_ADDRESS,
  },
  {
    name: "Monad harvest",
    chainId: 10143,
    rpc: process.env.MONAD_TESTNET_RPC_URL || "https://testnet-rpc.monad.xyz",
    gateway: process.env.MONAD_TESTNET_GATEWAY_ADDRESS,
  },
  {
    name: "Somnia withdrawal",
    chainId: 50312,
    rpc:
      process.env.SOMNIA_TESTNET_RPC_URL || "https://dream-rpc.somnia.network/",
    gateway:
      process.env.SOMNIA_GATEWAY_ADDRESS || process.env.ARC_GATEWAY_ADDRESS,
  },
] as const;

async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  const vaultAddress = process.env.VAULT_ADDRESS;
  const tokenAddress =
    process.env.ARC_USDC_ADDRESS ||
    "0x3600000000000000000000000000000000000000";
  if (!privateKey || !vaultAddress || sources.some((source) => !source.gateway))
    throw new Error(
      "Configure PRIVATE_KEY, VAULT_ADDRESS and all three source gateways"
    );
  const arcProvider = new ethers.JsonRpcProvider(
    process.env.ARC_TESTNET_RPC_URL || "https://rpc.testnet.arc.network"
  );
  const arcSigner = new ethers.Wallet(privateKey, arcProvider);
  const token = new ethers.Contract(
    tokenAddress,
    [
      "function balanceOf(address) view returns (uint256)",
      "function approve(address,uint256) returns (bool)",
    ],
    arcSigner
  );
  const vault = new ethers.Contract(
    vaultAddress,
    [
      "function fundFor(address,uint256)",
      "function fundYield(uint256)",
      "function pending(address) view returns (uint256)",
      "function shares(address) view returns (uint256)",
      "function claimable(address) view returns (uint256)",
      "function backing() view returns (uint256,uint256)",
    ],
    arcSigner
  );
  const iface = new ethers.Interface([
    "function depositFor(address,uint256)",
    "function withdrawFor(address,uint256)",
    "function harvestFor(address)",
  ]);
  const who = arcSigner.address;
  if (process.argv.includes("--verify")) {
    const [balance, liabilities] = (await vault.backing()) as [bigint, bigint];
    const shares = (await vault.shares(who)) as bigint;
    const claimable = (await vault.claimable(who)) as bigint;
    if (
      balance < liabilities ||
      shares < 1_500_000n ||
      claimable === 0n ||
      claimable > 250_000n
    )
      throw new Error("Vault demo backing or position check failed");
    console.log(
      JSON.stringify(
        {
          vault: vaultAddress,
          remainingShares: ethers.formatUnits(shares, 6),
          claimableYield: ethers.formatUnits(claimable, 6),
          backing: ethers.formatUnits(balance, 6),
          liabilities: ethers.formatUnits(liabilities, 6),
        },
        null,
        2
      )
    );
    return;
  }
  const resume = process.argv.includes("--resume");
  const sharesBefore = (await vault.shares(who)) as bigint;
  const walletBefore = (await token.balanceOf(who)) as bigint;
  const amount = 2_000_000n;
  if (!resume) {
    if (walletBefore < 2_400_000n)
      throw new Error("Demo signer needs at least 2.4 Arc test USDC");
    const allowance = new ethers.Contract(
      tokenAddress,
      ["function allowance(address,address) view returns (uint256)"],
      arcProvider
    );
    if ((await allowance.allowance(who, vaultAddress)) < 2_400_000n)
      await (await token.approve(vaultAddress, 2_400_000n)).wait();
    await (await vault.fundFor(who, amount)).wait();
    if ((await vault.pending(who)) < amount)
      throw new Error("Funding not reflected in Arc vault");
    console.log("Arc-funded pending: 2.00 test USDC");
  } else if (
    sharesBefore < 500_000n ||
    (await vault.claimable(who)) !== 100_000n
  ) {
    throw new Error(
      "--resume requires the funded post-deposit state from the interrupted smoke test"
    );
  }

  async function send(source: (typeof sources)[number], data: string) {
    const provider = new ethers.JsonRpcProvider(source.rpc);
    if (Number((await provider.getNetwork()).chainId) !== source.chainId)
      throw new Error(`${source.name}: wrong RPC chain`);
    const gateway = new ethers.Contract(
      source.gateway!,
      ["function forwardIntentWithData(address,bytes)"],
      new ethers.Wallet(privateKey!, provider)
    );
    const tx = await gateway.forwardIntentWithData(vaultAddress, data);
    const receipt = await tx.wait();
    if (receipt?.status !== 1)
      throw new Error(`${source.name}: source transaction failed`);
    const queued = await fetch("http://localhost:3000/api/intents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceChainId: source.chainId, txHash: tx.hash }),
    });
    if (!queued.ok)
      throw new Error(
        `${source.name}: queue rejected confirmed transaction (${queued.status})`
      );
    const historyPath = path.resolve(
      __dirname,
      "../../public/intent-history.json"
    );
    for (let attempt = 0; attempt < 40; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const history = JSON.parse(
        fs.readFileSync(historyPath, "utf8")
      ) as History[];
      const item = history.find(
        (row) =>
          row.sourceChainId === source.chainId &&
          row.txHash.toLowerCase() === tx.hash.toLowerCase()
      );
      if (item?.status === "failed")
        throw new Error(`${source.name}: ${item.error}`);
      if (item?.status === "completed") {
        console.log(`${source.name}: ${tx.hash} -> ${item.executionHash}`);
        return;
      }
    }
    throw new Error(`${source.name}: timed out waiting for Arc execution`);
  }

  if (!resume) {
    await send(
      sources[0],
      iface.encodeFunctionData("depositFor", [who, amount])
    );
    if ((await vault.shares(who)) !== sharesBefore + amount)
      throw new Error("Deposit did not mint 1:1 shares");
    await (await vault.fundYield(100_000n)).wait();
  }
  if ((await vault.claimable(who)) !== 100_000n)
    throw new Error("Sponsor-funded yield not claimable exactly");
  await send(sources[1], iface.encodeFunctionData("harvestFor", [who]));
  if ((await vault.claimable(who)) !== 0n)
    throw new Error("Harvest did not reset claimable yield");
  await send(
    sources[2],
    iface.encodeFunctionData("withdrawFor", [who, 500_000n])
  );
  if (
    (await vault.shares(who)) !==
    sharesBefore + (resume ? -500_000n : 1_500_000n)
  )
    throw new Error("Withdrawal did not burn shares");
  if ((await vault.claimable(who)) !== 0n)
    throw new Error("Withdrawal re-accrued already harvested yield");
  await (await vault.fundYield(250_000n)).wait(); // Leave a visibly claimable, funded demo reward.
  const finalClaimable = (await vault.claimable(who)) as bigint;
  if (finalClaimable < 249_999n || finalClaimable > 250_000n)
    throw new Error("Final sponsor-funded reward is incorrect");
  const [balance, liabilities] = (await vault.backing()) as [bigint, bigint];
  if (balance < liabilities) throw new Error("Vault is undercollateralized");
  console.log(
    JSON.stringify(
      {
        vault: vaultAddress,
        remainingShares: ethers.formatUnits(await vault.shares(who), 6),
        claimableYield: ethers.formatUnits(await vault.claimable(who), 6),
        backing: ethers.formatUnits(balance, 6),
        liabilities: ethers.formatUnits(liabilities, 6),
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
