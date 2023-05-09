import { z } from "zod";

export const zPluginSettings = z.object({
  pathPattern: z
    .string({
      description:
        "Defines the path pattern for the resources. Must include the `{language}` placeholder.",
    })
    .regex(/{language}/, {
      message:
        "The pathPattern setting must be defined and include the {language} placeholder. An example would be './resources/{language}.json'.",
    })
    .endsWith(".json"),
  variableReferencePattern: z.tuple([z.string(), z.string()]).optional(),
});

export type PluginSettings = z.infer<typeof zPluginSettings>;
