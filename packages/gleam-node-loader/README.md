# Gleam Node Loader

Add first class support for Gleam modules directly in Node.js. Instead of
building and requiring your files, use `@chouquette/gleam-node-loader` to bring
Gleam in your regular `import`. If you want Gleam in Vite, take a look at the
[twin package `@chouquette/gleam-vite-loader`](https://www.npmjs.com/package/@chouquette/gleam-vite-loader).

## Getting Started

First, install the package. You'll also need a valid Gleam compiler installed on
your path. You can use `@chouquette/gleam` to provide a valid Gleam compiler.

```sh
yarn add @chouquette/gleam-node-loader
yarn add @chouquette/gleam
```

## Executing the loader

Once the loader is installed, you need to call it before any other package or
module loaded by Node. If you do not import it at the launch of Node, you can
have some Gleam files unrecognized. To run the loader, Node provides a CLI flag.

```sh
# Run the Gleam loader before any module, and then execute main.js.
node --import @chouquette/gleam-node-loader main.js
```

## Adding the loader directly in the environment

Because running Node with the flag can be tedious, you can also use an
environment variable. If you set `NODE_OPTIONS` to
`--import @chouquette/gleam-node-loader`, then every time you'll call
`node main.js`, `@chouquette/gleam-node-loader` will be loaded first.

```
# Add in your environment.
NODE_OPTIONS='--import @chouquette/gleam-node-loader'
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
