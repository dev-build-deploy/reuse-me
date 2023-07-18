/* 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
SPDX-License-Identifier: GPL-3.0-or-later
*/

import simpleGit from "simple-git";
import { ISourceFile } from "./interfaces";

import * as path from "path";
import * as fs from "fs";

interface IDataSource {
  /**
   * Determines which files have been changed as part of the push.
   * @param context The context of the event
   * @returns The list of files that have been changed
   */
  getFiles(): Promise<ISourceFile[]>;

  /**
   * Retrieves the contents of the provided file.
   * @param file The file to retrieve the contents of
   * @returns The contents of the file
   */
  getFileContents(file: string, buffer?: boolean): Promise<string>;

  /**
   * Retrieves the name of the repository.
   */
  getRepositoryName(): Promise<string>;

  /**
   * Retrieves the list of license files stored in LICENSES/.
   */
  getLicenseFiles(): Promise<string[]>;
}

/**
 * Git data source for determining which files need to be validated.
 */
class GitSource implements IDataSource {
  __ROOT_PATH: string | undefined = undefined;

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

  async getLicenseFiles(): Promise<string[]> {
    const rootPath = await this.getRootPath();
    const files = await this.listFiles(rootPath);
    return files.filter(file => file.startsWith("LICENSES/"));
  }

  /**
   * Retrieve the tracked and untracked files from git
   * @param rootPath The root path of the repository
   * @returns The list of (un)tracked files
   */
  private async listFiles(rootPath: string): Promise<string[]> {
    try {
      const tracked = await simpleGit().raw(["ls-files", "--exclude-standard", "--full-name", rootPath]);
      const untracked = await simpleGit().raw(["ls-files", "--others", "--exclude-standard", "--full-name", rootPath]);
      const files = tracked + "\n" + untracked;
      // Remove the last empty line
      return files.split("\n").filter(file => {
        return file.trim() && fs.existsSync(file) && !fs.lstatSync(file).isDirectory();
      });
    } catch (GitError) {
      return [];
    }
  }

  public async getFiles(): Promise<ISourceFile[]> {
    const rootPath = await this.getRootPath();
    const files = await this.listFiles(rootPath);

    return files.map(file => { return {
      source: file.endsWith(".license") ? "license" : "original",
      filePath: file.endsWith(".license") ? file.replace(".license", "") : file,
      licensePath: file.endsWith(".license") ? file : `${file}.license`,
    }})
  }

  /**
   * Read the first 1024 bytes of a file
   * @param file The file to read
   * @returns The first 1024 bytes of the file
   * @throws Error if the file cannot be read
   */
  private readBuffer(file: string): string {
    const stream = fs.createReadStream(file, {
      flags: "r",
      encoding: "utf-8",
      fd: undefined,
      mode: 666,
      end: 1024,
    });

    let fileData = "";
    stream.on("data", function (data) {
      fileData += data;
    });
    stream.on("error", function () {
      throw new Error(`Problem while reading file '${file}'}`);
    });
    stream.on("end", function () {
      return fileData;
    });

    return fileData;
  }

  public async getFileContents(file: string, buffer?: boolean): Promise<string> {
    if (fs.existsSync(file) === false) return "";
    if (buffer) return this.readBuffer(file);
    else return fs.readFileSync(file, "utf8");
  }
}

export { IDataSource, GitSource };
