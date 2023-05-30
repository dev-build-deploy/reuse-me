/* 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
*/

import simpleGit from "simple-git";
import { IFile, IFileModification } from "./interfaces";

import * as fs from "fs";
import * as github from "./github";
import * as glob from "glob";

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
  __ROOT_PATH: string | undefined = undefined;
  modified: boolean;

  constructor(all: boolean = false) {
    this.modified = !all;
  }

  /**
   * Get the root directory for the repository
   * @returns The root directory of the repository
   */
  private async getRootPath(): Promise<string> {
    if (this.__ROOT_PATH === undefined) {
      this.__ROOT_PATH = await simpleGit().revparse({ '--show-toplevel': null })
    }

    return this.__ROOT_PATH
  }

  /**
   * Retrieve the files ignored based on `.gitignore`
   * @param rootPath The root path of the repository
   * @returns The list of ignored files
   */
  private async getIgnoredFiles(rootPath: string): Promise<string[]> {
    try {
      const ignored = await simpleGit().raw([
        "ls-files",
        "--others",
        "--ignored",
        "--exclude-standard",
        rootPath,
      ]);
      return ignored.split("\n");
    } catch (GitError) {
      return [];
    }
  }

  public async getChangedFiles(): Promise<IFile[]> {
    const changedFiles: IFile[] = [];
    const rootPath = await this.getRootPath()

    if (this.modified === false) {
      const ignored = await this.getIgnoredFiles(rootPath);
      const files = glob.globSync("**/*");
      for (const file of files) {
        // Skip directories
        if (fs.lstatSync(file).isDirectory()) continue;
        if (ignored.includes(file)) continue;

        changedFiles.push({
          source: file.endsWith(".license") ? "license" : "original",
          filePath: file.endsWith(".license") ? file.replace(".license", "") : file,
          licensePath: file.endsWith(".license") ? file : `${file}.license`,
          modification: "modified"
        });
      }

      return changedFiles;
    }

    const status = await simpleGit(rootPath).status()

    // TODO: Remove these for loops in favor of a more generic solution
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
