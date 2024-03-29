<!-- 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
SPDX-License-Identifier: MIT
-->

# ReuseMe - License and Copyright Management

ReuseMe provides a [Pre-commit hook](#pre-commit), [Command Line Interface](#local-development-command-line-interface) and [integration with GitHub Actions](#cicd-validation-github-actions) for managing software licensing and copyright attributions, including support for:

* [Validation](./docs/specifications.md) of your files against the [Reuse specification]
<img src="./docs/images/cli_example.svg">
* Generation of an SPDX 2.3 compatible Software Bill of Materials (SBOM)

  ```json
  {
    "SPDXID": "SPDXRef-DOCUMENT",
    "spdxVersion": "SPDX-2.3",
    "name": "reuse-me",
    "documentNamespace": "http://spdx.org/spdxdocs/spdx-v2.3-HASH",
    "dataLicense": "CC0-1.0",
    "creationInfo": {
      "comment": "Generated by ReuseMe",
      "created": "2023-06-15T12:45:54.800Z",
      "creators": [
        ...
      ]
      ...
    }
    ...
  }
  ```

> ⚠️ **NOTE** ⚠️
> 
> ReuseMe (and its owner) are not part of a law firm and, as such, the owner nor the application provide legal advise.
> Using ReuseME does not constitute legal advice or create an attorney-client relationship.
> 
> ReuseMe is created for the aggregation of Copyright and License information provided by the users in the files stored in their repositories.
> In the end, the users of ReuseMe are responsible for the correctness of the generated Software Bill of Materials, the associated licenses, and attributions.
> For that reason, ReuseMe is provided on an "as-is" basis and makes no warranties regarding any information or licenses provided on or through it, and disclaims liability for damages resulting from using the application.

## Pre-commit hook

You can add ReuseMe as a [pre-commit](https://pre-commit.com) by:

1. [Installing pre-commit](https://pre-commit.com/#install)
2. Including ReuseMe in your `.pre-commit.config.yaml` file, e.g.:

```yaml
repos:
- repo: https://github.com/dev-build-deploy/reuse-me
  rev: v0.8.0
  hooks:
  - id: reuse-me
```
3. Installing the hooks
```
$ pre-commit install
```

## CICD validation (GitHub Actions)

The basic workflow can be set up as such:

```yaml
name: Copyright & Licenses
on:
  pull_request:

jobs:
  reuse-me:
    name: REUSE compliance
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: dev-build-deploy/reuse-me@v0
```

_You can find more details in the [dedicated documentation](./docs/github-action.md)_

## Local Development (Command Line Interface)

Performing local validation is as simple as running the `reuse-me` CLI tool;

```sh
$ reuse-me
```

_You can find more details in the [dedicated documentation](./docs/cli.md)_

## Help?

For more support, please refer to our [Basic guidelines](./docs/guidelines.md) or the excellent [REUSE FAQ](https://reuse.software/faq/)

## Contributing

If you have suggestions for how reuse-me could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

[MIT](./LICENSES/MIT.txt) © 2023 Kevin de Jong \<monkaii@hotmail.com\>

[Reuse specification]: https://reuse.software/spec/
