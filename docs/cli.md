<!-- 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
-->

# Command Line Interface

## Installation instructions

A pre-compiled version of the CLI is already provided as part of this repository. One can therefore:

```sh
# Install the CLI tool
$ npm install -g https://github.com/dev-build-deploy/reuse-me

# Run the CLI tool
$ reuse-me
```

> **NOTE**: Creation of an installable package is part of the roadmap!

## Usage instructions

### Basic Usage

You can find more information about the possible commands with the `--help` flag, i.e.:



```sh
$ reuse-me --help

Usage: reuse-me [options]

Copyright and License management CLI tool

Options:
  -s, --sbom-output <file>  output path for the Software Bill of Materials (SBOM)
  -h, --help                display help for command

```

By default, ReuseMe will use information from `git` to exclude ignored files.

<img src="./images/cli_example.svg">

### Software Bill of Materials

You can generate a SPDX 2.3 compliant Software Bill of Materials (SBOM) by specifying the `--sbom-output` option;

```sh
$ reuse-me --sbom-output sbom.json
```

The result is redirected to the specified file.

[Reuse specification]: https://reuse.software/spec/