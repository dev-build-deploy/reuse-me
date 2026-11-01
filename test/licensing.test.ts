/*
 * SPDX-FileCopyrightText: 2026 Kevin de Jong <monkaii@hotmail.com>
 * SPDX-License-Identifier: MIT
 */

import * as fs from "fs";
import * as os from "os";
import * as path from "path";

import * as reuse from "@dev-build-deploy/reuse-it";

import { validate } from "../src/validator";

/**
 * Builds an SBOM for the given files in a temporary project and validates it.
 * @param files Path and content of each file in the project
 * @returns The SBOM and the number of REUSE compliance issues
 */
async function check(files: Record<string, string>): Promise<{ sbom: reuse.SoftwareBillOfMaterials; errors: number }> {
  const cwd = process.cwd();
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "reuse-me-licensing-"));
  try {
    for (const [file, content] of Object.entries(files)) {
      fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
      fs.writeFileSync(path.join(root, file), content);
    }
    fs.mkdirSync(path.join(root, "LICENSES"));
    for (const license of ["MIT", "CC0-1.0"]) {
      fs.copyFileSync(path.join(cwd, "LICENSES", `${license}.txt`), path.join(root, "LICENSES", `${license}.txt`));
    }

    process.chdir(root);
    const sbom = new reuse.SoftwareBillOfMaterials("test", "reuse-me-test");
    await sbom.addFiles(Object.keys(files));
    return { sbom, errors: validate(sbom).errorCount };
  } finally {
    process.chdir(cwd);
    fs.rmSync(root, { recursive: true, force: true });
  }
}

const HEADER = "Format: https://www.debian.org/doc/packaging-manuals/copyright-format/1.0/\n\n";

describe("Licensing information", () => {
  test("REUSE.toml covers files", async () => {
    const { sbom, errors } = await check({
      "REUSE.toml":
        'version = 1\n\n[[annotations]]\npath = "assets/**"\nSPDX-FileCopyrightText = "2026 Artist"\nSPDX-License-Identifier = "CC0-1.0"\n',
      "assets/models/tree.glb": "glTF\0binary",
    });
    expect(errors).toBe(0);
    expect(sbom.files.map(file => file.licenseInfoInFiles)).toEqual([["CC0-1.0"]]);
  });

  test("the last matching dep5 Files paragraph wins", async () => {
    const { sbom } = await check({
      ".reuse/dep5":
        HEADER +
        "Files: *\nCopyright: 2026 Everyone\nLicense: MIT\n\n" +
        "Files: assets/*\nCopyright: 2026 Artist\nLicense: CC0-1.0\n",
      "assets/logo.svg": "<svg/>\n",
    });
    expect(sbom.files.map(file => [file.copyrightText, file.licenseInfoInFiles])).toEqual([
      ["2026 Artist", ["CC0-1.0"]],
    ]);
  });
});
