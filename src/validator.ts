/* 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
*/

import { IValidationResult } from "./interfaces";
import { ExpressiveMessage } from "@dev-build-deploy/diagnose-it";

import * as spdx from "./spdx";

const validate = (sbom: spdx.SoftwareBillOfMaterials): IValidationResult[] => {
  const results: IValidationResult[] = [];

  for (const file of sbom.files) {
    const result: IValidationResult = {
      file: file,
      compliant: spdx.isReuseCompliant(file),
      errors: [],
    };

    if (result.compliant === false) {
      if (spdx.hasValidLicense(file) === false)
        result.errors.push(
          new ExpressiveMessage()
            .id(file.fileName)
            .error("Each Covered File MUST have Licensing Information associated with it.")
            .toString()
        );
      if (spdx.hasValidCopyrightText(file) === false)
        result.errors.push(
          new ExpressiveMessage()
            .id(file.fileName)
            .error("Each Covered File MUST have Copyright Information associated with it.")
            .toString()
        );
    }

    results.push(result);
  }

  return results;
};

export { validate };
