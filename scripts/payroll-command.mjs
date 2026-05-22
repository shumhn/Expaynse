import { spawn } from "node:child_process";
import path from "node:path";

const rootDir = process.cwd();
const isWindows = process.platform === "win32";
const nodeBin = process.execPath;
const tsxBin = path.join(
  rootDir,
  "node_modules",
  ".bin",
  isWindows ? "tsx.cmd" : "tsx",
);

const commands = {
  crank: {
    command: tsxBin,
    args: ["scripts/payroll/crank.ts"],
  },
  "onboard-employee": {
    command: tsxBin,
    args: ["scripts/payroll/onboard-employee.ts"],
  },
  "magicblock-health": {
    command: tsxBin,
    args: ["scripts/payroll/check-magicblock-health.ts"],
  },
  "verify-devnet": {
    command: nodeBin,
    args: ["scripts/payroll/verify-devnet.js"],
  },
  "deploy-devnet": {
    command: "sh",
    args: ["./scripts/payroll/devnet/deploy.sh"],
  },
  "check-idl-parity": {
    command: nodeBin,
    args: ["./scripts/payroll/check-idl-parity.js"],
  },
};

const target = process.argv[2];
const selected = target ? commands[target] : undefined;

if (!selected) {
  console.error("Unknown payroll command target.");
  console.error(`Available targets: ${Object.keys(commands).join(", ")}`);
  process.exit(1);
}

const child = spawn(selected.command, selected.args, {
  cwd: rootDir,
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
