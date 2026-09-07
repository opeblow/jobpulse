import { defineApp } from "convex/server";
import staticHosting from "@convex-dev/static-hosting/convex.config";

const app = defineApp();
app.use(staticHosting); // no httpPrefix: app keeps HTTP routes at the root

export default app;
