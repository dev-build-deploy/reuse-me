/* 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
*/

import { IValidationResult } from "./interfaces";

import * as spdx from "./spdx";
import { fileRequirements, projectRequirements } from "./requirements";

/**
 * Validates all files against requirements related to File contents
 * @param sbom The SBOM containing the files to validate
 * @returns List of validation results
 */
export function validateFiles(sbom: spdx.SoftwareBillOfMaterials): IValidationResult[] {
  const results: IValidationResult[] = [];

  for (const file of sbom.files) {
    const result: IValidationResult = {
      file: file,
      compliant: true,
      errors: [],
    };

    for (const req of fileRequirements) {
      const errors = req.validate(file);
      if (errors === undefined) continue;

      result.compliant = false;
      result.errors.push(...errors.errors.map(e => e.toString()));
    }

    results.push(result);
  }

  return results;
}

/**
 * Validates the SBOM against requirements related to the project
 * @param sbom The SBOM (Project) to validate
 * @param licenses List of licenses stored in LICENSES/
 * @returns Validation result
 */
export function validateSBOM(sbom: spdx.SoftwareBillOfMaterials, licenses: string[]): IValidationResult {
  const result: IValidationResult = {
    file: sbom.files[0],
    compliant: true,
    errors: [],
  };

  for (const req of projectRequirements) {
    const errors = req.validate(sbom, licenses);
    if (errors === undefined) continue;

    result.compliant = false;
    result.errors.push(...errors.errors.map(e => e.toString()));
  }

  return result;
}
