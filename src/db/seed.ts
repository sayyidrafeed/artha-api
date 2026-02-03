import { db } from "./index"
import { categories } from "./schema"

const defaultCategories = [
  // Income categories
  { name: "Salary", type: "income" as const },
  { name: "Freelance", type: "income" as const },
  { name: "Investment", type: "income" as const },
  { name: "Gift", type: "income" as const },
  { name: "Other Income", type: "income" as const },

  // Expense categories
  { name: "Food & Dining", type: "expense" as const },
  { name: "Transportation", type: "expense" as const },
  { name: "Utilities", type: "expense" as const },
  { name: "Entertainment", type: "expense" as const },
  { name: "Healthcare", type: "expense" as const },
  { name: "Shopping", type: "expense" as const },
  { name: "Education", type: "expense" as const },
  { name: "Housing", type: "expense" as const },
  { name: "Other Expense", type: "expense" as const },
]

async function seed(): Promise<void> {
  console.info("Seeding categories...")

  for (const category of defaultCategories) {
    await db.insert(categories).values(category).onConflictDoNothing()
  }

  console.info("Categories seeded successfully!")
  console.info("Note: Owner account should be created via OAuth sign-in")
  process.exit(0)
}

seed().catch((error) => {
  console.error("Seed failed:", error)
  process.exit(1)
})
