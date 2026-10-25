// SPDX-FileCopyrightText: 2025 Kevin de Jong <monkaii@hotmail.com>
// SPDX-License-Identifier: MIT

import { expect, test } from 'claude-code/testing'

const ROOT = '/repo'
const CONFIG = JSON.stringify({
  rules: [
    { paths: ['engine/**'], holder: 'Kevin de Jong <monkaii@hotmail.com>', year: 2024, license: 'MPL-2.0' },
    { paths: ['games/**', 'scripts/**', 'docs/**'], holder: 'Kevin de Jong <monkaii@hotmail.com>', year: 2025, license: 'LicenseRef-Proprietary' },
  ],
})
const FILES: Record<string, string> = {
  [`${ROOT}/.reuse-me.json`]: CONFIG,
  [`${ROOT}/.reuse/dep5`]: 'Files: assets/*\nCopyright: 2025 X\nLicense: CC0-1.0\n',
  [`${ROOT}/REUSE.toml`]: '[[annotations]]\npath = ["fonts/**"]\n',
  [`${ROOT}/existing.c`]: 'int old;\n',
}

// Stands for the engine beneath the plugin; `write` runs one Write through it and returns what reached the engine.
async function setup($: any, on: any) {
  let seen: any
  on('session.start', (_: any, e: any) => ({ cwd: e.cwd }))
  on('tool.call', (_: any, e: any) => { seen = e; return { result: {} } })
  on('fs.read', (_: any, e: any) => (e.path in FILES ? { value: FILES[e.path] } : { error: 'ENOENT' }))
  on('fs.exists', (_: any, e: any) => ({ value: e.path in FILES }))
  on('fs.list', (_: any, e: any) => ({ value: e.path.endsWith('LICENSES') ? [{ name: 'MPL-2.0.txt', kind: 'file' }] : [] }))
  on('fs.write', () => ({ value: undefined }))
  on('session.root', () => ({ value: ROOT }))
  await $.session.start({ cwd: ROOT, surface: 'terminal', isInteractive: true })
  return async (file_path: string, content: string) => {
    seen = undefined
    const r = await $.tool.call({ tool: 'Write', file_path, content })
    return { r, seen }
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

test('a png and an annotated path get no header', async ($, on) => {
  const w = await setup($, on)
  const a = await w(`${ROOT}/games/x.png`, 'PNGDATA')
  expect(a.seen.content).toBe('PNGDATA')
  const b = await w(`${ROOT}/assets/q.js`, 'let a\n')
  expect(b.seen.content).toBe('let a\n')
  const c = await w(`${ROOT}/fonts/q.css`, 'a{}\n')
  expect(c.seen.content).toBe('a{}\n')
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
