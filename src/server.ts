import { app } from "./app.js";

const port = Number(process.env.PORT ?? 3000);

// Start the server
const server = app.listen(port, () => {
  console.log(`ReviewFlow API listening on port ${port}`);
});

// Graceful shutdown
function shutdown(signal: string): void {
  console.log(`${signal} received; shutting down HTTP server`);
  server.close((error) => {
    if (error) {
      console.error("Failed to close HTTP server cleanly", error);
      process.exitCode = 1;
    }
  });
}

process.once("SIGTERM", () => shutdown("SIGTERM"));
process.once("SIGINT", () => shutdown("SIGINT"));
