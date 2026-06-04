# Gleam Vite Loader

Add first class support for Gleam modules directly in Vite. Instead of building
and requiring your files, use `@chouquette/gleam-vite-loader` to bring Gleam in
your regular `import`. If you want Gleam in Node.js, take a look at the
[twin package `@chouquette/gleam-node-loader`](https://www.npmjs.com/package/@chouquette/gleam-node-loader).

## Getting Started

After your Vite project has been created, install the package. You'll also need
a valid Gleam compiler installed on your path. You can use `@chouquette/gleam`
to provide a valid Gleam compiler.

```sh
yarn add @chouquette/gleam-node-loader
yarn add @chouquette/gleam
```

## Executing the loader

Once the loader is installed, you need to reference it in your `vite.config.js`.

```ts
// vite.config.{ts,js}
import gleam from '@chouquette/gleam-vite-loader'
export default {
  plugins: [gleam()],
}
```

## Use it in your code

After the loader has been installed, you'll have the possibility to import Gleam
modules directly from Node. Just write `import * as gleam from 'gleam:prelude'`,
and the loader will automatically transform the imports to a valid Gleam import.

Every module are accessible, just like you would do in Gleam directly. For
example, if you need to require `gleam/option`, the syntax will be
`import * as option from 'gleam:gleam/option`.

> [!WARNING]
>
> Be careful, there's an exception with the prelude, included automatically by
> default in every Gleam program. The prelude provides basic data structures,
> like `Result` or `List`. To import it, you'll have to use
> `import * as gleam from 'gleam:prelude'`.

You should be used to the Gleam FFI to use Gleam modules in JavaScript.
[Find more information on externals directly on official documentation.](https://gleam.run/documentation/externals/)

If you write TypeScript instead of JavaScript, you can install the companion
[`@chouquette/gleam-ts-loader`](https://www.npmjs.com/package/@chouquette/gleam-ts-loader)
package to provide entire TypeScript types for your Gleam imports.

## Contributing

Pull Requests are welcome! Feel free to open a Pull Request or open an issue if
you encounter any problem with the loader.

## Thanks

Special thanks to [Enderchief](https://github.com/Enderchief), who made the
awesome initial effort to create `vite-gleam`, which has been the foundations
for `@chouquette/gleam-vite-loader`. That package does not replace `vite-gleam`,
but instead provides an alternative unified between Vite and Node.js for various
projects.
