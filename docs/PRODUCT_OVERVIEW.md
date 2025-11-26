# TruAfrica Product Overview

## Vision

**"Africa's knowledge, rewarded. AI that understands Africa."**

TruAfrica is the African Truth Layer for AI – a platform that crowdsources validated insights and AI training data directly from Africans, in an AI-ready format.

## The Problem

- **AI models don't understand Africa**: Trained on biased, Western-centric data
- **Research is expensive**: Traditional market research costs $25K-$150K per study
- **Data lacks context**: Missing cultural nuances and local insights
- **Slow data collection**: Weeks or months to gather insights

## The Solution

TruAfrica provides:

1. **Crowdsourced Local Knowledge**: Direct access to insights from Africans who live it
2. **Multi-Layer Validation**: Majority voting, text similarity, ML confidence, and human validation
3. **Fair Rewards**: Contributors earn airtime, mobile money, and vouchers
4. **AI-Ready Format**: Structured data exports (CSV/JSON) and API access
5. **Campaign Management**: End-to-end workflow from question design to data delivery

## Target Segments

### Clients
- **AI Companies**: Training data for African-focused models
- **FMCG Brands**: Market research and consumer insights
- **Government**: Policy research and public opinion
- **NGOs**: Impact assessment and program evaluation
- **Research Institutions**: Academic research and data collection
- **Brands**: Brand perception and market validation

### Contributors
- **African Users**: Mobile-first, low-bandwidth experience
- **Expert Contributors**: Trust score system rewards quality
- **Local Experts**: Country and language-specific knowledge

## Key Features

### For Clients

1. **Campaign Creation**
   - 4-step wizard: Basic info → Target audience → Questions → Pricing review
   - Upload own questions or request TruAfrica to design them
   - Real-time pricing estimates with cost/revenue/margin breakdown

2. **Data Collection**
   - Multi-layer validation ensures quality
   - Real-time response tracking
   - Demographic filtering and targeting

3. **Data Delivery**
   - CSV/JSON export with full metadata
   - REST API for programmatic access
   - Campaign insights dashboard with charts and analytics

4. **Pricing Transparency**
   - Live pricing estimates
   - Cost breakdown (reward cost + processing)
   - Margin tracking (target 30-45%)

### For Contributors

1. **Trust Score System**
   - 0-100 scale with difficulty gating
   - +2 for correct answers, -5 for incorrect
   - Bonuses for high consensus (>90%)

2. **Rewards**
   - Airtime, mobile money, grocery vouchers
   - Automatic allocation for correct answers
   - Reward history and redemption

3. **Mobile-First Experience**
   - Lightweight, low-bandwidth design
   - Clear question interface
   - Progress tracking

### For Admins

1. **Question Design**
   - View campaigns needing question design
   - Create/edit questions using templates
   - Approve campaign questions

2. **Human Validation**
   - Review flagged answers (low consensus, conflicts)
   - Resolve edge cases
   - Mark answers as valid/invalid

3. **Pricing Management**
   - Configure pricing rules per question type
   - Adjust multipliers (complexity, urgency, country)
   - View system-wide stats

## Technical Architecture

### Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI), Recharts
- **Backend**: Supabase (Auth, Postgres, RLS, Storage)
- **Validation**: Multi-layer (majority voting, text similarity, ML confidence, human)
- **API**: RESTful with API key authentication

### Database Schema

**Core Tables**:
- `users`: Contributors, clients, admins
- `campaigns`: Campaign metadata and status
- `campaign_questions`: Question-to-campaign mapping
- `questions`: Question content and metadata
- `answers`: Contributor responses
- `rewards`: Reward allocation and tracking

**Pricing & API**:
- `pricing_rules`: Configurable pricing rules
- `campaign_pricing_snapshots`: Historical pricing estimates
- `api_keys`: API key management
- `api_usage_events`: Usage tracking

**Validation**:
- `validation_events`: All validation attempts
- `flagged_answers`: Answers needing human review

### Security

- **Row Level Security (RLS)**: Database-level access control
- **Role-Based Access**: Contributor, Company, Admin roles
- **API Authentication**: Hashed API keys with rate limiting
- **Data Isolation**: Clients only see their own campaigns

## Business Model

### Revenue Streams

1. **Campaign Fees**: Per-campaign pricing based on question type, complexity, urgency
2. **Per-Answer Pricing**: $1.50-$6 per validated answer
3. **API Subscriptions**: Monthly/annual API access fees
4. **Enterprise Training**: Custom AI model training services
5. **NGO/Government Polls**: Specialized research services
6. **Brand Activation**: Sponsored campaigns

### Pricing Model

- **Base Price**: Varies by question type (rating: $1.50, open_text: $2.00, audio: $3.00)
- **Multipliers**: Complexity (easy/medium/hard), urgency (standard/express), country, demographic filters
- **Margin Target**: 30-45% per answer
- **Cost Structure**: Reward cost + processing overhead (~$0.10)

## Go-To-Market

### Phase 1: South Africa (Current)
- Launch with South African contributors
- Focus on AI companies and FMCG brands
- Mobile-first experience

### Phase 2: East & West Africa
- Expand to Kenya, Nigeria, Ghana
- Multi-language support
- Local payment integrations

### Phase 3: API & Enterprise
- Public API launch
- Enterprise training services
- White-label solutions

## Competitive Advantages

1. **First Mover**: First platform focused on African AI training data
2. **Local Expertise**: Direct access to African contributors
3. **Quality Assurance**: Multi-layer validation ensures reliability
4. **Fair Compensation**: Contributors earn meaningful rewards
5. **AI-Ready**: Structured data format optimized for ML training
6. **Cost Effective**: 10x cheaper than traditional research

## Success Metrics

- **Contributors**: Active contributors, trust score distribution
- **Campaigns**: Campaigns created, completion rate, response quality
- **Revenue**: Total revenue, margin per campaign, API usage
- **Quality**: Average consensus score, validation confidence, rejection rate

## Future Enhancements

- **Audio/Video Responses**: Support for multimedia data collection
- **Real-Time Analytics**: Live dashboard updates
- **ML Model Integration**: Direct model training from platform data
- **Mobile App**: Native iOS/Android apps
- **Multi-Language**: Support for 10+ African languages
- **Blockchain Rewards**: Token-based reward system

## Contact

For product inquiries: product@truafrica.com
For technical support: support@truafrica.com




