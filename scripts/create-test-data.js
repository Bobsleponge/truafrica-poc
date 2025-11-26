#!/usr/bin/env node

/**
 * Create Test Data Script
 * Helps create test users and questions for testing the platform
 * 
 * Note: This requires Supabase to be set up and environment variables configured
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
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

async function createTestData() {
  console.log('\n🧪 TruAfrica POC - Test Data Creator\n');
  console.log('This script helps you create test data for testing the platform.\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    error('Missing environment variables. Please run setup first.');
    console.log('Run: npm run setup:supabase\n');
    rl.close();
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Test connection
  console.log('Testing connection...');
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError && authError.message !== 'Invalid API key') {
    // Expected if not logged in
  }

  // Get expertise fields
  const { data: fields, error: fieldsError } = await supabase
    .from('expertise_fields')
    .select('*');

  if (fieldsError || !fields || fields.length === 0) {
    error('No expertise fields found. Please run migrations first.');
    rl.close();
    return;
  }

  success(`Found ${fields.length} expertise fields`);

  console.log('\nThis script will help you:');
  console.log('  1. Create sample questions (requires company account)');
  console.log('  2. View test data creation instructions\n');

  const choice = await question('What would you like to do? (1/2/q to quit): ');

  if (choice === '1') {
    console.log('\nTo create sample questions:');
    console.log('  1. Sign up as a company at http://localhost:3000/signup?role=company');
    console.log('  2. Login and go to Company Dashboard');
    console.log('  3. Click "Upload New Question"');
    console.log('  4. Create questions in different fields and difficulty levels\n');
    
    console.log('Sample questions you can create:');
    console.log('\nEasy Questions:');
    console.log('  - "What are the main challenges facing small-scale farmers in Africa today?"');
    console.log('  - "How can mobile technology improve access to financial services in African communities?"');
    console.log('\nMedium Questions:');
    console.log('  - "Describe the impact of climate change on agricultural productivity in your region."');
    console.log('  - "What are the main barriers to internet connectivity in African communities?"');
    console.log('\nHard Questions:');
    console.log('  - "Explain how renewable energy solutions can address power shortages in African cities."');
    console.log('  - "What strategies can be implemented to improve healthcare delivery in remote African regions?"\n');
  } else if (choice === '2') {
    console.log('\n📝 Test Data Creation Instructions\n');
    console.log('1. Create Test Users:');
    console.log('   - Sign up as contributor: http://localhost:3000/signup?role=contributor');
    console.log('   - Sign up as company: http://localhost:3000/signup?role=company');
    console.log('   - Use different email addresses for each\n');
    
    console.log('2. Complete Onboarding (as contributor):');
    console.log('   - Answer all 5 onboarding questions');
    console.log('   - This will set your initial trust score\n');
    
    console.log('3. Create Questions (as company):');
    console.log('   - Upload 3-5 questions');
    console.log('   - Use different expertise fields');
    console.log('   - Mix easy, medium, and hard difficulties\n');
    
    console.log('4. Answer Questions (as contributor):');
    console.log('   - Answer the company\'s questions');
    console.log('   - Submit detailed answers');
    console.log('   - Watch consensus scores calculate\n');
    
    console.log('5. View Analytics (as company):');
    console.log('   - Check dashboard for statistics');
    console.log('   - View charts and filters\n');
    
    console.log('For detailed testing scenarios, see: docs/TESTING.md\n');
  }

  rl.close();
}

createTestData().catch(err => {
  error(`Error: ${err.message}`);
  rl.close();
  process.exit(1);
});

