/*
 * SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
 * SPDX-License-Identifier: MIT
 */

/**
 * Formats the provided string with the provided values, i.e.:
 *   formatMessage("Hello {0}", "World") => "Hello World"
 *
 * @param str Message containing {0}, {1}, etc.
 * @param val Values to replace the placeholders with
 *
 * @returns Formatted string
 */
export function formatMessage(str: string, ...val: string[]): string {
  for (let index = 0; index < val.length; index++) {
    str = str.replace(`{${index}}`, val[index]);
  }
  return str;
}

/**
 * Highlights the provided values in the provided string, i.e.:
 *   highlightMessage("Hello World", "World") => "Hello \x1b[36mWorld\x1b[0m"
 *
 * @param str Message to highlight
 * @param val Values to highlight
 * @returns Highlighted string
 */
export function highlightMessage(str: string, ...val: string[]): string {
  val.forEach(value => {
    str = str.replace(value, `\x1b[36m${value}\x1b[0;1m`);
  });

  return str;
}

/**
 * The version of reuse-me that is running. It is only known when running as a GitHub Action (the ref it was used
 * with, e.g. v1); the CLI does not carry its release version (package.json is not bumped on release, releases are
 * git tags only), and a made-up version would be worse than none.
 *
 * @returns The ref of the GitHub Action, or undefined when unknown
 */
export function toolVersion(): string | undefined {
  return process.env.GITHUB_ACTION_REF || undefined;
}

/**
 * The tool name for the SBOM's creation information (SPDX "Tool: name-version").
 *
 * @returns "reuse-me-<version>" when the version is known (see toolVersion), "reuse-me" otherwise
 */
export function toolName(): string {
  const version = toolVersion();
  return version ? `reuse-me-${version}` : "reuse-me";
}
