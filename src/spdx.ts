/* 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
*/

import { ICopyrightText, ISPDXHeader } from "./interfaces";

/** 
 * Retrieves the SPDX Header from the provided contents, if it exists.
 * Expected formats:
 *   SPDX-FileCopyrightText: [year] [copyright holder] <[email address]>
 *   SPDX-License-Identifier: [identifier]
 * @param contents The contents of the file to parse
 * @returns The SPDX Header, if it exists
 */
const getSPDXHeader = (contents: string): ISPDXHeader | undefined => {
  const SPDXCopyrightHeaderRegex = /SPDX-FileCopyrightText:\s*(©|[Cc]opyright|\([Cc]\))*\s*(?<year>[\d,-\s]*)\s*(?<copyrightHolder>[^\<\n]*)\s(<(?<contactAddress>.*)>)?/g;
  const SPDXLicenseHeaderRegex = /SPDX-License-Identifier:\s*(?<identifier>.*)/g;

  const copyrightMatches = contents.matchAll(SPDXCopyrightHeaderRegex);
  const licenseMatches = contents.matchAll(SPDXLicenseHeaderRegex);

  const header: ISPDXHeader = {
    copyright: [],
    licenses: []
  }

  for (const match of licenseMatches) {
    // Skip invalid matches
    if (match?.groups === undefined) continue;

    header.licenses.push(match.groups?.identifier.trim());
  }

  for (const match of copyrightMatches) {
    // Skip invalid matches
    if (match?.groups === undefined) continue;

    let copyright: ICopyrightText = {
      copyrightHolder: match.groups.copyrightHolder.trim()
    }
    if (match.groups.year.length > 0) {
      copyright.year = match.groups.year.trim()
    }
    if (match.groups.contactAddress) {
      copyright.contactAddress = match.groups.contactAddress.trim()
    }
    header.copyright.push(copyright);
  }

  return header
};

/**
 * Validates whether the provided header is a valid SPDX header.
 * @param header SPDX header to validate
 * @returns True if the header is valid, false otherwise
 */
const isValidSPDXHeader = (header: ISPDXHeader | undefined): boolean => {
  return header !== undefined && header.licenses.length > 0 && header.copyright.length > 0
}

export {
  getSPDXHeader,
  isValidSPDXHeader
}