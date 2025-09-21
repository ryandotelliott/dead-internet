import { components, internal } from "@/convex/_generated/api";
import { Agent } from "@convex-dev/agent";
import { openai } from "@ai-sdk/openai";
import { internalAction } from "@/convex/_generated/server";
import { v } from "convex/values";
import { z } from "zod";

const personaAgent = new Agent(components.agent, {
  name: "personaAgent",
  languageModel: openai.responses("gpt-5-mini"),
});

const PersonaSchema = z.object({
  name: z.string(),
  email: z.string(),
  summary: z.string(),
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
    emailAddress: v.optional(v.string()),
    emailBody: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { thread } = await personaAgent.createThread(ctx, {
      userId: args.profileId,
    });

    let prompt = `Generate a new persona including a full name, email address, and summary of the personality & role. Use a corporate tone. A subtle anomoly in the profile is allowed.`;

    if (args.emailAddress) {
      prompt = `Generate a new persona for ${args.emailAddress}.`;

      if (args.emailBody) {
        prompt += ` The first message sent to this persona is: ${args.emailBody}. Don't reference this message in the summary, just use it as context for the persona.`;
      }
    }

    const result: { object: z.infer<typeof PersonaSchema> } =
      await thread.generateObject({
        schema: PersonaSchema,
        system:
          "You simulate an aging corporate intranet directory in a 'dead internet' world. Produce plausible but faintly uncanny personas.",
        prompt: [
          {
            role: "system",
            content: prompt,
          },
        ],
        maxOutputTokens: 800,
      });

    const { name, email, summary, category } = result.object;

    await ctx.runMutation(internal.profile.profiles.update, {
      profileId: args.profileId,
      name: name,
      email: email,
      personaSummary: summary,
      personaCategory: category,
    });

    return null;
  },
});
