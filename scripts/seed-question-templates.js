/**
 * Seed Question Templates
 * Populates the question_templates table with sector-specific templates
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const templates = [
  // Retail Sector
  {
    sector: 'Retail',
    question_type: 'multiple_choice',
    content: 'How often do you shop for groceries?',
    options: ['Daily', '2-3 times per week', 'Once a week', 'Less than once a week'],
    metadata: { category: 'shopping_habits' },
    is_internal: false,
  },
  {
    sector: 'Retail',
    question_type: 'rating_scale',
    content: 'Rate your satisfaction with the product quality (1-5)',
    options: ['1', '2', '3', '4', '5'],
    metadata: { category: 'satisfaction' },
    is_internal: false,
  },
  
  // Healthcare Sector
  {
    sector: 'Healthcare',
    question_type: 'single_choice',
    content: 'What is your primary method of accessing healthcare?',
    options: ['Public clinic', 'Private clinic', 'Hospital', 'Traditional healer', 'Self-medication'],
    metadata: { category: 'access' },
    is_internal: false,
  },
  {
    sector: 'Healthcare',
    question_type: 'long_text',
    content: 'Describe the main challenges you face in accessing healthcare services',
    options: [],
    metadata: { category: 'challenges' },
    is_internal: false,
  },
  
  // Finance Sector
  {
    sector: 'Finance',
    question_type: 'multiple_choice',
    content: 'Which financial services do you currently use?',
    options: ['Bank account', 'Mobile money', 'Savings group', 'Microfinance', 'None'],
    metadata: { category: 'services' },
    is_internal: false,
  },
  {
    sector: 'Finance',
    question_type: 'short_text',
    content: 'What is the main barrier preventing you from using formal financial services?',
    options: [],
    metadata: { category: 'barriers' },
    is_internal: false,
  },
  
  // Agriculture Sector
  {
    sector: 'Agriculture',
    question_type: 'single_choice',
    content: 'What type of farming do you practice?',
    options: ['Subsistence farming', 'Commercial farming', 'Mixed farming', 'Livestock only', 'Crop only'],
    metadata: { category: 'farming_type' },
    is_internal: false,
  },
  {
    sector: 'Agriculture',
    question_type: 'long_text',
    content: 'What are the main challenges you face as a farmer?',
    options: [],
    metadata: { category: 'challenges' },
    is_internal: false,
  },
  
  // Climate Sector
  {
    sector: 'Climate',
    question_type: 'multiple_choice',
    content: 'How has climate change affected your community?',
    options: ['Increased droughts', 'More floods', 'Unpredictable seasons', 'Crop failures', 'No significant impact'],
    metadata: { category: 'impact' },
    is_internal: false,
  },
  {
    sector: 'Climate',
    question_type: 'rating_scale',
    content: 'How concerned are you about climate change? (1-5)',
    options: ['1', '2', '3', '4', '5'],
    metadata: { category: 'concern' },
    is_internal: false,
  },
  
  // Translation Campaigns (In-house)
  {
    sector: 'Translation',
    question_type: 'short_text',
    content: 'Translate this phrase to your local language: "Thank you for your participation"',
    options: [],
    metadata: { category: 'translation', is_internal: true },
    is_internal: true,
  },
  {
    sector: 'Translation',
    question_type: 'short_text',
    content: 'How would you say "How are you?" in your local language?',
    options: [],
    metadata: { category: 'translation', is_internal: true },
    is_internal: true,
  },
]

async function seedTemplates() {
  console.log('🌱 Seeding question templates...\n')

  try {
    // Check if templates already exist
    const { data: existing } = await supabase
      .from('question_templates')
      .select('id')
      .limit(1)

    if (existing && existing.length > 0) {
      console.log('⚠️  Templates already exist. Skipping seed.')
      console.log('   To re-seed, delete existing templates first.')
      return
    }

    // Insert templates
    const { data, error } = await supabase
      .from('question_templates')
      .insert(templates)
      .select()

    if (error) {
      throw error
    }

    console.log(`✅ Successfully seeded ${data.length} question templates`)
    console.log('\n📊 Templates by sector:')
    
    const bySector = templates.reduce((acc, t) => {
      acc[t.sector] = (acc[t.sector] || 0) + 1
      return acc
    }, {})
    
    Object.entries(bySector).forEach(([sector, count]) => {
      console.log(`   ${sector}: ${count} templates`)
    })

    console.log('\n✨ Question templates seed complete!')
  } catch (error) {
    console.error('❌ Error seeding question templates:', error.message)
    if (error.details) {
      console.error('   Details:', error.details)
    }
    if (error.hint) {
      console.error('   Hint:', error.hint)
    }
    process.exit(1)
  }
}

seedTemplates()



