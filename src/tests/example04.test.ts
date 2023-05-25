/*
Test 4
- file with flattened keys and file with nested json in one repo
*/

import { expect, test } from "vitest";
import { mockEnvironment, testConfig } from "@inlang/core/test";
import { setupConfig } from "@inlang/core/config";
import fs from "node:fs/promises";

test("inlang's config validation should pass", async () => {
  const env = await mockEnvironment({
    copyDirectory: {
      fs: fs,
      paths: ["./dist", "./example04"],
    },
  });

  const module = await import("../../example04/inlang.config.js");
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
    languageTag: { type: 'LanguageTag', name: 'de' },
    body: [ 
      {
        type: 'Message',
        metadata: { keyName: 'title' },
        id: { type: 'Identifier', name: 'title' },
        pattern: { 
          type: 'Pattern',
          elements: [ 
            { 
              type: 'Placeholder', 
              body: { type: 'VariableReference', name: 'appName' }
            } 
          ]
        }
      },
      {
        type: 'Message',
        metadata: { keyName: 'description' },
        id: { type: 'Identifier', name: 'description' },
        pattern: { 
          type: 'Pattern', 
          elements: [
            {
              type: 'Placeholder',
              body: { type: 'VariableReference', name: 'appName' }
            },
            { type: 'Text', value: ' ist cool.' }
          ]
        }
      },
      {
        type: 'Message',
        metadata: { parentKeys: ['nav'], keyName: 'home' },
        id: { type: 'Identifier', name: 'nav.home' },
        pattern: { 
          type: 'Pattern', 
          elements: [ { type: 'Text', value: 'Startseite' } ] }
      },
      {
        type: 'Message',
        metadata: { parentKeys: ['nav'], keyName: 'about' },
        id: { type: 'Identifier', name: 'nav.about' },
        pattern: { 
          type: 'Pattern', 
          elements: [ { type: 'Text', value: 'Über uns' } ] }
      },
    ]
  },{
    type: 'Resource',
    metadata: { space: 2 },
    languageTag: { type: 'LanguageTag', name: 'en' },
    body: [ 
      {
        type: 'Message',
        metadata: { keyName: 'title' },
        id: { type: 'Identifier', name: 'title' },
        pattern: { 
          type: 'Pattern',
          elements: [ 
            { 
              type: 'Placeholder', 
              body: { type: 'VariableReference', name: 'appName' }
            } 
          ]
        }
      },
      {
        type: 'Message',
        metadata: { keyName: 'description' },
        id: { type: 'Identifier', name: 'description' },
        pattern: { 
          type: 'Pattern', 
          elements: [
            {
              type: 'Placeholder',
              body: { type: 'VariableReference', name: 'appName' }
            },
            { type: 'Text', value: ' is cool.' }
          ]
        }
      },
      {
        type: 'Message',
        metadata: { keyName: 'nav.home' },
        id: { type: 'Identifier', name: 'nav.home' },
        pattern: { 
          type: 'Pattern', 
          elements: [ { type: 'Text', value: 'Home' } ] }
      },
      {
        type: 'Message',
        metadata: { keyName: 'nav.about' },
        id: { type: 'Identifier', name: 'nav.about' },
        pattern: { 
          type: 'Pattern', 
          elements: [ { type: 'Text', value: 'About' } ] }
      },
    ]
  },{
    type: 'Resource',
    metadata: { space: 4 },
    languageTag: { type: 'LanguageTag', name: 'fr' },
    body: [ 
      {
        type: 'Message',
        metadata: { parentKeys: ['nav'], keyName: 'about.you' },
        id: { type: 'Identifier', name: 'nav.about.you' },
        pattern: { 
          type: 'Pattern',
          elements: [ 
            { type: 'Text', value: 'test' } 
          ]
        }
      },
      {
        type: 'Message',
        metadata: { parentKeys: ['nav.b', 'nav.c'], keyName: 'd' },
        id: { type: 'Identifier', name: 'nav.b.nav.c.d' },
        pattern: { 
          type: 'Pattern',
          elements: [ 
            { type: 'Text', value: 'e' } 
          ]
        }
      }
    ]
  }
];