#!/usr/bin/env node
/**
 * Run expo-doctor from apps/mobile with root node_modules temporarily hidden
 * so the duplicate-dependency check only sees apps/mobile's tree (no root .pnpm).
 */
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const mobileDir = path.join(ROOT, "apps", "mobile");
const rootNodeModules = path.join(ROOT, "node_modules");
const rootNodeModulesBak = path.join(ROOT, "node_modules.bak.pnpm");

let restored = false;
function restoreRootNodeModules() {
  if (!restored && fs.existsSync(rootNodeModulesBak)) {
    try {
      fs.renameSync(rootNodeModulesBak, rootNodeModules);
      restored = true;
    } catch (_) {}
  }
}

process.on("exit", restoreRootNodeModules);
process.on("SIGINT", () => {
  restoreRootNodeModules();
  process.exit(130);
});
process.on("SIGTERM", () => {
  restoreRootNodeModules();
  process.exit(143);
});

try {
  if (fs.existsSync(rootNodeModules)) {
    fs.renameSync(rootNodeModules, rootNodeModulesBak);
  }
  execSync("npx expo-doctor", { stdio: "inherit", cwd: mobileDir });
} catch (e) {
  restoreRootNodeModules();
  process.exit(e.status ?? 1);
}

restoreRootNodeModules();
