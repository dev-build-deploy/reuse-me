/* 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
*/

import { CommitsSource } from "../datasources";
import { Probot } from "probot";

import * as github from "../github";
import { validate } from "../validator";
import { SoftwareBillOfMaterials } from "../spdx";

/**
 * Handles the push event, validating modified files for REUSE compliance.
 * @param context
 */
const onPush = async (context: any) => {
  github.setRepositoryContext(context.repo.owner, context.repo.repo, context.payload.ref);
  // const issues = await github.getIssues(context);

  const datasource = new CommitsSource(context.octokit, context.payload.commits);
  const sbom = new SoftwareBillOfMaterials("reuseme", datasource);
  await sbom.generate();

  const results = validate(sbom);

  for (const result of results) {
    if (result.compliant) continue;

    //await github.updateIssue(context, issues, result.file, header);
  }
};

/**
 * Main entry point for the bot.
 */
export = (app: Probot) => {
  app.on("push", onPush);
};
