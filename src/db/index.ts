import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
const poolMax = Number(process.env.DATABASE_POOL_MAX ?? (process.env.NODE_ENV === "production" ? "5" : "1"));

const globalForDb = globalThis as unknown as {
  brewcycleSql?: ReturnType<typeof createSqlClient>;
};

function createSqlClient() {
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to connect to PostgreSQL.");
  }

  return postgres(connectionString, {
    prepare: false,
    max: poolMax,
    idle_timeout: 10,
    connect_timeout: 10
  });
}

function getSqlClient() {
  if (process.env.NODE_ENV === "production") {
    return createSqlClient();
  }

  if (!globalForDb.brewcycleSql) {
    globalForDb.brewcycleSql = createSqlClient();
  }

  return globalForDb.brewcycleSql;
}

function createDatabaseClient() {
  return drizzle(getSqlClient(), { schema });
}

export const db = connectionString
  ? createDatabaseClient()
  : new Proxy({} as ReturnType<typeof createDatabaseClient>, {
      get() {
        throw new Error("DATABASE_URL is required to connect to PostgreSQL.");
      }
    });

export type DbClient = typeof db;