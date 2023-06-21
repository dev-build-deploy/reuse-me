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
  return sbom.files.map(file => {
    const errors = fileRequirements
      .map(req => req.validate(file))
      .filter(errors => errors !== undefined)
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      .map(errors => errors!.errors.map(e => e.toString()))
      .flat();

    return { file: file, compliant: errors.length === 0, errors: errors };
  });
}

/**
 * Validates the SBOM against requirements related to the project
 * @param sbom The SBOM (Project) to validate
 * @param licenses List of licenses stored in LICENSES/
 * @returns Validation result
 */
export function validateSBOM(sbom: spdx.SoftwareBillOfMaterials, licenses: string[]): IValidationResult {
  const errors = projectRequirements
    .map(req => req.validate(sbom, licenses))
    .filter(errors => errors !== undefined)
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    .map(errors => errors!.errors.map(e => e.toString()))
    .flat();

  return { file: sbom.files[0], compliant: errors.length === 0, errors: errors };
}
