/*
 * SPDX-FileCopyrightText: 2026 Kevin de Jong <monkaii@hotmail.com>
 * SPDX-License-Identifier: MIT
 */

import { execFileSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

import { GitSource } from "../src/datasources";

/**
 * Creates a git repository with tracked, staged, untracked and ignored files.
 * @returns The path of the repository
 */
function createRepository(): string {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "reuse-me-")));
  const git = (...args: string[]): void => {
    execFileSync("git", args, { cwd: root, stdio: "ignore" });
  };
  const write = (file: string, content = "content\n"): void => {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), content);
  };

  git("init", "-q");
  write(".gitignore", "ignored.txt\nbuild/\n");
  write("tracked.ts");
  write("src/nested.ts");
  write("LICENSES/MIT.txt");
  git("add", ".");
  git(
    "-c",
    "user.name=Test",
    "-c",
    "user.email=test@example.com",
    "-c",
    "commit.gpgsign=false",
    "commit",
    "-q",
    "-m",
    "init"
  );
  write("staged.ts");
  git("add", "staged.ts");
  write("untracked.ts");
  write("ignored.txt");
  write("build/output.js");
  return root;
}

describe("GitSource", () => {
  let root: string;

  beforeAll(() => {
    root = createRepository();
  });

  afterAll(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  test("lists the files git tracks (staged included), not untracked or ignored ones", async () => {
    const files = await new GitSource(root).getFiles();
    expect(files.sort()).toEqual([".gitignore", "LICENSES/MIT.txt", "src/nested.ts", "staged.ts", "tracked.ts"]);
  });

  test("works from a subdirectory, with paths relative to the repository root", async () => {
    const source = new GitSource(path.join(root, "src"));
    expect(await source.getRootPath()).toBe(root);
    expect((await source.getFiles()).sort()).toContain("src/nested.ts");
  });

  test("checks only the given files", async () => {
    const files = await new GitSource(root).getFiles(["staged.ts", path.join(root, "src/nested.ts"), "missing.ts"]);
    expect(files).toEqual(["staged.ts", "src/nested.ts"]);
  });

  test("checks a file given twice once", async () => {
    const files = await new GitSource(root).getFiles(["staged.ts", "./staged.ts", path.join(root, "staged.ts")]);
    expect(files).toEqual(["staged.ts"]);
  });

  test("covers the project when no files are given, or a given file is REUSE configuration", async () => {
    const source = new GitSource(root);
    expect(await source.coversProject()).toBe(true);
    expect(await source.coversProject([])).toBe(true);
    expect(await source.coversProject(["staged.ts", "LICENSES/MIT.txt"])).toBe(true);
    expect(await source.coversProject(["staged.ts", "src/nested.ts"])).toBe(false);
  });

  test("checks every tracked file when a given file is REUSE configuration", async () => {
    for (const config of ["LICENSES/MIT.txt", ".reuse/dep5", "REUSE.toml", "src/REUSE.toml"]) {
      const files = await new GitSource(root).getFiles(["staged.ts", config]);
      expect(files.sort()).toEqual([".gitignore", "LICENSES/MIT.txt", "src/nested.ts", "staged.ts", "tracked.ts"]);
    }
  });
});
