import MagicString from "magic-string"
import * as childProcess from "node:child_process"
import * as fs from "node:fs/promises"
import * as path from "node:path"
import * as toml from "toml"
import * as vite from "vite"

/** Defines a valid Gleam config, read from `gleam.toml`.
 * @typedef {Object} GleamConfig
 * @property {string} name
 * @property {string} [version]
 * @property {string} [target]
 */

/** @type GleamConfig | undefined */
let gleamConfig = undefined

/** Generate a custom logger, that does not warn on dynamic `import`.
 * @returns {vite.Logger}
 */
export function quietLogger() {
  const customLogger = vite.createLogger()
  const loggerWarn = customLogger.warn
  customLogger.warn = (msg, options) => {
    if (msg.includes("import_")) return
    loggerWarn(msg, options)
  }
  return customLogger
}

export default plugin

/** @returns {Promise<vite.Plugin>} */
export async function plugin() {
  return {
    name: "chouquette-gleam",

    config(config, env) {
      config.build ??= {}
      if ([null, undefined].includes(config.build.watch)) return
      if (typeof config.build.watch !== "object") config.build.watch = {}
      const origin = [config.build.watch.exclude].flat()
      origin.push(["build", "**"].join(path.sep))
      config.build.watch.exclude = origin
    },

    async buildStart() {
      const gleam = [".", "gleam.toml"].join(path.sep)
      const toml_exist = await fs.lstat(gleam)
      if (!toml_exist.isFile()) throw Error("gleam.toml not found")
      const file = await fs.readFile(gleam, { encoding: "utf8" })
      gleamConfig = toml.parse(file)
      await build()
    },

    async resolveId(source, importer) {
      if (!importer) return
      if (source.startsWith("hex:")) return hexSource(source)
      const isGleamFile = importer.endsWith(".gleam")
      const isGleamJsFile = source.endsWith("gleam.mjs")
      if (!isGleamFile && !isGleamJsFile) return
      importer = jsPath(importer)
      const jsDir = ["build", "dev", "javascript"].join(path.sep)
      const id = path.join(path.resolve("."), jsDir, importer, "..", source)
      return { id }
    },

    async transform(code, id) {
      if (!id.endsWith(".gleam")) return
      const js = jsPath(id.replace(".gleam", ".mjs"))
      const jsFile = [".", "build", "dev", "javascript", js].join(path.sep)
      const file = await fs.readFile(jsFile, { encoding: "utf8" })
      const magic = new MagicString(code)
      magic.overwrite(0, code.length - 1, file)
      const map = magic.generateMap({ source: id, includeContent: true })
      return { code: file, map }
    },

    async handleHotUpdate(ctx) {
      if (ctx.file.endsWith(".gleam")) await build()
    },
  }
}

/**
 * @param {string} path_
 * @param {Record<string, string>} [output={}]
 * @returns {Promise<Record<string, string>>}
 */
async function makeDeps(path_, output = {}) {
  const stat = await fs.lstat(path_)
  if (stat.isDirectory()) {
    const directory = await fs.readdir(path_)
    const deps = directory.map(p => makeDeps(`${path_}${path.sep}${p}`, output))
    await Promise.allSettled(deps)
  } else if (stat.isFile()) {
    const f = await fs.readFile(path_, { encoding: "utf8" })
    output[path_.slice(1)] = f
  }
  return output
}

/** @returns {Promise<void>} */
async function build() {
  if (!gleamConfig) throw new Error("gleam.toml not found")
  console.log("$ gleam build --target=javascript")
  const buildScript = "gleam build --target=javascript"
  const out = childProcess.execSync(buildScript, { encoding: "utf8" })
  console.log(out)
}

/**
 * @param {string} id
 * @returns {string}
 */
function jsPath(id) {
  const id_ = id.replace(".gleam", ".mjs")
  const path_ = path.relative(path.resolve("."), id_)
  if (!path_.startsWith("src")) return path_
  return path_.replace(`src${path.sep}`, `${gleamConfig?.name}${path.sep}`)
}

/** @param {string} source
 * @returns {{ id: string }} */
function hexSource(source) {
  const jsDir = ["build", "dev", "javascript"].join(path.sep)
  const id = path.join(path.resolve("."), jsDir, source.slice(4))
  return { id }
}
