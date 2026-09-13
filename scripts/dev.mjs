import { spawn } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const processes = [
  spawn("npm", ["run", "dev:ui"], { cwd: root, stdio: "inherit", detached: true }),
  spawn("npm", ["run", "relayer"], { cwd: resolve(root, "web3-hardhat-intent"), stdio: "inherit", detached: true }),
];
let stopping = false;

function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of processes) {
    if (child.pid) {
      try { process.kill(-child.pid, "SIGTERM"); } catch { /* Already stopped. */ }
    }
  }
  process.exitCode = code;
}

for (const child of processes) {
  child.on("error", (error) => { console.error(error); stop(1); });
  child.on("exit", (code) => { if (!stopping) stop(code || 1); });
}
process.on("SIGINT", () => stop(130));
process.on("SIGTERM", () => stop(143));
