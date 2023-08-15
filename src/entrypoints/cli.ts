#!/usr/bin/env node

/*
 * SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
 * SPDX-License-Identifier: MIT
 */

import * as diagnostics from "@dev-build-deploy/diagnose-it";
import * as reuse from "@dev-build-deploy/reuse-it";

import * as fs from "fs";
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
  .option("-s, --sbom-output <file>", "Output path for the Software Bill of Materials (SBOM).")
  .option("-c, --sarif-output <file>", "Output path for the SARIF file.")
  .action(async options => {
    console.log("📄 ReuseMe - REUSE compliance validation");
    console.log("----------------------------------------");
    console.log();

    const datasource = new GitSource();
    const sbom = new reuse.SoftwareBillOfMaterials(await datasource.getRepositoryName(), "reuse-me@v0");
    const files = await datasource.getFiles();
    await sbom.addFiles(files);

    const results = validate(sbom);

    for (const error of diagnostics.extractFromSarif(results.log)) {
      console.log(error.toString());
    }

    if ((options.sarifOutput || options.sbomOutput) && results.errorCount > 0) {
      console.log();
      console.log("----------------------------------------");
    }

    if (options.sarifOutput) {
      console.log(`✏️  Writing SARIF file...`);
      fs.writeFileSync(options.sarifOutput, JSON.stringify(results.log.properties(), null, 2));
    }

    if (options.sbomOutput) {
      if (results.errorCount === 0) {
        console.log(`✏️  Writing Software Bill of Materials file...`);
        fs.writeFileSync(options.sbomOutput, JSON.stringify(sbom, null, 2));
      } else {
        console.log(`⚠️  Skipping Software Bill of Materials file...`);
      }
    }

    if (options.sarifOutput || options.sbomOutput || results.errorCount > 0) {
      console.log("----------------------------------------");
    }

    if (results.errorCount === 0) {
      console.log(`✅ Found no REUSE compliance issues.`);
    } else {
      program.error(`❌ Found ${results.errorCount} REUSE compliance issues.`);
    }
  });

program.parse(process.argv);
