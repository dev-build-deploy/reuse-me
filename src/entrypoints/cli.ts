#!/usr/bin/env node

/* 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
*/

import { Command } from "commander";
import { GitSource } from "../datasources";
import { validate } from "../validator";

const program = new Command();

/**
 * Main entry point for the CLI tool.
 */
program
  .name("reuse-me")
  .description("Copyright and License management CLI tool")

/**
 * Validate command
 */
program
  .command("check")
  .description(
    "Checks whether the repository is compliant with the Reuse Specification."
  )
  .option("-a, --all", "Check all files in the repository")
  .action(async (options) => {
    console.log("📄 ReuseMe - REUSE compliance validation")
    console.log("----------------------------------------")

    const results = await validate(new GitSource(options.all));
    let errorCount = 0;
    for (const result of results) {
      // For now, we skip the compliant files in case we scan the full repository
      if (options.all && result.compliant) continue;

      errorCount += result.errors.length;

      console.log(`${result.compliant ? "✅" : "❌"} ${result.file}`)
      for (const error of result.errors) {
        console.log(`   ${error}`)
      }
    }

    if (!options.all || errorCount > 0) {
      console.log("----------------------------------------")
    }

    if (errorCount === 0) {
      console.log(`✅ Found no REUSE compliance issues.`)
    } else {
      program.error(`❌ Found ${errorCount} REUSE compliance issues.`)
    }
  });

program.parse(process.argv);
