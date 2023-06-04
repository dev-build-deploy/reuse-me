/* 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
*/

import { IValidationResult } from "./interfaces";

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
      if (spdx.hasValidLicense(file) === false && spdx.hasValidCopyrightText(file) === false) {
        result.errors.push(
          `Missing (or invalid) Copyright (SPDX-FileCopyrightText) and License (SPDX-License-Identifier) statements.`
        );
      } else if (spdx.hasValidCopyrightText(file) === false) {
        result.errors.push(`Missing (or invalid) Copyright (SPDX-FileCopyrightText) statement.`);
      } else if (spdx.hasValidLicense(file) === false) {
        result.errors.push(`Missing (or invalid) License (SPDX-License-Identifier) statement.`);
      }
    }

    results.push(result);
  }

  return results;
};

export { validate };
