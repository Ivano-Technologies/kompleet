import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Time-limited exceptions: expired entries become blocking.
 * Empty after xlsx migrated to SheetJS CDN tarball 0.20.3.
 */
const ALLOWED_GHSA = {};

const BULK_URL = "https://registry.npmjs.org/-/npm/v1/security/advisories/bulk";
const CHUNK_SIZE = 400;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LOCKFILE = join(ROOT, "pnpm-lock.yaml");

function stripPeerSuffix(version) {
  const idx = version.indexOf("(");
  return idx === -1 ? version : version.slice(0, idx);
}

function isRegistryVersion(version) {
  const v = version.trim();
  if (!v) return false;
  if (
    v.startsWith("link:") ||
    v.startsWith("workspace:") ||
    v.startsWith("file:") ||
    v.startsWith("http://") ||
    v.startsWith("https://")
  ) {
    return false;
  }
  return true;
}

/** Minimal indented YAML reader for pnpm-lock.yaml v9 subsets we need. */
function parseLockfileSections(text) {
  const lines = text.split(/\r?\n/);
  const snapshots = new Map();
  const prodRoots = []; // { name, versionKey }

  let section = null; // 'importers' | 'snapshots' | null
  let importerDepth = null;
  let inProdDeps = false;
  let prodDepsIndent = null;
  let currentPkg = null;
  let currentPkgIndent = null;
  let snapKey = null;
  let snapIndent = null;
  let inSnapDeps = false;
  let snapDepsIndent = null;
  let snapDeps = null;

  const flushSnapshot = () => {
    if (snapKey && snapDeps) {
      snapshots.set(snapKey, snapDeps);
    }
    snapKey = null;
    snapIndent = null;
    inSnapDeps = false;
    snapDepsIndent = null;
    snapDeps = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim() || line.trimStart().startsWith("#")) continue;

    const indent = line.match(/^ */)[0].length;
    const trimmed = line.trim();

    if (/^importers:\s*$/.test(trimmed) && indent === 0) {
      flushSnapshot();
      section = "importers";
      importerDepth = null;
      inProdDeps = false;
      continue;
    }
    if (/^packages:\s*$/.test(trimmed) && indent === 0) {
      flushSnapshot();
      section = null;
      inProdDeps = false;
      continue;
    }
    if (/^snapshots:\s*$/.test(trimmed) && indent === 0) {
      flushSnapshot();
      section = "snapshots";
      continue;
    }

    if (section === "importers") {
      // New importer root (e.g. ".": or "apps/mobile":)
      if (indent === 2 && /^.+:\s*$/.test(trimmed)) {
        inProdDeps = false;
        prodDepsIndent = null;
        currentPkg = null;
        continue;
      }
      if (
        (trimmed === "dependencies:" || trimmed === "optionalDependencies:") &&
        indent >= 4
      ) {
        inProdDeps = true;
        prodDepsIndent = indent;
        currentPkg = null;
        continue;
      }
      if (
        inProdDeps &&
        (trimmed === "devDependencies:" ||
          trimmed === "peerDependencies:" ||
          trimmed.endsWith(":") && indent === prodDepsIndent)
      ) {
        // Leaving prod deps block for a sibling key at same indent
        if (trimmed !== "dependencies:" && trimmed !== "optionalDependencies:") {
          inProdDeps = false;
          currentPkg = null;
        }
        if (trimmed === "dependencies:" || trimmed === "optionalDependencies:") {
          inProdDeps = true;
          prodDepsIndent = indent;
          currentPkg = null;
        }
        continue;
      }
      if (inProdDeps && indent === prodDepsIndent + 2 && trimmed.endsWith(":")) {
        currentPkg = trimmed.slice(0, -1).replace(/^['"]|['"]$/g, "");
        currentPkgIndent = indent;
        continue;
      }
      if (
        inProdDeps &&
        currentPkg &&
        indent > currentPkgIndent &&
        trimmed.startsWith("version:")
      ) {
        let version = trimmed.slice("version:".length).trim();
        if (
          (version.startsWith('"') && version.endsWith('"')) ||
          (version.startsWith("'") && version.endsWith("'"))
        ) {
          version = version.slice(1, -1);
        }
        prodRoots.push({ name: currentPkg, versionKey: version });
        continue;
      }
      continue;
    }

    if (section === "snapshots") {
      // Snapshot entry key at indent 2
      if (indent === 2 && trimmed.endsWith(":")) {
        flushSnapshot();
        let key = trimmed.slice(0, -1).trim();
        if (
          (key.startsWith('"') && key.endsWith('"')) ||
          (key.startsWith("'") && key.endsWith("'"))
        ) {
          key = key.slice(1, -1);
        }
        snapKey = key;
        snapIndent = indent;
        snapDeps = { dependencies: {}, optionalDependencies: {} };
        inSnapDeps = false;
        continue;
      }
      if (snapKey && indent === 4 && trimmed === "dependencies:") {
        inSnapDeps = "dependencies";
        snapDepsIndent = indent;
        continue;
      }
      if (snapKey && indent === 4 && trimmed === "optionalDependencies:") {
        inSnapDeps = "optionalDependencies";
        snapDepsIndent = indent;
        continue;
      }
      if (
        snapKey &&
        inSnapDeps &&
        indent === 4 &&
        trimmed.endsWith(":") &&
        trimmed !== "dependencies:" &&
        trimmed !== "optionalDependencies:"
      ) {
        inSnapDeps = false;
        continue;
      }
      if (snapKey && inSnapDeps && indent === snapDepsIndent + 2) {
        const m = trimmed.match(/^(.+?):\s*(.+)$/);
        if (m) {
          let depName = m[1].trim();
          let depVer = m[2].trim();
          if (
            (depName.startsWith("'") && depName.endsWith("'")) ||
            (depName.startsWith('"') && depName.endsWith('"'))
          ) {
            depName = depName.slice(1, -1);
          }
          if (
            (depVer.startsWith("'") && depVer.endsWith("'")) ||
            (depVer.startsWith('"') && depVer.endsWith('"'))
          ) {
            depVer = depVer.slice(1, -1);
          }
          snapDeps[inSnapDeps][depName] = depVer;
        }
        continue;
      }
    }
  }
  flushSnapshot();

  return { prodRoots, snapshots };
}

function collectProductionClosure(prodRoots, snapshots) {
  /** @type {Map<string, Set<string>>} */
  const versionsByPackage = new Map();
  const visited = new Set();
  const queue = [];

  for (const root of prodRoots) {
    queue.push(root);
  }

  while (queue.length > 0) {
    const { name, versionKey } = queue.pop();
    const visitKey = `${name}@${versionKey}`;
    if (visited.has(visitKey)) continue;
    visited.add(visitKey);

    if (!isRegistryVersion(versionKey)) continue;

    const bareVersion = stripPeerSuffix(versionKey);
    if (!versionsByPackage.has(name)) versionsByPackage.set(name, new Set());
    versionsByPackage.get(name).add(bareVersion);

    const snap =
      snapshots.get(`${name}@${versionKey}`) ||
      snapshots.get(`${name}@${bareVersion}`);
    if (!snap) continue;

    for (const [depName, depVer] of Object.entries(snap.dependencies || {})) {
      queue.push({ name: depName, versionKey: depVer });
    }
    for (const [depName, depVer] of Object.entries(
      snap.optionalDependencies || {},
    )) {
      queue.push({ name: depName, versionKey: depVer });
    }
  }

  /** @type {Record<string, string[]>} */
  const payload = {};
  for (const [name, set] of versionsByPackage) {
    payload[name] = [...set].sort();
  }
  return payload;
}

function parseSemver(input) {
  const m = String(input)
    .trim()
    .replace(/^v/, "")
    .match(/^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?/);
  if (!m) return null;
  return {
    major: Number(m[1]),
    minor: Number(m[2]),
    patch: Number(m[3]),
    prerelease: m[4] ? m[4].split(".") : [],
  };
}

function compareSemver(a, b) {
  if (a.major !== b.major) return a.major < b.major ? -1 : 1;
  if (a.minor !== b.minor) return a.minor < b.minor ? -1 : 1;
  if (a.patch !== b.patch) return a.patch < b.patch ? -1 : 1;
  // no prerelease > prerelease
  if (a.prerelease.length === 0 && b.prerelease.length === 0) return 0;
  if (a.prerelease.length === 0) return 1;
  if (b.prerelease.length === 0) return -1;
  const len = Math.max(a.prerelease.length, b.prerelease.length);
  for (let i = 0; i < len; i++) {
    const x = a.prerelease[i];
    const y = b.prerelease[i];
    if (x === undefined) return -1;
    if (y === undefined) return 1;
    const xn = /^\d+$/.test(x);
    const yn = /^\d+$/.test(y);
    if (xn && yn) {
      const xi = Number(x);
      const yi = Number(y);
      if (xi !== yi) return xi < yi ? -1 : 1;
    } else if (xn !== yn) {
      return xn ? -1 : 1;
    } else if (x !== y) {
      return x < y ? -1 : 1;
    }
  }
  return 0;
}

function matchesComparator(version, op, target) {
  const cmp = compareSemver(version, target);
  switch (op) {
    case "<":
      return cmp < 0;
    case "<=":
      return cmp <= 0;
    case ">":
      return cmp > 0;
    case ">=":
      return cmp >= 0;
    case "=":
    case "==":
      return cmp === 0;
    default:
      return false;
  }
}

/** Test version against npm-style vulnerable_versions (supports || and space-AND). */
function versionInVulnerableRange(versionStr, rangeStr) {
  const version = parseSemver(versionStr);
  if (!version || !rangeStr) return false;

  const orParts = String(rangeStr)
    .split("||")
    .map((s) => s.trim())
    .filter(Boolean);

  return orParts.some((part) => {
    const tokens = part.match(/(>=|<=|>|<|=)\s*[vV]?\d+\.\d+\.\d+[^\s]*|\d+\.\d+\.\d+[^\s]*/g);
    if (!tokens || tokens.length === 0) return false;
    return tokens.every((token) => {
      const t = token.trim();
      const m = t.match(/^(>=|<=|>|<|=)\s*(.+)$/);
      if (m) {
        const target = parseSemver(m[2]);
        if (!target) return false;
        return matchesComparator(version, m[1], target);
      }
      const exact = parseSemver(t);
      if (!exact) return false;
      return matchesComparator(version, "=", exact);
    });
  });
}

async function fetchBulkAdvisories(versionsByPackage) {
  const names = Object.keys(versionsByPackage).sort();
  /** @type {Record<string, Array<Record<string, unknown>>>} */
  const merged = {};

  for (let i = 0; i < names.length; i += CHUNK_SIZE) {
    const chunkNames = names.slice(i, i + CHUNK_SIZE);
    /** @type {Record<string, string[]>} */
    const body = {};
    for (const name of chunkNames) {
      body[name] = versionsByPackage[name];
    }

    const res = await fetch(BULK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(
        `Bulk advisory request failed (${res.status}): ${text.slice(0, 500)}`,
      );
      process.exit(1);
    }

    const data = await res.json();
    for (const [pkg, advisories] of Object.entries(data || {})) {
      merged[pkg] = advisories;
    }
  }

  return merged;
}

const latestCache = new Map();

async function getLatestVersion(packageName) {
  if (latestCache.has(packageName)) return latestCache.get(packageName);

  const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(packageName)}`, {
    headers: { Accept: "application/vnd.npm.install-v1+json" },
  });
  if (!res.ok) {
    latestCache.set(packageName, null);
    return null;
  }
  const data = await res.json();
  const latest = data?.["dist-tags"]?.latest ?? null;
  latestCache.set(packageName, latest);
  return latest;
}

async function hasPublishedFix(packageName, vulnerableVersions) {
  const latest = await getLatestVersion(packageName);
  if (!latest) return false;
  // Fix available when latest is NOT in the vulnerable range
  return !versionInVulnerableRange(latest, vulnerableVersions);
}

function ghsaFromUrl(url) {
  if (!url || typeof url !== "string") return "";
  const parts = url.split("/").filter(Boolean);
  return parts[parts.length - 1] || "";
}

async function main() {
  let lockText;
  try {
    lockText = readFileSync(LOCKFILE, "utf8");
  } catch {
    console.error(`Unable to read ${LOCKFILE}`);
    process.exit(1);
  }

  if (!lockText.includes("lockfileVersion: '9.0'") && !lockText.includes('lockfileVersion: "9.0"') && !lockText.includes("lockfileVersion: 9")) {
    console.error("Expected pnpm-lock.yaml lockfileVersion 9.");
    process.exit(1);
  }

  const { prodRoots, snapshots } = parseLockfileSections(lockText);
  const versionsByPackage = collectProductionClosure(prodRoots, snapshots);
  const packageCount = Object.keys(versionsByPackage).length;

  if (packageCount === 0) {
    console.error("No production packages found in lockfile.");
    process.exit(1);
  }

  const advisoryMap = await fetchBulkAdvisories(versionsByPackage);
  const today = new Date();

  /** @type {Array<{ ghsa: string, package: string, severity: string }>} */
  const blocking = [];
  /** @type {Array<{ ghsa: string, package: string, severity: string, expires: string }>} */
  const ignored = [];

  for (const [pkg, advisories] of Object.entries(advisoryMap)) {
    if (!Array.isArray(advisories)) continue;
    for (const advisory of advisories) {
      const severity = String(advisory.severity || "").toLowerCase();
      if (severity !== "high" && severity !== "critical") continue;

      const ghsa = ghsaFromUrl(advisory.url) || "";
      const vulnerableVersions = String(advisory.vulnerable_versions || "");
      const allowed = ALLOWED_GHSA[ghsa];

      if (allowed) {
        const expiresAt = new Date(allowed.expires);
        if (expiresAt < today) {
          blocking.push({ ghsa, package: pkg, severity });
        } else {
          ignored.push({
            ghsa,
            package: pkg,
            severity,
            expires: allowed.expires,
          });
        }
        continue;
      }

      const fixed = await hasPublishedFix(pkg, vulnerableVersions);
      if (!fixed) {
        blocking.push({ ghsa, package: pkg, severity });
      }
    }
  }

  if (blocking.length > 0) {
    console.error(
      "Security audit failed: blocking high/critical advisories (no fix available or exception expired).",
    );
    for (const advisory of blocking) {
      console.error(
        `- ${advisory.ghsa || "(unknown)"}: ${advisory.package} (${advisory.severity})`,
      );
    }
    process.exit(1);
  }

  if (ignored.length > 0) {
    console.log("Security audit passed with approved temporary exceptions:");
    for (const advisory of ignored) {
      console.log(
        `- ${advisory.ghsa}: ${advisory.package} (${advisory.severity}) [expires ${advisory.expires}]`,
      );
    }
  } else {
    console.log(
      "Security audit passed with no blocking high/critical advisories.",
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
