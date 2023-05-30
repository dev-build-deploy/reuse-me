<!-- 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
-->

# reuse-me

This repository contains multiple solutions to ensure compliance with the REUSE specification, including:

* A CLI tool to validate (local changes) for valid Copyright and License headers
* A GitHub App built with [Probot](https://github.com/probot/probot) that Copyright and License management bot


## Installation instructions

### Command-line Interface
```sh
# Install dependencies
npm install

# Build the application
npm run build

# Add execution permissions to the CLI binary
chmod +x ./lib/entrypoints/cli.js

# Run the CLI tool
./lib/entrypoints/cli.js check
```

### GitHub App

```sh
# Install dependencies
npm install

# Run the bot
npm start
```

## Contributing

If you have suggestions for how reuse-me could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

[GPL-3.0-or-later AND CC0-1.0](LICENSE) © 2023 Kevin de Jong \<monkaii@hotmail.com\>
