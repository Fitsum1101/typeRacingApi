import http from "http";

import app from "./app";
import { checkConnection, connectDB, disconnectDB } from "./config/db";

const server = http.createServer(app);

// -----------------------------
// Graceful shutdown
// -----------------------------
const gracefulShutdown = async (signal: string): Promise<void> => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  try {
    // Stop accepting new connections
    await new Promise<void>((resolve, reject) => {
      server.close((err?: Error) => (err ? reject(err) : resolve()));
    });
    console.log("✅ HTTP server closed.");

    // Disconnect from database
    await disconnectDB();
    console.log("✅ Database disconnected.");

    console.log("💤 Graceful shutdown completed.");
    process.exit(0);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("❌ Error during shutdown:", error.message);
    } else {
      console.error("❌ Unknown error during shutdown:", error);
    }
    process.exit(1);
  }
};

// -----------------------------
// Start server
// -----------------------------
const startServer = async (): Promise<void> => {
  try {
    console.log("🔗 Connecting to database...");
    await connectDB();
    console.log("✅ Database connected");

    const health = await checkConnection();
    if (!health.connected) {
      throw new Error(
        `Database health check failed: ${health.error ?? "Unknown error"}`,
      );
    }
    console.log("✅ Database health check passed");

    const PORT = Number(process.env.PORT) || 3000;
    server.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV ?? "development"}`);
    });

    server.on("error", (error: NodeJS.ErrnoException) => {
      console.error("❌ Server failed to start:", error.message);
      process.exit(1);
    });

    // Handle termination signals
    ["SIGINT", "SIGTERM", "SIGQUIT"].forEach((signal) => {
      void process.on(signal, () => gracefulShutdown(signal));
    });
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("❌ Failed to start server:", err.message);

      if (err.message.includes("did not initialize yet")) {
        console.log("\n💡 Possible Prisma solution:");
        console.log("1. npx prisma generate");
        console.log("2. npx prisma migrate dev --name init");
        console.log("3. npm run dev\n");
      }
    } else {
      console.error("❌ Unknown error during server start:", err);
    }

    process.exit(1);
  }
};

// -----------------------------
// Launch
// -----------------------------
void startServer();

export default server;
