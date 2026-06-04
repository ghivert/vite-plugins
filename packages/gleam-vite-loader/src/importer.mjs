import * as childProcess from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as toml from 'toml'
import * as vite from 'vite'

/** Resolves `gleam:...` imports to the compiled Gleam output.
 * `import { foo } from 'gleam:my_module'` resolves to
 * `./build/dev/javascript/my_module.mjs` relative to the project root.
 * If the file doesn't exist, it looks for the Gleam source and triggers
 * a compilation before resolving.
 * @returns {vite.Plugin} */
export function gleamImportPlugin() {
  let root = ''
  return {
    name: 'chouquette-gleam-vite-loader',

    configResolved(config) {
      root = config.root
    },

    config(config, env) {
      config.build ??= {}
      if (config.build.watch === null) return
      if (config.build.watch === undefined) return
      if (typeof config.build.watch !== 'object') config.build.watch = {}
      const origin = [config.build.watch.exclude ?? []].flat()
      origin.push(['build', '**'].join(path.sep))
      config.build.watch.exclude = origin
    },

    async buildStart() {
      const gleam = [root, 'gleam.toml'].join(path.sep)
      const toml_exist = await fs.promises.lstat(gleam)
      if (!toml_exist.isFile()) throw Error('gleam.toml not found')
      await buildGleam(root)
    },

    async resolveId(source) {
      if (!source.startsWith('gleam:')) return null
      const buildDir = path.resolve(root, 'build/dev/javascript')
      if (!fs.existsSync(buildDir)) await buildGleam(root)
      const modulePath = source.slice(6)
      if (modulePath === 'prelude') return path.resolve(buildDir, 'prelude.mjs')
      const fileName = `${modulePath}.mjs`
      // Search in all package folders
      const resolved = await findCompiledModule(buildDir, fileName)
      if (resolved) return resolved
      const gleamSource = await isExistingModule(root, modulePath)
      if (!gleamSource) {
        const msg = `[gleam-import] Could not find Gleam source for '${modulePath}'`
        throw new Error(msg)
      }
      await buildGleam(root)
      return await findCompiledModule(buildDir, fileName)
    },

    async handleHotUpdate(ctx) {
      if (!ctx.file.endsWith('.gleam')) return
      await buildGleam(root)
      const srcDir = path.resolve(root, 'src')
      const relPath = path.relative(srcDir, ctx.file)
      const moduleName = relPath.replace('.gleam', '.mjs')
      const buildDir = path.resolve(root, 'build/dev/javascript')
      const compiled = await findCompiledModule(buildDir, moduleName)
      if (!compiled) return fullReload(ctx)
      const mod = ctx.server.moduleGraph.getModuleById(compiled)
      if (!mod) return fullReload(ctx)
      ctx.server.moduleGraph.invalidateModule(mod)
      return [mod]
    },
  }
}

/** @param {vite.HmrContext} ctx */
function fullReload(ctx) {
  ctx.server.ws.send({ type: 'full-reload' })
  return []
}

/** @param {string} buildDir
 * @param {string} fileName */
async function findCompiledModule(buildDir, fileName) {
  const packages = await fs.promises.readdir(buildDir)
  for (const pkg of packages) {
    const filePath = path.resolve(buildDir, pkg, fileName)
    if (fs.existsSync(filePath)) return filePath
  }
  return null
}

/** @param {string} root
 * @param {string} mod */
async function isExistingModule(root, mod) {
  const localPath = path.resolve(root, `src/${mod}.gleam`)
  const manifestPath = path.resolve(root, 'manifest.toml')
  if (fs.existsSync(localPath)) return true
  if (!fs.existsSync(manifestPath)) return false
  const content = await fs.promises.readFile(manifestPath, 'utf8')
  const manifest = toml.parse(content)
  const gleamMod = `src/${mod}.gleam`
  for (const pkg of manifest.packages) {
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

/** @param {string} root */
async function buildGleam(root) {
  console.log('[gleam-import] Building gleam')
  childProcess.execSync('gleam build --target=javascript', {
    cwd: root,
    stdio: 'inherit',
  })
}
