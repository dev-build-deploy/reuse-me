/* 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
*/

import { ISourceFile } from "../src/interfaces";
import * as spdx from "../src/spdx";
import * as fs from "fs";

const FIXTURES_BASE_DIR = `${__dirname}/fixtures`;

/**
 * Validates the SPDX header of a file.
 */
describe("parseFile", () => {
  /**
   * Empty SPDX headers should be detected as invalid.
   */
  test("Empty SPDX Headers", async () => {
    for (const invalidHeader of [
      "empty-file",
      "missing-header"
    ]) {
      const contents = fs.readFileSync(`${FIXTURES_BASE_DIR}/${invalidHeader}`, "utf8");
      const fixture = JSON.parse(fs.readFileSync(`${FIXTURES_BASE_DIR}/${invalidHeader}.fixture`, "utf8"));
      const header = spdx.parseFile(invalidHeader, contents);

      expect(header).toBeDefined();
      expect(header).toStrictEqual(fixture)
    }
  });

  /**
   * Validates different copyright combinations in the SPDX header.
   */
  test("Copyright Headers", async () => {
    for (const validHeader of [
      "copyright-missing",
      "copyright-missing-contact-address",
      "copyright-missing-year",
      "copyright-multiple-years",
      "copyright-multiple",
      "copyright-single"
    ]) {
      const contents = fs.readFileSync(`${FIXTURES_BASE_DIR}/${validHeader}`, "utf8");
      const fixture = JSON.parse(fs.readFileSync(`${FIXTURES_BASE_DIR}/${validHeader}.fixture`, "utf8"));
      const header = spdx.parseFile(validHeader, contents);

      expect(header).toBeDefined();
      expect(header).toStrictEqual(fixture)
    }
  });

  /**
   * Validates different license combinations in the SPDX header.
   */
  test("License Headers", async () => {
    for (const validHeader of [
      "license-missing",
      "license-multiple",
      "license-single"
    ]) {
      const contents = fs.readFileSync(`${FIXTURES_BASE_DIR}/${validHeader}`, "utf8");
      const fixture = JSON.parse(fs.readFileSync(`${FIXTURES_BASE_DIR}/${validHeader}.fixture`, "utf8"));
      const header = spdx.parseFile(validHeader, contents);

      expect(header).toBeDefined();
      expect(header).toStrictEqual(fixture)
    }
  });

  /**
   * Validates all supported SPDX File Tags
   */
  test("SPDX File Tags", async () => {
    const contents = fs.readFileSync(`${FIXTURES_BASE_DIR}/filetags`, "utf8");
    const fixture = JSON.parse(fs.readFileSync(`${FIXTURES_BASE_DIR}/filetags.fixture`, "utf8"));
    const header = spdx.parseFile("filetags", contents);

    expect(header).toBeDefined();
    expect(header).toStrictEqual(fixture)
  })

  /**
   * Validates that all data between REUSE-IgnoreStart and REUSE-IgnoreEnd is ignored.
   */
  test("Reuse Ignore", async () => {
    const contents = fs.readFileSync(`${FIXTURES_BASE_DIR}/reuse-ignore`, "utf8");
    const fixture = JSON.parse(fs.readFileSync(`${FIXTURES_BASE_DIR}/reuse-ignore.fixture`, "utf8"));
    const header = spdx.parseFile("reuse-ignore", contents);

    expect(header).toBeDefined();
    expect(header).toStrictEqual(fixture)
  })
});
