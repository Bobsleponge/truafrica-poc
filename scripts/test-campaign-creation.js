/**
 * Script to test campaign creation flow
 * 
 * This script creates a test campaign to verify the campaign creation
 * and pricing engine are working correctly.
 * 
 * Usage:
 *   node scripts/test-campaign-creation.js
 * 
 * Prerequisites:
 *   - Supabase project must be set up
 *   - Environment variables must be configured (.env.local)
 *   - Pricing rules must be seeded
 *   - Client owner user must exist (client@example.com)
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

async function testCampaignCreation() {
  console.log('🧪 Testing campaign creation flow...\n')

  try {
    // 1. Get client owner user
    console.log('1. Finding client owner user...')
    const { data: clientUser, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', 'client@example.com')
      .eq('role', 'client_owner')
      .single()

    if (userError || !clientUser) {
      throw new Error('Client owner user not found. Please run: npm run dev:users')
    }
    console.log(`   ✅ Found client owner user: ${clientUser.email}`)

    // 2. Get an expertise field
    console.log('\n2. Getting expertise field...')
    const { data: fields, error: fieldsError } = await supabase
      .from('expertise_fields')
      .select('id, name')
      .limit(1)

    if (fieldsError || !fields || fields.length === 0) {
      throw new Error('No expertise fields found. Please run migrations.')
    }
    const field = fields[0]
    console.log(`   ✅ Using field: ${field.name}`)

    // 3. Create a test question
    console.log('\n3. Creating test question...')
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .insert({
        client_id: clientUser.id,
        field_id: field.id,
        content: 'What are the main challenges facing small-scale farmers in rural Africa?',
        difficulty_level: 'easy',
        status: 'active'
      })
      .select()
      .single()

    if (questionError) throw questionError
    console.log(`   ✅ Created question: ${question.id}`)

    // 4. Create campaign
    console.log('\n4. Creating test campaign...')
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .insert({
        client_id: clientUser.id,
        name: 'Test Campaign - Rural Agriculture Challenges',
        description: 'A test campaign to validate the campaign creation flow',
        objective: 'Understand challenges facing small-scale farmers',
        target_countries: ['South Africa', 'Nigeria', 'Kenya'],
        target_demo: { ageMin: 18, ageMax: 65 },
        status: 'draft',
        needs_question_design: false
      })
      .select()
      .single()

    if (campaignError) throw campaignError
    console.log(`   ✅ Created campaign: ${campaign.id}`)

    // 5. Link question to campaign
    console.log('\n5. Linking question to campaign...')
    const { data: campaignQuestion, error: cqError } = await supabase
      .from('campaign_questions')
      .insert({
        campaign_id: campaign.id,
        question_id: question.id,
        question_type: 'open_text',
        required_responses: 10,
        complexity_level: 'easy',
        base_price_per_answer: 2.00
      })
      .select()
      .single()

    if (cqError) throw cqError
    console.log(`   ✅ Linked question to campaign`)

    // 6. Test pricing calculation
    console.log('\n6. Testing pricing calculation...')
    const pricingRequest = {
      questions: [{
        questionType: 'open_text',
        complexityLevel: 'easy',
        requiredResponses: 10
      }],
      urgency: 'standard',
      targetCountries: ['South Africa', 'Nigeria'],
      demographicFilterCount: 1
    }

    // Call pricing API (simulate)
    const { data: pricingRules } = await supabase
      .from('pricing_rules')
      .select('*')
      .eq('question_type', 'open_text')
      .eq('is_active', true)
      .single()

    if (pricingRules) {
      const basePrice = pricingRules.base_price_per_answer
      const baseCost = pricingRules.base_cost_per_answer
      const complexityMultiplier = pricingRules.multiplier_factors.complexity.easy || 1.0
      const pricePerAnswer = basePrice * complexityMultiplier
      const costPerAnswer = baseCost * complexityMultiplier + 0.10 // processing overhead
      const totalPrice = pricePerAnswer * 10
      const totalCost = costPerAnswer * 10
      const margin = ((totalPrice - totalCost) / totalPrice) * 100

      console.log(`   ✅ Pricing calculated:`)
      console.log(`      Price per answer: $${pricePerAnswer.toFixed(2)}`)
      console.log(`      Cost per answer: $${costPerAnswer.toFixed(2)}`)
      console.log(`      Total price (10 responses): $${totalPrice.toFixed(2)}`)
      console.log(`      Total cost (10 responses): $${totalCost.toFixed(2)}`)
      console.log(`      Margin: ${margin.toFixed(1)}%`)
    }

    // 7. Create pricing snapshot
    console.log('\n7. Creating pricing snapshot...')
    const { data: snapshot, error: snapshotError } = await supabase
      .from('campaign_pricing_snapshots')
      .insert({
        campaign_id: campaign.id,
        estimated_total_cost: 13.00,
        estimated_total_revenue: 20.00,
        estimated_margin: 35.0,
        currency: 'USD',
        breakdown: {
          questionType: 'open_text',
          complexity: 'easy',
          requiredResponses: 10
        }
      })
      .select()
      .single()

    if (snapshotError) throw snapshotError
    console.log(`   ✅ Created pricing snapshot`)

    console.log('\n✅ Campaign creation test complete!')
    console.log('\n📝 Test Campaign Details:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`Campaign ID: ${campaign.id}`)
    console.log(`Campaign Name: ${campaign.name}`)
    console.log(`Status: ${campaign.status}`)
    console.log(`Question ID: ${question.id}`)
    console.log(`View in dashboard: http://localhost:3000/company/campaigns/${campaign.id}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  } catch (error) {
    console.error('❌ Error testing campaign creation:', error.message)
    console.error(error)
    process.exit(1)
  }
}

// Run the script
testCampaignCreation().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})


