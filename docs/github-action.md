<!-- 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
SPDX-License-Identifier: MIT
-->

# GitHub Action

You can scan your [full repository](#repository-scanning) for determining compliance with the [Reuse specification].

Running this GitHub Action will result in output similar to:

<img src="./images/cli_example.svg">

## Workflows

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

The SPDX 2.3 Software Bill of Materials will be uploaded as build artifact in case your repository is compliant with the [Reuse specification]

[Reuse specification]: https://reuse.software/spec/