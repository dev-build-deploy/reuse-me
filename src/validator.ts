/* 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
*/

import { IDataSource } from "./datasources";
import { IFile, ISPDXHeader, IValidationResult } from "./interfaces";

import * as spdx from "./spdx";
import * as debian from "./debian"

/**
 * Validation of a single file against the Reuse specification.
 * @param file File to validate
 * @param datasource Datasource (git, github, etc.) to retrieve file contents from
 * @param debianLicenseMap Debian package configuration mapping against the file
 * @returns 
 */
const validateSingleFile = async (file: IFile, datasource: any, debianLicenseMap: any): Promise<IValidationResult> => {
  // Determine the SPDX header of the file
  let header: ISPDXHeader | undefined = undefined;

  // First we check whether the file is matched in the Debian package configuration
  const debianFileLicense = debianLicenseMap.get(file.filePath)
  if (debianFileLicense !== undefined) {
    header = debianFileLicense;
  }

  // Next we check for an available .license file, as part of optimization for large
  // binary files.
  if (spdx.isValidSPDXHeader(header) === false) {
    header = spdx.getSPDXHeader(await datasource.getFileContents(file.licensePath));
  }

  // Otherwise, we check the original file.
  if (spdx.isValidSPDXHeader(header) === false) {
    header = spdx.getSPDXHeader(await datasource.getFileContents(file.filePath));
  }

  const result: IValidationResult = {
    file: file.source === "original" ? file.filePath : file.licensePath,
    compliant: spdx.isValidSPDXHeader(header),
    errors: [],
    header: header
  }

  if (result.compliant === false) {
    if (result.header === undefined) {
      result.errors.push(`File does not contain a valid SPDX header.`)
    } else {
      if (result.header?.copyright.length === 0 && result.header?.licenses.length === 0) {
        result.errors.push(`Missing (or invalid) SPDX Copyright (SPDX-FileCopyrightText) and License (SPDX-License-Identifier) statements.`)
      } else if (result.header?.copyright.length === 0) {
        result.errors.push(`Missing (or invalid) SPDX Copyright (SPDX-FileCopyrightText) statement.`)
      } else if (result.header?.licenses.length === 0) {
        result.errors.push(`Missing (or invalid) SPDX License (SPDX-License-Identifier) statement.`)
      }
    }
  }

  return result;
}

/**
 * Validates all files in the provided datasource against the Reuse specification.
 * @param datasource Datasource (git, github, etc.)
 */
const validate = async (datasource: IDataSource): Promise<IValidationResult[]> => {
  const changedFiles = await datasource.getChangedFiles();
  const debianConfig = debian.load(await datasource.getFileContents(".reuse/dep5"))
  const debianLicenseMap = debianConfig ? debian.licenseMap(debianConfig, changedFiles) : new Map<string, ISPDXHeader>();

  // Validate each file asynchronously
  const promises = [];
  for (let file of changedFiles) {
    // Skip files in the LICENSES/ directory
    if (file.filePath.startsWith("LICENSES/") || file.filePath === ".reuse/dep5") {
      continue;
    }

    // Skip original source files which have been removed
    if (file.source === "original" && file.modification === "removed") {
      continue;
    }

    promises.push(validateSingleFile(file, datasource, debianLicenseMap))
  }

  return await Promise.all(promises);
}

export { validate }
