// SPDX-FileCopyrightText: 2025 Kevin de Jong <monkaii@hotmail.com>
// SPDX-License-Identifier: MIT

import { expect, test } from 'claude-code/testing'

const ROOT = '/repo'
const CONFIG = JSON.stringify({
  rules: [
    { paths: ['engine/**'], holder: 'Kevin de Jong <monkaii@hotmail.com>', year: 2024, license: 'MPL-2.0' },
    { paths: ['games/**', 'scripts/**', 'docs/**'], holder: 'Kevin de Jong <monkaii@hotmail.com>', year: 2025, license: 'LicenseRef-Proprietary' },
    { paths: ['assets/**', 'fonts/**', 'vendor/**'], holder: 'Kevin de Jong <monkaii@hotmail.com>', year: 2026, license: 'MIT' },
  ],
})
const FILES: Record<string, string> = {
  [`${ROOT}/.reuse-me.json`]: CONFIG,
  [`${ROOT}/.reuse/dep5`]: 'Files: assets/*\nCopyright: 2025 X\nLicense: CC0-1.0\n',
  [`${ROOT}/REUSE.toml`]: '[[annotations]]\npath = ["fonts/**"]\n',
  [`${ROOT}/existing.c`]: 'int old;\n',
}

// Stands for the engine beneath the plugin; `write` runs one Write through it and returns what reached the engine,
// the hook's answer and the files the hook wrote. `extra` adds or replaces repository files for one test.
async function setup($: any, on: any, extra: Record<string, string> = {}) {
  const files: Record<string, string> = { ...FILES, ...extra }
  let seen: any
  const written: Record<string, string> = {}
  on('session.start', (_: any, e: any) => ({ cwd: e.cwd }))
  on('tool.call', (_: any, e: any) => { seen = e; return { result: {} } })
  on('fs.read', (_: any, e: any) => (e.path in files ? { value: files[e.path] } : { error: 'ENOENT' }))
  on('fs.exists', (_: any, e: any) => ({ value: e.path in files }))
  on('fs.list', (_: any, e: any) => ({ value: e.path.endsWith('LICENSES') ? [{ name: 'MPL-2.0.txt', kind: 'file' }] : [] }))
  on('fs.write', (_: any, e: any) => { written[e.path] = e.content ?? e.data ?? e.text; return { value: undefined } })
  on('session.root', () => ({ value: ROOT }))
  await $.session.start({ cwd: ROOT, surface: 'terminal', isInteractive: true })
  return async (file_path: string, content: string) => {
    seen = undefined
    for (const k of Object.keys(written)) delete written[k]
    const r = await $.tool.call({ tool: 'Write', file_path, content })
    return { r, seen, written: { ...written } }
  }
}

test('a C file gets a // header with the engine rule', async ($, on) => {
  const w = await setup($, on)
  const { seen } = await w(`${ROOT}/engine/a.c`, 'int x;\n')
  expect(seen.content).toBe(
    '// SPDX-FileCopyrightText: 2024 Kevin de Jong <monkaii@hotmail.com>\n// SPDX-License-Identifier: MPL-2.0\nint x;\n',
  )
})

test('a shell file keeps its shebang on line 1', async ($, on) => {
  const w = await setup($, on)
  const { seen } = await w(`${ROOT}/scripts/run.sh`, '#!/bin/sh\necho hi\n')
  expect(seen.content.split('\n')[0]).toBe('#!/bin/sh')
  expect(seen.content).toContain('# SPDX-License-Identifier: LicenseRef-Proprietary')
  expect(seen.content.endsWith('echo hi\n')).toBe(true)
})

test('markdown gets the header after its front matter', async ($, on) => {
  const w = await setup($, on)
  const { seen } = await w(`${ROOT}/docs/a.md`, '---\ntitle: A\n---\n# A\n')
  expect(seen.content.startsWith('---\ntitle: A\n---\n\n<!--\nSPDX-FileCopyrightText: 2025')).toBe(true)
  expect(seen.content.endsWith('-->\n\n# A\n')).toBe(true)
})

test('a commentable file under a dep5 path still gets its header, with a warning to drop the stanza', async ($, on) => {
  const w = await setup($, on)
  const { r, seen } = await w(`${ROOT}/assets/q.js`, 'let a\n')
  expect(seen.content).toBe('// SPDX-FileCopyrightText: 2026 Kevin de Jong <monkaii@hotmail.com>\n// SPDX-License-Identifier: MIT\nlet a\n')
  expect(r.deny).toBeUndefined()
  expect(r.context.join('\n')).toContain('assets/q.js now carries its own SPDX header, and .reuse/dep5 also covers it')
  expect(r.context.join('\n')).toContain('two licences in the SBOM')
})

test('a REUSE.toml path gets its header; only a non-closest precedence warns', async ($, on) => {
  const w = await setup($, on, { [`${ROOT}/REUSE.toml`]: '[[annotations]]\npath = ["fonts/**"]\n\n[[annotations]]\npath = "vendor/**"\nprecedence = "override"\n' })
  const a = await w(`${ROOT}/fonts/q.css`, 'a{}\n')
  expect(a.seen.content).toBe('/*\nSPDX-FileCopyrightText: 2026 Kevin de Jong <monkaii@hotmail.com>\nSPDX-License-Identifier: MIT\n*/\na{}\n')
  expect(a.r.context ?? []).toEqual([])
  const b = await w(`${ROOT}/vendor/v.c`, 'int v;\n')
  expect(b.seen.content).toContain('// SPDX-License-Identifier: MIT')
  expect(b.r.context.join('\n')).toContain('REUSE.toml (precedence = "override") also covers it')
})

test('a shebang and front matter stay first under a dep5 path too', async ($, on) => {
  const w = await setup($, on)
  const a = await w(`${ROOT}/assets/run.sh`, '#!/bin/sh\necho hi\n')
  expect(a.seen.content.startsWith('#!/bin/sh\n\n# SPDX-FileCopyrightText: 2026')).toBe(true)
  const b = await w(`${ROOT}/assets/n.md`, '---\ntitle: N\n---\nText\n')
  expect(b.seen.content.startsWith('---\ntitle: N\n---\n\n<!--\nSPDX-FileCopyrightText: 2026')).toBe(true)
  expect(b.seen.content.endsWith('-->\n\nText\n')).toBe(true)
})

test('a covered binary gets nothing: no header, no file written', async ($, on) => {
  const w = await setup($, on)
  const a = await w(`${ROOT}/assets/x.png`, 'PNGDATA')
  expect(a.seen.content).toBe('PNGDATA')
  expect(a.written).toEqual({})
  const b = await w(`${ROOT}/fonts/f.woff2`, 'FONT')
  expect(b.seen.content).toBe('FONT')
  expect(b.written).toEqual({})
})

test('an uncovered binary is denied with the dep5 stanza to add', async ($, on) => {
  const w = await setup($, on)
  const { r, seen, written } = await w(`${ROOT}/games/x.png`, 'PNGDATA')
  expect(seen).toBeUndefined()
  expect(written).toEqual({})
  expect(r.deny).toContain('games/x.png cannot hold a comment header and nothing covers it')
  expect(r.deny).toContain('Files: games/x.png\nCopyright: 2025 Kevin de Jong <monkaii@hotmail.com>\nLicense: LicenseRef-Proprietary\n')
})

test('"dep5": "append" lets the hook add the stanza itself', async ($, on) => {
  const config = JSON.parse(CONFIG)
  const w = await setup($, on, { [`${ROOT}/.reuse-me.json`]: JSON.stringify({ ...config, dep5: 'append' }) })
  const { seen, written } = await w(`${ROOT}/games/data.json`, '{}\n')
  expect(seen.content).toBe('{}\n')
  expect(written[`${ROOT}/.reuse/dep5`]).toBe(
    'Files: assets/*\nCopyright: 2025 X\nLicense: CC0-1.0\n\nFiles: games/data.json\nCopyright: 2025 Kevin de Jong <monkaii@hotmail.com>\nLicense: LicenseRef-Proprietary\n',
  )
})

test('"sidecars": true writes a .license file; an existing sidecar already covers a file', async ($, on) => {
  const config = JSON.parse(CONFIG)
  const w = await setup($, on, {
    [`${ROOT}/.reuse-me.json`]: JSON.stringify({ ...config, sidecars: true }),
    [`${ROOT}/engine/old.json.license`]: 'x',
  })
  const a = await w(`${ROOT}/games/x.png`, 'PNGDATA')
  expect(a.seen.content).toBe('PNGDATA')
  expect(a.written[`${ROOT}/games/x.png.license`]).toBe(
    'SPDX-FileCopyrightText: 2025 Kevin de Jong <monkaii@hotmail.com>\nSPDX-License-Identifier: LicenseRef-Proprietary\n',
  )
  const b = await w(`${ROOT}/engine/old.json`, '{}')
  expect(b.seen.content).toBe('{}')
  expect(b.written).toEqual({})
})

test('a path with no rule is denied, naming the config', async ($, on) => {
  const w = await setup($, on)
  const { r, seen } = await w(`${ROOT}/tools/x.py`, 'print(1)\n')
  expect(seen).toBeUndefined()
  expect(JSON.stringify(r)).toContain('no licence rule for tools/x.py: add one to .reuse-me.json')
})

test('an already headed file and an existing file pass unchanged', async ($, on) => {
  const w = await setup($, on)
  const headed = '// SPDX-FileCopyrightText: 2020 Someone\n// SPDX-License-Identifier: MIT\nint y;\n'
  const a = await w(`${ROOT}/engine/b.c`, headed)
  expect(a.seen.content).toBe(headed)
  const b = await w(`${ROOT}/existing.c`, 'int new;\n')
  expect(b.seen.content).toBe('int new;\n')
})
