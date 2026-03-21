import { neon } from "@neondatabase/serverless"

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required")
  }

  const sql = neon(process.env.DATABASE_URL)
  console.log("Dropping schema public...")
  await sql`DROP SCHEMA public CASCADE;`

  console.log("Creating schema public...")
  await sql`CREATE SCHEMA public;`

  console.log("Database reset complete.")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
