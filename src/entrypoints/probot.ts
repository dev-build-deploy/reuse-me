/* 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
*/

import { ISPDXHeader } from "../interfaces";
import { GitHubSource } from "../datasources";
import { Probot } from "probot";

import * as spdx from "../spdx";
import * as github from "../github";

const onPush = async (context: any) => {
  const datasource = new GitHubSource(context);
  const issues = await github.getIssues(context);

  for (let file of await datasource.getChangedFiles()) {
    // Determine the SPDX header of the file
    let header: ISPDXHeader | undefined = undefined;
    header = spdx.getSPDXHeader(await datasource.getFileContents(file.filePath));

    // Check whether a seperate .license file is available
    if (header === undefined) {
      header = spdx.getSPDXHeader(await datasource.getFileContents(file.licensePath));
    }

    await github.updateIssue(context, issues, file, header);
  }
}

/**
 * Main entry point for the bot.
 */
export = (app: Probot) => {
  app.on('push', onPush)
};
