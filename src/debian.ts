/* 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
SPDX-License-Identifier: GPL-3.0-or-later
*/

import { ISourceFile } from "./interfaces";
import * as spdx from "./spdx";
import * as fs from "fs";
import { getSourceFile, kebabToCamel } from "./utils";

/**
 * Debian Package
 * @interface IDebianPackage
 * @member header Debian Header
 * @member files List of file-stanzas
 */
export interface IDebianPackage {
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
const DEBIAN_PACKAGE_REGEX = /(?<key>[^:]+):\s*(?<value>[^[\r\n]+]*([\r\n]+\s+[^[\r\n]+]*)*)/g;

function getDebianKeyValuePairs(stanza: string): Record<string, string> {
  const result: Record<string, string> = {};
  const matches = stanza.matchAll(DEBIAN_PACKAGE_REGEX);
  for (const match of matches) {
    // Skip invalid matches
    if (match?.groups === undefined) continue;

    // Retrieve key/value pairs
    result[kebabToCamel(match.groups.key.trim())] = match.groups.value.trim();
  }
  return result;
}

/**
 * Parses the provided header string into a DebianHeader object
 * @param header The header string to parse
 * @returns The DebianHeader object
 */
function parseHeader(header: string): IDebianHeader {
  const headerData: IDebianHeader = {
    format: "1.0",
  };

  Object.entries(getDebianKeyValuePairs(header)).forEach(([key, value]) => {
    const headerKey = key as keyof IDebianHeader;
    if (headerKey === "copyright") headerData[headerKey] = value.split(/[\r\n]+/).map(line => line.trim());
    else headerData[headerKey] = value;
  });

  return headerData;
}

/**
 * Parses the provided stanza string into a DebianPackage object
 * @param stanza The stanza string to parse
 * @returns The DebianPackage object
 */
function parseFileStanza(stanza: string): IFilesStanza {
  const filesStanza: IFilesStanza = {
    files: [],
    license: "",
    copyright: [],
  };

  Object.entries(getDebianKeyValuePairs(stanza)).forEach(([key, value]) => {
    switch (key) {
      case "files":
        filesStanza.files = value
          .split(/[\r\n]+/)
          .map(file => file.trim())
          .filter(file => file.trim().length > 0);
        break;
      case "license":
        filesStanza.license = value.split(/[\r\n]+/)[0];
        break;
      case "copyright":
        filesStanza.copyright = value.split(/[\r\n]+/).map(line => line.trim());
        break;
      case "comment":
        filesStanza.comment = value;
        break;
    }
  });

  return filesStanza;
}

/**
 * Loads the Debian configuration from the provided root path
 * @param rootPath The root path of the repository
 */
export function load(config: string): IDebianPackage | undefined {
  const stanzas = config.split(/[\r\n]+\s*[\r\n]+/);

  if (stanzas.length === 0) throw new Error("No stanzas found");

  return {
    header: parseHeader(stanzas[0]),
    files: stanzas.slice(1).map(stanza => parseFileStanza(stanza)),
  };
}

/**
 * Matches the provided filename against the provided wildcard pattern in accordance
 * to the DEB5 specification:
 *
 *   Only the wildcards * and ? apply; the former matches any number of characters (including none),
 *   the latter a single character. Both match slashes (/) and leading dots, unlike shell globs. The
 *   pattern *.in therefore matches any file whose name ends in .in anywhere in the source tree, not
 *   just at the top level.
 *
 * TODO: Implement support for the ? wildcard
 *
 * @param fileName Filename to match
 * @param pattern Wildcard pattern to match against
 * @returns True if the filename matches the pattern, false otherwise
 */
export function wildcardMatch(fileName: string, pattern: string): boolean {
  if (pattern === "*") return true;

  return new RegExp(
    `^${pattern
      .split("*")
      .map(s => s.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"))
      .join(".*")}$`
  ).test(fileName);
}

/**
 * Creates a mapping between files specified in the Debian Package and their respective SPDX headers
 * @param debianPackage Debian package configuration
 * @param files List of files to map agains the Debian package configuration
 * @returns A map of files to their respective SPDX headers
 */
export async function licenseMap(debianPackage: IDebianPackage, files: ISourceFile[]): Promise<Map<string, spdx.IFile>> {
  const fileMap = new Map<string, spdx.IFile>();

  for (const packageFiles of debianPackage.files) {
    for (const patternFile of packageFiles.files) {
      files
        .filter(file => wildcardMatch(getSourceFile(file), patternFile))
        .forEach(async file => {
          fs.writeFileSync(`${getSourceFile(file)}.deb5`, `${packageFiles.copyright
            .map(copyright => `SPDX-FileCopyrightText: ${copyright}`)
            .join("\n")}${packageFiles.license ? `\nSPDX-License-Identifier: ${packageFiles.license}` : ""}`);
          fileMap.set(
            getSourceFile(file),
            await spdx.parseFile(`${getSourceFile(file)}.deb5`)
          )
        }
      );
    }
  }

  return fileMap;
}
