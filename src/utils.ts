/* 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
*/

import { ISourceFile } from "./interfaces";

/**
 * Converts a kebab-case string to camelCase
 * @param str String to convert to camelCase
 * @returns camelCase string
 */
export function kebabToCamel(str: string): string {
  return str
    .split("-")
    .map((word, index) => (index === 0 ? word.toLowerCase() : word[0].toUpperCase() + word.slice(1).toLowerCase()))
    .join("");
}

/**
 * Determines the source of the file
 * @param file The file to determine the source of
 * @returns The source of the file
 */
export function getSourceFile(file: ISourceFile) {
  return file.source === "original" ? file.filePath : file.licensePath;
}
