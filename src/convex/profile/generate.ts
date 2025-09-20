"use node";

import { internalAction } from "@/convex/_generated/server";
import { v } from "convex/values";
import { z } from "zod";
import { generateObject } from "ai";
import { internal } from "@/convex/_generated/api";
import { dedent } from "ts-dedent";

const SYSTEM_PROMPT = `
You simulate an aging corporate intranet directory inside a "dead internet" world.
Produce personas that feel plausible at a glance yet subtly uncanny—like fragments of
profiles that survived migrations, audits, and quiet data corruptions.

Tone and constraints:
- Professional, affectless, and corporate-first, with ossified jargon and softened euphemisms.
- Uncanny, but not comedic. No overt horror; prefer mild drift and bureaucratic menace.
- Allow 0-1 minor anomalies (e.g., obsolete job titles, slightly anachronistic phrasing,
  or a harmless bracketed tag like [REDACTED] once). Never break grammar or validity.
- Output must remain internally consistent and believable.
- Do not include markdown or lists in fields.

Field requirements:
- name: a realistic full name suitable for an enterprise directory.
- email: valid and routable, using the @deadnet.com domain.
- summary: one sentence (24-320 chars) that hints at role, tone, and goals within DeadNet,
 touching on performance optics, risk management, or procedural escalation.
`;

enum PersonaCategory {
  security = "security",
  compliance = "compliance",
  growth = "growth",
  archives = "archives",
  liaison = "liaison",
  operations = "operations",
  support = "support",
  legal = "legal",
  engineering = "engineering",
  unknown = "unknown",
}

const randomCategory = () => {
  return Object.values(PersonaCategory)[
    Math.floor(Math.random() * Object.values(PersonaCategory).length)
  ];
};

export const run = internalAction({
  args: {
    isUserProfile: v.boolean(),
    context: v.optional(v.string()),
    emailAddress: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const category = randomCategory();
    const persona = await generatePersonaForCategory(category, args.context);

    await ctx.runMutation(internal.profile.profiles.create, {
      name: persona.name,
      email: args.emailAddress ?? persona.email,
      personaSummary: persona.summary,
      personaCategory: category,
    });

    return null;
  },
});

const PersonaSchema = z.object({
  name: z
    .string()
    .min(3)
    .max(80)
    .describe("Realistic full name suitable for an enterprise directory."),
  email: z
    .string()
    .email()
    .describe("Valid and routable, using the @deadnet.com domain."),
  summary: z
    .string()
    .min(24)
    .max(320)
    .describe(
      "One sentence (24-320 chars) that hints at role, tone, and goals within DeadNet, touching on performance optics, risk management, or procedural escalation.",
    ),
});

type Persona = z.infer<typeof PersonaSchema>;

export const generatePersonaForCategory = async (
  category: PersonaCategory,
  context?: string,
): Promise<Persona> => {
  try {
    const response = await generateObject({
      model: "gpt-5-mini",
      schema: PersonaSchema,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: dedent(
            `Generate a persona for the ${category} division within DeadNet.
            ${context ? `Context: ${context}\n` : ""}
            Requirements:
            - Provide realistic name and a valid @deadnet.com email.
            - Summary is a single sentence (24-320 chars), dead-internet corporate tone.
            - Subtle strangeness allowed, but keep it plausible and internally consistent.
            - No markdown, no lists, no meta commentary.`,
          ),
        },
      ],
    });

    const output = response.object;
    if (!output) {
      throw new Error("OpenAI returned no text");
    }

    return {
      name: output.name,
      email: output.email,
      summary: output.summary,
    };
  } catch (error) {
    throw new Error("Failed to generate persona");
  }
};
