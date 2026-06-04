# Gleam TypeScript Loader

Add first class support for Gleam modules directly in TypeScript. Use
`@chouquette/gleam-ts-loader` to bring Gleam types in your regular `import` when
using
[`@chouquette/gleam-node-loader`](https://www.npmjs.com/package/@chouquette/gleam-node-loader)
or
[`@chouquette/gleam-vite-loader`](https://www.npmjs.com/package/@chouquette/gleam-vite-loader).

## Getting Started

```sh
yarn add @chouquette/gleam-ts-loader
```

## Configuring Gleam to output TypeScript declarations

By default, Gleam will not output TypeScript declarations. Modify your
`gleam.toml` to add declarations.

```toml
# In gleam.toml
[javascript]
typescript_declarations = true
```

Then, clear your existing artifacts, and rebuild the project.

```sh
gleam clean
gleam build
```

## Adding the plugin to `tsconfig.json`

Once the loader is installed, you need to add it to TypeScript. Edit your
`tsconfig.json`, and add the plugin in the `plugins` field.

```json
{
  ...
  "plugins": [{ "name": "@chouquette/gleam-ts-loader" }],
  ...
}
```

And tada! You have nothing more to do. Starting now, every time you import a
Gleam file with `import * as gleam from 'gleam:prelude'`, you'll get complete
typechecking.

## Contributing

Pull Requests are welcome! Feel free to open a Pull Request or open an issue if
you encounter any problem with the loader.
