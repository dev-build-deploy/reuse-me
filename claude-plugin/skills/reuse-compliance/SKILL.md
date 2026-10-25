---
name: reuse-compliance
description: How REUSE (SPDX) licence and copyright coverage works in this repository, and what ReuseMe's CI check looks for. Use when creating files, adding a licence, vendoring third-party code, or when the reuse-me hook denies a Write.
---

<!--
SPDX-FileCopyrightText: 2025 Kevin de Jong <monkaii@hotmail.com>
SPDX-License-Identifier: MIT
-->

# REUSE compliance with ReuseMe

ReuseMe (CI: `dev-build-deploy/reuse-me`) fails a pull request when a file has no copyright or no licence, when `LICENSES/` lacks a licence a file uses (PR001), or holds one nothing uses (PR002). The `reuse-me` plugin hook keeps Claude from causing that: it adds the header to every new file it writes.

## Headers versus annotations

- **Header** (source, scripts, markdown, yaml, html, css...): a comment at the top with two tags, in the file's own comment syntax. After a shebang, an XML declaration, an HTML doctype or markdown front matter; never before them.
- **Annotation** (pictures, fonts, audio, binaries, generated data, JSON): no header. Covered in bulk by `REUSE.toml` (`[[annotations]]`, `path`, `SPDX-FileCopyrightText`, `SPDX-License-Identifier`) or `.reuse/dep5` (`Files:`, `Copyright:`, `License:`), or by a `<file>.license` sidecar holding the two tags as plain text.
- The hook writes the sidecar itself for a comment-less file (e.g. `.json`) that no annotation covers; binaries it leaves alone, so add them to `.reuse/dep5` or `REUSE.toml` in the same change.

## Where the values come from

`.reuse-me.json` in the repository root (first matching rule wins):

```json
{
  "rules": [
    { "paths": ["engine/**"], "holder": "Kevin de Jong <monkaii@hotmail.com>", "year": 2024, "license": "MPL-2.0" },
    { "paths": ["games/**"],  "holder": "Kevin de Jong <monkaii@hotmail.com>", "license": "LicenseRef-Proprietary" }
  ],
  "defaults": { "holder": "Kevin de Jong <monkaii@hotmail.com>" },
  "exclude": ["vendor/**"]
}
```

- `paths`: globs relative to the root (`**` crosses folders, `*` does not; no slash matches at any depth).
- `holder`: a string or list; the year is prefixed unless the holder starts with one. `year` defaults to the current year.
- `defaults`: used when no rule matches. Without a default licence, the only file in `LICENSES/` is used; with none or several the hook denies: `no licence rule for <path>: add one to .reuse-me.json`. Do not guess: add the rule (ask the user which licence when unclear) and write again.
- `exclude`: paths the hook never touches. A repository without `.reuse-me.json`, `REUSE.toml`, `.reuse/dep5` or `LICENSES/` is not enforced at all.

## Adding a new licence

1. Put the full text in `LICENSES/<SPDX-ID>.txt` (SPDX ids from spdx.org/licenses; a custom one must be `LicenseRef-<letters, digits, . or ->` with its own text file, FL003).
2. Add or change the rule in `.reuse-me.json`.
3. Remove licence files nothing uses any more (PR002).

## Third-party files

Keep their own header and licence intact (an existing header is never replaced). Vendored folders without headers go into `.reuse/dep5` or `REUSE.toml` with the upstream copyright and licence, and their licence text into `LICENSES/`. Never relabel third-party code with the repository's licence.

## Existing files and shell writes

The hook only rewrites a `Write` that creates a file. Editing an existing file leaves its header alone. A file created through `Bash` (`cat >`, `tee`) is not seen: add the header yourself, in the same form the hook would.

## Check before pushing

`npx reuse-me` / the `reuse-me` CLI (see docs/cli.md) validates locally what CI will check.
