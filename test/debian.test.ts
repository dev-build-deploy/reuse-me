/* 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
*/

import * as debian from "../src/debian";
import * as fs from "fs";

const FIXTURES_BASE_DIR = `${__dirname}/fixtures`;

/**
 * Validates the SPDX header of a file.
 */
describe("getDebianConfig", () => {
  /**
   * Example Debian Config
   */
  test("Full Debian Config", async () => {
    for (const validConfig of [
      "deb5-complete"
    ]) {
      const config = fs.readFileSync(`${FIXTURES_BASE_DIR}/${validConfig}`, "utf8");
      const fixture = JSON.parse(fs.readFileSync(`${FIXTURES_BASE_DIR}/${validConfig}.fixture`, "utf8"));
      const pkg = debian.load(config)

      expect(pkg).toBeDefined();
      expect(pkg).toStrictEqual(fixture)
    }
  });
});
