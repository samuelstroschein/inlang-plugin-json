/*
This is the try out test and can be used to test new szenarios. Please setup a new test if the one is not the
*/

import { expect, test } from "vitest";
import { mockEnvironment, testConfig } from "@inlang/core/test";
import { setupConfig } from "@inlang/core/config";
import fs from "node:fs/promises";

test("inlang's config validation should pass", async () => {
  const env = await mockEnvironment({
    copyDirectory: {
      fs: fs,
      paths: ["./dist", "./exampleTRY"],
    },
  });

  const module = await import("../../exampleTRY/inlang.config.js");
  const config = await setupConfig({ module, env });

  const [isOk, error] = await testConfig({ config });
  if (error) {
    throw error;
  }
  expect(isOk).toBe(true);

  //custom test
  const resources = await config.readResources({ config });
  //expect(JSON.stringify(resources) === JSON.stringify(referenceResources)).toBe(true);
});



// reference resources ----------------------------------------------

const referenceResources = [
  {
    type: 'Resource',
    metadata: { space: 2, flatten: false },
    languageTag: { type: 'LanguageTag', name: 'en' },
    body: [ 
      {
        type: 'Message',
        metadata: { isPrefixed: true },
        id: { type: 'Identifier', name: 'translation.numbers.404' },
        pattern: { 
          type: 'Pattern', 
          elements: [ { type: 'Text', value: 'not found' } ] }
      }
    ]
  },{
    type: 'Resource',
    metadata: { space: 2, flatten: false },
    languageTag: { type: 'LanguageTag', name: 'fr' },
    body: [ 
      {
        type: 'Message',
        metadata: { isPrefixed: true },
        id: { type: 'Identifier', name: 'translation.numbers.404' },
        pattern: { 
          type: 'Pattern', 
          elements: [ { type: 'Text', value: 'pas trouvé' } ] }
      }
    ]
  }
];