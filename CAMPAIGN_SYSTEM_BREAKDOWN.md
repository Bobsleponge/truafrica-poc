# Comprehensive Campaign System Breakdown

## Overview

The TruAfrica campaign system is a sophisticated, multi-step campaign builder that enables companies to create, manage, and execute data collection campaigns across Africa. The system supports both client-facing campaigns and internal (in-house) campaigns with comprehensive features including pricing, rewards, quality control, versioning, and collaboration.

---

## 1. Campaign Data Model

### Core Campaign Entity (`campaigns` table)

**Basic Fields:**
- `id` (UUID): Primary key
- `client_id` (UUID): References the company/user who created the campaign
- `name` (TEXT): Campaign name
- `description` (TEXT): Campaign description
- `objective` (TEXT): Campaign objective
- `status` (enum): `'draft' | 'running' | 'completed' | 'archived'`
- `needs_question_design` (BOOLEAN): Flag indicating if TruAfrica should design questions
- `created_at`, `updated_at` (TIMESTAMPTZ)

**Extended Fields (from Migration 004):**
- `company_name` (TEXT): Client company name
- `industry` (TEXT): Industry sector
- `contact_details` (JSONB): Contact information (email, phone, address, contact person)
- `regions_of_operation` (TEXT[]): Array of regions
- `data_sensitivity_level` (enum): `'public' | 'internal' | 'confidential' | 'restricted'`
- `nda_status` (BOOLEAN): Whether NDA is required
- `internal_owner_id` (UUID): Internal TruAfrica owner
- `preferred_timelines` (JSONB): Timeline preferences (start/end dates, urgency, duration)
- `primary_goal` (TEXT): Primary campaign goal
- `secondary_goals` (TEXT[]): Array of secondary goals
- `use_case_description` (TEXT): Detailed use case
- `ai_technical_requirements` (JSONB): AI/ML requirements (embedding, fine-tuning, etc.)
- `data_modality` (TEXT[]): Data types (`'text' | 'audio' | 'image' | 'video' | 'behavioural'`)
- `target_accuracy` (DECIMAL): Target accuracy percentage
- `dataset_size_requirements` (INTEGER): Required dataset size
- `is_in_house` (BOOLEAN): Whether it's an internal campaign
- `campaign_mode` (enum): `'client_mode' | 'internal_mode'`
- `approval_status` (enum): `'draft' | 'internal_review' | 'client_review' | 'approved' | 'locked'`

**Pricing Fields:**
- `total_budget` (DECIMAL): Total campaign budget
- `reward_budget` (DECIMAL): Budget allocated for rewards
- `setup_fee` (DECIMAL): One-time setup fee
- `per_response_fee` (DECIMAL): Fee per response
- `validation_fee` (DECIMAL): Validation service fee
- `analytics_fee` (DECIMAL): Analytics dashboard fee
- `fine_tuning_fee` (DECIMAL): Fine-tuning service fee

**Wizard & Versioning:**
- `wizard_data` (JSONB): Complete wizard state (CampaignBuilderData)
- `wizard_step` (INTEGER): Current step in 20-step wizard
- `current_version_id` (UUID): Reference to current version

### Related Tables

1. **`campaign_briefs`**: Additional campaign brief information
   - Goals, key questions, constraints, languages, budget, timeline

2. **`campaign_questions`**: Junction table linking campaigns to questions
   - `campaign_id`, `question_id`, `question_type`, `required_responses`, `complexity_level`, `base_price_per_answer`

3. **`campaign_versions`**: Version control for campaigns
   - Version number, full data snapshot, created by, notes

4. **`campaign_collaborators`**: Real-time collaboration
   - User ID, role (`'owner' | 'editor' | 'viewer'`), last active timestamp

5. **`campaign_approvals`**: Approval workflow tracking
   - Status, reviewed by, notes, timestamps

6. **`reward_configurations`**: Reward settings per campaign
   - Currency, distribution method, per-question/task-type rewards, budget

7. **`campaign_quality_rules`**: Quality control settings
   - Validation layers, geo-verification, duplicate detection, AI scoring, disqualification rules

8. **`campaign_pricing_snapshots`**: Historical pricing data
   - Estimated costs, revenue, margin, breakdown

9. **`in_house_campaigns`**: Internal platform campaigns
   - Type (`'translation' | 'onboarding' | 'feedback'`), target language, metadata

---

## 2. Campaign Builder Wizard (20 Steps)

The campaign builder is a comprehensive 20-step wizard that guides users through campaign creation:

### Step Groups:

**Steps 1-3: Client Information**
1. **Company & Contact Details**: Company name, industry, contact information, regions of operation
2. **Data & Compliance**: Data sensitivity level, NDA status, internal owner assignment
3. **Timeline Preferences**: Start/end dates, urgency level, estimated duration

**Steps 4-6: Campaign Objectives**
4. **Primary Goal**: Main objective and goal type (classification, behavioural modelling, validation, dataset creation, fine-tuning, other)
5. **Secondary Goals & Use Case**: Additional goals and detailed use case description
6. **AI Technical Requirements**: Embedding needs, fine-tuning, supervised tasks, data modality, target accuracy, dataset size

**Steps 7-9: Target Audience**
7. **Geographic Targeting**: Target countries, provinces, urban/rural preferences
8. **Demographics**: Age brackets, occupation, languages, dialects
9. **Exclusions & Compliance**: Exclusion criteria, special requirements, POPIA compliance

**Steps 10-13: Question Building**
10. **Question Type Selection**: Choose question types from templates
11. **Question Builder**: Create questions with content, type, options, complexity
12. **Logic & Branching**: Configure branching rules and conditional logic
13. **AI Question Refinement**: AI-powered question optimization

**Steps 14-15: Rewards & Incentives**
14. **Reward Configuration**: Currency, distribution method, per-question/task-type rewards
15. **Reward Budget**: Total budget, payout per 1000 responses, min/max payout

**Steps 16-17: Scale & Quality**
16. **Campaign Scale & Quotas**: Number of respondents, quotas per demographic, response timeframe
17. **Quality Control**: Validation layers, geo-verification, duplicate detection, AI scoring, disqualification rules

**Steps 18-20: Pricing & Approval**
18. **Pricing Calculator**: Automatic pricing calculation with breakdown
19. **Campaign Summary**: Review all campaign details, operational risks, mitigations
20. **Final Approval & Export**: Approval workflow, export options, dataset schema

### Wizard Features:
- **Auto-save**: Wizard state is saved on each step change
- **Draft persistence**: Campaigns can be saved as drafts and resumed later
- **Step navigation**: Users can jump to previously completed steps
- **Data validation**: Step-by-step validation before progression

---

## 3. API Endpoints

### Campaign Management

**`GET /api/campaigns`**
- Lists all campaigns for authenticated user
- Supports filtering by status
- Returns campaigns with related briefs and questions
- Admin users see all campaigns; company users see only their own

**`POST /api/campaigns`**
- Creates a new campaign
- Accepts: name, description, objective, targetCountries, targetDemo, brief, questions, urgency, needsQuestionDesign
- Automatically calculates pricing if questions provided
- Creates campaign brief and links questions via `campaign_questions` table
- Returns complete campaign with relations

**`GET /api/campaigns/[id]`**
- Retrieves a single campaign by ID
- Includes all related data (briefs, questions, pricing, etc.)

**`PATCH /api/campaigns/[id]`**
- Updates campaign fields
- Validates ownership/access

**`DELETE /api/campaigns/[id]`**
- Deletes a campaign (cascade deletes related records)

### Campaign Builder

**`POST /api/campaigns/builder`**
- Saves wizard state
- Updates `wizard_data` and `wizard_step` fields
- Called automatically on step navigation

**`GET /api/campaigns/builder?campaignId=xxx`**
- Loads saved wizard state
- Returns `wizard_data` and current `wizard_step`

### Campaign Finalization

**`POST /api/campaigns/[id]/finalize`**
- Converts wizard data to actual database records
- Creates question records from `wizard_data.questions`
- Links questions to campaign via `campaign_questions`
- Calculates and stores final pricing snapshot
- Creates reward configuration record
- Creates quality rules record
- Creates initial version
- Updates campaign status to 'draft' (ready for approval)
- Returns warnings for any issues encountered

### Status Management

**`PATCH /api/campaigns/[id]/status`**
- Updates campaign status with validation
- Validates status transitions (prevents invalid state changes)
- Enforces business rules:
  - Draft → Running: Requires questions, approval, and pricing
  - Running → Completed/Archived: Deactivates questions
  - No backward transitions (except completed → archived)
- Returns success/error with validation messages

**`GET /api/campaigns/[id]/status`**
- Returns current status and available transitions
- Indicates if campaign can be started

### Version Control

**`GET /api/campaigns/[id]/versions`**
- Returns version history for a campaign
- Includes version number, data snapshot, creator, notes, timestamps

**`POST /api/campaigns/[id]/versions`**
- Creates a new version from current campaign data
- Or restores from a previous version
- Supports notes for version descriptions

### Collaboration

**`GET /api/campaigns/[id]/collaborate`**
- Lists collaborators for a campaign
- Shows roles and last active timestamps

**`POST /api/campaigns/[id]/collaborate`**
- Adds or updates collaborators
- Manages roles (owner, editor, viewer)

### Approval

**`POST /api/campaigns/[id]/approve`**
- Updates approval status
- Supports workflow: draft → internal_review → client_review → approved
- Admin-only endpoint

### Export & Sharing

**`GET /api/campaigns/[id]/export`**
- Exports campaign data in various formats
- Includes questions, responses, analytics

**`GET /api/campaigns/share/[token]`**
- Public sharing endpoint with token-based access
- Allows external access to campaign details

### Responses & Analytics

**`GET /api/campaigns/[id]/responses`**
- Retrieves all responses for a campaign
- Supports filtering and pagination

**`GET /api/campaigns/[id]/summary`**
- Returns campaign summary with statistics
- Includes response counts, completion rates, quality metrics

---

## 4. Pricing System

### Pricing Engine (`lib/services/pricingEngine.ts`)

**Core Function: `calculateCampaignPricing()`**
- Takes `CampaignPricingRequest` with:
  - Questions (type, complexity, required responses)
  - Urgency level
  - Target countries
  - Demographic filter count
- Returns `CampaignPricingResult` with:
  - Total cost and revenue
  - Margin and margin percentage
  - Per-question breakdown
  - Validation status

**Pricing Factors:**
- **Question Type**: Base price varies by type (audio, video, text, etc.)
- **Complexity Level**: Easy (1.0x), Medium (1.2x), Hard (1.5x)
- **Urgency**: Standard vs Express (multiplier)
- **Target Country**: Country-specific cost adjustments
- **Demographic Filters**: Additional cost per filter
- **Required Responses**: Scales with volume

**Pricing Components:**
1. **Setup Fee**: One-time fee based on urgency
2. **Per Response Fee**: Calculated from question types and complexity
3. **Reward Budget**: User-specified budget for contributor rewards
4. **Validation Fee**: Based on number of respondents and quality rules
5. **Analytics Fee**: Optional dashboard fee
6. **Fine-Tuning Fee**: Optional ML fine-tuning service fee

**Pricing Rules:**
- Stored in `pricing_rules` table
- Base price and cost per question type
- Multiplier factors for various conditions
- Margin target validation (typically 30%+)

### Pricing Service (`lib/services/pricingService.ts`)

**Function: `calculateTotalPrice()`**
- Comprehensive pricing calculation including all components
- Integrates with pricing engine
- Returns full breakdown with all fees
- Suggests discount ranges for large campaigns

---

## 5. Reward System

### Reward Engine (`lib/services/rewardEngine.ts`)

**Features:**
- **Cost-of-Living Alignment**: Rewards adjusted for African markets
  - Currency multipliers: ZAR (1.0x), KES (0.15x), NGN (0.05x), USD (0.055x)
- **Task Type Multipliers**: Different rewards for different task types
  - Audio: 1.5x, Video: 2.0x, Image: 1.3x, Text: 1.0x, etc.
- **Complexity Multipliers**: Easy (1.0x), Medium (1.2x), Hard (1.5x)

**Functions:**
- `calculateRewardPerQuestion()`: Calculates reward for a single question
- `calculateRewardPerTaskType()`: Calculates reward for a task type
- `calculateTotalRewardBudget()`: Calculates total budget for all questions and respondents
- `alignWithCostOfLiving()`: Adjusts rewards based on currency and country
- `getSuggestedRewardLevels()`: Provides recommended reward ranges

**Reward Configuration:**
- Stored in `reward_configurations` table
- Supports multiple currencies (ZAR, KES, NGN, USD)
- Distribution methods: airtime, data voucher, mobile money, cashback, points
- Per-question and per-task-type reward mapping
- Min/max payout thresholds

---

## 6. Question System

### Question Types

**Supported Types:**
- `rating`: Rating scale questions
- `multiple_choice`: Multiple choice with multiple selections
- `single_choice`: Single choice selection
- `open_text`: Free-form text response
- `short_text`: Short text response
- `long_text`: Long text response
- `rating_scale`: Custom rating scale
- `audio`: Audio recording response
- `video`: Video recording response
- `image_classification`: Image classification task
- `comparison`: Comparison tasks

### Question Features

**Question Fields:**
- `content`: Question text
- `question_type`: Type enum
- `options`: Array of options (for choice questions)
- `difficulty_level`: `'easy' | 'medium' | 'hard'`
- `branching_rules`: Conditional logic (JSONB)
- `validation_type`: Validation method
- `reward_value`: Reward amount for this question
- `comparison_config`: Configuration for comparison questions
- `image_config`: Configuration for image questions
- `audio_config`: Configuration for audio questions
- `video_config`: Configuration for video questions

**Question Templates:**
- Stored in `question_templates` table
- Organized by sector (Retail, Healthcare, Finance, etc.)
- Can be marked as internal-only
- Reusable across campaigns

**Campaign Questions:**
- Linked via `campaign_questions` junction table
- Specifies `required_responses` per question
- Stores `base_price_per_answer` from pricing calculation

---

## 7. Quality Control System

### Quality Rules (`campaign_quality_rules` table)

**Features:**
- **Validation Layers**: Multi-layer validation configuration
  - Majority voting
  - Text similarity
  - ML confidence scoring
  - Human validator review
- **Geo-Verification**: Location-based verification
- **Duplicate Detection**: Prevents duplicate responses
- **AI Scoring**: Automated quality scoring
- **Disqualification Rules**: Custom rules for filtering responses
- **Confidence Threshold**: Minimum confidence score (default 70%)

### Validation System

**Validation Types:**
- `majority_voting`: Consensus from multiple responses
- `text_similarity`: Semantic similarity checking
- `ml_confidence`: Machine learning confidence scores
- `human_validator`: Manual review

**Validation Events:**
- Tracked in `validation_events` table
- Records validation type, confidence score, validator ID
- Links to answers for audit trail

**Flagged Answers:**
- `flagged_answers` table tracks problematic responses
- Status: `'pending' | 'resolved' | 'invalid'`
- Includes reason, resolver, resolution notes

---

## 8. Status & Approval Workflow

### Campaign Status Lifecycle

```
draft → running → completed → archived
  ↓         ↓
archived  archived
```

**Status Definitions:**
- **draft**: Campaign being created/edited
- **running**: Active campaign collecting responses
- **completed**: Campaign finished, no longer accepting responses
- **archived**: Archived for historical reference

**Status Transition Rules:**
- Draft → Running: Requires questions, approval status 'approved', and pricing
- Running → Completed: Can be manually completed or auto-completed
- Completed → Archived: Final archival
- No backward transitions (except completed → archived)

### Approval Workflow

**Approval Status:**
- `draft`: Initial state
- `internal_review`: Under TruAfrica internal review
- `client_review`: Sent to client for review
- `approved`: Approved and ready to run
- `locked`: Locked (cannot be modified)

**Approval Process:**
1. Campaign created in `draft` approval status
2. Admin reviews and moves to `internal_review`
3. After internal review, moves to `client_review`
4. Client approves, moves to `approved`
5. Campaign can now be started (status → `running`)

---

## 9. Version Control & Collaboration

### Version Control

**Features:**
- Full campaign data snapshots
- Version numbering (auto-increment)
- Notes for each version
- Restore capability
- Created by tracking

**Use Cases:**
- Track changes over time
- Rollback to previous versions
- Compare versions
- Audit trail

### Collaboration

**Collaborator Roles:**
- **owner**: Full control (can delete, manage collaborators)
- **editor**: Can edit campaign
- **viewer**: Read-only access

**Features:**
- Real-time collaboration tracking
- Last active timestamp
- Role-based permissions
- Multiple collaborators per campaign

---

## 10. User Interfaces

### Company Dashboard (`/company/campaigns`)
- Lists all company campaigns
- Filter by status (all, draft, running, completed)
- Shows statistics: total campaigns, running, responses, revenue
- Campaign cards with key metrics
- Quick actions: view, edit, create new

### Campaign Builder (`/company/campaigns/builder`)
- 20-step wizard interface
- Step indicator with navigation
- Auto-save functionality
- Draft persistence
- Form validation
- Progress tracking

### Admin Dashboard (`/admin/campaigns`)
- View all campaigns
- Filter campaigns needing question design
- Approve/reject campaigns
- Manage internal campaigns
- View system-wide statistics

### Campaign Detail Pages
- Full campaign information
- Question list
- Response analytics
- Pricing breakdown
- Quality metrics
- Version history
- Collaborator management

---

## 11. Database Schema Summary

### Core Tables
- `campaigns`: Main campaign entity
- `campaign_briefs`: Additional brief information
- `campaign_questions`: Campaign-question junction
- `questions`: Question entities
- `answers`: Contributor responses

### Extended Tables (Migration 004)
- `campaign_versions`: Version control
- `campaign_collaborators`: Collaboration
- `campaign_approvals`: Approval workflow
- `question_templates`: Reusable question templates
- `reward_configurations`: Reward settings
- `campaign_quality_rules`: Quality control
- `campaign_pricing_snapshots`: Pricing history
- `in_house_campaigns`: Internal campaigns

### Supporting Tables
- `pricing_rules`: Pricing configuration
- `validation_events`: Validation tracking
- `flagged_answers`: Quality issues
- `users`: User accounts
- `expertise_fields`: Question categorization

---

## 12. Key Services

### Pricing Services
- `pricingEngine.ts`: Core pricing calculations
- `pricingService.ts`: Full pricing service with all components
- `pricingCalculators.ts`: Utility functions for pricing math

### Reward Services
- `rewardEngine.ts`: Reward calculation engine
- `rewardService.ts`: Reward management service

### Other Services
- `versionControlService.ts`: Version management
- `collaborationService.ts`: Collaboration features
- `exportService.ts`: Data export functionality
- `aiService.ts`: AI-powered question refinement

---

## 13. Security & Access Control

### Row Level Security (RLS)
- All campaign-related tables have RLS enabled
- Policies enforce:
  - Company users see only their campaigns
  - Admin users see all campaigns
  - Contributors see only campaigns they're assigned to
  - Collaborators see campaigns they're part of

### Authentication
- Supabase Auth integration
- Role-based access (contributor, company, admin)
- API endpoints validate authentication and authorization

---

## 14. Integration Points

### External Integrations
- **Reward Distribution**: Mobile money, airtime, vouchers
- **Payment Processing**: Campaign payment handling
- **Analytics**: Dashboard and reporting
- **AI Services**: Question refinement, validation scoring

### Internal Integrations
- **User Management**: Links to user accounts
- **Question System**: Reuses question infrastructure
- **Answer System**: Collects and validates responses
- **Validation System**: Multi-layer validation

---

## 15. Workflow Examples

### Creating a Campaign
1. User navigates to `/company/campaigns/builder`
2. Starts 20-step wizard
3. Fills in each step (auto-saved)
4. Reaches step 20 and clicks "Complete Campaign"
5. System calls `/api/campaigns/[id]/finalize`
6. Questions created, pricing calculated, records finalized
7. Campaign status: `draft`, approval_status: `draft`
8. Admin reviews and approves
9. Campaign can be started (status → `running`)

### Starting a Campaign
1. Campaign must be in `draft` status with `approved` approval_status
2. Must have questions linked
3. Must have pricing calculated
4. User calls `PATCH /api/campaigns/[id]/status` with `status: 'running'`
5. System validates transition
6. Questions activated
7. Campaign starts accepting responses

### Collecting Responses
1. Contributors see active questions from running campaigns
2. Submit answers through contributor interface
3. Answers validated based on campaign quality rules
4. Rewards calculated and allocated
5. Responses tracked in `answers` table

---

## 16. Future Enhancements (Potential)

Based on the codebase structure, potential enhancements:
- Real-time collaboration (WebSocket integration)
- Advanced analytics dashboard
- Automated campaign optimization
- A/B testing for questions
- Multi-language campaign support
- API for external campaign management
- Campaign templates
- Bulk campaign creation
- Advanced reporting and exports

---

## Summary

The campaign system is a comprehensive, enterprise-grade solution for managing data collection campaigns. It supports:

- **Complex Campaign Creation**: 20-step wizard with extensive configuration
- **Flexible Pricing**: Dynamic pricing based on multiple factors
- **Fair Rewards**: Cost-of-living aligned reward system
- **Quality Assurance**: Multi-layer validation and quality control
- **Version Control**: Full audit trail and rollback capability
- **Collaboration**: Multi-user campaign management
- **Approval Workflow**: Structured approval process
- **Scalability**: Designed to handle large-scale campaigns

The system is built on Next.js with Supabase backend, providing a modern, scalable architecture for managing complex data collection operations across Africa.



