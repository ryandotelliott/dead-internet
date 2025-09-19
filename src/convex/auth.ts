import { convex } from "@convex-dev/better-auth/plugins";
import { components, internal } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";
import { betterAuth } from "better-auth";
import {
  AuthFunctions,
  createClient,
  GenericCtx,
} from "@convex-dev/better-auth";

const siteUrl = process.env.SITE_URL;

const authFunctions: AuthFunctions = internal.auth;

export const authComponent = createClient<DataModel>(components.betterAuth, {
  authFunctions: authFunctions,
  triggers: {
    user: {
      onCreate: async (ctx, authUser) => {
        console.log("User created", authUser);
        const existingProfile = await ctx.db
          .query("profiles")
          .withIndex("byUserId", (q) => q.eq("userId", authUser._id))
          .unique();

        if (existingProfile) {
          await ctx.db.patch(existingProfile._id, {
            userId: authUser._id,
            name: authUser.name,
            email: authUser.email,
          });
          return;
        }

        await ctx.db.insert("profiles", {
          name: authUser.name,
          email: authUser.email,
          userId: authUser._id,
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

export const { onCreate, onUpdate, onDelete } = authComponent.triggersApi();
