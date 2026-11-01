<!-- 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
SPDX-License-Identifier: MIT
-->

# Basic guidelines

## Adding licensing and copyright information to your file
Per the [Reuse specification], you can cover your files with the following approaches:

- Adding a [comment header](https://reuse.software/spec-3.3/#comment-headers) in your files;
<!-- REUSE-IgnoreStart -->
```yaml
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
SPDX-License-Identifier: GPL-3.0-or-later
```
<!-- REUSE-IgnoreEnd -->

- Adding a `.license` file next to your (binary) files; it takes precedence over the file's own comment header
- Using a [REUSE.toml](https://reuse.software/spec-3.3/#reusetoml) file to cover many files at once
- Using [DEP5](https://reuse.software/spec-3.3/#dep5-deprecated) (`.reuse/dep5`, deprecated in favour of `REUSE.toml`)

_Please refer to the [Reuse specification] for more details._

## How the sources are combined

ReuseMe follows the order of precedence of the [Reuse specification] (3.3):

| Source | How it combines with the file's own information |
| --- | --- |
| `.license` file | Replaces the file's comment header (the header is then ignored) |
| `REUSE.toml`, `precedence = "closest"` (default) | Only fills in what the file lacks, separately for copyright and licence, from the closest `REUSE.toml` that covers the file |
| `REUSE.toml`, `precedence = "aggregate"` | Always added to the file's information |
| `REUSE.toml`, `precedence = "override"` | Replaces all information closer to the file; the override table closest to the repository root wins |
| `.reuse/dep5` `Files` paragraph | Aggregated: all copyright notices and both licences apply |

- Within one `REUSE.toml` or `.reuse/dep5`, the **last** matching table or `Files` paragraph wins (as the Debian
  copyright format says). Put general patterns (`Files: *`) first and specific ones after them.
- The header paragraph of `.reuse/dep5` describes the project as a whole; it does not license files.
- A dep5 `Comment` and a `REUSE.toml` `SPDX-FileComment` end up in the file's SPDX comment in the SBOM.
- `REUSE.toml` and `.reuse/dep5` are mutually exclusive in the specification; use one of them.

## Use SPDX File Tags to enrich your Software Bill of Materials
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

## Ignoring false positive matches

In case you run into a false-positive match, you can use the `REUSE-IgnoreStart` and `REUSE-IgnoreEnd` tags to ignore snippets.

```typescript
function foo(bar: string) {
  // REUSE-IgnoreStart
  if (bar.includes(
    "Copyright is important"
  )) {
    console.log("Ru-roh")
  }
  // REUSE-IgnoreEnd
}
```

[Reuse specification]: https://reuse.software/spec-3.3/