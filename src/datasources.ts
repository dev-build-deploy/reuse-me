/*
 * SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
 * SPDX-License-Identifier: MIT
 */

import * as fs from "fs";
import * as path from "path";

import git from "simple-git";

/**
 * Files that change the Licensing Information of other files: when one of them is among the files to check, every
 * tracked file is checked (e.g. a changed .reuse/dep5 can leave files elsewhere without a licence).
 */
const REUSE_CONFIGURATION = [/^\.reuse\/dep5$/, /(^|\/)REUSE\.toml$/, /^LICENSES\//];

/**
 * Git data source for determining which files need to be validated.
 */
class GitSource {
  private readonly baseDir: string;
  private rootPath: string | undefined = undefined;

  /**
   * @param baseDir A directory inside the repository (defaults to the current working directory)
   */
  constructor(baseDir: string = process.cwd()) {
    this.baseDir = path.resolve(baseDir);
  }

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
  async getRootPath(): Promise<string> {
    if (this.rootPath === undefined) {
      this.rootPath = (await git(this.baseDir).revparse({ "--show-toplevel": null })).trim();
    }

    return this.rootPath;
  }

  /**
   * Retrieve the files git tracks (i.e. the files in its index, which includes staged new files). Untracked and
   * ignored files are not part of the project, and neither are submodules, symbolic links to directories, or files
   * deleted from the working tree.
   * @returns Paths relative to the repository root
   */
  private async listTrackedFiles(): Promise<string[]> {
    const rootPath = await this.getRootPath();
    const output = await git(rootPath).raw(["ls-files", "-z", "--full-name"]);
    return output.split("\0").filter(file => file.length > 0 && this.isFile(file));
  }

  /**
   * Whether the path (relative to the repository root) is an existing regular file
   * @param file Path relative to the repository root
   */
  private isFile(file: string): boolean {
    const fullPath = path.join(this.rootPath ?? this.baseDir, file);
    return fs.existsSync(fullPath) && fs.statSync(fullPath).isFile();
  }

  /**
   * Whether getFiles(only) returns every tracked file, i.e. the whole project is validated: no files were given, or a
   * given file is REUSE configuration.
   *
   * @param only Files to validate instead of all tracked files
   */
  async coversProject(only?: string[]): Promise<boolean> {
    await this.getRootPath();
    if (only === undefined || only.length === 0) return true;
    const files = only.map(file => this.toRepositoryPath(file));
    return files.some(file => REUSE_CONFIGURATION.some(pattern => pattern.test(file)));
  }

  /**
   * Turns a path relative to the base directory (or an absolute path) into a path relative to the repository root
   * (call getRootPath first)
   * @param file The path to convert
   */
  private toRepositoryPath(file: string): string {
    return path
      .relative(this.rootPath ?? this.baseDir, path.resolve(this.baseDir, file))
      .split(path.sep)
      .join("/");
  }

  /**
   * Determines which files to validate: every file git tracks, or only the given files (e.g. the staged files passed
   * by a pre-commit hook). When a given file is REUSE configuration (.reuse/dep5, a REUSE.toml, or a file in
   * LICENSES/), every tracked file is validated, as the change can affect any of them.
   *
   * @param only Files to validate instead of all tracked files; relative to the base directory, or absolute
   * @returns Paths relative to the repository root, each once
   */
  async getFiles(only?: string[]): Promise<string[]> {
    if (await this.coversProject(only)) {
      return this.listTrackedFiles();
    }

    // Each file once: the SBOM identifies a file by the hash of its path, so a file given twice (e.g. "a.ts ./a.ts")
    // would produce duplicate SPDX identifiers and an invalid SBOM
    const files = [...new Set((only ?? []).map(file => this.toRepositoryPath(file)))];
    return files.filter(file => !file.startsWith("../") && this.isFile(file));
  }
}

export { GitSource };
