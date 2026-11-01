<!-- 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
SPDX-License-Identifier: MIT
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
Usage: reuse-me [options] [files...]

Copyright and License management CLI tool

Arguments:
  files                      Files to validate (default: every file git tracks)

Options:
  -s, --sbom-output <file>   Output path for the Software Bill of Materials
                             (SBOM).
  -c, --sarif-output <file>  Output path for the SARIF file.
  -h, --help                 display help for command
```

### Which files are validated

Without arguments, ReuseMe validates every file `git` tracks (`git ls-files`: committed files and staged new files).
Untracked and ignored files are not part of the project, and neither are submodules or files deleted from the working
tree. You can run it from any directory inside the repository; paths are relative to the repository root.

With file arguments, ReuseMe validates only those files, which is what the [pre-commit hook](../README.md#pre-commit-hook)
does with the staged files:

```sh
$ reuse-me src/new-file.ts assets/logo.png
```

When one of the given files is REUSE configuration (`.reuse/dep5`, a `REUSE.toml`, or a file in `LICENSES/`), every
tracked file is validated, since such a change can affect any file. Only a run that validates every tracked file
reports unused License Files ([PR002](./specifications.md#project)).

<img src="./images/cli_example.svg">

### Software Bill of Materials

You can generate a SPDX 2.3 compliant Software Bill of Materials (SBOM) by specifying the `--sbom-output` option;

```sh
$ reuse-me --sbom-output sbom.json
```

The result is redirected to the specified file.

[Reuse specification]: https://reuse.software/spec-3.3/