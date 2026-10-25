// SPDX-FileCopyrightText: 2025 Kevin de Jong <monkaii@hotmail.com>
// SPDX-License-Identifier: MIT

import type { Register } from 'claude-code'

/**
 * Claude Code companion of ReuseMe: a new file written by Claude gets its REUSE header.
 *
 * The rules come from `.reuse-me.json` in the repository root (see README, "Claude Code plugin").
 * ReuseMe itself stays the deterministic check in CI; this hook only keeps Claude from writing
 * a file that check would reject.
 */

type Rule = { paths: string[]; holder?: string | string[]; year?: string | number; license?: string }
type Config = { rules?: Rule[]; defaults?: Omit<Rule, 'paths'>; exclude?: string[] }

type Style = { line?: string; block?: [string, string] }
const HASH: Style = { line: '# ' }
const SLASH: Style = { line: '// ' }
const STYLES: Record<string, Style> = {
  sh: HASH, bash: HASH, zsh: HASH, py: HASH, rb: HASH, pl: HASH, yml: HASH, yaml: HASH, toml: HASH,
  mk: HASH, cmake: HASH, dockerfile: HASH, gitignore: HASH, gitattributes: HASH, ini: HASH, cfg: HASH,
  conf: HASH, r: HASH, ps1: HASH, nix: HASH, tf: HASH, properties: HASH,
  c: SLASH, h: SLASH, cc: SLASH, cpp: SLASH, hpp: SLASH, cs: SLASH, java: SLASH, kt: SLASH, go: SLASH,
  rs: SLASH, swift: SLASH, js: SLASH, mjs: SLASH, cjs: SLASH, jsx: SLASH, ts: SLASH, mts: SLASH,
  tsx: SLASH, php: SLASH, scala: SLASH, dart: SLASH, zig: SLASH, wgsl: SLASH, glsl: SLASH, proto: SLASH,
  sql: { line: '-- ' }, lua: { line: '-- ' }, hs: { line: '-- ' },
  tex: { line: '% ' }, vim: { line: '" ' }, el: { line: ';; ' }, lisp: { line: ';; ' },
  css: { block: ['/*', '*/'] }, scss: { block: ['/*', '*/'] },
  html: { block: ['<!--', '-->'] }, htm: { block: ['<!--', '-->'] }, xml: { block: ['<!--', '-->'] },
  svg: { block: ['<!--', '-->'] }, md: { block: ['<!--', '-->'] }, mdx: { block: ['<!--', '-->'] },
  vue: { block: ['<!--', '-->'] },
}
const BASENAMES: Record<string, string> = {
  Makefile: 'mk', Dockerfile: 'dockerfile', CMakeLists: 'cmake', Brewfile: 'sh', Gemfile: 'rb',
}
// Formats that cannot carry a comment (or are binary): REUSE covers them with an annotation or a `.license` file.
const NO_COMMENT = new Set([
  'json', 'lock', 'txt', 'csv', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 'bmp', 'pdf', 'wasm', 'ttf', 'otf',
  'woff', 'woff2', 'mp3', 'ogg', 'wav', 'mp4', 'webm', 'zip', 'gz', 'bin', 'dat', 'ipynb', 'map',
])
const BINARY = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 'bmp', 'pdf', 'wasm', 'ttf', 'otf', 'woff', 'woff2', 'mp3', 'ogg',
  'wav', 'mp4', 'webm', 'zip', 'gz', 'bin', 'dat',
])

const ALWAYS_COVERED = [/^LICENSES\//, /^\.reuse\//, /\.license$/, /(^|\/)REUSE\.toml$/, /^\.git\//]

/** Glob to regex: `**` crosses folders, `*` does not (`dep5` mode: it does); no slash means any depth. */
export function globToRegExp(glob: string, crossing = false): RegExp {
  let g = glob.replace(/^\.?\//, '')
  const anyDepth = !g.includes('/')
  const dirOnly = g.endsWith('/')
  if (dirOnly) g += '**'
  let out = ''
  for (let i = 0; i < g.length; i++) {
    const c = g[i]
    if (c === '*' && g[i + 1] === '*') {
      i++
      if (g[i + 1] === '/') { i++; out += '(?:.*/)?' } else out += '.*'
    } else if (c === '*') out += crossing ? '.*' : '[^/]*'
    else if (c === '?') out += '[^/]'
    else out += c.replace(/[.+^${}()|[\]\\]/g, '\\$&')
  }
  return new RegExp((anyDepth ? '(?:^|.*/)' : '^') + out + '$')
}

export const matches = (globs: string[], rel: string, crossing = false) => globs.some(g => globToRegExp(g, crossing).test(rel))

/** Paths REUSE.toml (`path = "..."`/`path = [...]`) or .reuse/dep5 (`Files:` stanzas) annotate. */
export function annotatedGlobs(toml: string, dep5: string): { toml: string[]; dep5: string[] } {
  const t: string[] = []
  for (const m of toml.matchAll(/^\s*path\s*=\s*(\[[^\]]*\]|"[^"]*"|'[^']*')/gm)) {
    for (const s of m[1].matchAll(/"([^"]*)"|'([^']*)'/g)) t.push(s[1] ?? s[2])
  }
  const d: string[] = []
  const lines = dep5.split('\n')
  for (let i = 0; i < lines.length; i++) {
    if (!/^Files:/i.test(lines[i])) continue
    let text = lines[i].replace(/^Files:/i, '')
    while (/^[ \t]/.test(lines[i + 1] ?? '')) text += ' ' + lines[++i]
    d.push(...text.split(/\s+/).filter(Boolean))
  }
  return { toml: t, dep5: d }
}

export function buildHeader(style: Style, holders: string[], license: string): string {
  // Built from parts so this source never carries a line that starts with an SPDX tag.
  const tag = 'SPDX-'
  const lines = [...holders.map(h => `${tag}FileCopyrightText: ${h}`), `${tag}License-Identifier: ${license}`]
  if (style.block) return `${style.block[0]}\n${lines.join('\n')}\n${style.block[1]}\n`
  return lines.map(l => (style.line as string) + l).join('\n') + '\n'
}

/** Inserts the header where REUSE allows it: after a shebang, XML declaration, doctype or front matter. */
export function insertHeader(content: string, ext: string, header: string): string {
  const eol = content.includes('\r\n') ? '\r\n' : '\n'
  const h = eol === '\n' ? header : header.replace(/\n/g, eol)
  const lines = content.split(/\r?\n/)
  let n = 0
  if (lines[0]?.startsWith('#!')) n = 1
  else if (/^<\?xml/.test(lines[0] ?? '')) n = 1
  else if ((ext === 'md' || ext === 'mdx') && lines[0]?.trim() === '---') {
    const close = lines.findIndex((l, i) => i > 0 && l.trim() === '---')
    if (close > 0) n = close + 1
  }
  if ((ext === 'html' || ext === 'htm') && /^\s*<!doctype/i.test(lines[n] ?? '')) n++
  const head = lines.slice(0, n)
  const rest = lines.slice(n).join(eol)
  const sep = n > 0 || ext === 'md' || ext === 'mdx' || ext === 'html' ? eol : ''
  return (head.length ? head.join(eol) + eol + (n > 0 ? eol : '') : '') + h + (rest ? sep + rest : '')
}

const EXT = (p: string) => {
  const base = p.split('/').pop() as string
  if (BASENAMES[base]) return BASENAMES[base]
  const i = base.lastIndexOf('.')
  return (i < 0 ? '' : base.slice(i + 1)).toLowerCase() || (base.startsWith('.') ? base.slice(1).toLowerCase() : '')
}

export const register: Register = on => {
  on('tool.call', { tool: 'Write' }, async ($, e, next) => {
    const root = (await $.session.root()).replace(/\/$/, '')
    if (!e.file_path.startsWith(root + '/')) return next(e)
    const rel = e.file_path.slice(root.length + 1)
    if (ALWAYS_COVERED.some(r => r.test(rel))) return next(e)
    // An existing file being edited is left as it is.
    if (await $.fs.exists(e.file_path)) return next(e)

    const read = (p: string) => $.fs.read(`${root}/${p}`).catch(() => '')
    const [json, toml, dep5, licenses] = await Promise.all([
      read('.reuse-me.json'), read('REUSE.toml'), read('.reuse/dep5'),
      $.fs.list(`${root}/LICENSES`).catch(() => []),
    ])
    // Not a REUSE repository: nothing to enforce.
    if (!json && !toml && !dep5 && licenses.length === 0) return next(e)

    let config: Config = {}
    if (json) {
      try { config = JSON.parse(json) } catch (err) {
        return { deny: `reuse-me: .reuse-me.json is not valid JSON (${(err as Error).message})` }
      }
    }
    if (matches(config.exclude ?? [], rel)) return next(e)

    const ann = annotatedGlobs(toml, dep5)
    const ext = EXT(rel)
    // Covered by annotation (REUSE.toml, .reuse/dep5) or binary: no header.
    if (matches(ann.toml, rel) || matches(ann.dep5, rel, true)) return next(e)
    if (BINARY.has(ext)) return next(e)

    const rule = (config.rules ?? []).find(r => matches(r.paths, rel))
    const d = config.defaults ?? {}
    const holder = rule?.holder ?? d.holder
    const soleLicense = licenses.filter(f => f.name.endsWith('.txt'))
    const license = rule?.license ?? d.license ?? (soleLicense.length === 1 ? soleLicense[0].name.replace(/\.txt$/, '') : undefined)
    if (!holder || !license) {
      return { deny: `reuse-me: no licence rule for ${rel}: add one to .reuse-me.json ({"rules":[{"paths":["${rel.includes('/') ? rel.split('/')[0] + '/**' : rel}"],"holder":"Name <email>","license":"<SPDX id>"}]})` }
    }
    const year = String(rule?.year ?? d.year ?? new Date().getFullYear())
    const holders = (Array.isArray(holder) ? holder : [holder]).map(h => (/^\d{4}/.test(h) ? h : `${year} ${h}`))

    // A header already there: pass.
    if (/^\s*(?:\S{0,3}\s?)?SPDX-(?:FileCopyrightText|License-Identifier):/m.test(e.content.slice(0, 2048))) return next(e)

    const style = STYLES[ext]
    if (!style || NO_COMMENT.has(ext)) {
      // No comment syntax: a `.license` file next to it covers it.
      await $.fs.write(`${e.file_path}.license`, buildHeader({ line: '' }, holders, license))
      $.ui.toast(`reuse-me: wrote ${rel}.license`)
      return next(e)
    }
    return next({ ...e, content: insertHeader(e.content, ext, buildHeader(style, holders, license)) })
  }).catch(($, e, next) => (next.called ? next(e) : { deny: 'reuse-me: the licence guard failed; not writing an unlicensed file' }))
}
