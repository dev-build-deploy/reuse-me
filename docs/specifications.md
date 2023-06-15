<!-- 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
-->

# Specifications

ReuseMe currently has implemented two sets of validation rules:

## Individual Files

| ID | Description |
| --- | --- |
| FL01 | Each Covered File MUST have Copyright and Licensing Information associated with it |
| FL02 | The SPDX License Identifier (`<LICENSE>`) MUST be LicenseRef-[letters, numbers, `.`, or `-`] as defined by the SPDX Specification |

## Project

| ID | Description |
| --- | --- |
| PR01 | The Project MUST include a License File for every license, but is missing `<LICENSE>` |
| PR02 | The Project MUST NOT include License Files (`<LICENSE>`) for licenses under which none of the files in the Project are licensed. |