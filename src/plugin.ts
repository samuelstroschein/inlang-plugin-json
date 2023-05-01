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

  // prepared for different folder structure e.g. example/language/translation.json
  const pathAfterLanguageIsDirectory = pathAfterLanguage.startsWith("/");
  if (pathAfterLanguageIsDirectory) {
    const languages: Array<string> = [];
    const paths = await args.$fs.readdir(pathBeforeLanguage);
    for (const language of paths) {
      if (!language.toString().includes(".")) {
        for (const languagefile of await args.$fs.readdir(
          `${pathBeforeLanguage}${language}`
        )) {
          if (
            typeof languagefile === "string" &&
            languagefile.endsWith(".json") &&
            !languages.some((l) => l === language.toString())
          ) {
            languages.push(language.toString());
          }
        }
      }
    }

    return languages;
  } else {
    const paths = await args.$fs.readdir(pathBeforeLanguage);
    // files that end with .json
    const languages = [];

    for (const language of paths) {
      // remove the .json extension to only get language name
      if (typeof language === "string" && language.endsWith(".json")) {
        languages.push(language.replace(".json", ""));
      }
    }
    return languages;
  }
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
    try {
      const json = JSON.parse(
        (await args.$fs.readFile(resourcePath, { encoding: "utf-8" })) as string
      );
      // reading the json, and flattening it to avoid nested keys.
      const flatJson = flatten(json) as Record<string, string>;
      result.push(parseResource(flatJson, language));
    } catch {
      // is directory
      let allFlatJson: any = {};
      for (const languagefile of await args.$fs.readdir(
        resourcePath.replace("/*.json", "")
      )) {
        const json: any = {};
        json[languagefile.toString().replace(".json", "")] = JSON.parse(
          (await args.$fs.readFile(
            `${resourcePath.replace("/*.json", "")}/${languagefile}`,
            { encoding: "utf-8" }
          )) as string
        );
        const flatJson = flatten(json) as Record<string, string>;
        allFlatJson = { ...allFlatJson, ...flatJson };
      }
      result.push(parseResource(allFlatJson, language));
    }
  }
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
    const [, pathAfterLanguage] = args.settings.pathPattern.split("{language}");
    const pathAfterLanguageIsDirectory = pathAfterLanguage.startsWith("/");

    const resourcePath = args.settings.pathPattern.replace(
      "{language}",
      resource.languageTag.name
    );

    if (pathAfterLanguageIsDirectory) {
      //deserialize the file names
      const result = splitMessagesByPrefix(resource.body);
      for (const prefix of result.prefixes) {
        const splitedResource: ast.Resource = {
          type: resource.type,
          languageTag: resource.languageTag,
          body: result.messages[prefix],
        };
        await args.$fs.writeFile(
          resourcePath.replace("*", prefix),
          serializeResource(splitedResource)
        );
      }
    } else {
      // without language directory
      await args.$fs.writeFile(resourcePath, serializeResource(resource));
    }
  }
}

/**
 * Split messages by prefix.
 *
 * @example
 * splitMessagesByPrefix(resource.body)
 */
function splitMessagesByPrefix(messages: ast.Message[]) {
  const prefixes: Array<string> = [
    ...new Set(messages.map((msg) => msg.id.name.split(".")[0])),
  ];
  const result: {
    prefixes: Array<string>;
    messages: { [key: string]: ast.Message[] };
  } = {
    prefixes: prefixes,
    messages: {},
  };
  prefixes.forEach((prefix) => {
    result.messages[prefix] = messages.filter((msg) =>
      msg.id.name.startsWith(prefix)
    );
    result.messages[prefix].forEach((msg) => {
      msg.id.name = msg.id.name.replace(`${prefix}.`, "");
    });
  });
  return result;
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
  language: string
): ast.Resource {
  return {
    type: "Resource",
    languageTag: {
      type: "LanguageTag",
      name: language,
    },
    body: Object.entries(flatJson).map(([id, value]) =>
      parseMessage(id, value)
    ),
  };
}

/**
 * Parses a message.
 *
 * @example
 *  parseMessage("test", "Hello world")
 */
function parseMessage(id: string, value: string): ast.Message {
  return {
    type: "Message",
    id: {
      type: "Identifier",
      name: id,
    },
    pattern: { type: "Pattern", elements: [{ type: "Text", value: value }] },
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
function serializeResource(resource: ast.Resource): string {
  const obj = {};
  resource.body.forEach((message) => {
    const [key, value] = serializeMessage(message);
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
function serializeMessage(message: ast.Message): [id: string, value: string] {
  return [message.id.name, (message.pattern.elements[0] as ast.Text).value];
}
