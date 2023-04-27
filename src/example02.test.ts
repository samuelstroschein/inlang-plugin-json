// @ts-ignore
import { defineConfig } from "../example02/inlang.config.js";
import { describe, it, expect } from "vitest";
import nodeFs from "node:fs";
import { fs as memfs } from "memfs";
import {
  initialize$import,
  Config,
  EnvironmentFunctions,
} from "@inlang/core/config";
import { query } from "@inlang/core/query";

const env = await initializeTestEnvironment();
const config = (await defineConfig(env)) as Config;

const resources = await config.readResources({ config });
const referenceResource = resources.find(
  (resource) => resource.languageTag.name === config.referenceLanguage
)!;


describe("plugin", async () => {
  describe("readResources()", async () => {
    it("should return an array of resources that matches config.languages", () => {
      expect(resources.length).toBe(config.languages.length);
      for (const resource of resources) {
        expect(config.languages.includes(resource.languageTag.name));
      }
    });

    it("should be possible to query a message", () => {
      const message = query(referenceResource).get({ id: "hallo.test" });
      expect(message).toBeDefined();
      expect(message?.pattern.elements[0].value).toBe(
        "DO NOT CHANGE THIS MESSAGE. This message is used for testing purposes."
      );
    });

    it("should not parse missing translations as empty string or similar", () => {
      const germanResource = resources.find(
        (resource) => resource.languageTag.name === "de"
      );
      const message = query(germanResource!).get({ id: "test.test" });
      expect(message).toBeUndefined();
    });

    it("should be possible to query a nested message with dot notation (id.nested)", () => {
      const message = query(referenceResource).get({ id: "test.test-nested.test" });
      expect(message).toBeDefined();
      expect(message?.pattern.elements[0].value).toBe(
        "DO NOT CHANGE THIS MESSAGE. This message is used for testing purposes."
      );
    });
  });
});

describe("writeResources()", async () => {
  it("should serialize the resources", async () => {
    const updatedReferenceResource = query(referenceResource)
      .create({
        message: {
          id: { type: "Identifier", name: "test.test-nested.updated" },
          type: "Message",
          pattern: {
            type: "Pattern",
            elements: [{ type: "Text", value: "Newly created message" }],
          },
        },
      })
      .unwrap();
    const updatedResources = [
      ...resources.filter(
        (resource) => resource.languageTag.name !== config.referenceLanguage
      ),
      updatedReferenceResource,
    ];
    await config.writeResources({ config, resources: updatedResources });
    const json = JSON.parse(
      (await env.$fs.readFile(
        `/example02/${config.referenceLanguage}/test.json`,
        "utf-8"
      )) as string
    );
    expect(json["test-nested"].updated).toBe("Newly created message");
  });

  it("should be capable of doing a round trip where the input equals the output", async () => {
    const env = await initializeTestEnvironment();
    const config = (await defineConfig(env)) as Config;
    const original = {
      en: JSON.parse((await env.$fs.readFile("./en/test.json", "utf-8")) as string),
      de: JSON.parse((await env.$fs.readFile("./de/test.json", "utf-8")) as string),
    };
    console.log(original)
    const resources = await config.readResources({ config });
    await config.writeResources({ config, resources });
    const serialized = {
      en: JSON.parse((await env.$fs.readFile("./en/test.json", "utf-8")) as string),
      de: JSON.parse((await env.$fs.readFile("./de/test.json", "utf-8")) as string),
    };
    expect(serialized).toEqual(original);
  });
});

/**
 * Initializes the environment.
 *
 * Copies files in /dist and /example to the in-memory file system.
 * Note: Nested directories are not copied.
 */
async function initializeTestEnvironment(): Promise<EnvironmentFunctions> {
  const $fs = memfs.promises;
  // change the working directory to the inlang config directory to resolve relative paths
  process.cwd = () => "/example02";
  const $import = initialize$import({
    workingDirectory: "/example02",
    fs: $fs,
    fetch,
  });
  const env = {
    $fs,
    $import,
  };
  // only /dist and /example are needed and therefore copied
  for (const path of ["/dist", "/example02"]) {
    // create directory
    await $fs.mkdir(path, { recursive: true });
    for (const file of await nodeFs.promises.readdir("./" + path)) {
      if(path === "/dist"){
        await $fs.writeFile(
          `${path}/${file}`,
          await nodeFs.promises.readFile(`./${path}/${file}`, "utf-8"),
          { encoding: "utf-8" }
        );
      }else{
        if(file === "inlang.config.js"){
          await $fs.writeFile(
            `${path}/${file}`,
            await nodeFs.promises.readFile(`./${path}/${file}`, "utf-8"),
            { encoding: "utf-8" }
          );
        }else{
          await $fs.mkdir(`${path}/${file}`, { recursive: true });
          for (const languagefile of await nodeFs.promises.readdir(`./${path}/${file}`)) {
            const f = await nodeFs.promises.readFile(`./${path}/${file}/${languagefile}`, "utf-8");
            await $fs.writeFile(
              `${path}/${file}/${languagefile}`,
              f,
              { encoding: "utf-8" }
            );
          }
        }
      }
    }
  }
  return env;
}