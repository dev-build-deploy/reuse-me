/*
 * SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
 * SPDX-License-Identifier: MIT
 */

import * as fs from "fs";
import * as path from "path";

import * as reuse from "@dev-build-deploy/reuse-it";
import * as sarif from "@dev-build-deploy/sarif-it";

import * as tool from "./config/tool.json";
import * as spdx from "./spdx";
import { formatMessage, highlightMessage } from "./utils";

/**
 * Validates whether the provided file contains a SPDX Copyright header
 */
function* missingCopyrightInformation(rule: sarif.Rule, spdxFile: reuse.SpdxFile): Generator<sarif.Result> {
  if (spdx.hasValidCopyrightText(spdxFile) === false) {
    yield new sarif.Result(highlightMessage(rule.properties().shortDescription?.text ?? "", "Copyright Information"), {
      level: "error",
      ruleId: "MissingCopyrightInformation",
    }).addLocation({
      physicalLocation: {
        artifactLocation: {
          uri: spdxFile.fileName,
        },
      },
    });
  }
}

/**
 * Validates wheter the provided file contains a SPDX license header
 */
function* missingLicenseInformation(rule: sarif.Rule, spdxFile: reuse.SpdxFile): Generator<sarif.Result> {
  if (spdx.hasValidLicense(spdxFile) === false) {
    yield new sarif.Result(highlightMessage(rule.properties().shortDescription?.text ?? "", "License Information"), {
      level: "error",
      ruleId: "MissingLicenseInformation",
    }).addLocation({
      physicalLocation: {
        artifactLocation: {
          uri: spdxFile.fileName,
        },
      },
    });
  }
}

/**
 * Validates whether the provided SPDX (custom) license identifier is comform specifications.
 */
function* incorrectLicenseFormat(rule: sarif.Rule, spdxFile: reuse.SpdxFile): Generator<sarif.Result> {
  const results: sarif.Result[] = [];

  spdxFile.licenseInfoInFiles
    .filter(license => license.startsWith("LicenseRef-"))
    .filter(license => /^LicenseRef-[A-Za-z0-9\-.]+$/.test(license) === false)
    .forEach(license => {
      results.push(
        new sarif.Result(
          highlightMessage(
            formatMessage(rule.properties().shortDescription?.text ?? "", license),
            license,
            'LicenseRef-[letters, numbers, ".", or "-"]'
          ),
          {
            level: "error",
            ruleId: "IncorrectLicenseFormat",
          }
        ).addLocation({
          physicalLocation: {
            artifactLocation: {
              uri: spdxFile.fileName,
            },
          },
        })
      );
    });

  for (const result of results) {
    yield result;
  }
}

/**
 * Validates whether all used SPDX licenses are represented in the LICENSES folder.
 */
function* MissingLicenseFile(rule: sarif.Rule, sbom: reuse.SoftwareBillOfMaterials): Generator<sarif.Result> {
  const results: sarif.Result[] = [];

  const allLicenses = [...new Set(sbom.files.flatMap(file => spdx.getLicenseFileIdentifiers(file)))];
  const missingLicenses = allLicenses.filter(license => fs.existsSync(`./LICENSES/${license}.txt`) === false);

  missingLicenses.forEach(license => {
    results.push(
      new sarif.Result(
        highlightMessage(
          formatMessage(rule.properties().shortDescription?.text ?? "", license),
          "License File",
          license
        ),
        {
          level: "error",
          ruleId: "MissingLicense",
        }
      ).addLocation({
        physicalLocation: {
          artifactLocation: {
            uri: sbom.name,
          },
        },
      })
    );
  });

  for (const result of results) {
    yield result;
  }
}

/** The directory holding the License Files, relative to the repository root */
const LICENSES_DIRECTORY = "LICENSES";

/**
 * Validates that every License File in the LICENSES folder is used by at least one file. Only meaningful when the SBOM
 * holds every file of the project (see projectRequirements).
 */
function* UnusedLicenseFile(rule: sarif.Rule, sbom: reuse.SoftwareBillOfMaterials): Generator<sarif.Result> {
  if (!fs.existsSync(LICENSES_DIRECTORY)) return;

  const usedIdentifiers = new Set(sbom.files.flatMap(file => spdx.getLicenseFileIdentifiers(file)));
  const licenseFiles = fs
    .readdirSync(LICENSES_DIRECTORY)
    .filter(entry => !entry.endsWith(".license"))
    .filter(entry => fs.statSync(path.join(LICENSES_DIRECTORY, entry)).isFile())
    .sort();

  for (const licenseFile of licenseFiles) {
    const identifier = path.parse(licenseFile).name;
    if (usedIdentifiers.has(identifier)) continue;

    yield new sarif.Result(
      highlightMessage(
        formatMessage(rule.properties().shortDescription?.text ?? "", identifier),
        "License Files",
        identifier
      ),
      {
        level: "error",
        ruleId: "UnusedLicenseFile",
      }
    ).addLocation({
      physicalLocation: {
        artifactLocation: {
          uri: `${LICENSES_DIRECTORY}/${licenseFile}`,
        },
      },
    });
  }
}

/**
 * Returns a list of rules and their corresponding validation function based on the provided mapping.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getRulesFromMapping<T>(mapping: T): { rule: sarif.Rule; validate: any }[] {
  const rules: {
    rule: sarif.Rule;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    validate: any;
  }[] = [];

  if (!mapping || mapping.constructor !== Object) {
    return rules;
  }

  for (const rule of tool.driver.rules) {
    if (Object.keys(mapping).includes(rule.name)) {
      rules.push({
        rule: new sarif.Rule(rule.name, rule),
        validate: mapping[rule.name as keyof T],
      });
    }
  }

  return rules;
}

type ProjectFunction = (rule: sarif.Rule, sbom: reuse.SoftwareBillOfMaterials) => Generator<sarif.Result>;
type ProjectRequirementMap = { [key: string]: ProjectFunction };
type FileFunction = (rule: sarif.Rule, spdxFile: reuse.SpdxFile) => Generator<sarif.Result>;
type FileRequirementMap = { [key: string]: FileFunction };
/**
 * The requirements on the project as a whole.
 * @param options.complete Whether the SBOM holds every file of the project. Rules that need the whole project (an
 *                         unused License File can only be told apart from one used by a file outside a partial run)
 *                         only apply when it does.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function projectRequirements(options: { complete: boolean }): { rule: sarif.Rule; validate: any }[] {
  const ruleMap: ProjectRequirementMap = {
    MissingLicenseFile: MissingLicenseFile,
    ...(options.complete ? { UnusedLicenseFile: UnusedLicenseFile } : {}),
  };

  return getRulesFromMapping<ProjectRequirementMap>(ruleMap);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fileRequirements(): { rule: sarif.Rule; validate: any }[] {
  const ruleMap: FileRequirementMap = {
    MissingCopyrightInformation: missingCopyrightInformation,
    MissingLicenseInformation: missingLicenseInformation,
    IncorrectLicenseFormat: incorrectLicenseFormat,
  };

  return getRulesFromMapping<FileRequirementMap>(ruleMap);
}
