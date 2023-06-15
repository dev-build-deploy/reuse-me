#!/usr/bin/env node

/*
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
*/

import { Command } from "commander";
import { GitSource } from "../datasources";
import { validateFiles, validateSBOM } from "../validator";
import { SoftwareBillOfMaterials } from "../spdx";

const program = new Command();

/**
 * Main entry point for the CLI tool.
 */
program.name("reuse-me").description("Copyright and License management CLI tool");

program
  .command("sbom")
  .description("Generates a Software Bill of Materials (SBOM) for the repository.")
  .action(async () => {
    const datasource = new GitSource();
    const sbom = new SoftwareBillOfMaterials(await datasource.getRepositoryName(), datasource);
    await sbom.generate();
    console.log(JSON.stringify(sbom.toJSON(), null, 2));
  });

/**
 * Validate command
 */
program
  .command("check")
  .description("Checks whether the repository is compliant with the Reuse Specification.")
  .action(async () => {
    console.log("📄 ReuseMe - REUSE compliance validation");
    console.log("----------------------------------------");
    console.log();

    const datasource = new GitSource();
    const sbom = new SoftwareBillOfMaterials(await datasource.getRepositoryName(), datasource);
    await sbom.generate();

    const projectResults = validateSBOM(sbom, await datasource.getLicenseFiles());
    let errorCount = 0;

    if (projectResults.errors.length > 0) {
      errorCount += projectResults.errors.length;
      console.log(`❌ The Project '${sbom.name}'`);
      projectResults.errors.forEach(error => console.log(`   ${error}`));
      console.log();
    }

    const results = validateFiles(sbom);
    results
      .filter(result => !result.compliant)
      .forEach(result => {
        errorCount += result.errors.length;
        console.log(`❌ ${result.file.fileName}`);
        result.errors.forEach(error => console.log(`   ${error}`));
        console.log();
      });

    if (errorCount > 0) {
      console.log("----------------------------------------");
    }

    if (errorCount === 0) {
      console.log(`✅ Found no REUSE compliance issues.`);
    } else {
      program.error(`❌ Found ${errorCount} REUSE compliance issues.`);
    }
  });

program.parse(process.argv);
