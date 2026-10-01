import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });
let isConnected = false;

/**
 * Connect to the database
 */
export const connectDB = async (): Promise<PrismaClient> => {
  if (isConnected) {
    console.log("✅ Using existing Prisma connection");
    return prisma;
  }

  try {
    await prisma.$connect();
    isConnected = true;
    console.log("✅ Prisma connected to PostgreSQL");
    return prisma;
  } catch (error) {
    console.error("❌ Prisma connection error:", error);
    isConnected = false;
    throw error;
  }
};

/**
 * Get Prisma client instance
 */
export const getPrisma = (): PrismaClient => prisma;

/**
 * Check if database is reachable
 */
export const checkConnection = async (): Promise<{
  connected: boolean;
  error?: string;
}> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { connected: true };
  } catch (error: unknown) {
    const err = error as { message?: string };
    return { connected: false, error: err.message ?? "Unknown error" };
  }
};

/**
 * Disconnect Prisma
 */
export const disconnectDB = async (): Promise<void> => {
  await prisma.$disconnect();
  isConnected = false;
  console.log("✅ Prisma connection closed");
};

// Graceful shutdown
process.on("SIGTERM", async () => {
  await disconnectDB();
  process.exit(0);
});

process.on("SIGINT", async () => {
  await disconnectDB();
  process.exit(0);
});

export { prisma };
