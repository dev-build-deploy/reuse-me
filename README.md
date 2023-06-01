<!-- 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
-->

# reuse-me

This repository contains multiple solutions to ensure compliance with the REUSE specification, including:

* A [CLI tool](#command-line-interface) to validate your local repository
* A [GitHub Action](#github-action) to validate your Pull Request/Repository contents

## Configuration
Per the [Reuse specification], you can cover your files with the following approaches:

- Adding a [comment header](#https://reuse.software/spec/#comment-headers) in your files
- Adding a `.license` file next to your (binary) files
Using [DEP5](https://reuse.software/spec/#dep5) allows for specifying copyright and licensing in bulk

_Please refer to the [Reuse specification] for more details._

## Command Line Interface

The CLI tool can be used for local operations around your git repository, incl:

- Validation of locally modified files
- Full validation of your repository

## Example usage

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
❌ Found 1 REUSE compliance issues.
```

_You can find more details in the [dedicated documentation](./docs/cli.md)_

### GitHub Action

The CLI tool can be used for local operations around your gith repository, incl:

- Validation of locally modified files
- Full validation of your repository

## Example usage:

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

This will result in output similar to:
```sh
📄 ReuseMe - REUSE compliance validation
🔎 Scanning Pull Request
📝 Validation results
  ❌ docs/cli.md
    Error: Missing (or invalid) SPDX Copyright (SPDX-FileCopyrightText) and License (SPDX-License-Identifier) statements.
  ✅ lib/action/index.js
  ✅ lib/cli/index.js
  ✅ lib/probot/index.js
  ✅ src/datasources.ts
Error: ❌ Found 2 REUSE compliance issues.
```

In addition, annotations are added to files containing a non-compliance issue.

_You can find more details in the [dedicated documentation](./docs/github-action.md)_

## Contributing

If you have suggestions for how reuse-me could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

[GPL-3.0-or-later AND CC0-1.0](LICENSE) © 2023 Kevin de Jong \<monkaii@hotmail.com\>

[Reuse specification]: https://reuse.software/spec/
