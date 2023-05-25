 /**
 * @type {import("@inlang/core/config").DefineConfig}
 */
 export async function defineConfig(env) {
	const { default: pluginJson } = await env.$import(
		'https://cdn.jsdelivr.net/gh/samuelstroschein/inlang-plugin-json@2.3.7/dist/index.js'
	);

	return {
		referenceLanguage: 'en',
		plugins: [pluginJson({ 
			pathPattern: "./example09/{language}/translation.json",
			variableReferencePattern: ["{", "}"]
		})]
	};
}
