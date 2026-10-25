// SPDX-FileCopyrightText: 2026 Kevin de Jong <monkaii@hotmail.com>
// SPDX-License-Identifier: CC0-1.0

// Runs the committed bundles the way users do: `bin/reuse-me --help`, and `bin/reuse-me` in a scratch git
// repository that is REUSE compliant and one that is not. Catches a bundle or bin wrapper that no longer loads
// (e.g. CommonJS `require` of an ESM bundle). Usage: node scripts/smoke-bin.mjs

import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const bin = resolve("bin/reuse-me");
const root = mkdtempSync(join(tmpdir(), "reuse-me-smoke-"));

const git = (cwd, ...args) => spawnSync("git", args, { cwd, encoding: "utf8" });
const repo = (name, files) => {
  const dir = join(root, name);
  mkdirSync(dir);
  git(dir, "init", "-q");
  for (const [file, text] of Object.entries(files)) {
    mkdirSync(join(dir, file, ".."), { recursive: true });
    writeFileSync(join(dir, file), text);
  }
  git(dir, "add", "-A");
  return dir;
};

const spdx = "SPDX-" + "License-Identifier";
const header = `// SPDX-FileCopyrightText: 2026 Smoke Test <smoke@example.com>\n// ${spdx}: MIT\n`;
const license = "MIT License (smoke test)\n";
const good = repo("good", { "a.ts": `${header}export {};\n`, "LICENSES/MIT.txt": license, "LICENSES/MIT.txt.license": "" });
const bad = repo("bad", { "a.ts": "export {};\n", "LICENSES/MIT.txt": license });

const cases = [
  { cwd: process.cwd(), args: ["--help"], exit: 0 },
  { cwd: bad, args: [], exit: 1, output: /REUSE compliance issues/ },
  { cwd: good, args: [], exit: 0, output: /no REUSE compliance issues/ },
];

let failed = false;
for (const c of cases) {
  const run = spawnSync(process.execPath, [bin, ...c.args], { cwd: c.cwd, encoding: "utf8" });
  const out = `${run.stdout}${run.stderr}`;
  const ok = run.status === c.exit && (!c.output || c.output.test(out));
  console.log(`${ok ? "ok  " : "FAIL"} bin/reuse-me ${c.args.join(" ")} in ${c.cwd === process.cwd() ? "." : c.cwd.split("/").pop()} (exit ${run.status}, expected ${c.exit})`);
  if (!ok) {
    failed = true;
    console.error(out.trim());
  }
}
rmSync(root, { recursive: true, force: true });
process.exit(failed ? 1 : 0);
