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

/**
 * Extracts all individual license names from the license information in file.
 * @param file SPDX file to extract the licenses from
 * @returns List of individual licenses
 */
export function getIndividualLicences(file: reuse.SpdxFile): string[] {
  return file.licenseInfoInFiles
    .filter(license => license !== "NOASSERTION")
    .map(license => license.split(/( AND | OR )/))
    .flat()
    .filter(license => license !== " AND " && license !== " OR ");
}
