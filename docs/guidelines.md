<!-- 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
-->

# Basic guidelines

## Adding licensing and copyright information to your file
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

ReuseMe attempts to limit the number of false positive hits by;
- Only scanning the first 1024 characters of your files
- Ensure that `SPDX-` tags are the first words on a line

In case you do run into a false-positive match, you can use the `REUSE-IgnoreStart` and `REUSE-IgnoreEnd` tags to ignore snippets.

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

[Reuse specification]: https://reuse.software/spec/