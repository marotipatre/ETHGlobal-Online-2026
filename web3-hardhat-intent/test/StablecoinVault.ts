import { expect } from "chai";
import { ethers } from "hardhat";

describe("StablecoinVault", () => {
  async function fixture() {
    const [owner, executor, user, stranger] = await ethers.getSigners();
    const token = await (
      await ethers.getContractFactory("MockVaultUSDC")
    ).deploy();
    const vault = await (
      await ethers.getContractFactory("StablecoinVault")
    ).deploy(await token.getAddress(), executor.address);
    await token.mint(owner.address, 10_000_000n);
    await token.approve(await vault.getAddress(), 10_000_000n);
    return { owner, executor, user, stranger, token, vault };
  }

  it("backs principal and sponsor-funded yield, then pays the user", async () => {
    const { owner, executor, user, token, vault } = await fixture();
    await vault.fundFor(user.address, 4_000_000n);
    expect(await vault.pending(user.address)).eq(4_000_000n);
    await vault.connect(executor).depositFor(user.address, 3_000_000n);
    expect(await vault.shares(user.address)).eq(3_000_000n);
    expect(await vault.claimable(user.address)).eq(0n);
    await vault.fundYield(300_000n);
    expect(await vault.claimable(user.address)).eq(300_000n);
    await vault.connect(executor).withdrawFor(user.address, 1_000_000n);
    await vault.connect(executor).harvestFor(user.address);
    await vault.connect(user).reclaimPending(1_000_000n);
    expect(await token.balanceOf(user.address)).eq(2_300_000n);
    expect(await vault.shares(user.address)).eq(2_000_000n);
    const [balance, liabilities] = await vault.backing();
    expect(balance).eq(2_000_000n);
    expect(liabilities).eq(2_000_000n);
    expect(owner.address).not.eq(user.address);
  });

  it("rejects unfunded deposits, unauthorized calls, and harvest without yield", async () => {
    const { executor, user, stranger, vault } = await fixture();
    await expect(
      vault.connect(stranger).depositFor(user.address, 1n)
    ).to.be.revertedWith("Not executor");
    await expect(
      vault.connect(executor).depositFor(user.address, 1n)
    ).to.be.revertedWith("Insufficient pending");
    await expect(
      vault.connect(executor).withdrawFor(user.address, 1n)
    ).to.be.revertedWith("Insufficient shares");
    await expect(
      vault.connect(executor).harvestFor(user.address)
    ).to.be.revertedWith("No funded yield");
  });

  it("does not re-accrue harvested yield after a withdrawal", async () => {
    const { executor, user, vault } = await fixture();
    await vault.fundFor(user.address, 2_000_000n);
    await vault.connect(executor).depositFor(user.address, 2_000_000n);
    await vault.fundYield(100_000n);
    await vault.connect(executor).harvestFor(user.address);
    expect(await vault.claimable(user.address)).eq(0n);
    await vault.connect(executor).withdrawFor(user.address, 500_000n);
    expect(await vault.claimable(user.address)).eq(0n);
    await vault.fundYield(150_000n);
    expect(await vault.claimable(user.address)).eq(150_000n);
  });

  it("pauses intent actions while preserving user reclaim", async () => {
    const { executor, user, stranger, token, vault } = await fixture();
    await vault.fundFor(user.address, 1_000_000n);
    await expect(vault.connect(stranger).setPaused(true)).to.be.revertedWith(
      "Not owner"
    );
    await vault.setPaused(true);
    await expect(
      vault.connect(executor).depositFor(user.address, 1_000_000n)
    ).to.be.revertedWith("Paused");
    await vault.connect(user).reclaimPending(1_000_000n);
    expect(await token.balanceOf(user.address)).eq(1_000_000n);
  });
});
