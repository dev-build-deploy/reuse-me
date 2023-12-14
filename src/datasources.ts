/*
 * SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
 * SPDX-License-Identifier: MIT
 */

import * as fs from "fs";
import * as path from "path";

import simpleGit from "simple-git";

/**
 * Git data source for determining which files need to be validated.
 */
class GitSource {
  __ROOT_PATH: string | undefined = undefined;

  /**
   * Retrieves the name of the repository.
   */
  async getRepositoryName(): Promise<string> {
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
   * Retrieves the list of license files stored in LICENSES/.
   */
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

  /**
   * Determines which files have been changed as part of the push.
   * @param context The context of the event
   * @returns The list of files that have been changed
   */
  async getFiles(): Promise<string[]> {
    const rootPath = await this.getRootPath();

    return await this.listFiles(rootPath);
  }
}

export { GitSource };
