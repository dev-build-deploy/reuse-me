/*
 * SPDX-FileCopyrightText: 2026 Kevin de Jong <monkaii@hotmail.com>
 * SPDX-License-Identifier: MIT
 */

import * as fs from "fs";
import * as os from "os";
import * as path from "path";

import * as reuse from "@dev-build-deploy/reuse-it";

import * as tool from "../src/config/tool.json";
import { fileRequirements, projectRequirements } from "../src/requirements";
import { IValidationOptions, validate } from "../src/validator";

const HEADER = "Format: https://www.debian.org/doc/packaging-manuals/copyright-format/1.0/\n\n";

/**
 * Builds an SBOM for a temporary project whose files are all licensed through .reuse/dep5, and validates it.
 * @param license The license expression of every file
 * @param licenseFiles The names of the files in LICENSES/
 * @param options Validation options
 * @returns The rule and location of each REUSE compliance issue
 */
async function check(
  license: string,
  licenseFiles: string[],
  options?: IValidationOptions
): Promise<{ ruleId?: string; uri?: string }[]> {
  const cwd = process.cwd();
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "reuse-me-project-"));
  try {
    fs.mkdirSync(path.join(root, ".reuse"));
    fs.writeFileSync(
      path.join(root, ".reuse/dep5"),
      `${HEADER}Files: src/*\nCopyright: 2026 Someone\nLicense: ${license}\n`
    );
    fs.mkdirSync(path.join(root, "src"));
    fs.writeFileSync(path.join(root, "src/main.ts"), "export {};\n");
    fs.mkdirSync(path.join(root, "LICENSES"));
    for (const licenseFile of licenseFiles) {
      fs.writeFileSync(path.join(root, "LICENSES", licenseFile), "License text\n");
    }

    process.chdir(root);
    const sbom = new reuse.SoftwareBillOfMaterials("test", "reuse-me-test");
    await sbom.addFiles(["src/main.ts"]);
    const results = validate(sbom, options).log.properties().runs[0].results ?? [];
    return results.map(result => ({
      ruleId: result.ruleId,
      uri: result.locations?.[0].physicalLocation?.artifactLocation?.uri,
    }));
  } finally {
    process.chdir(cwd);
    fs.rmSync(root, { recursive: true, force: true });
  }
}

describe("Rule definitions", () => {
  test("every rule in the definitions is implemented", () => {
    const implemented = [...projectRequirements({ complete: true }), ...fileRequirements()].map(
      requirement => requirement.rule.properties().id
    );
    expect(implemented.sort()).toEqual(tool.driver.rules.map(rule => rule.name).sort());
  });
});

describe("PR002: unused License Files", () => {
  test("a License File no file uses is reported when the whole project is validated", async () => {
    expect(await check("MIT", ["MIT.txt", "CC0-1.0.txt"], { complete: true })).toEqual([
      { ruleId: "UnusedLicenseFile", uri: "LICENSES/CC0-1.0.txt" },
    ]);
  });

  test("an unused License File is not reported when only some files are validated", async () => {
    expect(await check("MIT", ["MIT.txt", "CC0-1.0.txt"])).toEqual([]);
  });

  test("every identifier of a license expression counts as used", async () => {
    const licenseFiles = ["Apache-2.0.txt", "LLVM-exception.txt", "MIT.txt"];
    expect(await check("(Apache-2.0 WITH LLVM-exception) OR MIT", licenseFiles, { complete: true })).toEqual([]);
  });

  test("the .license file of a License File is not a License File", async () => {
    expect(await check("MIT", ["MIT.txt", "MIT.txt.license"], { complete: true })).toEqual([]);
  });
});

describe("SARIF output", () => {
  const original = process.env.GITHUB_ACTION_REF;

  afterEach(() => {
    if (original === undefined) delete process.env.GITHUB_ACTION_REF;
    else process.env.GITHUB_ACTION_REF = original;
  });

  /**
   * Validates an empty SBOM and returns the SARIF tool driver
   */
  function driver(): Record<string, unknown> {
    const log = validate(new reuse.SoftwareBillOfMaterials("test", "reuse-me-test")).log.properties();
    return log.runs[0].tool.driver as unknown as Record<string, unknown>;
  }

  test("the tool driver carries the version of the GitHub Action", () => {
    process.env.GITHUB_ACTION_REF = "v1.4.0";
    expect(driver().version).toBe("v1.4.0");
  });

  test("the tool driver has no made-up version when the version is unknown", () => {
    delete process.env.GITHUB_ACTION_REF;
    expect(driver()).not.toHaveProperty("version");
    expect(driver().name).toBe("reuse-me");
  });
});
