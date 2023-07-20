/*
 * SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
 * SPDX-License-Identifier: MIT
 */

import * as reuse from "@dev-build-deploy/reuse-it";

import { ExpressiveMessage } from "@dev-build-deploy/diagnose-it";
import * as spdx from "./spdx";
import * as fs from "fs";
import { getIndividualLicences } from "./spdx";

/**
 * Requirement interface
 * @interface IRequirement
 * @member id Requirement identifier
 * @member description Description of the requirement
 */
interface IRequirement {
  id: string;
  description: string;
}

interface IFileRequirement extends IRequirement {
  validate(spdxFile: reuse.SpdxFile): RequirementError | void;
}

interface IProjectRequirement extends IRequirement {
  validate(sbom: reuse.SoftwareBillOfMaterials, licenses: string[]): RequirementError | void;
}

/**
 * Error thrown when a commit message does not meet the Conventional Commit specification.
 */
export class RequirementError extends Error {
  identifier: string;
  description: string;
  errors: ExpressiveMessage[] = [];

  constructor(requirement: IRequirement, identifier: string) {
    super();

    this.identifier = identifier;
    this.description = requirement.description;
    this.message = `Non-compliant with the requirement ${requirement.id}`;
  }

  /**
   * Extends the output with another error message
   * @param highlight String to highlight in the specification description
   */
  addError(highlight: string | string[], description?: string) {
    this.errors.push(
      new ExpressiveMessage()
        .id(this.identifier)
        .error(this.highlightString(description ? description : this.description, highlight))
    );
    this.message = this.errors.map(e => e.toString()).join("\n");
  }

  /**
   * Highlights the substring(s) in the specified string in cyan.
   * @param str original string
   * @param substring substring(s) to highlight (in cyan)
   * @returns string containing highlighted sections in cyan
   */
  private highlightString(str: string, substring: string | string[]) {
    const HIGHLIGHT = "\x1b[1;36m";
    const RESET = "\x1b[0m\x1b[1m";

    // Ensure that we handle both single and multiple substrings equally
    if (!Array.isArray(substring)) substring = [substring];

    // Replace all instances of substring with a blue version
    let result = str;
    substring.forEach(sub => (result = result.replace(sub, `${HIGHLIGHT}${sub}${RESET}`)));
    return result;
  }
}

/**
 * Each Covered File MUST have Copyright and Licensing Information associated with it
 */
class FL01 implements IFileRequirement {
  id = "FL01";
  description = "Each Covered File MUST have Copyright and Licensing Information associated with it";

  validate(spdxFile: reuse.SpdxFile): RequirementError | void {
    const error = new RequirementError(this, spdxFile.fileName);

    if (spdx.hasValidCopyrightText(spdxFile) === false)
      error.addError(["Each Covered File MUST have Copyright", "Information"]);
    if (spdx.hasValidLicense(spdxFile) === false)
      error.addError(["Each Covered File MUST have", "Licensing Information"]);
    
    if (error.errors.length > 0) return error;
  }
}

/**
 * The SPDX License Identifier (X) MUST be LicenseRef-[letters, numbers, ".", or "-"] as defined by the SPDX Specification
 */
class FL02 implements IFileRequirement {
  id = "FL02";
  description =
    'The SPDX License Identifier (X) MUST be LicenseRef-[letters, numbers, ".", or "-"] as defined by the SPDX Specification';

  validate(spdxFile: reuse.SpdxFile): RequirementError | void {
    const error = new RequirementError(this, spdxFile.fileName);

    spdxFile.licenseInfoInFiles
      .filter(license => license.startsWith("LicenseRef-"))
      .filter(license => /^LicenseRef-[A-Za-z0-9\-.]+$/.test(license) === false)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .forEach(license => {
        error.addError(
          [license, "MUST be LicenseRef-", 'letters, numbers, ".", or "-"'],
          `The SPDX License Identifier (${license}) MUST be LicenseRef-[letters, numbers, ".", or "-"] as defined by the SPDX Specification`
        );
      });

    if (error.errors.length > 0) return error;
  }
}

/**
 * The Project MUST include a License File for every license, but is missing (...)
 */
class PR01 implements IProjectRequirement {
  id = "PR01";
  description = "The Project MUST include a License File for every license, but is missing (...)";

  validate(sbom: reuse.SoftwareBillOfMaterials): RequirementError | void {
    const error = new RequirementError(this, sbom.name);

    const allLicenses = sbom.files
      .map(file => getIndividualLicences(file))
      .flat()
      .filter((value, index, array) => array.indexOf(value) === index);
    const missingLicenses = allLicenses.filter(license => fs.existsSync(`./LICENSES/${license}.txt`) === false);

    missingLicenses.forEach(license => {
      error.addError(
        ["Project MUST include a License File for", license],
        `The Project MUST include a License File for every license, but is missing ${license}`
      );
    });

    if (error.errors.length > 0) return error;
  }
}

/**
 * The Project MUST NOT include License Files (X) for licenses under which none of the files in the Project are licensed.
 */
class PR02 implements IProjectRequirement {
  id = "PR02";
  description =
    "The Project MUST NOT include License Files (X) for licenses under which none of the files in the Project are licensed.";

  validate(sbom: reuse.SoftwareBillOfMaterials, licenses: string[]): RequirementError | void {
    const error = new RequirementError(this, sbom.name);

    const localLicenses = [...licenses];

    sbom.files.forEach(file => {
      getIndividualLicences(file).forEach(license => {
        if (localLicenses.includes(`LICENSES/${license}.txt`) === true)
          localLicenses.splice(localLicenses.indexOf(`LICENSES/${license}.txt`), 1);
        if (localLicenses.length === 0) return;
      });
    });

    localLicenses.forEach(license => {
      const niceLicense = license.replace("LICENSES/", "").replace(".txt", "");
      error.addError(
        ["Project MUST NOT include License Files", niceLicense],
        `The Project MUST NOT include License Files (${niceLicense}) under which none of the files in the Project are licensed`
      );
    });

    if (error.errors.length > 0) return error;
  }
}

/**
 * The Project MUST NOT include duplicate SPDX identifiers (...).
 */
class PR03 implements IProjectRequirement {
  id = "PR03";
  description = "The Project MUST NOT include duplicate SPDX identifiers (...).";

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  validate(sbom: reuse.SoftwareBillOfMaterials, _licenses: string[]): RequirementError | void {
    const error = new RequirementError(this, sbom.name);

    const spdxIdentifiers = sbom.files.map(file => file.SPDXID);
    spdxIdentifiers.forEach((value, index, array) => {
      if (array.indexOf(value) !== index) {
        error.addError(
          ["Project MUST NOT include duplicate SPDX identifiers", value],
          `The Project MUST NOT include duplicate SPDX identifiers (${value}).`
        );
      }
    });

    if (error.errors.length > 0) return error;
  }
}

export const fileRequirements: IFileRequirement[] = [new FL01(), new FL02()];
export const projectRequirements: IProjectRequirement[] = [new PR01(), new PR02(), new PR03()];
