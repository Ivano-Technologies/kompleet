import { execSync } from "child_process";

try {
  console.log("Running dependency audit fix...");
  execSync("pnpm audit --fix --prod", { stdio: "inherit" });
  console.log("Audit fix completed.");
} catch (err) {
  console.log("Audit fix attempted. Continuing to security gate.");
}
