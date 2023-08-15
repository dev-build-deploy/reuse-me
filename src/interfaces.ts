/*
 * SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
 * SPDX-License-Identifier: MIT
 */

import * as reuse from "@dev-build-deploy/reuse-it";
import * as sarif from "@dev-build-deploy/sarif-it";

/**
 * Validation results
 * @interface IValidationResult
 * @member file The file that was validated
 * @member compliant True if the file is compliant, false otherwise
 * @member results List of results from the validation in SARIF format
 */
export interface IValidationResult {
  file: reuse.SpdxFile;
  compliant: boolean;
  results: sarif.Result[];
}
