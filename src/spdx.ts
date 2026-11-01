/*
 * SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
 * SPDX-License-Identifier: MIT
 */

import * as reuse from "@dev-build-deploy/reuse-it";

/**
 * Checks whether the provided file has a valid SPDX license.
 * @param file SPDX file to validate
 * @returns True if the file has a valid license, false otherwise
 */
export function hasValidLicense(file: reuse.SpdxFile): boolean {
  return (
    file.licenseInfoInFiles.length > 0 &&
    !(file.licenseInfoInFiles.length === 1 && file.licenseInfoInFiles[0] === "NOASSERTION")
  );
}

/**
 * Checks whether the provided file has a valid SPDX copyright statement.
 * @param file SPDX file to validate
 * @returns True if the file has a valid copyright statement, false otherwise
 */
export function hasValidCopyrightText(file: reuse.SpdxFile): boolean {
  return file.copyrightText !== undefined && file.copyrightText !== "";
}

/**
 * Validates whether the provided header is a valid SPDX header.
 * @param header SPDX header to validate
 * @returns True if the header is valid, false otherwise
 */
export function isReuseCompliant(file: reuse.SpdxFile): boolean {
  return hasValidLicense(file) && hasValidCopyrightText(file);
}

/** The operators of an SPDX License Expression; they are not license identifiers */
const EXPRESSION_OPERATORS = ["AND", "OR", "WITH"];

/**
 * Extracts every license and exception identifier from the license information in file, i.e. the names of the
 * License Files in LICENSES/ that the file relies on ("Apache-2.0 WITH LLVM-exception" needs both Apache-2.0 and
 * LLVM-exception).
 * @param file SPDX file to extract the identifiers from
 * @returns List of license and exception identifiers
 */
export function getLicenseFileIdentifiers(file: reuse.SpdxFile): string[] {
  return file.licenseInfoInFiles
    .filter(license => license !== "NOASSERTION")
    .flatMap(license => license.replace(/[()]/g, " ").split(/\s+/))
    .filter(identifier => identifier.length > 0 && !EXPRESSION_OPERATORS.includes(identifier.toUpperCase()));
}
