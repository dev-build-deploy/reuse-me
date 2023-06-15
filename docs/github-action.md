<!-- 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
-->

# GitHub Action

You can scan your [full repository](#repository-scanning) and [pull requests](#pull-request-scanning) for determining compliance with the [Reuse specification]. Running this GitHub Action will result in output similar to:

<img src="./images/cli_example.svg">

## Workflows

### Repository Scanning

You can enable a full repository scan, regardless of which files are modified in the current context. This can be particularly useful in case you want to ensure full compliance with the [Reuse specification].

#### Workflow

```yaml
name: Copyright & Licenses
on:
  push:

jobs:
  reuse-me:
    name: REUSE compliance
    runs-on: ubuntu-latest
    steps:
      # We need to check-out the branch in order to access files
      - uses: actions/checkout@v3

      # Run the action to validate the contents
      - uses: dev-build-deploy/reuse-me@v0
```

### Pull Request Scanning

You can limit the validation to files affected within your current Pull Request. This could be useful for legacy projects in which you want to gradually introduce the [Reuse specification].

In addition, this can have a (positive) impact on large repositories with a rich history.

#### Workflow

```yaml
name: Copyright & Licenses
on:
  pull_request:

permissions:
  contents: read
  pull-requests: read

jobs:
  reuse-me:
    name: REUSE compliance
    runs-on: ubuntu-latest
    steps:
      - uses: dev-build-deploy/reuse-me@v0
        with:
          token: ${{ github.token }}
```

### Inputs

| Name | Required | Description |
| --- | --- | --- |
| `token` | *NO* | GitHub token only used for [pull request scanning](#pull-request-scanning) and can be ommitted during a [full repository scan](#repository-scanning). Please refer to [permissions](#permissions) for more details on the permissions required for the provided GitHub token. |

### Permissions

The following permissions are only required in case you are performing a [pull request scan](#pull-request-scanning).

| Name | Value | Comment |
| --- | --- | --- |
| `contents` | `read` | The GitHub Action will read contents from your repository in order to check for valid REUSE headers in your modified files |
| `pull-requests` | `read` | In order to limit scans to modified files ONLY, the GitHub Action needs to have read access to your PR data |

[Reuse specification]: https://reuse.software/spec/