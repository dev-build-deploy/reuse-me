/* 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
*/

import { ISourceFile } from "./interfaces";
import * as spdx from "./spdx";

/**
 * Debian Package
 * @interface IDebianPackage
 * @member header Debian Header
 * @member files List of file-stanzas
 */
interface IDebianPackage {
  header: IDebianHeader;
  files: IFilesStanza[];
}

/**
 * Debian Header
 * @interface IDebianHeader
 * @member format The package format version
 * @member upstreamName The name of the upstream project
 * @member upstreamContact The contact information of the upstream project
 * @member source The source location of the upstream project
 * @member disclaimer Disclaimer message
 * @member comment Additional comments
 * @member license Software License
 * @member copyright List of copyright statements
 */
interface IDebianHeader {
  format: string;
  upstreamName?: string;
  upstreamContact?: string;
  source?: string;
  disclaimer?: string;
  comment?: string;
  license?: string;
  copyright?: string[];
}

/**
 * Debian Files stanza
 * @interface IFilesStanza
 * @member files List of files (can contain wildcards)
 * @member copyright List of copyright statements
 * @member license Software License
 * @member comment Additional comments
 */
interface IFilesStanza {
  files: string[];
  copyright: string[];
  license: string;
  comment?: string;
}

// Regex which matches "key: value" with multiline support
const DEBIAN_PACKAGE_REGEX = /(?<key>[^:]+):\s*(?<value>[^\n]*(\n\s+[^\n]*)*)/g;

/**
 * Converts a kebab-case string to camelCase
 * @param str String to convert to camelCase
 * @returns camelCase string
 */
const kebabToCamel = (str: string): string => {
  return str
    .split("-")
    .map((word, index) => (index === 0 ? word.toLowerCase() : word[0].toUpperCase() + word.slice(1).toLowerCase()))
    .join("");
};

/**
 * Parses the provided header string into a DebianHeader object
 * @param header The header string to parse
 * @returns The DebianHeader object
 */
const parseHeader = (header: string): IDebianHeader => {
  const headerData: IDebianHeader = {
    format: "1.0",
  };

  const matches = header.matchAll(DEBIAN_PACKAGE_REGEX);
  for (const match of matches) {
    // Skip invalid matches
    if (match?.groups === undefined) continue;

    // Retrieve key/value pairs
    const key = kebabToCamel(match.groups.key.trim());
    const value = match.groups.value.trim();

    // TODO: Remove the need for this switch statement
    switch (key) {
      case "format":
        headerData.format = value;
        break;
      case "upstreamName":
        headerData.upstreamName = value;
        break;
      case "upstreamContact":
        headerData.upstreamContact = value;
        break;
      case "source":
        headerData.source = value;
        break;
      case "disclaimer":
        headerData.disclaimer = value;
        break;
      case "comment":
        headerData.comment = value;
        break;
      case "license":
        headerData.license = value;
        break;
      case "copyright":
        headerData.copyright = value.split("\n").map(line => line.trim());
        break;
    }
  }

  return headerData;
};

/**
 * Parses the provided stanza string into a DebianPackage object
 * @param stanza The stanza string to parse
 * @returns The DebianPackage object
 */
const parseFileStanza = (stanza: string): IFilesStanza => {
  const filesStanza: IFilesStanza = {
    files: [],
    license: "",
    copyright: [],
  };

  const matches = stanza.matchAll(DEBIAN_PACKAGE_REGEX);
  for (const match of matches) {
    // Skip invalid matches
    if (match?.groups === undefined) continue;

    // Retrieve key/value pairs
    const key = kebabToCamel(match.groups.key.trim());
    const value = match.groups.value.trim();

    // TODO: Remove the need for this switch statement
    switch (key) {
      case "files":
        filesStanza.files = value.split(" ");
        break;
      case "license":
        filesStanza.license = value.split("\n")[0];
        break;
      case "copyright":
        filesStanza.copyright = value.split("\n").map(line => line.trim());
        break;
      case "comment":
        filesStanza.comment = value;
        break;
    }
  }

  return filesStanza;
};

/**
 * Loads the Debian configuration from the provided root path
 * @param rootPath The root path of the repository
 */
const load = (config: string): IDebianPackage | undefined => {
  const stanzas = config.split(/\n\s*\n/);

  if (stanzas.length === 0) {
    throw new Error("No stanzas found");
  }

  return {
    header: parseHeader(stanzas[0]),
    files: stanzas.slice(1).map(stanza => parseFileStanza(stanza)),
  };
};

/**
 * Matches the provided filename against the provided wildcard pattern
 * @param fileName Filename to match
 * @param pattern Wildcard pattern to match against
 * @returns True if the filename matches the pattern, false otherwise
 */
const wildcardMatch = (fileName: string, pattern: string): boolean => {
  if (pattern === "*") return true;
  const regexp = new RegExp(
    `^${pattern
      .split("*")
      .map(s => s.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"))
      .join(".*")}$`
  );
  return regexp.test(fileName);
};

/**
 * Creates a mapping between files specified in the Debian Package and their respective SPDX headers
 * @param debianPackage Debian package configuration
 * @param files List of files to map agains the Debian package configuration
 * @returns A map of files to their respective SPDX headers
 */
const licenseMap = (debianPackage: IDebianPackage, files: ISourceFile[]): Map<string, spdx.IFile> => {
  const fileMap = new Map<string, spdx.IFile>();

  for (const packageFiles of debianPackage.files) {
    for (const patternFile of packageFiles.files) {
      for (const file of files) {
        const filePath = file.source === "original" ? file.filePath : file.licensePath;
        if (wildcardMatch(filePath, patternFile)) {
          const spdxFile = spdx.parseFile(
            filePath,
            `${packageFiles.copyright
              .map(copyright => `SPDX-FileCopyrightText: ${copyright}`)
              .join("\n")}\nSPDX-License-Identifier: ${packageFiles.license}`
          );
          if (spdx.isReuseCompliant(spdxFile) === false) continue;

          fileMap.set(filePath, spdxFile);
        }
      }
    }
  }

  return fileMap;
};

export { load, licenseMap, IDebianPackage };
