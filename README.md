# Gleam Loaders

Versed in the JavaScript and Node ecosystem? Fan of Gleam & Vite? Interested of
building polyglot projects? Those Plugins are here to help you build your dream
project, with Gleam, Vite or Node & TypeScript integrations. \
They provide integrations between Gleam & Vite and Gleam & Node.js.

## The `gleam:` Protocol

All loaders are built around the `gleam:` protocol. Instead of importing
JavaScript files and resolving their paths directly, just import Gleam modules
using the `gleam:` prefix, like in Gleam.

```js
import * as gleam from 'gleam:prelude'
import * as my_module from 'gleam:my_module'

const res = my_module.my_function()
if (gleam.Result$isOk(res)) {
  const data = gleam.Result$0(res)
  const valid = my_module.MyType$MyOkType(data)
  return gleam.Result$Ok(valid)
} else {
  const invalid = my_module.MyType$MyErrorType()
  return gleam.Result$Error(invalid)
}
```

Every time a Gleam module is imported, the loaders intercept those, compile the
corresponding Gleam source, and resolve them to the generated JavaScript output.
In case you're using TypeScript, a TypeScript loader takes care to provide
interoperability with the TypeScript compiler to correctly resolve types
declaration.

## Sub-packages

All loaders are published separately and have their own documentation. Take a
look at one of them to get started.

- [`@chouquette/gleam-node-loader`](https://www.npmjs.com/package/@chouquette/gleam-node-loader)
- [`@chouquette/gleam-vite-loader`](https://www.npmjs.com/package/@chouquette/gleam-vite-loader)
- [`@chouquette/gleam-ts-loader`](https://www.npmjs.com/package/@chouquette/gleam-ts-loader)

## Sponsor

Maintaining Gleam on JavaScript targets with various loaders, compiler support
and more takes time, and everything is built on my spare time. If you find some
usefulness, in one of those package,
[consider sponsoring to help me maintain the packages](https://github.com/sponsors/ghivert).

If you like Gleam as a whole,
[consider donating to Louis Pilfold, its creator](https://github.com/sponsors/lpil).
Gleam is in need for sponsors.

## Contributing

Every contributions are welcome, whether they're issues, Pull Requests,
documentation effort, etc. All efforts are appreciated.
