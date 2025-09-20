import { defineApp } from "convex/server";
import betterAuth from "@convex-dev/better-auth/convex.config";
import agent from "@convex-dev/agent/convex.config";

const app = defineApp();
app.use(betterAuth);
app.use(agent);

export default app;
