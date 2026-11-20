import app from "./app";
import { env } from "./config/env";

const server = app.listen(env.PORT, () => {
  console.log(`SupportDesk API running on port ${env.PORT}`);
});

process.on("SIGINT", () => {
  server.close(() => {
    console.log("API server stopped.");
    process.exit(0);
  });
});
