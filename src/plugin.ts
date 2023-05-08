import type { InlangConfig } from "@inlang/core/config";
import type { InlangEnvironment } from "@inlang/core/environment";
import type * as ast from "@inlang/core/ast";
import { createPlugin } from "@inlang/core/plugin";
import flatten from "flat";
import safeSet from "just-safe-set";

export const plugin = createPlugin<PluginSettings>(({ settings, env }) => ({
  id: "samuelstroschein.inlangPluginJson",
  async config() {
    return {
      languages: await getLanguages({
        $fs: env.$fs,
        settings,
      }),
      readResources: async (args) =>
        readResources({ ...args, $fs: env.$fs, settings }),
      writeResources: async (args) =>
        writeResources({ ...args, $fs: env.$fs, settings }),
    };
  },
}));

type PluginSettings = {
  /**
   * Defines the path pattern for the resources.
   *
   * Must include the `{language}` placeholder.
   *
   * @example
   *  "./resources/{language}.json"
   */
  pathPattern: string;
  variableReferencePattern?: [string, string];
};

/**
 * Automatically derives the languages in this repository.
 */
async function getLanguages(args: {
  $fs: InlangEnvironment["$fs"];
  settings: PluginSettings;
}) {
  // replace the path
  const [pathBeforeLanguage, pathAfterLanguage] =
    args.settings.pathPattern.split("{language}");
  const paths = await args.$fs.readdir(pathBeforeLanguage);
  const languages = [];

  for (const language of paths) {
    // remove the .json extension to only get language name
    if (typeof language === "string" && language.endsWith(".json")) {
      languages.push(language.replace(".json", ""));
    }
  }
  return languages;
}

/**
 * Reading resources.
 *
 * The function merges the args from Config['readResources'] with the settings
 * and EnvironmentFunctions.
 */
export async function readResources(
  // merging the first argument from config (which contains all arguments)
  // with the custom settings argument
  args: Parameters<InlangConfig["readResources"]>[0] & {
    $fs: InlangEnvironment["$fs"];
    settings: PluginSettings;
  }
): ReturnType<InlangConfig["readResources"]> {
  const result: ast.Resource[] = [];
  for (const language of args.config.languages) {
    const resourcePath = args.settings.pathPattern.replace(
      "{language}",
      language
    );
    const json = JSON.parse(
      (await args.$fs.readFile(resourcePath, { encoding: "utf-8" })) as string
    );
    // reading the json, and flattening it to avoid nested keys.
    const flatJson = flatten(json) as Record<string, string>;

    result.push(parseResource(flatJson, language, args.settings.variableReferencePattern ));
  }
  //console.log(result[1].body.find(x => x.id.name === "logout.description")?.pattern.elements)
  return result;
}

/**
 * Writing resources.
 *
 * The function merges the args from Config['readResources'] with the settings
 * and EnvironmentFunctions.
 */
async function writeResources(
  args: Parameters<InlangConfig["writeResources"]>[0] & {
    settings: PluginSettings;
    $fs: InlangEnvironment["$fs"];
  }
): ReturnType<InlangConfig["writeResources"]> {
  for (const resource of args.resources) {
    const resourcePath = args.settings.pathPattern.replace(
      "{language}",
      resource.languageTag.name
    );
    await args.$fs.writeFile(resourcePath, serializeResource(resource, args.settings.variableReferencePattern));
  }
}

/**
 * Parses a resource.
 *
 * @example
 *  parseResource({ "test": "Hello world" }, "en")
 */
function parseResource(
  /** flat JSON refers to the flatten function from https://www.npmjs.com/package/flat */
  flatJson: Record<string, string>,
  language: string,
  variableReferencePattern?: [string, string],
): ast.Resource {

  return {
    type: "Resource",
    languageTag: {
      type: "LanguageTag",
      name: language,
    },
    body: Object.entries(flatJson).map(([id, value]) =>
      parseMessage(id, value, variableReferencePattern)
    ),
  };
}

/**
 * Parses a message.
 *
 * @example
 *  parseMessage("test", "Hello world")
 */
function parseMessage(id: string, value: string, variableReferencePattern?: [string, string]): ast.Message {
  const regex = variableReferencePattern && 
    (variableReferencePattern[1] 
      ? new RegExp(`(\\${variableReferencePattern[0]}[^\\${variableReferencePattern[1]}]+\\${variableReferencePattern[1]})`, "g")
      : new RegExp(`(${variableReferencePattern}\\w+)`, "g"));
  const newElements = [];
  if(regex){
    const splitArray = value.split(regex);
    for (let i = 0; i < splitArray.length; i++) {
      if (regex.test(splitArray[i])) {
        newElements.push({
          type: "Placeholder",
          body: {
            type: "VariableReference",
            name: variableReferencePattern[1] 
              ? splitArray[i].slice(variableReferencePattern[0].length, variableReferencePattern[1].length * -1)
              : splitArray[i].slice(variableReferencePattern[0].length)
          }
        });
      } else {
        if(splitArray[i] !== ""){
          newElements.push({
            type: "Text",
            value: splitArray[i]
          });
        }
      }
    }
  } else {
    newElements.push({
      type: "Text",
      value: value
    });
  }

  return {
    type: "Message",
    id: {
      type: "Identifier",
      name: id,
    },
    pattern: { type: "Pattern", elements: newElements as Array<ast.Text | ast.Placeholder>},
  };
}

/**
 * Serializes a resource.
 *
 * The function un-flattens, and therefore reverses the flattening
 * in parseResource, of a given object. The result is a stringified JSON
 * that is beautified by adding (null, 2) to the arguments.
 *
 * @example
 *  serializeResource(resource)
 */
function serializeResource(resource: ast.Resource, variableReferencePattern?: [string, string]): string {
  const obj = {};
  resource.body.forEach((message) => {
    const [key, value] = serializeMessage(message, variableReferencePattern);
    safeSet(obj, key, value);
  });
  // stringify the object with beautification.
  return JSON.stringify(obj, null, 2);
}

/**
 * Serializes a message.
 *
 * Note that only the first element of the pattern is used as inlang, as of v0.3,
 * does not support more than 1 element in a pattern.
 */
function serializeMessage(message: ast.Message, variableReferencePattern?: [string, string]): [id: string, value: string] {
  const newStringArr = [];
  for( const element of message.pattern.elements) {
    if (element.type === "Text" || !variableReferencePattern) {
      newStringArr.push(element.value);
    } else if (element.type === "Placeholder") {
      variableReferencePattern[1] 
        ? newStringArr.push(`${variableReferencePattern[0]}${element.body.name}${variableReferencePattern[1]}`)
        : newStringArr.push(`${variableReferencePattern[0]}${element.body.name}`);
    }
  }
  const newString: string = newStringArr.join("")
  return [message.id.name, newString];
}