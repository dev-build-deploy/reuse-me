// SPDX-FileCopyrightText: 2025 Kevin de Jong <monkaii@hotmail.com>
// SPDX-License-Identifier: MIT

import type { Register } from 'claude-code'

/**
 * Claude Code companion of ReuseMe: a new file written by Claude gets its REUSE header.
 *
 * In-file headers win over annotations: a file with a comment syntax always gets the header, even when
 * `.reuse/dep5` or REUSE.toml covers its path, so its licence stays traceable when the file leaks. Only files
 * that cannot hold a comment (pictures, fonts, JSON, binaries) are left to `.reuse/dep5`.
 *
 * The rules come from `.reuse-me.json` in the repository root (see README, "Claude Code plugin").
 * ReuseMe itself stays the deterministic check in CI; this hook only keeps Claude from writing
 * a file that check would reject.
 */

type Rule = { paths: string[]; holder?: string | string[]; year?: string | number; license?: string }
/** `dep5`: what to do with a new comment-less file no annotation covers (`deny`, the default, or `append`). */
type Config = {
  rules?: Rule[]; defaults?: Omit<Rule, 'paths'>; exclude?: string[]; dep5?: 'deny' | 'append'; sidecars?: boolean
}

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
// Formats that cannot carry a comment (or are binary): REUSE covers them with an annotation.
const NO_COMMENT = new Set([
  'json', 'lock', 'txt', 'csv', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 'bmp', 'pdf', 'wasm', 'ttf', 'otf',
  'woff', 'woff2', 'mp3', 'ogg', 'wav', 'mp4', 'webm', 'zip', 'gz', 'bin', 'dat', 'ipynb', 'map',
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

type TomlAnnotation = { paths: string[]; precedence: string }

/**
 * What REUSE.toml (`[[annotations]]` with `path` and `precedence`) and .reuse/dep5 (`Files:` stanzas) annotate.
 * `precedence` defaults to `closest`, where an in-file header wins over the annotation.
 */
export function annotations(toml: string, dep5: string): { toml: TomlAnnotation[]; dep5: string[] } {
  const t: TomlAnnotation[] = []
  for (const block of toml.split(/^\s*\[\[annotations\]\]\s*$/m).slice(1)) {
    const paths: string[] = []
    const m = block.match(/^\s*path\s*=\s*(\[[^\]]*\]|"[^"]*"|'[^']*')/m)
    if (m) for (const s of m[1].matchAll(/"([^"]*)"|'([^']*)'/g)) paths.push(s[1] ?? s[2])
    const prec = block.match(/^\s*precedence\s*=\s*["']([^"']*)["']/m)
    t.push({ paths, precedence: prec ? prec[1] : 'closest' })
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

/** A `.reuse/dep5` stanza for one path (continuation lines indented, as the Debian format wants). */
export function dep5Stanza(rel: string, holders: string[], license: string): string {
  return `Files: ${rel}\nCopyright: ${holders.join('\n           ')}\nLicense: ${license}\n`
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

const DEP5_FORMAT = 'Format: https://www.debian.org/doc/packaging-manuals/copyright-format/1.0/\n'
const HEADER_PRESENT = /^\s*(?:\S{0,3}\s?)?SPDX-(?:FileCopyrightText|License-Identifier):/m

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

    const ann = annotations(toml, dep5)
    const inDep5 = matches(ann.dep5, rel, true)
    const tomlHit = ann.toml.find(a => matches(a.paths, rel))
    const ext = EXT(rel)
    const style = NO_COMMENT.has(ext) ? undefined : STYLES[ext]

    // No comment syntax: the file is covered by an annotation (or a sidecar), never by a header.
    if (!style) {
      if (inDep5 || tomlHit || (await $.fs.exists(`${e.file_path}.license`))) return next(e)
    }

    const rule = (config.rules ?? []).find(r => matches(r.paths, rel))
    const d = config.defaults ?? {}
    const holder = rule?.holder ?? d.holder
    const soleLicense = licenses.filter(f => f.name.endsWith('.txt'))
    const license = rule?.license ?? d.license ?? (soleLicense.length === 1 ? soleLicense[0].name.replace(/\.txt$/, '') : undefined)
    const alreadyHeaded = !!style && HEADER_PRESENT.test(e.content.slice(0, 2048))
    if ((!holder || !license) && !alreadyHeaded) {
      return { deny: `reuse-me: no licence rule for ${rel}: add one to .reuse-me.json ({"rules":[{"paths":["${rel.includes('/') ? rel.split('/')[0] + '/**' : rel}"],"holder":"Name <email>","license":"<SPDX id>"}]})` }
    }
    const year = String(rule?.year ?? d.year ?? new Date().getFullYear())
    const holders = holder ? (Array.isArray(holder) ? holder : [holder]).map(h => (/^\d{4}/.test(h) ? h : `${year} ${h}`)) : []

    if (!style) {
      const plan = planUncovered({ root, rel, dep5, toml, config, holders, license: license as string })
      if ('deny' in plan) return plan
      await $.fs.write(plan.write, plan.content)
      $.ui.toast(plan.toast)
      return next(e)
    }

    // A comment syntax: the header goes in the file, even when an annotation covers the path too, so the
    // licence travels with the file when it is copied out of the repository.
    const content = alreadyHeaded ? e.content : insertHeader(e.content, ext, buildHeader(style, holders, license as string))
    const doubled = inDep5 ? '.reuse/dep5' : tomlHit && tomlHit.precedence !== 'closest' ? `REUSE.toml (precedence = "${tomlHit.precedence}")` : ''
    const ran = await next({ ...e, content })
    if (!doubled || ran.deny !== undefined) return ran
    const warning = `reuse-me: ${rel} now carries its own SPDX header, and ${doubled} also covers it: ` +
      (inDep5 ? 'REUSE adds both up (two licences in the SBOM). ' : 'the annotation does not yield to the header. ') +
      `Drop this path from ${inDep5 ? '.reuse/dep5' : 'that REUSE.toml annotation'} (narrow its glob) so the header is the one source.`
    $.ui.toast(`reuse-me: ${rel} is also covered by ${inDep5 ? '.reuse/dep5' : 'REUSE.toml'}`)
    return { ...ran, context: [...(ran.context ?? []), warning] }
  }).catch(($, e, next) => (next.called ? next(e) : { deny: 'reuse-me: the licence guard failed; not writing an unlicensed file' }))
}

type Uncovered = { root: string; rel: string; dep5: string; toml: string; config: Config; holders: string[]; license: string }
type Plan = { deny: string } | { write: string; content: string; toast: string }

/**
 * A new file without comment syntax that no annotation covers needs a `.reuse/dep5` stanza. Denied with the stanza
 * to add (the default: some repositories generate dep5, and a hand edit would be lost), appended when
 * `.reuse-me.json` says `"dep5": "append"`, or covered by a `.license` sidecar when it says `"sidecars": true`.
 */
export function planUncovered(u: Uncovered): Plan {
  const stanza = dep5Stanza(u.rel, u.holders, u.license)
  if (u.config.sidecars === true) {
    return { write: `${u.root}/${u.rel}.license`, content: buildHeader({ line: '' }, u.holders, u.license), toast: `reuse-me: wrote ${u.rel}.license` }
  }
  if (u.config.dep5 === 'append' && (u.dep5 || !u.toml)) {
    const base = u.dep5 ? u.dep5.replace(/\n*$/, '\n') : DEP5_FORMAT
    return { write: `${u.root}/.reuse/dep5`, content: `${base}\n${stanza}`, toast: `reuse-me: added ${u.rel} to .reuse/dep5` }
  }
  const where = !u.dep5 && u.toml
    ? `REUSE.toml has no annotation for it: add one ([[annotations]] path = "${u.rel}", SPDX-FileCopyrightText = "${u.holders.join('", "')}", SPDX-License-Identifier = "${u.license}")`
    : `add this stanza to .reuse/dep5 (or set "dep5": "append" in .reuse-me.json to let the hook do it):\n\n${stanza}`
  return { deny: `reuse-me: ${u.rel} cannot hold a comment header and nothing covers it; ${where}` }
}
