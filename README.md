# TruAfrica POC Platform

**Tagline:** "Africa validated, AI elevated"

A scalable platform where African contributors can answer questions to train AI models, get rated, and earn rewards, while companies can submit questions, view answers, and track statistics.

## Features

### For Contributors
- **Onboarding System**: Tiered test to determine initial trust score
- **Question Answering**: Answer questions based on expertise and trust score
- **Trust Scoring**: Build reputation through accurate answers
- **Rewards**: Earn vouchers (Airtime, Mobile Money, Grocery vouchers) for correct answers
- **Dashboard**: Track answers, rewards, and trust score

### For Companies
- **Question Upload**: Submit questions for validation
- **Real-time Tracking**: View answers as they come in
- **Analytics Dashboard**: 
  - Total questions answered
  - Average consensus scores
  - Contributor trust ratings
  - Rewards allocated
- **Filtering**: Filter by field, difficulty, and contributor trust score
- **Charts**: Visualize answer progress, consensus distribution, and contributor performance

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (built on Radix UI)
- **Charts**: Recharts
- **Backend**: Supabase (Auth, Database, Storage)
- **Forms**: React Hook Form + Zod validation

## Prerequisites

### For Local Development (without Docker)
- Node.js 18+ and npm/yarn/pnpm
- Supabase account (free tier works)
- Git

### For Docker Development
- Docker 20.10+ and Docker Compose 2.0+
- Supabase account (free tier works)
- Git

## Quick Start

**New to TruAfrica?** Start with [QUICK_START.md](./QUICK_START.md) for a 5-minute setup guide!

### Quick Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up Supabase** (Interactive):
   ```bash
   npm run setup:supabase
   ```
   Or follow manual steps in [SETUP.md](./SETUP.md)

3. **Verify setup**:
   ```bash
   npm run setup:verify
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

5. **Open in browser**: http://localhost:3000

## Docker Setup

TruAfrica can be run using Docker for easier local development and deployment. This eliminates the need to install Node.js locally.

### Prerequisites for Docker

- [Docker](https://docs.docker.com/get-docker/) (20.10 or later)
- [Docker Compose](https://docs.docker.com/compose/install/) (2.0 or later)
- Supabase account (free tier works)

### Quick Start with Docker

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd truafrica-poc
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` and add your Supabase credentials:
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key

3. **Run database migrations** (one-time setup):
   ```bash
   # Using npm (if you have Node.js installed)
   npm run migrate
   
   # Or manually run migrations in Supabase SQL Editor
   # See lib/supabase/migrations/ for SQL files
   ```

4. **Start the application**:

   **Production mode** (optimized build):
   ```bash
   docker-compose up --build
   ```

   **Development mode** (with hot reload):
   ```bash
   docker-compose --profile dev up app-dev --build
   ```

5. **Open in browser**: http://localhost:3000

### Docker Commands

- **Build and start**: `docker-compose up --build`
- **Start in background**: `docker-compose up -d`
- **Stop containers**: `docker-compose down`
- **View logs**: `docker-compose logs -f app`
- **Rebuild after changes**: `docker-compose up --build`
- **Development mode**: `docker-compose --profile dev up app-dev`

### Docker Development vs Production

**Development Mode** (`app-dev` service):
- Hot reload enabled
- Source code mounted as volume
- Faster startup, slower runtime performance
- Use for active development

**Production Mode** (`app` service):
- Optimized Next.js standalone build
- Smaller image size
- Better performance
- Use for testing production builds locally

### Environment Variables in Docker

Environment variables are loaded from `.env.local` file. The Docker Compose configuration automatically:
- Loads variables from `.env.local`
- Passes them to the container
- Uses defaults for optional variables

See `.env.example` for all available environment variables.

### Troubleshooting Docker

**Container won't start**:
- Check Docker is running: `docker ps`
- Verify environment variables in `.env.local`
- Check logs: `docker-compose logs app`

**Port already in use**:
- Change port in `docker-compose.yml`: `"3001:3000"` instead of `"3000:3000"`

**Build fails**:
- Clear Docker cache: `docker-compose build --no-cache`
- Ensure Docker has enough resources (memory/CPU)

**Database connection issues**:
- Verify Supabase URL and key in `.env.local`
- Check Supabase project is active
- Ensure RLS policies are set correctly

**Hot reload not working (dev mode)**:
- Ensure you're using `app-dev` service: `docker-compose --profile dev up app-dev`
- Check volume mounts in `docker-compose.yml`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run setup:check` - Check project setup
- `npm run setup:test-db` - Test database connection
- `npm run setup:supabase` - Interactive Supabase setup guide
- `npm run setup:verify` - Complete setup verification
- `npm run test:data` - Get test data creation help

For complete setup guide, see [SETUP.md](./SETUP.md)

## Project Structure

```
truafrica-poc/
├── app/
│   ├── (auth)/              # Authentication pages
│   │   ├── login/
│   │   └── signup/
│   ├── (contributor)/      # Contributor routes
│   │   ├── dashboard/
│   │   ├── onboarding/
│   │   └── questions/
│   ├── (company)/          # Company routes
│   │   ├── dashboard/
│   │   └── questions/new/
│   ├── api/                # API routes
│   │   ├── answers/consensus/
│   │   └── rewards/allocate/
│   ├── layout.tsx
│   └── page.tsx            # Landing page
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── contributor/       # Contributor-specific components
│   ├── company/           # Company-specific components
│   └── shared/            # Shared components
├── lib/
│   ├── supabase/          # Supabase client and migrations
│   └── utils/             # Utility functions
├── types/                 # TypeScript type definitions
└── hooks/                 # React hooks
```

## Database Schema

### Core Tables

- **users**: User profiles with role, trust_score, expertise_fields
- **expertise_fields**: Available fields of expertise
- **questions**: Questions submitted by companies
- **answers**: Answers from contributors
- **rewards**: Reward allocations
- **ratings**: Trust score change history
- **company_dashboard_stats**: Aggregated company statistics

See `lib/supabase/migrations/001_initial_schema.sql` for full schema details.

## Key Workflows

### Contributor Flow

1. **Sign Up** → Select role as "Contributor"
2. **Onboarding** → Complete tiered test (determines initial trust score)
3. **Dashboard** → View available questions, trust score, rewards
4. **Answer Questions** → Submit answers based on expertise
5. **Consensus Calculation** → System compares answer to majority
6. **Trust Score Update** → Score increases/decreases based on correctness
7. **Reward Allocation** → Correct answers earn vouchers

### Company Flow

1. **Sign Up** → Select role as "Company"
2. **Dashboard** → View statistics and answers
3. **Upload Questions** → Submit questions with field and difficulty
4. **Track Answers** → View answers in real-time
5. **Analytics** → Monitor consensus scores and contributor performance

## Adding New Features

### Adding New Question Types

1. Update the `questions` table schema if needed
2. Modify `app/(company)/questions/new/page.tsx` to include new fields
3. Update the question display components

### Adding New Expertise Fields

1. Insert into `expertise_fields` table:
```sql
INSERT INTO public.expertise_fields (name, description, difficulty_level)
VALUES ('New Field', 'Description', 'easy');
```

2. The field will automatically appear in dropdowns

### Adding New Reward Types

1. Update the `reward_type` enum in the database:
```sql
ALTER TYPE reward_type ADD VALUE 'new_reward_type';
```

2. Update `lib/utils/rewards.ts` to handle the new type
3. Update the reward display components

### Integrating Reward APIs

The reward system includes placeholder functions in `lib/utils/rewards.ts`. To integrate actual APIs:

1. Update `redeemReward()` function in `lib/utils/rewards.ts`
2. Add API credentials to environment variables
3. Implement API calls for:
   - Airtime providers (MTN, Airtel, etc.)
   - Mobile Money (M-Pesa, Orange Money, etc.)
   - Grocery vouchers (Shoprite, Pick n Pay, etc.)

Example:
```typescript
export async function redeemReward(
  rewardId: string,
  rewardType: RewardType,
  value: number,
  recipientInfo: { phoneNumber?: string; email?: string; name?: string }
): Promise<{ success: boolean; message: string; transactionId?: string }> {
  if (rewardType === 'airtime') {
    // Call airtime API
    const response = await fetch('https://airtime-api.com/redeem', {
      method: 'POST',
      body: JSON.stringify({
        phone: recipientInfo.phoneNumber,
        amount: value,
      }),
    })
    return await response.json()
  }
  // ... other reward types
}
```

## Consensus Algorithm

The consensus system compares answers using text similarity:

1. **Text Similarity**: Uses word overlap (Jaccard similarity)
2. **Consensus Score**: Average similarity with all other answers
3. **Correctness**: Answers with ≥70% consensus are marked correct
4. **Trust Score**: Increases for correct answers, decreases for incorrect

To improve the algorithm:
- Update `lib/utils/consensus.ts`
- Consider using NLP libraries for better text comparison
- Implement semantic similarity (e.g., using embeddings)

## Trust Score System

- **Initial Score**: Based on onboarding test performance (40-80)
- **Correct Answer**: +2 points
- **Incorrect Answer**: -5 points
- **High Consensus Bonus**: +1 point for >90% consensus
- **Range**: 0-100

Difficulty access:
- **Trust Score ≥ 80**: All difficulties (easy, medium, hard)
- **Trust Score ≥ 60**: Easy and medium
- **Trust Score < 60**: Easy only

## Mobile-First Design

The platform is optimized for mobile devices:
- Responsive layouts using Tailwind CSS
- Touch-friendly interactions
- Optimized for low-bandwidth scenarios
- African market color scheme (green, yellow, orange)

## Security

- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- Companies can only view answers to their questions
- Authentication required for all protected routes

## Deployment

### Docker Deployment

For production deployment with Docker:

1. **Build the image**:
   ```bash
   docker build -t truafrica:latest .
   ```

2. **Run the container**:
   ```bash
   docker run -d \
     -p 3000:3000 \
     --env-file .env.local \
     --name truafrica-app \
     truafrica:latest
   ```

3. **Or use docker-compose**:
   ```bash
   docker-compose up -d
   ```

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms

1. Build the project: `npm run build`
2. Start production server: `npm start`
3. Ensure environment variables are set
4. Configure Supabase CORS settings

## Environment Variables

Required:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key

Optional (for reward API integrations):
- `AIRTIME_API_KEY`
- `MOBILE_MONEY_API_KEY`
- `VOUCHER_API_KEY`

## Troubleshooting

### Database Connection Issues
- Verify Supabase URL and key in `.env.local`
- Check Supabase project status
- Ensure RLS policies are correctly set

### Authentication Issues
- Clear browser cookies
- Check Supabase Auth settings
- Verify email confirmation settings

### Consensus Not Calculating
- Check API route logs
- Ensure answers exist for comparison
- Verify database permissions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

[Add your license here]

## Support

For issues and questions:
- Open an issue on GitHub
- Contact: [your contact information]

## Roadmap

- [ ] Multi-language support
- [ ] Advanced NLP for consensus calculation
- [ ] Real-time notifications
- [ ] Mobile app (React Native)
- [ ] Payment gateway integration
- [ ] Advanced analytics
- [ ] Contributor leaderboards
- [ ] Question templates
- [ ] Bulk question upload

---

**Built with ❤️ for Africa**
