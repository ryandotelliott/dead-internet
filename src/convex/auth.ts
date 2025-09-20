import { convex } from "@convex-dev/better-auth/plugins";
import { components, internal } from "@/convex/_generated/api";
import { DataModel } from "@/convex/_generated/dataModel";
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
        // TODO: Generate persona for the user
        // TODO: Generate AI profiles to message the user

        await ctx.runMutation(internal.profile.profiles.createProfile, {
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
