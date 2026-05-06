import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { attachRequestContext } from "./middleware/requestContext.js";
import { SqliteMemoryStore } from "@raelix/memory";
import { BrainOrchestrator } from "./brain/orchestrator.js";
import { createApiRouter } from "./routes/api.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(attachRequestContext(env.defaultRole as "admin" | "family" | "child" | "guest"));

const memory = new SqliteMemoryStore(env.dbPath);
const brain = new BrainOrchestrator(memory, env.projectsDir);

await brain.initialize();

app.use("/api", createApiRouter({ brain, memory }));

app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`RAELIX API running on http://localhost:${env.port}`);
});
