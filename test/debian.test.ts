/* 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
*/

import * as spdx from "../src/spdx";
import * as debian from "../src/debian";
import * as fs from "fs";

const FIXTURES_BASE_DIR = `${__dirname}/fixtures`;

/**
 * Validates parsing of a Debian Package configuration file
 */
describe("getDebianConfig", () => {
  /**
   * Example Debian Config
   */
  test("Full Debian Config", async () => {
    for (const validConfig of ["deb5-complete"]) {
      const config = fs.readFileSync(`${FIXTURES_BASE_DIR}/${validConfig}`, "utf8");
      const fixture = JSON.parse(fs.readFileSync(`${FIXTURES_BASE_DIR}/${validConfig}.fixture`, "utf8"));
      const pkg = debian.load(config);

      expect(pkg).toBeDefined();
      expect(pkg).toStrictEqual(fixture);
    }
  });

  /**
   * File stanzas containing multiple file patterns seperated by new lines
   */
  test("Multiple file patterns", async () => {
    const config = fs.readFileSync(`${FIXTURES_BASE_DIR}/deb5-multiple-files`, "utf8");
    const fixture = JSON.parse(fs.readFileSync(`${FIXTURES_BASE_DIR}/deb5-multiple-files.fixture`, "utf8"));
    const pkg = debian.load(config);

    expect(pkg).toBeDefined();
    expect(pkg).toStrictEqual(fixture);
  });

  /**
   * Validate wildcard pattern matching
   */
  test("Wildcard file patterns", async () => {
    const config = fs.readFileSync(`${FIXTURES_BASE_DIR}/deb5-multiple-files`, "utf8");
    const pkg = debian.load(config);
    expect(pkg !== undefined);
    if (pkg === undefined) return;

    const map = debian.licenseMap(pkg, [
      {
        source: "original",
        filePath: "test/fixtures/something.fixture",
        licensePath: "LICENSE",
        modification: "modified",
      },
      {
        source: "original",
        filePath: "test/fixtures/another.fixture",
        licensePath: "LICENSE",
        modification: "modified",
      },
      {
        source: "original",
        filePath: "test/fixtures/should-not-match",
        licensePath: "LICENSE",
        modification: "modified",
      },
      {
        source: "original",
        filePath: "test/debian.ts",
        licensePath: "LICENSE",
        modification: "modified",
      },
      {
        source: "original",
        filePath: "fake/doesntexist.ts",
        licensePath: "fake/doesntexist.ts",
        modification: "modified",
      },
    ]);

    expect(map).toStrictEqual(
      new Map<string, spdx.IFile>([
        [
          "test/debian.ts",
          {
            SPDXID: "SPDXRef-032567a50e1998c3dde47f65321c1d17a125756b",
            attributionTexts: [],
            checksums: [
              {
                algorithm: "SHA1",
                checksumValue: "51c79352c11c9b3aa3f7cd9501c2af59f674b55f",
              },
            ],
            copyrightText: "2023, Kevin de Jong <monkaii@hotmail.com>",
            fileContributors: [],
            fileName: "./test/debian.ts",
            fileTypes: [],
            licenseConcluded: "NOASSERTION",
            licenseInfoInFiles: ["GPL-3.0-or-later"],
          },
        ],
        [
          "test/fixtures/something.fixture",
          {
            SPDXID: "SPDXRef-5e4897a0b4f46e69264f5eb87343fcbffff3a9be",
            attributionTexts: [],
            checksums: [
              {
                algorithm: "SHA1",
                checksumValue: "51c79352c11c9b3aa3f7cd9501c2af59f674b55f",
              },
            ],
            copyrightText: "2023, Kevin de Jong <monkaii@hotmail.com>",
            fileContributors: [],
            fileName: "./test/fixtures/something.fixture",
            fileTypes: [],
            licenseConcluded: "NOASSERTION",
            licenseInfoInFiles: ["GPL-3.0-or-later"],
          },
        ],
        [
          "test/fixtures/another.fixture",
          {
            SPDXID: "SPDXRef-d0e34217b725df94a63930100e889653ae2b8424",
            attributionTexts: [],
            checksums: [
              {
                algorithm: "SHA1",
                checksumValue: "51c79352c11c9b3aa3f7cd9501c2af59f674b55f",
              },
            ],
            copyrightText: "2023, Kevin de Jong <monkaii@hotmail.com>",
            fileContributors: [],
            fileName: "./test/fixtures/another.fixture",
            fileTypes: [],
            licenseConcluded: "NOASSERTION",
            licenseInfoInFiles: ["GPL-3.0-or-later"],
          },
        ],
      ])
    );
  });
});
