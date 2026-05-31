import type ts from 'typescript/lib/tsserverlibrary'
import * as fs from 'node:fs'
import * as path from 'node:path'

const init: ts.server.PluginModuleFactory = ({ typescript }) => ({
  create: function (info) {
    const logger = info.project.projectService.logger
    logger.info('[ts-gleam-plugin] initializing')

    const directory = info.project.getCurrentDirectory()
    const buildDir = path.join(directory, 'build/dev/javascript')

    function findCompiledModule(modulePath: string) {
      if (!fs.existsSync(buildDir)) return null
      const fileName = `${modulePath}.d.mts`
      const packages = fs.readdirSync(buildDir)
      for (const pkg of packages) {
        const filePath = path.join(buildDir, pkg, fileName)
        if (fs.existsSync(filePath)) return filePath
      }
      return null
    }

    function createModuleResolver(containingFile: string) {
      return (
        moduleName: ts.StringLiteralLike,
        resolveModule: () =>
          | ts.ResolvedModuleWithFailedLookupLocations
          | undefined,
      ) => {
        const text = moduleName.text
        logger.info(`[ts-gleam-plugin] resolving: ${text}`)
        if (!text.startsWith('gleam:')) return undefined

        const mod = text.slice(6)
        if (mod === 'prelude') {
          const preludePath = path.join(buildDir, 'prelude.d.mts')
          if (fs.existsSync(preludePath)) {
            return {
              extension: typescript.Extension.Dmts,
              isExternalLibraryImport: false,
              resolvedFileName: preludePath,
            }
          }
          return undefined
        }

        const resolved = findCompiledModule(mod)
        if (resolved) {
          return {
            extension: typescript.Extension.Dmts,
            isExternalLibraryImport: false,
            resolvedFileName: resolved,
          }
        }
        return undefined
      }
    }

    const proxy = Object.create(null)
    for (const k of Object.keys(info.languageService)) {
      const key = k as keyof ts.LanguageService
      const x = info.languageService[key]
      proxy[k] = typeof x === 'function' ? x.bind(info.languageService) : x
    }

    proxy.getSemanticDiagnostics = (fileName: string) => {
      const prior = info.languageService.getSemanticDiagnostics(fileName)
      // Filter out "cannot find module" errors for gleam: imports
      return prior.filter(d => {
        if (d.code === 2307 && typeof d.messageText === 'string') {
          return !d.messageText.includes("'gleam:")
        }
        return true
      })
    }

    if (info.languageServiceHost.resolveModuleNameLiterals) {
      const _resolveModuleNameLiterals =
        info.languageServiceHost.resolveModuleNameLiterals.bind(
          info.languageServiceHost,
        )
      info.languageServiceHost.resolveModuleNameLiterals = (
        modulesLiterals,
        containingFile,
        ...rest
      ) => {
        const resolvedModules = _resolveModuleNameLiterals(
          modulesLiterals,
          containingFile,
          ...rest,
        )
        const moduleResolver = createModuleResolver(containingFile)
        return modulesLiterals.map((moduleName, index) => {
          try {
            const resolvedModule = moduleResolver(moduleName, () => {
              return info.languageServiceHost.getResolvedModuleWithFailedLookupLocationsFromCache?.(
                moduleName.text,
                containingFile,
              )
            })
            if (resolvedModule) return { resolvedModule }
            return resolvedModules[index]!
          } catch (e) {
            logger.info(`[ts-gleam-plugin] ERR: ${e}`)
            return resolvedModules[index]!
          }
        })
      }
    }

    return proxy
  },
})

module.exports = init
