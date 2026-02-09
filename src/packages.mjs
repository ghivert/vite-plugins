import * as fs from "node:fs"
import * as path from "node:path"
import * as toml from "toml"
import * as JSONC from "jsonc-parser"

/** Compute the aliases paths for Gleam & TypeScript, according to the
 * `tsconfig.json` in the dirname folder & every subpaths in Gleam's package
 * `package.json` file.
 * @param {string} dirname Pass `__dirname` in your `vite.config.js`.
 * @returns {Promise<{ [key: string]: string }>}
 * */
export async function aliases(dirname) {
  const paths = [gleamPaths(dirname), tsPaths(dirname)]
  const [gleamish, tsish] = await Promise.all(paths)
  return [...tsish, ...gleamish].reduce((acc, [entry, path]) => {
    if (acc[entry] && acc[entry] !== path)
      throw new Error(
        `${entry} already defined. Values: ${acc[entry]}, ${path}`,
      )
    return { ...acc, [entry]: path }
  }, {})
}

/**
 * @param {string} dirname
 * @returns {Promise<[string, string][]>}
 * */
async function gleamPaths(dirname) {
  const gleamConfigPath = path.resolve(dirname, "gleam.toml")
  const gleamToml = toml.parse(await readFile(gleamConfigPath))
  const dependencies = gleamToml.dependencies
  const devDeps = gleamToml["dev-dependencies"]
  const deps = [...Object.entries(dependencies), ...Object.entries(devDeps)]
  const res = await Promise.all(
    deps.map(async ([package_, requirement]) => {
      if (!requirement.path) return []
      const modulePath = path.resolve(dirname, requirement.path, "package.json")
      if (!fs.existsSync(modulePath)) return []
      const packageJson = JSONC.parse(await readFile(modulePath))
      if (!packageJson.imports) return []
      return Object.entries(packageJson.imports).map(entry => {
        return keepImport(dirname, entry)
      })
    }),
  )
  return res.flat()
}

/**
 * @param {string} dirname
 * @param {[string, string]} entry
 * @returns {[string, string]}
 */
function keepImport(dirname, entry) {
  const key = entry[0].replace(/\/\*$/g, "")
  const value = entry[1].replace(/\.mjs$/g, "").replace(/\/\*$/g, "")
  return [key, path.resolve(dirname, value)]
}

/**
 * @param {string} dirname
 * @returns {Promise<[string, string][]>}
 * */
async function tsPaths(dirname) {
  const tsConfigPath = path.resolve(dirname, "tsconfig.json")
  const tsConfig = JSONC.parse(await readFile(tsConfigPath))
  const paths = tsConfig.compilerOptions?.paths ?? {}
  return Object.entries(paths).flatMap(([key, value]) => {
    const newKey = key.replace(/\/\*$/g, "")
    if (!Array.isArray(value)) return []
    const newValue =
      value[0]?.replace(/\.mjs$/g, "").replace(/\/\*$/g, "") ?? ""
    return [[newKey, path.resolve(dirname, newValue)]]
  })
}

/**
 * @param {string} path
 * @returns {Promise<string>}
 */
function readFile(path) {
  return fs.promises.readFile(path, "utf8")
}
