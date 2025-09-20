import { components, internal } from "@/convex/_generated/api";
import { Agent } from "@convex-dev/agent";
import { openai } from "@ai-sdk/openai";
import { internalAction } from "@/convex/_generated/server";
import { v } from "convex/values";
import { z } from "zod";

const personaAgent = new Agent(components.agent, {
  name: "personaAgent",
  languageModel: openai.chat("gpt-5-mini"),
});

const PersonaSchema = z.object({
  name: z.string().min(3).max(80),
  email: z.string().email(),
  summary: z.string().min(24).max(320),
  category: z.enum([
    "security",
    "compliance",
    "growth",
    "archives",
    "liaison",
    "operations",
    "support",
    "legal",
    "engineering",
    "unknown",
  ]),
});

export const generatePersonaForProfile = internalAction({
  args: {
    profileId: v.id("profiles"),
    context: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { thread } = await personaAgent.createThread(ctx, {
      userId: args.profileId,
    });

    const result: { object: z.infer<typeof PersonaSchema> } =
      await thread.generateObject({
        schema: PersonaSchema,
        system:
          "You simulate an aging corporate intranet directory in a 'dead internet' world. Produce plausible but faintly uncanny personas.",
        prompt: [
          {
            role: "system",
            content: `Generate persona fields for the profile. ${args.context ?? ""}\n- name: realistic full name.\n- email: valid @deadnet.com.\n- summary: single sentence (24-320 chars), corporate tone, subtle anomaly allowed.\n- category: choose from provided set.`,
          },
        ],
      });

    const { name, email, summary, category } = result.object;

    await ctx.runMutation(internal.profile.profiles.setPersona, {
      profileId: args.profileId,
      personaSummary: summary,
      personaCategory: category,
    });

    return null;
  },
});
