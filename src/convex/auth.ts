import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { components } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";
import { betterAuth } from "better-auth";

const siteUrl = process.env.SITE_URL;

export const authComponent = createClient<DataModel>(components.betterAuth, {
  triggers: {
    user: {
      onCreate: async (ctx, user) => {
        const existingProfile = await ctx.db
          .query("profiles")
          .withIndex("byEmail", (q) => q.eq("email", user.email))
          .unique();

        if (existingProfile) {
          await ctx.db.patch(existingProfile._id, {
            userId: user._id,
            name: user.name,
            email: user.email,
          });
          return;
        }

        await ctx.db.insert("profiles", {
          userId: user._id,
          name: user.name,
          email: user.email,
        });
      },
    },
  },
});

export const createAuth = (
  ctx: GenericCtx<DataModel>,
  { optionsOnly } = { optionsOnly: false },
) => {
  return betterAuth({
    logger: {
      disabled: optionsOnly,
    },
    baseURL: siteUrl,
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    plugins: [convex()],
  });
};
