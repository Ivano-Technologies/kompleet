#!/usr/bin/env node
/**
 * Install mobile app deps. Temporarily hides root node_modules so npm
 * installs only into apps/mobile (no symlinks to root's .pnpm tree),
 * then runs install --ignore-scripts and rebuild to avoid "expo-module
 * is not recognized" during prepare.
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
process.on("SIGINT", () => { restoreRootNodeModules(); process.exit(130); });
process.on("SIGTERM", () => { restoreRootNodeModules(); process.exit(143); });

try {
  if (fs.existsSync(rootNodeModules)) {
    fs.renameSync(rootNodeModules, rootNodeModulesBak);
  }

  execSync("npm install --ignore-scripts", { stdio: "inherit", cwd: mobileDir });
  execSync("npm rebuild", { stdio: "inherit", cwd: mobileDir });
} catch (e) {
  restoreRootNodeModules();
  process.exit(e.status ?? 1);
}

restoreRootNodeModules();
