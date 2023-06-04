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

Usage: reuse-me [options] [command]

Copyright and License management CLI tool

Options:
  -h, --help       display help for command

Commands:
  check [options]  Checks whether the repository is compliant with the Reuse Specification.
  help [command]   display help for command
```

### Validate your repository

Running the `check` command will perform local validation of your repository.

```sh
$ reuse-me check --help

Usage: reuse-me check [options]

Checks whether the repository is compliant with the Reuse Specification.

Options:
  -a, --all   Check all files in the repository
  -h, --help  display help for command
```

 By default, it will use your `git` status to determine which files to validate, i.e.:

```sh
$ reuse-me check

📄 ReuseMe - REUSE compliance validation
----------------------------------------
❌ docs/cli.md
   Missing (or invalid) SPDX Copyright (SPDX-FileCopyrightText) and License (SPDX-License-Identifier) statements.
✅ lib/action/index.js
✅ lib/cli/index.js
✅ lib/probot/index.js
✅ src/datasources.ts
----------------------------------------
✅ Found no REUSE compliance issues.
```

Additionally, you can use the `--all` flag to validate _all_ files in your repository.

### Generate Software Bill of Materials

You can generate a SPDX 2.3 compliant Software Bill of Materials (SBOM) using the `sbom` command.

```sh
$ reuse-me sbom --help

Usage: reuse-me sbom [options]

Generates a Software Bill of Materials (SBOM) for the repository.

Options:
  -h, --help  display help for command
```

The result is redirected to your stdout.

> **NOTE**:\
This command will generate a SBOM based on the provided information - this also means that it will included files not correctly attributed according to the [Reuse specification].\
\
Please refer to [the validation instructions](#validate-your-repository) for more details.

[Reuse specification]: https://reuse.software/spec/