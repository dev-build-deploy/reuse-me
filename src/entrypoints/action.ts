/*
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
*/

import * as core from "@actions/core";
import * as github from "@actions/github";

import * as githubWrapper from "../github";
import { CommitsSource, GitSource, IDataSource } from "../datasources";
import { validate } from "../validator";
import { SoftwareBillOfMaterials } from "../spdx";

/**
 * Main entry point for the GitHub Action.
 */
async function run(): Promise<void> {
  try {
    core.info("📄 ReuseMe - REUSE compliance validation");
    // Setup environment
    let datasource: IDataSource;
    let errorCount = 0;

    // Store input parameters
    const token = core.getInput("token") ?? undefined;

    // Validate files changed as part of the Pull Request
    if (github.context.eventName === "pull_request" && token !== undefined) {
      core.startGroup("🔎 Scanning Pull Request");
      // Configure the GitHub context
      githubWrapper.setRepositoryContext(github.context.repo.owner, github.context.repo.repo, github.context.ref);
      const octokit = github.getOctokit(token);
      const pullRequestNumber = github.context.payload.number;

      // Retrieve the commits of the pull request and setup the datasource
      const commits = await githubWrapper.getPullRequestCommits(octokit, pullRequestNumber);
      datasource = new CommitsSource(octokit.rest, commits);
    } else {
      core.startGroup("🔎 Scanning repository");
      datasource = new GitSource(true); // Validate all files in the repository
    }
    core.endGroup();

    core.startGroup("📝 Validation results");
    const sbom = new SoftwareBillOfMaterials("reuseme", datasource);
    await sbom.generate();
    const results = validate(sbom);

    for (const result of results) {
      core.info(`${result.compliant ? "✅" : "❌"} ${result.file.fileName}`);
      errorCount += result.errors.length;
      for (const error of result.errors) {
        core.error(error, {
          title: "REUSE Compliance",
          file: result.file.fileName,
        });
      }
    }
    core.endGroup();

    if (errorCount === 0) {
      core.info(`✅ Found no REUSE compliance issues.`);
    } else {
      core.setFailed(`❌ Found ${errorCount} REUSE compliance issues.`);
    }
  } catch (ex) {
    core.setFailed((ex as Error).message);
  }
}

run();
