import * as vite from 'vite'

/** Resolves `gleam:...` imports to the compiled Gleam output.
 * `import { foo } from 'gleam:my_module'` resolves to
 * `./build/dev/javascript/my_module.mjs` relative to the project root.
 * If the file doesn't exist, it looks for a matching Gleam package and
 * triggers a compilation before resolving. */
declare function gleamImportPlugin(): vite.Plugin
