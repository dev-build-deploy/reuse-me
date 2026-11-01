/*
 * SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
 * SPDX-License-Identifier: MIT
 */

import * as reuse from "@dev-build-deploy/reuse-it";
import * as sarif from "@dev-build-deploy/sarif-it";

import * as tool from "./config/tool.json";
import { IValidationResult } from "./interfaces";
import { fileRequirements, projectRequirements } from "./requirements";
import { toolVersion } from "./utils";

/**
 * Validation options
 * @member complete Whether the SBOM holds every file of the project (not only, say, the staged files of a commit);
 *                  rules about the project as a whole, like unused License Files (PR002), only apply then
 */
export interface IValidationOptions {
  complete?: boolean;
}

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
 * @param options Validation options
 * @returns Validation result
 */
function validateSBOM(sbom: reuse.SoftwareBillOfMaterials, options: IValidationOptions): IValidationResult {
  const requirements = projectRequirements({ complete: options.complete === true });

  const results = requirements
    .map(req => [...req.validate(req.rule, sbom)])
    .filter(errors => errors !== undefined)
    .flat();

  return { file: sbom.files[0], compliant: results.length === 0, results: results }; //errors.length === 0, errors: errors };
}

/**
 * Validates the provided SBOM against the requirements (both project and file requirements)
 * @param sbom The SBOM to validate
 * @param options Validation options
 * @returns Validation results
 */
export function validate(
  sbom: reuse.SoftwareBillOfMaterials,
  options: IValidationOptions = {}
): { errorCount: number; log: sarif.Log } {
  // SARIF's tool.driver.version is optional: it is left out rather than made up when the version is unknown
  const version = toolVersion();
  const run = new sarif.Run(new sarif.Tool(tool.driver.name, { ...tool.driver, ...(version ? { version } : {}) }));
  const log = new sarif.Log().addRun(run);

  let errorCount = 0;
  const projectResults = validateSBOM(sbom, options);
  projectResults.results.forEach(res => {
    run.addResult(res);
    errorCount += res.properties()?.occurrenceCount ?? 0;
  });

  const results = validateFiles(sbom);
  results.forEach(result =>
    result.results.forEach(res => {
      run.addResult(res);
      errorCount += res.properties()?.occurrenceCount ?? 0;
    })
  );

  return {
    errorCount: errorCount,
    log: log,
  };
}
