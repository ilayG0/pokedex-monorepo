require("dotenv").config();

const http = require("http");
const { connectDB, disconnectDB } = require("./config/db");
const { createApp } = require("./app");
const { attachSocket } = require("./sockets/socket");

async function startServer() {
  await connectDB();

  const app = createApp();
  const PORT = process.env.PORT || 3000;

  const server = http.createServer(app);

  attachSocket(server);

  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  async function shutdown() {
    console.log("Shutting down server...");
    server.close(async () => {
      try {
        await disconnectDB();
      } catch (err) {
        console.error("Error disconnecting DB:", err);
      } finally {
        process.exit(0);
      }
    });
  }

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
