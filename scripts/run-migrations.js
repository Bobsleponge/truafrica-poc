#!/usr/bin/env node

/**
 * Supabase Migration Runner
 * 
 * This script runs database migrations using Supabase Management API.
 * It requires SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function success(message) {
  console.log(`${colors.green}✓${colors.reset} ${message}`);
}

function error(message) {
  console.log(`${colors.red}✗${colors.reset} ${message}`);
}

function warning(message) {
  console.log(`${colors.yellow}⚠${colors.reset} ${message}`);
}

function info(message) {
  console.log(`${colors.cyan}ℹ${colors.reset} ${message}`);
}

function header(message) {
  console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.blue}${message}${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}\n`);
}

async function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envPath)) {
    error('.env.local file not found');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=').replace(/^["']|["']$/g, '');
      env[key.trim()] = value.trim();
    }
  });

  return env;
}

async function readMigrationFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Migration file not found: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf-8');
}

async function runMigrationsWithPostgres(env) {
  // Try using pg library if available, otherwise provide instructions
  try {
    // Dynamic import of pg (if installed)
    const { Client } = require('pg');
    
    let connectionString;
    let client;
    
    // Method 1: Use direct connection string if provided
    if (env.SUPABASE_DB_CONNECTION_STRING) {
      info('Using provided connection string...');
      connectionString = env.SUPABASE_DB_CONNECTION_STRING;
      
      try {
        client = new Client({ 
          connectionString: connectionString,
          ssl: {
            rejectUnauthorized: false
          }
        });
        await client.connect();
        success('Connected to database using provided connection string');
      } catch (err) {
        error(`Connection failed: ${err.message}`);
        throw new Error(`Connection failed: ${err.message}`);
      }
    } 
    // Method 2: Construct connection string from password
    else if (env.SUPABASE_DB_PASSWORD) {
      info('Constructing connection string from password...');
      
      // Extract database connection details from Supabase URL
      const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error('NEXT_PUBLIC_SUPABASE_URL not found in .env.local');
      }
      
      const projectRef = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1];
      if (!projectRef) {
        throw new Error('Could not extract project reference from Supabase URL');
      }

      const dbPassword = env.SUPABASE_DB_PASSWORD;
      
      // Try different connection string formats
      const connectionStrings = [
        // Format 1: Pooler transaction mode (port 6543) - most common
        `postgresql://postgres.${projectRef}:${encodeURIComponent(dbPassword)}@aws-0-${projectRef}.pooler.supabase.com:6543/postgres?pgbouncer=true`,
        // Format 2: Pooler session mode (port 5432)
        `postgresql://postgres.${projectRef}:${encodeURIComponent(dbPassword)}@aws-0-${projectRef}.pooler.supabase.com:5432/postgres?pgbouncer=true`,
        // Format 3: Alternative pooler format
        `postgresql://postgres.${projectRef}:${encodeURIComponent(dbPassword)}@${projectRef}.pooler.supabase.com:6543/postgres?pgbouncer=true`,
        // Format 4: Direct connection (if pooler not available)
        `postgresql://postgres:${encodeURIComponent(dbPassword)}@db.${projectRef}.supabase.co:5432/postgres`,
      ];
      
      let lastError;
      
      for (let i = 0; i < connectionStrings.length; i++) {
        try {
          info(`Trying connection format ${i + 1}...`);
          client = new Client({ 
            connectionString: connectionStrings[i],
            ssl: {
              rejectUnauthorized: false
            }
          });
          await client.connect();
          success(`Connected to database (format ${i + 1})`);
          connectionString = connectionStrings[i];
          break;
        } catch (err) {
          lastError = err;
          if (i === connectionStrings.length - 1) {
            error('All connection attempts failed');
            error(`Last error: ${lastError.message}`);
            info('\n💡 TIP: Use connection string method instead:');
            info('   1. Run: node scripts/setup-db-connection.js');
            info('   2. Or get connection string from Supabase Dashboard:');
            info('      Settings > Database > Connection string > URI');
            throw new Error(`Connection failed: ${lastError.message}`);
          }
        }
      }
    } else {
      throw new Error('Neither SUPABASE_DB_CONNECTION_STRING nor SUPABASE_DB_PASSWORD found in .env.local');
    }

    const migrationsDir = path.join(process.cwd(), 'lib', 'supabase', 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    if (migrationFiles.length === 0) {
      warning('No migration files found');
      await client.end();
      return;
    }

    header(`Running ${migrationFiles.length} migration(s)`);

    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      const sql = await readMigrationFile(filePath);
      
      info(`Running ${file}...`);
      
      try {
        // Execute migration in a transaction for safety
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');
        success(`✓ ${file} completed successfully`);
      } catch (err) {
        await client.query('ROLLBACK').catch(() => {}); // Ignore rollback errors
        // Check if error is because objects already exist
        if (err.message.includes('already exists') || 
            err.message.includes('duplicate') ||
            err.message.includes('relation') && err.message.includes('already exists')) {
          warning(`${file} - Some objects may already exist (this is OK if re-running)`);
          info(`   Error: ${err.message.split('\n')[0]}`);
        } else {
          error(`${file} failed: ${err.message}`);
          await client.end();
          throw err;
        }
      }
    }

    await client.end();
    success('All migrations completed successfully!');
    
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      error('pg package not found. Installing...');
      info('Run: npm install --save-dev pg');
      info('Or use Supabase CLI: supabase db push');
      throw new Error('pg package required for programmatic migrations');
    }
    throw err;
  }
}

async function main() {
  header('TruAfrica POC - Database Migration Runner');

  try {
    // Load environment variables
    info('Loading environment variables...');
    const env = await loadEnvFile();
    
    // Set environment variables for this process
    Object.keys(env).forEach(key => {
      process.env[key] = env[key];
    });

    if (!env.NEXT_PUBLIC_SUPABASE_URL) {
      error('NEXT_PUBLIC_SUPABASE_URL not found in .env.local');
      process.exit(1);
    }

    success('Environment variables loaded');

    // Check if we have database connection credentials
    const hasConnectionString = !!env.SUPABASE_DB_CONNECTION_STRING;
    const hasDbPassword = !!env.SUPABASE_DB_PASSWORD;
    const hasServiceRoleKey = !!env.SUPABASE_SERVICE_ROLE_KEY;

    if (!hasConnectionString && !hasDbPassword && !hasServiceRoleKey) {
      warning('No database connection credentials found');
      info('\nTo run migrations programmatically, add one of these to .env.local:');
      info('1. SUPABASE_DB_CONNECTION_STRING - Full connection URI (Recommended)');
      info('   (Get it from: Supabase Dashboard > Settings > Database > Connection string > URI)');
      info('2. SUPABASE_DB_PASSWORD - Your database password');
      info('   (Get it from: Supabase Dashboard > Settings > Database > Connection string)');
      info('\n💡 Quick setup: Run "node scripts/setup-db-connection.js" to configure automatically\n');
      info('For now, showing migration SQL files for manual execution...\n');
      
      // Show migration files
      const { main: showMigrations } = require('./show-migrations.js');
      await showMigrations();
      
      info('\nOr run: node scripts/setup-db-connection.js');
      process.exit(0);
    }

    // Try PostgreSQL connection approach
    if (hasConnectionString || hasDbPassword) {
      await runMigrationsWithPostgres(env);
      return;
    }

    // If we only have service role key, we'd need a different approach
    // For now, provide instructions
    warning('Service role key found but direct SQL execution via REST API is not supported');
    info('Please use one of these methods:');
    info('1. Add SUPABASE_DB_PASSWORD to .env.local');
    info('2. Use Supabase CLI: supabase db push');
    info('3. Run migrations manually in Supabase SQL Editor');

  } catch (err) {
    error(`Migration failed: ${err.message}`);
    console.error(err);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(err => {
    error(`Fatal error: ${err.message}`);
    process.exit(1);
  });
}

module.exports = { main };

