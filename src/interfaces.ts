/*
 * SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
 * SPDX-License-Identifier: MIT
 */

import * as reuse from "@dev-build-deploy/reuse-it"

/**
 * Validation results
 * @interface IValidationResult
 * @member compliant True if the file is compliant, false otherwise
 * @member errors List of error messages
 * @member header Associated SPDX Header (if compliant)
 */
export interface IValidationResult {
  file: reuse.SpdxFile;
  compliant: boolean;
  errors: string[];
}
