<!-- 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
-->

# Command Line Interface

## Installation instructions

A pre-compiled version of the CLI is already provided as part of this repository. One can therefore:

```sh
# Clone the repository
$ git clone https://github.com/dev-build-deploy/reuse-me.git

# Go the local copy of the repository
$ cd reuse-me

# Run the CLI tool
$ ./lib/cli/index.js
```

> **NOTE**: Creation of an installable package is part of the roadmap!

## Usage instructions

### Basic Usage

You can find more information about the possible commands with the `--help` flag, i.e.:

```sh
$ ./lib/cli/index.js --help

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
Usage: reuse-me check [options]

Checks whether the repository is compliant with the Reuse Specification.

Options:
  -a, --all   Check all files in the repository
  -h, --help  display help for command
```

 By default, it will use your `git` status to determine which files to validate, i.e.:

```sh
$ ./lib/cli/index.js check

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
