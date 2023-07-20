/*
 * SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
 * SPDX-License-Identifier: MIT
 */
import * as requirements from "../src/requirements";
import * as reuse from "@dev-build-deploy/reuse-it";

describe("Validate Requirements", () => {
  test("File Requirements (OK)", async () => {
    const sbom = new reuse.SoftwareBillOfMaterials("test", "reuse-me@test");
    await sbom.addFile("test/fixtures/basic-file.ts");

    for (const req of requirements.fileRequirements) {
      const errors = req.validate(sbom.files[0]);
      expect(errors).toBeUndefined();
    }
  })
});