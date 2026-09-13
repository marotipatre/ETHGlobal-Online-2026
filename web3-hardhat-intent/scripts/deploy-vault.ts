import { ethers } from "hardhat";

async function main() {
  const executor = process.env.ARC_EXECUTOR_ADDRESS;
  const usdc =
    process.env.ARC_USDC_ADDRESS ||
    "0x3600000000000000000000000000000000000000";
  if (!executor || !ethers.isAddress(executor) || !ethers.isAddress(usdc))
    throw new Error("Configure ARC_EXECUTOR_ADDRESS and ARC_USDC_ADDRESS");
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  if (Number(network.chainId) !== 5042002)
    throw new Error("Vault must be deployed on Arc Testnet");
  if (
    (await ethers.provider.getCode(executor)) === "0x" ||
    (await ethers.provider.getCode(usdc)) === "0x"
  )
    throw new Error("Executor or USDC contract is missing");
  const factory = await ethers.getContractFactory("StablecoinVault");
  const vault = await factory.deploy(usdc, executor);
  await vault.waitForDeployment();
  const receipt = await vault.deploymentTransaction()?.wait();
  console.log(
    JSON.stringify(
      {
        deployer: deployer.address,
        chainId: Number(network.chainId),
        vault: await vault.getAddress(),
        usdc,
        executor,
        blockNumber: receipt?.blockNumber,
        txHash: receipt?.hash,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
