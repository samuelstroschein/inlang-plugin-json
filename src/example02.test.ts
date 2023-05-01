import { expect, test } from "vitest";
import { mockEnvironment, validateConfig } from "@inlang/core/test";
import { setupConfig } from "@inlang/core/config";
import fs from "node:fs/promises";

test("inlang's config validation should pass", async () => {
  const env = await mockEnvironment({
    copyDirectory: {
      fs: fs,
      paths: ["./dist", "./example02"],
    },
  });

  const module = await import("../example02/inlang.config.js");

  const config = await setupConfig({ module, env });

  const [isOk, error] = await validateConfig({ config });

  if (error) {
    throw error;
  }
  expect(isOk).toBe(true);
});
