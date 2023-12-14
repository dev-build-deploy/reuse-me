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
