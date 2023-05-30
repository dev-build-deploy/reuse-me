/* 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
*/

/**
 * SPDX File Header
 * @interface ISPDXHeader
 * @member copyright SPDX File Copyright Text
 * @member license SPDIX Licese Identifier
 */
export interface ISPDXHeader {
  copyright: ICopyrightText[]
  licenses: string[]
}

/**
 * SPDX File Copyright Text
 * @interface ICopyrightText
 * @member year the year(s) associated with the publication
 * @member copyrightHolder The holder(s) of the copyright
 * @member contactAddress (Optional) Contact information of the Copyright holder
 */
export interface ICopyrightText {
  year?: string
  copyrightHolder: string
  contactAddress?: string
}

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
export interface IFile {
  source: "license" | "original"
  filePath: string
  licensePath: string
  modification: IFileModification;
} 
