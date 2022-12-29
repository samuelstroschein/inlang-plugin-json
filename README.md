# inlang-plugin-json

This plugin reads and writes resources that are stored as JSON. The following features are supported:

- [x] key-value pair (`"key": "value"`)
- [x] nested key-value pairs (`{ "key": { "nested-key": "value" } }`)

### Usage

See the [example](./example).

### Limitations

- If a user creates a message with a nested id i.e. `example.nested` and `example` is also a message, the plugin will break.

## Contributing

### Getting started

Run the following commands in your terminal (node and npm must be installed):

1. `npm install`
2. `npm run dev`

`npm run dev` will start the development environment which automatically compiles the [src/index.ts](./src/index.ts) files to JavaScript ([dist/index.js](dist/index.js)), runs tests defined in `*.test.ts` files and watches changes.

### Publishing

Run `npm run build` to generate a build.

The [dist](./dist/) directory is used to distribute the plugin directly via CDN like [jsDelivr](https://www.jsdelivr.com/). Using a CDN works because the inlang config uses dynamic imports to import plugins.

The plugin can be imported by the [inlang config](https://inlang.com/documentation/config) as follows:

```js
export async function initializeConfig(env) {
  const plugin = await env.$import(
    // use .../inlang/plugin-template@{version}/dist/index.js
    // in production.
    "https://cdn.jsdelivr.net/gh/inlang/plugin-template/dist/index.js"
  );
}
```

Read the [jsDelivr documentation](https://www.jsdelivr.com/?docs=gh) on importing from GitHub.
