/* 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
*/

import simpleGit from "simple-git";
import { IFile, IFileModification } from "./interfaces";

import * as github from "./github";
import * as fs from "fs";

interface IDataSource {
  /**
   * Determines which files have been changed as part of the push.
   * @param context The context of the event
   * @returns The list of files that have been changed
   */
  getChangedFiles(): Promise<IFile[]>;

  /**
   * Retrieves the contents of the provided file.
   * @param file The file to retrieve the contents of
   * @returns The contents of the file
   */
  getFileContents(file: string): Promise<string>;
}

/**
 * Git data source for determining which files need to be validated.
 */
class GitSource implements IDataSource {
  __ROOT_PATH: string | undefined = undefined

  constructor(rootPath?: string) {
    if (rootPath) {
      this.__ROOT_PATH = rootPath;
    }
  }

  private async getRootPath(): Promise<string> {
    if (this.__ROOT_PATH === undefined) {
      this.__ROOT_PATH = await simpleGit().revparse({ '--show-toplevel': null })
    }

    return this.__ROOT_PATH
  }

  public async getChangedFiles(): Promise<IFile[]> {
    const rootPath = await this.getRootPath()
    const status = await simpleGit(rootPath).status()

    const changedFiles: IFile[] = [];
    for (const file of status.not_added) {
      changedFiles.push({
        source: file.endsWith(".license") ? "license" : "original",
        filePath: file.endsWith(".license") ? file.replace(".license", "") : file,
        licensePath: file.endsWith(".license") ? file : `${file}.license`,
        modification: "added"
      });
    }
    for (const file of status.created) {
      changedFiles.push({
        source: file.endsWith(".license") ? "license" : "original",
        filePath: file.endsWith(".license") ? file.replace(".license", "") : file,
        licensePath: file.endsWith(".license") ? file : `${file}.license`,
        modification: "added"
      });
    }
    for (const file of status.modified) {
      changedFiles.push({
        source: file.endsWith(".license") ? "license" : "original",
        filePath: file.endsWith(".license") ? file.replace(".license", "") : file,
        licensePath: file.endsWith(".license") ? file : `${file}.license`,
        modification: "modified"
      });
    }
    for (const file of status.deleted) {
      changedFiles.push({
        source: file.endsWith(".license") ? "license" : "original",
        filePath: file.endsWith(".license") ? file.replace(".license", "") : file,
        licensePath: file.endsWith(".license") ? file : `${file}.license`,
        modification: "removed"
      });
    }

    return changedFiles;
  }

  public async getFileContents(file: string): Promise<string> {
    if (fs.existsSync(file) === false) {
      return "";
    }
    return fs.readFileSync(file, "utf8");
  }
}

/**
 * GitHub data source for determining which files need to be validated.
 */
class GitHubSource implements IDataSource {
  context: any;

  constructor(context: any) {
    this.context = context;
  }

  public async getChangedFiles(): Promise<IFile[]> {
    const payload = this.context.payload;
    if (!payload.commits) return [];

    const changedFiles: IFile[] = [];
    for (const commit of payload.commits) {
      for (const modification of ["added", "modified", "removed"]) {
        for (const file of commit[modification]) {
          changedFiles.push({
            source: file.endsWith(".license") ? "license" : "original",
            filePath: file.endsWith(".license") ? file.replace(".license", "") : file,
            licensePath: file.endsWith(".license") ? file : `${file}.license`,
            modification: (modification as IFileModification)
          });
        }
      }
    }

    return changedFiles;
  }

  public async getFileContents(file: string): Promise<string> {
    return await github.getFileContents(this.context, file);
  }
}

export { IDataSource, GitSource, GitHubSource }
