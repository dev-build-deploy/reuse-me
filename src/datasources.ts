/* 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
*/

import simpleGit, { StatusResultRenamed } from "simple-git";
import { ISourceFile, IFileModification } from "./interfaces";

import * as path from "path";
import * as fs from "fs";
import * as github from "./github";

interface IDataSource {
  /**
   * Determines which files have been changed as part of the push.
   * @param context The context of the event
   * @returns The list of files that have been changed
   */
  getChangedFiles(): Promise<ISourceFile[]>;

  /**
   * Retrieves the contents of the provided file.
   * @param file The file to retrieve the contents of
   * @returns The contents of the file
   */
  getFileContents(file: string): Promise<string>;

  /**
   * Retrieves the name of the repository.
   */
  getRepositoryName(): Promise<string>;
}

/**
 * Git data source for determining which files need to be validated.
 */
class GitSource implements IDataSource {
  __ROOT_PATH: string | undefined = undefined;
  modified: boolean;

  constructor(all = false) {
    this.modified = !all;
  }

  public async getRepositoryName(): Promise<string> {
    return path.basename(await this.getRootPath());
  }

  /**
   * Get the root directory for the repository
   * @returns The root directory of the repository
   */
  private async getRootPath(): Promise<string> {
    if (this.__ROOT_PATH === undefined) {
      this.__ROOT_PATH = await simpleGit().revparse({
        "--show-toplevel": null,
      });
    }

    return this.__ROOT_PATH;
  }

  /**
   * Retrieve the files ignored based on `.gitignore`
   * @param rootPath The root path of the repository
   * @returns The list of ignored files
   */
  private async listFiles(rootPath: string): Promise<string[]> {
    try {
      const ignored = await simpleGit().raw(["ls-files", "--exclude-standard", "--full-name", rootPath]);
      // Remove the last empty line
      return ignored.split("\n").filter(file => {
        return file.trim() && fs.existsSync(file) && !fs.lstatSync(file).isDirectory();
      });
    } catch (GitError) {
      return [];
    }
  }

  public async getChangedFiles(): Promise<ISourceFile[]> {
    const changedFiles: ISourceFile[] = [];
    const rootPath = await this.getRootPath();

    if (this.modified === false) {
      const files = await this.listFiles(rootPath);
      for (const file of files) {
        changedFiles.push({
          source: file.endsWith(".license") ? "license" : "original",
          filePath: file.endsWith(".license") ? file.replace(".license", "") : file,
          licensePath: file.endsWith(".license") ? file : `${file}.license`,
          modification: "modified",
        });
      }
      return changedFiles;
    }

    const status = await simpleGit(rootPath).status();

    /**
     * Creates a single file entry
     * @param file File path
     * @param modification File modification type
     * @returns File dictionary
     */
    const createFileEntry = (file: string, modification: IFileModification): ISourceFile => {
      return {
        source: file.endsWith(".license") ? "license" : "original",
        filePath: file.endsWith(".license") ? file.replace(".license", "") : file,
        licensePath: file.endsWith(".license") ? file : `${file}.license`,
        modification: modification,
      };
    };

    status.created.forEach((file: string) => {
      changedFiles.push(createFileEntry(file, "added"));
    });
    status.not_added.forEach((file: string) => {
      changedFiles.push(createFileEntry(file, "added"));
    });

    status.modified.forEach((file: string) => {
      changedFiles.push(createFileEntry(file, "modified"));
    });

    status.deleted.forEach((file: string) => {
      changedFiles.push(createFileEntry(file, "removed"));
    });
    status.renamed.forEach((rename: StatusResultRenamed) => {
      changedFiles.push(createFileEntry(rename.from, "removed"));
      changedFiles.push(createFileEntry(rename.to, "added"));
    });

    return changedFiles;
  }

  public async getFileContents(file: string): Promise<string> {
    if (fs.existsSync(file) === false) {
      // TOO: Determine whether we need to handle this use case.
      return "";
    }
    return fs.readFileSync(file, "utf8");
  }
}

/**
 * GitHub data source for determining which files need to be validated.
 */
class CommitsSource implements IDataSource {
  octokit: any;
  commits: any;

  constructor(octokit: any, commits: any) {
    this.octokit = octokit;
    this.commits = commits;
  }

  public async getRepositoryName(): Promise<string> {
    return github.getRepositoryContext().repo;
  }

  public async getChangedFiles(): Promise<ISourceFile[]> {
    if (!this.commits) return [];

    const changedFiles: ISourceFile[] = [];
    for (const commit of this.commits) {
      for (const modification of ["added", "modified", "removed"]) {
        for (const file of commit[modification]) {
          changedFiles.push({
            source: file.endsWith(".license") ? "license" : "original",
            filePath: file.endsWith(".license") ? file.replace(".license", "") : file,
            licensePath: file.endsWith(".license") ? file : `${file}.license`,
            modification: modification as IFileModification,
          });
        }
      }
    }

    return changedFiles;
  }

  public async getFileContents(file: string): Promise<string> {
    return await github.getFileContents(this.octokit, file);
  }
}

export { IDataSource, GitSource, CommitsSource };
