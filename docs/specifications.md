<!-- 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
SPDX-License-Identifier: MIT
-->

# Specifications

ReuseMe currently has implemented two sets of [validation rules](../src/config/tool.json):

## Individual Files

| ID | Description |
| --- | --- |
| FL001 | Each Covered File **MUST** have **[Copright Information](https://reuse.software/faq/#what-is-copyright)** associated with it. |
| FL002 | Each Covered File **MUST** have **[Licensing Information](https://reuse.software/faq/#what-is-license)** associated with it. |
| FL003 | The SPDX License Identifier (`<ID>`) **MUST** be `LicenseRef-`[`letters`, `numbers`, `.`, or `-`] as defined by the [SPDX Specification](https://spdx.github.io/spdx-spec/v2.3/) |

## Project

| ID | Description |
| --- | --- |
| PR001 | The Project **MUST** include a License File for every license, but is missing `<LICENSE>`. |
| PR002 | The Project **MUST NOT** include License Files (`<LICENSE>`) for licenses under which none of the files in the Project are licensed. |

PR001 and PR002 read every identifier of a license expression: `(Apache-2.0 WITH LLVM-exception) OR MIT` needs
`LICENSES/Apache-2.0.txt`, `LICENSES/LLVM-exception.txt` and `LICENSES/MIT.txt`, and uses all three.

PR002 is only checked when the whole project is validated (the GitHub Action, the CLI without file arguments, or a
pre-commit run that includes REUSE configuration such as a file in `LICENSES/`): when only some files are validated,
a license used by one of the other files would look unused.
