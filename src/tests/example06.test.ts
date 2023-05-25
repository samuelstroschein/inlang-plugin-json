/*
Test 6
- Test adding messages without metadata (commit)
*/

import { expect, test } from "vitest";
import { mockEnvironment, testConfig } from "@inlang/core/test";
import { setupConfig } from "@inlang/core/config";
import fs from "node:fs/promises";
import type * as ast from "@inlang/core/ast";

test("inlang's config validation should pass", async () => {
  const env = await mockEnvironment({
    copyDirectory: {
      fs: fs,
      paths: ["./dist", "./example06"],
    },
  });

  const module = await import("../../example06/inlang.config.js");
  const config = await setupConfig({ module, env });

  const [isOk, error] = await testConfig({ config });
  if (error) {
    throw error;
  }
  expect(isOk).toBe(true);

  //custom test
  const resources = await config.readResources({ config });
  expect(JSON.stringify(resources) === JSON.stringify(referenceResources)).toBe(true);

  //add message
  await config.writeResources({ config, resources: referenceResourcesNew as ast.Resource[] });
  const resourcesNew = await config.readResources({ config });
  expect(JSON.stringify(resourcesNew) === JSON.stringify(referenceResourcesNewExpected)).toBe(true);
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
        metadata: { fileName: 'translation', keyName: 'message01' },
        id: { type: 'Identifier', name: 'translation.message01' },
        pattern: { 
          type: 'Pattern', 
          elements: [ { type: 'Text', value: 'first' } ] }
      }
    ]
  }
];

const referenceResourcesNew = [
  {
    type: 'Resource',
    metadata: { space: 2 },
    languageTag: { type: 'LanguageTag', name: 'en' },
    body: [ 
      {
        type: 'Message',
        metadata: { fileName: 'translation', keyName: 'message01' },
        id: { type: 'Identifier', name: 'translation.message01' },
        pattern: { 
          type: 'Pattern', 
          elements: [ { type: 'Text', value: 'first' } ] }
      },{
        type: 'Message',
        id: { type: 'Identifier', name: 'translation.message02' },
        pattern: { 
          type: 'Pattern', 
          elements: [ { type: 'Text', value: 'second' } ] }
      }
    ]
  }
];

const referenceResourcesNewExpected = [
  {
    type: 'Resource',
    metadata: { space: 2 },
    languageTag: { type: 'LanguageTag', name: 'en' },
    body: [ 
      {
        type: 'Message',
        metadata: { fileName: 'translation', keyName: 'message01' },
        id: { type: 'Identifier', name: 'translation.message01' },
        pattern: { 
          type: 'Pattern', 
          elements: [ { type: 'Text', value: 'first' } ] }
      },{
        type: 'Message',
        metadata: { fileName: 'translation', keyName: 'message02' },
        id: { type: 'Identifier', name: 'translation.message02' },
        pattern: { 
          type: 'Pattern', 
          elements: [ { type: 'Text', value: 'second' } ] }
      }
    ]
  }
];

