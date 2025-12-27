# Vite Plugins

Versed in the JavaScript and Node ecosystem? Fan of Gleam & Vite? Interested of
building polyglot projects? Those Plugins are here to help you build your dream
project, with Gleam, Redraw or Node & TypeScript integrations. \
They provide integrations between Gleam & Vite, simplify Gleam & React
integration & help with `package.json` `imports` for your sub-packages, like in
monorepo.

## Installation

```sh
yarn add @chouquette/vite
```

## Using Vite Gleam Plugin

Based on the fantastic work of Enderchief, you can easily integrate Gleam & Vite
together. Create your Vite project with `yarn create vite`. Once it's done,
create a new Gleam project inside your newly-created Vite project. Finally,
inside your `vite.config.js`, import the plugin and inject it.

```ts
// vite.config.{ts,js}
import gleam from "@chouquette/vite/gleam"
export default {
  plugins: [gleam()],
}
```

> [!INFO]
>
> By default, TypeScript will complain about importing files with the `.gleam`
> extension. There are two choices for fixes:
>
> - If the type of the import doesn't matter , add `declare module "*.gleam";`
>   inside any TypeScript file. A caveat is the LSP does not know if an export
>   exists so it will not provide autocompletion when importing a Gleam file and
>   it will type exports as `any`.
> - Alternatively, if the vite dev server is running you can have full type
>   safety when importing from Gleam. `npm i ts-gleam`. Create a
>   `tsconfig.json`/`jsconfig.json` and set `compilerOptions.plugins` to
>   `[{"name": "ts-gleam"}]` (**RECOMMENDED**)

## Using Redraw Plugin

When using [Redraw](https://github.com/ghivert/redraw), you regularly need to
interact with the Gleam FFI, and using JSX is often needed to integrate easily
with existing React packages. The Redraw plugin add custom matcher for Vite, to
add JSX support in Gleam FFI files. Indeed, in modern Vite installations, only
`.jsx` files convert your JSX to JavaScript. With this plugin, all files ending
in `.redraw.js`, `.redraw.mjs`, `.redraw.ts` & `.redraw.mts` will run through a
modern JSX transformer to support FFI with React!

```ts
// vite.config.{ts,js}
import redraw from "@chouquette/vite/redraw"
export default {
  plugins: [redraw()],
}
```

Once the plugin has been added, you're now free to add FFI code with JSX.

```jsx
// file.redraw.mjs
export function component() {
  return (
    <React.Fragment>
      <div>Gleam + React = 💜</div>
    </React.Fragment>
  )
}
```

## Using Packages Plugin

With recent `package.json`, you can use
[sub-path imports](https://nodejs.org/api/packages.html#subpath-imports).
They're a standardised way to work Node & JavaScript packages, and they
integrate perfectly with TypeScript and other JavaScript packages. However, when
using Gleam, JavaScript files are simply copy-pasted as-is, and the paths won't
be rewritten. For example, let's say you write your FFI like this.

```jsonc
// package.json
// Define an import path pointing to the Gleam prelude.
// The Gleam `build` folder is always at root of the project, alongside the
// `gleam.toml` file. If you put your `package.json` alongside them, the
// sub-path will always resolve correctly.
{
  "imports": {
    "#gleam/prelude": "./build/dev/javascript/prelude.mjs",
  },
}
```

```gleam
//// module.gleam
//// Add an FFI function here, calling directly JavaScript. With the defined
//// API from Gleam, it's possible to directly call and return Gleam data
//// from JavaScript.

/// Divide a number by `y`, iif `y` is different from 0.
@external(javascript, "./module.ffi.mjs", "divide")
pub fn divide(x: Int, y: Int) -> Result(Int, Nil)
```

```js
// module.ffi.mjs
// Import the prelude, to access Result type directly.
import * as gleam from "#gleam/prelude"
// Define the JavaScript FFI function.
export function divide(x, y) {
  if (y === 0) return gleam.Result$Error()
  const result = x / y
  return gleam.Result$Ok(result)
}
```

In your project, this will work correctly if you launch your program with Node.
Node will correctly resolve the imports. Unfortunately, if your package is used
as dependency, let's with path dependency in a monorepo, your project will not
be able to access the `package.json` `imports` field, and the resolution will
fail. The plugin, when called, will search for your local `imports`, and add
them automatically to your project. Be careful though, you cannot have two
imports with the same name, but with different resolutions. In that case, the
plugin will fail & warn you.

```ts
// vite.config.{ts,js}
import packages from "@chouquette/vite/packages"
export default {
  resolve: {
    // Resolve the aliases from TypeScript config files and NPM imports.
    alias: await packages.aliases(__dirname),
  },
}
```

## Thanks

Special thanks to [Enderchief](https://github.com/Enderchief), who made the
awesome initial effort to create `vite-gleam`, which has been the foundations
for `@chouquette/vite/gleam`. That package does not replace `vite-gleam`, but
instead provides an alternative and a coherent package including Redraw, Gleam
and other Node niceties directly built together.
