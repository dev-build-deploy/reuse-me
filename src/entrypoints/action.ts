/*
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
*/

import * as core from "@actions/core";
import * as artifact from "@actions/artifact";
import * as fs from "fs";

import { GitSource } from "../datasources";
import { validateFiles, validateSBOM } from "../validator";
import { SoftwareBillOfMaterials } from "../spdx";

/**
 * Uploads the SBOM to GitHub Artifacts.
 * @param sbom The SBOM to upload

 */
async function uploadSBOM(sbom: SoftwareBillOfMaterials): Promise<void> {
  const client = artifact.create();
  fs.writeFileSync("sbom.json", JSON.stringify(sbom.toJSON(), null, 2));
  await client.uploadArtifact("ReuseMe SBOM", ["sbom.json"], ".", { continueOnError: true });
  core.info("Uploaded Software Bill of Materials to GitHub Artifacts.");
}

/**
 * Main entry point for the GitHub Action.
 */
async function run(): Promise<void> {
  try {
    core.info("📄 ReuseMe - REUSE compliance validation");

    const datasource = new GitSource();
    const sbom = new SoftwareBillOfMaterials(await datasource.getRepositoryName(), datasource);
    await sbom.generate();

    const projectResults = validateSBOM(sbom, await datasource.getLicenseFiles());
    let errorCount = 0;

    if (projectResults.errors.length > 0) {
      errorCount += projectResults.errors.length;
      core.startGroup(`❌ The Project '${sbom.name}'`);
      projectResults.errors.forEach(error =>
        core.error(error, {
          title: "REUSE Compliance",
          file: projectResults.file.fileName,
        })
      );
      core.endGroup();
    }

    const results = validateFiles(sbom);
    results
      .filter(result => !result.compliant)
      .forEach(result => {
        errorCount += result.errors.length;
        core.startGroup(`❌ ${result.file.fileName}`);
        result.errors.forEach(error =>
          core.error(error, {
            title: "REUSE Compliance",
            file: result.file.fileName,
          })
        );
        core.endGroup();
      });

    if (errorCount === 0) {
      await uploadSBOM(sbom);
      core.info(`✅ Found no REUSE compliance issues.`);
    } else {
      core.setFailed(`❌ Found ${errorCount} REUSE compliance issues.`);
    }
  } catch (ex) {
    core.setFailed((ex as Error).message);
  }
}

run();
