/*
 * SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
 * SPDX-License-Identifier: MIT
 */

import * as fs from "fs";

import * as artifact from "@actions/artifact";
import * as core from "@actions/core";
import * as diagnostics from "@dev-build-deploy/diagnose-it";
import * as reuse from "@dev-build-deploy/reuse-it";

import { GitSource } from "../datasources";
import { validate } from "../validator";

/**
 * Uploads the SBOM to GitHub Artifacts.
 * @param sbom The SBOM to upload

 */
async function uploadSBOM(sbom: reuse.SoftwareBillOfMaterials): Promise<void> {
  const client = artifact.create();
  fs.writeFileSync("sbom.json", JSON.stringify(sbom, null, 2));
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
    const sbom = new reuse.SoftwareBillOfMaterials(await datasource.getRepositoryName(), "reuse-me@v0");
    const files = await datasource.getFiles();
    await sbom.addFiles(files);

    const results = validate(sbom);

    if (results.errorCount === 0) {
      await uploadSBOM(sbom);
      core.info(`✅ Found no REUSE compliance issues.`);
    } else {
      for (const error of diagnostics.extractFromSarif(results.log)) {
        core.error(error.toString(), {
          title: "REUSE Compliance",
          file: error.toJSON().id,
        });
      }
      console.info();
      core.setFailed(`❌ Found ${results.errorCount} REUSE compliance issues.`);
    }
  } catch (ex) {
    core.setFailed((ex as Error).message);
  }
}

run();
