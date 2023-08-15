/*
 * SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
 * SPDX-License-Identifier: MIT
 */

import * as reuse from "@dev-build-deploy/reuse-it";

import * as validator from "../src/validator";

describe("Validate Requirements", () => {
  test("No errors", async () => {
    const sbom = new reuse.SoftwareBillOfMaterials("test", "reuse-me@test");
    await sbom.addFile("test/fixtures/basic-file.ts");

    const data = validator.validate(sbom);
    expect(data.errorCount).toBe(0);
  });
});
