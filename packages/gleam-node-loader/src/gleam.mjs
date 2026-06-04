import * as mod from 'node:module'
import * as childProcess from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

/** @type {mod.ResolveHook} */
export function resolve(specifier, context, nextResolve) {
  if (!specifier.startsWith('gleam:')) return nextResolve(specifier, context)
  const root = findProjectRoot(context.parentURL)
  if (!root) {
    throw new Error(
      '[gleam-import] Could not find Gleam project root (gleam.toml + package.json)',
    )
  }
  const buildDir = path.resolve(root, 'build/dev/javascript')
  if (!fs.existsSync(buildDir)) buildGleam(root)
  const modulePath = specifier.slice(6)
  if (modulePath === 'prelude') {
    const url = `file://${path.resolve(buildDir, 'prelude.mjs')}`
    return { shortCircuit: true, url }
  }
  const fileName = `${modulePath}.mjs`
  let resolved = findCompiledModule(buildDir, fileName)
  if (resolved) return { shortCircuit: true, url: `file://${resolved}` }
  const gleamSource = isExistingModule(root, modulePath)
  if (!gleamSource) {
    const msg = `[gleam-import] Could not find Gleam source for '${modulePath}'`
    throw new Error(msg)
  }
  buildGleam(root)
  resolved = findCompiledModule(buildDir, fileName)
  if (resolved) return { shortCircuit: true, url: `file://${resolved}` }
  throw new Error(`[gleam-import] Could not resolve '${specifier}'`)
}

/** @param {string | undefined} parentURL
 * @returns {string | null} */
function findProjectRoot(parentURL) {
  if (!parentURL) return null
  let dir = path.dirname(fileURLToPath(parentURL))
  while (dir !== path.dirname(dir)) {
    const hasGleamToml = fs.existsSync(path.join(dir, 'gleam.toml'))
    const hasPackageJson = fs.existsSync(path.join(dir, 'package.json'))
    if (hasGleamToml && hasPackageJson) return dir
    dir = path.dirname(dir)
  }
  return null
}

/** @param {string} buildDir
 * @param {string} fileName
 * @returns {string | null} */
function findCompiledModule(buildDir, fileName) {
  if (!fs.existsSync(buildDir)) return null
  const packages = fs.readdirSync(buildDir)
  for (const pkg of packages) {
    const filePath = path.resolve(buildDir, pkg, fileName)
    if (fs.existsSync(filePath)) return filePath
  }
  return null
}

/** @param {string} root
 * @param {string} mod
 * @returns {boolean} */
function isExistingModule(root, mod) {
  const localPath = path.resolve(root, `src/${mod}.gleam`)
  const manifestPath = path.resolve(root, 'manifest.toml')
  if (fs.existsSync(localPath)) return true
  if (!fs.existsSync(manifestPath)) return false
  const content = fs.readFileSync(manifestPath, 'utf8')
  const packages = []
  /**  @type {{ [key: string]: string } | null} */
  let currentPkg = null
  for (const line of content.split('\n')) {
    if (line.startsWith('[[packages]]')) {
      if (currentPkg) packages.push(currentPkg)
      currentPkg = {}
    } else if (currentPkg && line.includes('=')) {
      const [key, ...rest] = line.split('=')
      const value = rest.join('=').trim().replace(/^"|"$/g, '')
      currentPkg[key.trim()] = value
    }
  }
  if (currentPkg) packages.push(currentPkg)
  const gleamMod = `src/${mod}.gleam`
  for (const pkg of packages) {
    if (pkg.source === 'local') {
      const depPath = path.resolve(root, pkg.path, mod)
      if (fs.existsSync(depPath)) return true
    } else {
      const pkgPath = `build/packages/${pkg.name}`
      const hexPath = path.resolve(root, pkgPath, gleamMod)
      if (fs.existsSync(hexPath)) return true
    }
  }
  return false
}

/** @param {string} root @returns {void} */
function buildGleam(root) {
  console.log('[gleam-import] Building gleam')
  childProcess.execSync('gleam build --target=javascript', {
    cwd: root,
    stdio: 'inherit',
  })
}
