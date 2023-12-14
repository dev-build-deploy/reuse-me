/*
 * SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
 * SPDX-License-Identifier: MIT
 */

import * as reuse from "@dev-build-deploy/reuse-it";
import * as sarif from "@dev-build-deploy/sarif-it";

import * as tool from "./config/tool.json";
import { IValidationResult } from "./interfaces";
import { fileRequirements, projectRequirements } from "./requirements";

/**
 * Validates all files against requirements related to File contents
 * @param sbom The SBOM containing the files to validate
 * @returns List of validation results
 */
function validateFiles(sbom: reuse.SoftwareBillOfMaterials): IValidationResult[] {
  const requirements = fileRequirements();

  return sbom.files.map(file => {
    const results = requirements
      .map(req => [...req.validate(req.rule, file)])
      .filter(errors => errors !== undefined)
      .flat();

    return { file: file, compliant: results.length === 0, results: results };
  });
}

/**
 * Validates the SBOM against requirements related to the project
 * @param sbom The SBOM (Project) to validate
 * @returns Validation result
 */
function validateSBOM(sbom: reuse.SoftwareBillOfMaterials): IValidationResult {
  const requirements = projectRequirements();

  const results = requirements
    .map(req => [...req.validate(req.rule, sbom)])
    .filter(errors => errors !== undefined)
    .flat();

  return { file: sbom.files[0], compliant: results.length === 0, results: results }; //errors.length === 0, errors: errors };
}

/**
 * Validates the provided SBOM against the requirements (both project and file requirements)
 * @param sbom The SBOM to validate
 * @returns Validation results
 */
export function validate(sbom: reuse.SoftwareBillOfMaterials): { errorCount: number; log: sarif.Log } {
  const run = new sarif.Run(new sarif.Tool(tool.driver.name, tool.driver));
  const log = new sarif.Log().addRun(run);

  let errorCount = 0;
  const projectResults = validateSBOM(sbom);
  projectResults.results.forEach(res => {
    run.addResult(res);
    errorCount += res.properties().occurrenceCount;
  });

  const results = validateFiles(sbom);
  results.forEach(result =>
    result.results.forEach(res => {
      run.addResult(res);
      errorCount += res.properties().occurrenceCount;
    })
  );

  return {
    errorCount: errorCount,
    log: log,
  };
}
