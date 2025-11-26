/**
 * Script to seed default pricing rules into the database
 * 
 * This script inserts default pricing rules for all question types
 * so the pricing engine can calculate costs and prices.
 * 
 * Usage:
 *   node scripts/seed-pricing-rules.js
 * 
 * Prerequisites:
 *   - Supabase project must be set up
 *   - Environment variables must be configured (.env.local)
 *   - Migration 004_seed_pricing_rules.sql should be run, or this script will insert them
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables from .env.local
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local')
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8')
    envFile.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/)
      if (match) {
        const key = match[1].trim()
        const value = match[2].trim().replace(/^["']|["']$/g, '')
        if (!process.env[key]) {
          process.env[key] = value
        }
      }
    })
  }
}

loadEnv()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase credentials')
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const pricingRules = [
  {
    question_type: 'open_text',
    base_price_per_answer: 2.00,
    base_cost_per_answer: 1.20,
    multiplier_factors: {
      complexity: { easy: 1.0, medium: 1.3, hard: 1.6 },
      urgency: { standard: 1.0, express: 1.3 },
      country: { default: 1.0, 'South Africa': 1.1, 'Nigeria': 1.0, 'Kenya': 1.0 }
    },
    is_active: true
  },
  {
    question_type: 'rating',
    base_price_per_answer: 1.50,
    base_cost_per_answer: 0.90,
    multiplier_factors: {
      complexity: { easy: 1.0, medium: 1.2, hard: 1.4 },
      urgency: { standard: 1.0, express: 1.2 },
      country: { default: 1.0, 'South Africa': 1.1, 'Nigeria': 1.0, 'Kenya': 1.0 }
    },
    is_active: true
  },
  {
    question_type: 'multiple_choice',
    base_price_per_answer: 1.50,
    base_cost_per_answer: 0.90,
    multiplier_factors: {
      complexity: { easy: 1.0, medium: 1.2, hard: 1.4 },
      urgency: { standard: 1.0, express: 1.2 },
      country: { default: 1.0, 'South Africa': 1.1, 'Nigeria': 1.0, 'Kenya': 1.0 }
    },
    is_active: true
  },
  {
    question_type: 'audio',
    base_price_per_answer: 3.00,
    base_cost_per_answer: 1.80,
    multiplier_factors: {
      complexity: { easy: 1.0, medium: 1.4, hard: 1.8 },
      urgency: { standard: 1.0, express: 1.4 },
      country: { default: 1.0, 'South Africa': 1.1, 'Nigeria': 1.0, 'Kenya': 1.0 }
    },
    is_active: true
  }
]

async function seedPricingRules() {
  console.log('🚀 Seeding pricing rules...\n')

  for (const rule of pricingRules) {
    try {
      console.log(`Inserting pricing rule for ${rule.question_type}...`)

      const { data, error } = await supabase
        .from('pricing_rules')
        .upsert({
          question_type: rule.question_type,
          base_price_per_answer: rule.base_price_per_answer,
          base_cost_per_answer: rule.base_cost_per_answer,
          multiplier_factors: rule.multiplier_factors,
          is_active: rule.is_active
        }, {
          onConflict: 'question_type'
        })
        .select()

      if (error) {
        if (error.code === '23505') {
          console.log(`  ⚠️  Pricing rule for ${rule.question_type} already exists, updating...`)
          const { error: updateError } = await supabase
            .from('pricing_rules')
            .update({
              base_price_per_answer: rule.base_price_per_answer,
              base_cost_per_answer: rule.base_cost_per_answer,
              multiplier_factors: rule.multiplier_factors,
              is_active: rule.is_active
            })
            .eq('question_type', rule.question_type)

          if (updateError) throw updateError
          console.log(`  ✅ Updated pricing rule for ${rule.question_type}`)
        } else {
          throw error
        }
      } else {
        console.log(`  ✅ Created pricing rule for ${rule.question_type}`)
        console.log(`     Base Price: $${rule.base_price_per_answer.toFixed(2)}`)
        console.log(`     Base Cost: $${rule.base_cost_per_answer.toFixed(2)}`)
        console.log(`     Margin: ${((rule.base_price_per_answer - rule.base_cost_per_answer) / rule.base_price_per_answer * 100).toFixed(1)}%`)
      }
      console.log('')
    } catch (error) {
      console.error(`  ❌ Error with ${rule.question_type}:`, error.message)
      console.log('')
    }
  }

  console.log('✅ Pricing rules seeding complete!\n')
}

// Run the script
seedPricingRules().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})




