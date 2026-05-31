import * as vite from "vite"

/**
 * @typedef {Object} RedrawOptions
 * @property {RegExp} [pattern] Pattern for FFI files. By default, Redraw
 * plugin will transform JSX for all JavaScript ending with the following
 * suffix.
 *
 * - `.redraw.mjs`
 * - `.redraw.js`
 * - `.redraw.mts`
 * - `.redraw.ts`
 *
 * As a Gleam developer, you'll probably want to write all your FFI files as
 * `.mjs`, probably with the `.ffi` suffix before. Something like
 * `[my-file].ffi.mjs` or similar. Indeed, `.mjsx` or `.jsx` files are not
 * taken into consideration by the Gleam compiler. \
 * To avoid clashhing with usual FFI files and ending with impossible to
 * understand errors, Redraw avoid converting all `.mjs` files. You're free
 * to modify that behaviour with `pattern`.
 */

export default plugin

/** Allow FFI files to be compiled using JSX. This makes sure the JSX compiler
 * can go through `mjs` files, and allow to write usual React code in FFI.
 * @param {RedrawOptions} opts
 * @returns {vite.Plugin}
 * */
export function plugin(opts = {}) {
  return {
    name: "chouquette-vite-redraw",
    /** @param {string} code @param {string} id */
    async transform(code, id) {
      const matcher = createRedrawMatcher(opts)
      if (!id.match(matcher)) return null
      // Use the exposed transform from vite, instead of directly
      // transforming with esbuild
      return vite.transformWithOxc(code, id, {
        jsx: {
          refresh: true,
          runtime: "automatic",
        },
      })
    },
  }
}

/** @param {RedrawOptions} opts @returns {RegExp} */
function createRedrawMatcher(opts) {
  if (opts.pattern instanceof RegExp) {
    return new RegExp(opts.pattern)
  } else {
    return /\.redraw.m?[tj]s$/
  }
}
