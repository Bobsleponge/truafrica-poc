#!/usr/bin/env node

/**
 * Environment Configuration Script
 * Helps configure .env.local with Supabase credentials
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function success(text) {
  console.log(`${colors.green}✓${colors.reset} ${text}`);
}

function error(text) {
  console.log(`${colors.red}✗${colors.reset} ${text}`);
}

function info(text) {
  console.log(`${colors.blue}ℹ${colors.reset} ${text}`);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function configureEnv() {
  console.log(`\n${colors.cyan}🔧 TruAfrica POC - Environment Configuration${colors.reset}\n`);

  const envPath = path.join(process.cwd(), '.env.local');
  const examplePath = path.join(process.cwd(), '.env.example');

  // Check if .env.local already exists
  if (fs.existsSync(envPath)) {
    const existing = fs.readFileSync(envPath, 'utf8');
    const hasUrl = existing.includes('NEXT_PUBLIC_SUPABASE_URL=') && 
                   !existing.includes('NEXT_PUBLIC_SUPABASE_URL=your_') &&
                   !existing.includes('NEXT_PUBLIC_SUPABASE_URL=\n');
    const hasKey = existing.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY=') && 
                   !existing.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_') &&
                   !existing.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY=\n');

    if (hasUrl && hasKey) {
      info('.env.local already exists with credentials');
      const overwrite = await question('Do you want to update it? (y/n): ');
      if (overwrite.toLowerCase() !== 'y') {
        console.log('\nKeeping existing configuration.');
        rl.close();
        return;
      }
    }
  }

  console.log('Please provide your Supabase credentials:');
  console.log('(You can find these in Supabase Dashboard > Settings > API)\n');

  const supabaseUrl = await question('Supabase Project URL: ');
  const supabaseKey = await question('Supabase anon public key: ');

  if (!supabaseUrl || !supabaseKey || 
      supabaseUrl.trim() === '' || supabaseKey.trim() === '' ||
      supabaseUrl.includes('your_') || supabaseKey.includes('your_')) {
    error('Invalid credentials provided');
    rl.close();
    return;
  }

  console.log('\n---\n');
  console.log('OpenAI API Key (Optional but recommended for AI features):');
  console.log('(Get your key from https://platform.openai.com/api-keys)');
  console.log('(Press Enter to skip and configure later)\n');
  
  const openaiKey = await question('OpenAI API Key (optional): ');

  // Read example file or create template
  let envContent = '';
  if (fs.existsSync(examplePath)) {
    envContent = fs.readFileSync(examplePath, 'utf8');
  } else {
    envContent = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# OpenAI Configuration
OPENAI_API_KEY=

# Optional: Reward API Integrations
# AIRTIME_API_KEY=
# MOBILE_MONEY_API_KEY=
# VOUCHER_API_KEY=
`;
  }

  // Update with provided values
  envContent = envContent.replace(
    /NEXT_PUBLIC_SUPABASE_URL=.*/,
    `NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl.trim()}`
  );
  envContent = envContent.replace(
    /NEXT_PUBLIC_SUPABASE_ANON_KEY=.*/,
    `NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseKey.trim()}`
  );
  
  // Update OpenAI API key if provided
  if (openaiKey && openaiKey.trim() !== '' && !openaiKey.includes('your_')) {
    if (envContent.includes('OPENAI_API_KEY=')) {
      envContent = envContent.replace(
        /OPENAI_API_KEY=.*/,
        `OPENAI_API_KEY=${openaiKey.trim()}`
      );
    } else {
      // Add OpenAI API key if it doesn't exist in the template
      envContent += `\n# OpenAI Configuration\nOPENAI_API_KEY=${openaiKey.trim()}\n`;
    }
    success('OpenAI API key configured');
  } else {
    info('OpenAI API key skipped (you can add it later to .env.local)');
  }

  // Write to .env.local
  fs.writeFileSync(envPath, envContent);
  success('Environment variables saved to .env.local');

  console.log('\nNext steps:');
  console.log('  1. Run: npm run setup:test-db (test connection)');
  console.log('  2. Run: npm run setup:verify (complete verification)');
  if (!openaiKey || openaiKey.trim() === '' || openaiKey.includes('your_')) {
    console.log('  3. Add OPENAI_API_KEY to .env.local for AI features');
    console.log('  4. Run: npm run dev (start development server)\n');
  } else {
    console.log('  3. Run: npm run dev (start development server)\n');
  }

  rl.close();
}

configureEnv().catch(err => {
  error(`Error: ${err.message}`);
  rl.close();
  process.exit(1);
});

