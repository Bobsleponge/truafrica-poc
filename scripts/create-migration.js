#!/usr/bin/env node

/**
 * Create New Migration File
 * Helper script to create a new migration file with proper template
 */

const fs = require('fs')
const path = require('path')
const readline = require('readline')

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function success(message) {
  console.log(`${colors.green}✓${colors.reset} ${message}`)
}

function error(message) {
  console.log(`${colors.red}✗${colors.reset} ${message}`)
}

function info(message) {
  console.log(`${colors.cyan}ℹ${colors.reset} ${message}`)
}

function header(message) {
  console.log(`\n${colors.blue}${'='.repeat(70)}${colors.reset}`)
  console.log(`${colors.blue}${message}${colors.reset}`)
  console.log(`${colors.blue}${'='.repeat(70)}${colors.reset}\n`)
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

function getNextMigrationNumber() {
  const migrationsDir = path.join(process.cwd(), 'lib', 'supabase', 'migrations')
  if (!fs.existsSync(migrationsDir)) {
    return 1
  }

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .map(f => {
      const match = f.match(/^(\d+)_/)
      return match ? parseInt(match[1]) : 0
    })
    .filter(n => n > 0)
    .sort((a, b) => b - a)

  return files.length > 0 ? files[0] + 1 : 1
}

function createMigrationTemplate(number, name, description) {
  const safeName = name.toLowerCase().replace(/[^a-z0-9]/g, '_')
  const fileName = `${String(number).padStart(3, '0')}_${safeName}.sql`

  const template = `-- Migration ${String(number).padStart(3, '0')}: ${name}
-- ${description}

-- TODO: Add your migration SQL here
-- 
-- Examples:
-- 
-- Create new table:
-- CREATE TABLE IF NOT EXISTS public.new_table (
--   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--   name TEXT NOT NULL,
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );
--
-- Add column to existing table:
-- ALTER TABLE public.existing_table
--   ADD COLUMN IF NOT EXISTS new_column TEXT;
--
-- Create enum:
-- DO $$ BEGIN
--   CREATE TYPE new_enum_type AS ENUM ('value1', 'value2');
-- EXCEPTION
--   WHEN duplicate_object THEN null;
-- END $$;
--
-- Add index:
-- CREATE INDEX IF NOT EXISTS idx_table_column ON public.table(column);
--
-- Enable RLS:
-- ALTER TABLE public.new_table ENABLE ROW LEVEL SECURITY;
--
-- Add policy:
-- DROP POLICY IF EXISTS "policy_name" ON public.new_table;
-- CREATE POLICY "policy_name"
--   ON public.new_table FOR SELECT
--   USING (auth.uid() IS NOT NULL);
--
-- Add trigger:
-- DROP TRIGGER IF EXISTS update_table_updated_at ON public.new_table;
-- CREATE TRIGGER update_table_updated_at BEFORE UPDATE ON public.new_table
--   FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

`

  return { fileName, template }
}

async function main() {
  header('Create New Migration File')

  try {
    const migrationsDir = path.join(process.cwd(), 'lib', 'supabase', 'migrations')
    
    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir, { recursive: true })
      info('Created migrations directory')
    }

    const nextNumber = getNextMigrationNumber()
    info(`Next migration number: ${nextNumber}`)

    const name = await question('Migration name (e.g., "add_user_preferences"): ')
    if (!name) {
      error('Migration name is required')
      rl.close()
      process.exit(1)
    }

    const description = await question('Description (what does this migration do?): ')
    if (!description) {
      error('Description is required')
      rl.close()
      process.exit(1)
    }

    const { fileName, template } = createMigrationTemplate(nextNumber, name, description)
    const filePath = path.join(migrationsDir, fileName)

    if (fs.existsSync(filePath)) {
      error(`File already exists: ${fileName}`)
      rl.close()
      process.exit(1)
    }

    fs.writeFileSync(filePath, template)
    success(`Created migration file: ${fileName}`)
    info(`Location: ${filePath}`)
    
    info('\nNext steps:')
    info('1. Edit the migration file and add your SQL')
    info('2. Test in Supabase SQL Editor first')
    info('3. Run: npm run migrate')
    info('4. Or run manually in Supabase Dashboard')

  } catch (err) {
    error(`Error: ${err.message}`)
    console.error(err)
    process.exit(1)
  } finally {
    rl.close()
  }
}

if (require.main === module) {
  main().catch(err => {
    error(`Fatal error: ${err.message}`)
    process.exit(1)
  })
}

module.exports = { main, getNextMigrationNumber, createMigrationTemplate }



