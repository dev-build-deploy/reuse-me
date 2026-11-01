/*
 * SPDX-FileCopyrightText: 2026 Kevin de Jong <monkaii@hotmail.com>
 * SPDX-License-Identifier: MIT
 */

import { toolName } from "../src/utils";

describe("toolName", () => {
  const original = process.env.GITHUB_ACTION_REF;

  afterEach(() => {
    if (original === undefined) delete process.env.GITHUB_ACTION_REF;
    else process.env.GITHUB_ACTION_REF = original;
  });

  test("names the tool without a made-up version", () => {
    delete process.env.GITHUB_ACTION_REF;
    expect(toolName()).toBe("reuse-me");
  });

  test("carries the ref of the GitHub Action", () => {
    process.env.GITHUB_ACTION_REF = "v1";
    expect(toolName()).toBe("reuse-me-v1");
  });
});
