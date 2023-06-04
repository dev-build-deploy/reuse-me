<!-- 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
-->

# ReuseMe

ReuseMe provides [multiple tools](#tooling) for managing software licensing and copyright attributions, including support for:

* Validation of your files against the [Reuse specification]
* Generation of an SPDX 2.3 compatible Software Bill of Materials (SBOM)

## Basic guidelines
### Adding licensing and copyright information to your file
Per the [Reuse specification], you can cover your files with the following approaches:

- Adding a [comment header](#https://reuse.software/spec/#comment-headers) in your files;
<!-- REUSE-IgnoreStart -->
```yaml
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
SPDX-License-Identifier: GPL-3.0-or-later
```
<!-- REUSE-IgnoreEnd -->

- Adding a `.license` file next to your (binary) files
- Using [DEP5](https://reuse.software/spec/#dep5) allows for specifying copyright and licensing in bulk

_Please refer to the [Reuse specification] for more details._

### Use SPDX File Tags to enrich your Software Bill of Materials
To enrichen your SPDX 2.3 SBOM, additional [File Tags](https://spdx.github.io/spdx-spec/v2.3/file-tags/) can be used to add additional information to each file. For example:

<!-- REUSE-IgnoreStart -->
```yaml
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
SPDX-FileType: DOCUMENTATION
SPDX-License-Identifier: GPL-3.0-or-later
SPDX-FileLicenseConcluded: GPL-3.0-or-later
SPDX-FileLicenseComments: This file is original work of the copyright holder, and therefor the license specified in the file is correct.
SPDX-FileComment: This file is part of the public documentation.
SPDX-FileContributor: Kevin de Jong
```
<!-- REUSE-IgnoreEnd -->

## Tooling

There are two main options available:
* A [CLI tool](#command-line-interface) for managing your local (git) repository
* A [GitHub Action](#github-action) to validate your Pull Request/Repository contents

### Command Line Interface

The CLI tool can be used for local operations around your git repository, incl:

- Validation of locally modified files
- Full validation of your repository

#### Example usage

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

The CLI tool can be used for local operations around your git repository, incl:

- Validation of locally modified files
- Full validation of your repository

#### Example usage:

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
Error: ❌ Found 1 REUSE compliance issues.
```

In addition, annotations are added to files containing a non-compliance issue.

_You can find more details in the [dedicated documentation](./docs/github-action.md)_

## Contributing

If you have suggestions for how reuse-me could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

[GPL-3.0-or-later AND CC0-1.0](LICENSE) © 2023 Kevin de Jong \<monkaii@hotmail.com\>

[Reuse specification]: https://reuse.software/spec/
