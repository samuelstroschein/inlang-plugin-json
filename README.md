# inlang-plugin-json

This plugin reads and writes resources that are stored as JSON. The following features are supported:

- [x] key-value pair (`"key": "value"`)
- [x] nested key-value pairs (`{ "key": { "nested-key": "value" } }`)

## Usage

```js
// filename: inlang.config.js

export async function defineConfig(env) {
	const { default: pluginJson } = await env.$import(
		'https://cdn.jsdelivr.net/gh/samuelstroschein/inlang-plugin-json@2/dist/index.js'
	);

	const { default: standardLintRules } = await env.$import(
		'https://cdn.jsdelivr.net/gh/inlang/standard-lint-rules@2/dist/index.js'
	);

	return {
		referenceLanguage: 'en',
		plugins: [pluginJson({ pathPattern: './translations/{language}.json' }), standardLintRules()]
	};
}
```

---

Take a look at the [example inlang.config.js](./example/inlang.config.js) for the plugin config and usage.

---

### Settings

#### Placeholder

To correctly parse placeholders for code variables in strings, you must define the parsing pattern. This is done by adding the `variableReferencePattern` to the `jsonPlugin` inside `inlang.config.js` as follows:

**Example**
```js
jsonPlugin({
  variableReferencePattern: {
    parse: /{}/,
    serialize: (placeholder) => `{${placeholder.name}}`
  }
})
```

**Type definition**
```js
type PluginSettings = {
 variableReferencePattern: {
    parse: Regex,
    serialize: (placeholder: ast.VariableReference) => string 
  }
}
```

**Common use cases**

| Placeholder       | Parse         | Serialize                                     |
|-------------------|---------------|-----------------------------------------------|
| `{placeholder}`   | `/{}/`        | `(placeholder) => {{placeholder.name}}`   |
| `{{placeholder}}` | `/{{}}/`      | `(placeholder) => {{{placeholder.name}}}` |
| `${placeholder}`  | `/${}/`       | `(placeholder) => {${placeholder.name}}`  |
| `%placeholder`    | `/%/`         | `(placeholder) => {%placeholder.name}`    |
| `[placeholder]`   | `/[]/`        | `(placeholder) => {[placeholder.name]}`   |
| `:placeholder`    | `/:/`         | `(placeholder) => {:placeholder.name}`    |

---

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

Read the [jsDelivr documentation](https://www.jsdelivr.com/?docs=gh) on importing from GitHub.
