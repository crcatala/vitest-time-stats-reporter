import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
const exports = Object.values(packageJson.exports)
  .map(entry => entry.import)
  .filter(target => typeof target === 'string')

if (exports.length === 0) throw new Error('package.json has no import export targets')

for (const target of exports) {
  const path = target.slice(2)
  if (!existsSync(path)) throw new Error(`Export target is missing from the build: ${target}`)
}

for (const target of exports) {
  execFileSync(process.execPath, ['--input-type=module', '--eval', `await import(${JSON.stringify(target)})`], {
    stdio: 'inherit',
  })
}

const packed = JSON.parse(execFileSync('npm', ['pack', '--json', '--ignore-scripts'], { encoding: 'utf8' }))
const tarball = packed[0]?.filename
if (!tarball) throw new Error('npm pack did not produce a tarball')

const tempDir = mkdtempSync(join(tmpdir(), 'package-check-'))
try {
  const contents = execFileSync('tar', ['-tzf', tarball], { encoding: 'utf8' })
  for (const target of exports) {
    const path = target.slice(2)
    if (!contents.includes(`package/${path}\n`)) {
      throw new Error(`Packed artifact is missing export target: ${target}`)
    }
  }

  execFileSync('tar', ['-xzf', tarball, '-C', tempDir])
  for (const target of exports) {
    const packedTarget = pathToFileURL(join(tempDir, 'package', target.slice(2))).href
    execFileSync(process.execPath, ['--input-type=module', '--eval', `await import(${JSON.stringify(packedTarget)})`], {
      stdio: 'inherit',
    })
  }
} finally {
  rmSync(tarball, { force: true })
  rmSync(tempDir, { recursive: true, force: true })
}
