import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const TARGET_DIRS = [
  "src/modules/document-intelligence",
  "src/workers",
  "tests",
];
const EXTENSIONS = new Set([".ts", ".tsx", ".js", ".mjs", ".cjs"]);

const LOGGER_CALL_REGEX = /logger\.(info|warn|error|debug|trace)\s*\(/;
const PROHIBITED_FIELDS = ["rawText", "boundingBoxes", "ocrRawText"];
const PROHIBITED_PATTERNS = [
  /account[_\s-]?number/i,
  /\bBVN\b/i,
  /\bNIN\b/i,
  /\bTIN\b/i,
];

async function main() {
  const files = await collectFiles(TARGET_DIRS.map((d) => path.join(ROOT, d)));
  const violations = [];

  for (const file of files) {
    const content = await fs.readFile(file, "utf8");
    const lines = content.split(/\r?\n/);

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      if (!LOGGER_CALL_REGEX.test(line)) {
        continue;
      }

      const window = lines.slice(i, i + 8).join("\n");
      const hasForbiddenField = PROHIBITED_FIELDS.some((field) =>
        window.includes(field),
      );
      const hasForbiddenPattern = PROHIBITED_PATTERNS.some((regex) =>
        regex.test(window),
      );

      if (hasForbiddenField || hasForbiddenPattern) {
        violations.push({
          file: toWorkspaceRelative(file),
          line: i + 1,
          snippet: line.trim(),
        });
      }
    }
  }

  if (violations.length > 0) {
    console.error("OCR log safety violations detected:");
    for (const violation of violations) {
      console.error(
        `- ${violation.file}:${violation.line} -> ${violation.snippet}`,
      );
    }
    process.exit(1);
  }

  console.log("OCR log safety scan passed.");
}

async function collectFiles(directories) {
  const allFiles = [];

  for (const directory of directories) {
    const exists = await pathExists(directory);
    if (!exists) {
      continue;
    }
    await walk(directory, allFiles);
  }

  return allFiles;
}

async function walk(currentPath, output) {
  const entries = await fs.readdir(currentPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(currentPath, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath, output);
      continue;
    }

    if (entry.isFile() && EXTENSIONS.has(path.extname(entry.name))) {
      output.push(fullPath);
    }
  }
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function toWorkspaceRelative(filePath) {
  return filePath.replace(`${ROOT}${path.sep}`, "");
}

await main();
