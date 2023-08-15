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
| PR003 | The Project **MUST NOT** include duplicate SPDX identifiers (`<ID>`). |
