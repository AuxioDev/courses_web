// The website never migrates the database: only the Student Diary does. This file exists so
// `prisma generate` can build the client from the shared schema.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: { url: process.env["DATABASE_URL"] },
});
