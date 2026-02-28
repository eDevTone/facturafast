import { defineConfig } from 'drizzle-kit'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

export default defineConfig({
  dialect: 'postgresql',
  schema: './drizzle/schemas/*',
  out: './drizzle/migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
})
