/* 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
*/

import * as spdx from "./spdx"

/**
 * File modification type
 */
export type IFileModification = "added" | "removed" | "modified";

/**
 * File information
 * @interface IFile
 * @member path The path to the file
 * @member modification The modification type
 */
export interface ISourceFile {
  source: "license" | "original"
  filePath: string
  licensePath: string
  modification: IFileModification;
}

/**
 * Validation results
 * @interface IValidationResult
 * @member compliant True if the file is compliant, false otherwise
 * @member errors List of error messages
 * @member header Associated SPDX Header (if compliant)
 */
export interface IValidationResult {
  file: spdx.IFile
  compliant: boolean
  errors: string[]
}
