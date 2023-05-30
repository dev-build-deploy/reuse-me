/* 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
SPDX-License-Identifier: GPL-3.0-or-later
*/

import { IFile, ISPDXHeader } from "./interfaces";

const PULLREQUEST_TITLE = (file: string) => `Missing SPDX Header: ${file}`
const PULLREQUEST_BODY = (file: string) => `# Context
The file \`${file}\` does not contain a (valid) SPDX header and/or no valid \`.license\` file was found.

# Expectations
The following SPDX header is expected either in the file itself or in a seperated \`${file}.license\` file:

\`\`\`python
# SPDX-FileCopyrightText: [year] [copyright holder] <[email address]>
#
# SPDX-License-Identifier: [identifier]
\`\`\`
Please refer to the [Reuse FAQ](https://reuse.software/faq/) for more information.

# References
- [Reuse Project](https://reuse.software/)
- [SPDX License List](https://spdx.org/licenses/)
- [SPDX Specification](https://spdx.github.io/spdx-spec/)
`

/**
 * Retrieves all issues for the repository.
 * @param context The context of the event
 * @returns The list of issues
 */
const getIssues = async (context: any) => {
  const issues = [];

  for await (const response of context.octokit.paginate.iterator(
    context.octokit.rest.issues.listForRepo,
    context.repo(),
  )) {
    issues.push(...response.data);
  }

  return issues;
}

/**
 * Updates GitHub issues based on the status of the SPDX header.
 *  - If the header is invalid, the issue is created. 
 *  - If the header is valid, the issue is closed.
 *  - If the file has been removed, the issue is closed.
 * @param context The context of the event
 * @param issues List of issues for the repository
 * @param file Specific file to check
 * @param header SPDX header of the file
 */
const updateIssue = async (context: any, issues: any[], file: IFile, header: ISPDXHeader | undefined) => {
  // Check if an open issue does not already exist
  for (const issue of issues) {
    if (issue.title === PULLREQUEST_TITLE(file.filePath) && issue.state !== "closed") {
      // Close issue in case we have a valid header or the file has been removed
      if (header !== undefined || file.modification === "removed") {
        await context.octokit.issues.update(context.repo({
          issue_number: issue.number,
          state: "closed"
        }));
      }
      // No need to create an additional issue in case one already exists.
      return;
    }
  }

  // No need to create an issue if the header is valid...
  if (header !== undefined) return;
  // ...or the (original) file has been removed
  if (file.source === "original" && file.modification === "removed") return;

  await context.octokit.issues.create(context.repo({
    title: PULLREQUEST_TITLE(file.filePath),
    body: PULLREQUEST_BODY(file.filePath),
    assignee: context.payload.sender.login,
    labels: ["license"]
  }));
};

/**
* Retrieves the first lines of the file from GitHub.
* @param context The context of the event
* @param filePath The path to the file to retrieve
* @returns The contents of the file
*/
const getFileContents = async (
  context: any,
  filePath: string
): Promise<string> => {
  try {
    const response = await context.octokit.repos.getContent(context.repo({ path: filePath }));
    return Buffer.from(response.data.content, "base64").toString();
  } catch (error) {
    return "";
  }
};

export { getFileContents, getIssues, updateIssue }
