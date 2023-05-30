/* 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
*/

import { IDataSource } from "./datasources";
import { ISPDXHeader } from "./interfaces";

import * as spdx from "./spdx";

/**
 * Validates all files in the provided datasource against the Reuse specification.
 * @param datasource Datasource (git, github, etc.)
 */
const validate = async (datasource: IDataSource): Promise<void> => {
  const result = []

  for (let file of await datasource.getChangedFiles()) {
    // Skip files in the LICENSES/ directory
    if (file.filePath.startsWith("LICENSES/")) {
      continue;
    }

    // Determine the SPDX header of the file
    let header: ISPDXHeader | undefined = undefined;
    
    // First we check for an available .license file, as part of optimization for large
    // binary files.
    header = spdx.getSPDXHeader(await datasource.getFileContents(file.licensePath));

    // Otherwise, we check the original file.
    if (spdx.isValidSPDXHeader(header) === false) {
      header = spdx.getSPDXHeader(await datasource.getFileContents(file.filePath));
    }
    result.push({file: file, header: header})
  }

  for (const file of result) {
    if (file.header === undefined) {
      console.log(`File ${file.file.filePath} is invalid.`)
      continue;
    }
    if (spdx.isValidSPDXHeader(file.header) === false) {
      if (file.header?.copyright.length === 0) {
        console.log(`File ${file.file.filePath} does not contain a valid copyright statement.`)
      }
      if (file.header?.licenses.length === 0) {
        console.log(`File ${file.file.filePath} does not contain a valid license statement.`)
      }
    }
  }
}

export {validate}
