/*
Test 5
- also use numbers as keys
*/

import { expect, test } from "vitest";
import { mockEnvironment, testConfig } from "@inlang/core/test";
import { setupConfig } from "@inlang/core/config";
import fs from "node:fs/promises";

test("inlang's config validation should pass", async () => {
  const env = await mockEnvironment({
    copyDirectory: {
      fs: fs,
      paths: ["./dist", "./example05"],
    },
  });

  const module = await import("../../example05/inlang.config.js");
  const config = await setupConfig({ module, env });

  const [isOk, error] = await testConfig({ config });
  if (error) {
    throw error;
  }
  expect(isOk).toBe(true);

  //custom test
  const resources = await config.readResources({ config });
  expect(JSON.stringify(resources) === JSON.stringify(referenceResources)).toBe(true);
});



// reference resources ----------------------------------------------

const referenceResources = [
  {
    type: 'Resource',
    metadata: { space: 2 },
    languageTag: { type: 'LanguageTag', name: 'en' },
    body: [ 
      {
        type: 'Message',
        metadata: { fileName: 'translation', parentKeys: ['numbers'], keyName: '404' },
        id: { type: 'Identifier', name: 'translation.numbers.404' },
        pattern: { 
          type: 'Pattern', 
          elements: [ { type: 'Text', value: 'not found' } ] }
      }
    ]
  },{
    type: 'Resource',
    metadata: { space: 2 },
    languageTag: { type: 'LanguageTag', name: 'fr' },
    body: [ 
      {
        type: 'Message',
        metadata: { fileName: 'translation', parentKeys: ['numbers'], keyName: '404' },
        id: { type: 'Identifier', name: 'translation.numbers.404' },
        pattern: { 
          type: 'Pattern', 
          elements: [ { type: 'Text', value: 'pas trouvé' } ] }
      }
    ]
  }
];