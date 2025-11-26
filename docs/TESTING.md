# TruAfrica POC - Testing Guide

This guide provides step-by-step instructions for testing all features of the TruAfrica POC.

## Prerequisites

- Supabase project set up and migrations run
- Environment variables configured
- Development server running (`npm run dev`)

## Test Scenarios

### Scenario 1: Contributor Complete Flow

**Objective**: Test the complete contributor journey from signup to earning rewards.

#### Step 1: Contributor Signup

1. Navigate to `http://localhost:3000/signup?role=contributor`
2. Fill in the form:
   - **Name**: "John Doe"
   - **Email**: `john.doe@example.com` (use a unique email)
   - **Password**: `Test123!@#` (or any secure password)
   - **Country**: Select "Nigeria" (or any African country)
   - **Languages**: Select "English", "Hausa"
   - **Expertise**: Select "Technology", "Agriculture"
3. Click "Sign Up"
4. **Expected**: Redirects to `/contributor/onboarding`

**Verification**:
- Check Supabase Dashboard > Authentication > Users (new user should appear)
- Check Table Editor > users (profile should be created with `role = 'contributor'`)

#### Step 2: Complete Onboarding

1. You should be on the onboarding page
2. Answer all 5 questions:
   - Question 1 (Easy): "What is the primary challenge facing small-scale farmers in Africa today?"
     - **Answer**: "The primary challenges include limited access to modern farming equipment, lack of financial resources, unpredictable weather patterns due to climate change, and limited market access. Many farmers also struggle with soil degradation and lack of knowledge about sustainable farming practices."
   - Question 2 (Easy): "How can mobile technology improve access to financial services in rural Africa?"
     - **Answer**: "Mobile technology enables mobile money services like M-Pesa, allowing people without bank accounts to send and receive money, pay bills, and access credit. It also provides access to financial information, market prices, and enables farmers to receive payments directly for their produce."
   - Question 3 (Medium): "Describe the impact of climate change on agricultural productivity in your region."
     - **Answer**: "Climate change has led to irregular rainfall patterns, prolonged droughts, and increased temperatures. This affects crop yields, causes water scarcity, and makes farming more unpredictable. Farmers need to adapt by using drought-resistant crops and water conservation techniques."
   - Question 4 (Medium): "What are the main barriers to internet connectivity in African communities?"
     - **Answer**: "Main barriers include high costs of internet services, limited infrastructure in rural areas, lack of electricity, low digital literacy, and language barriers. Many areas lack fiber optic cables and rely on expensive satellite connections."
   - Question 5 (Hard): "Explain how renewable energy solutions can address power shortages in African cities."
     - **Answer**: "Renewable energy solutions like solar panels, wind turbines, and hydroelectric power can provide decentralized energy generation. Solar is particularly suitable for Africa due to abundant sunlight. These solutions reduce dependence on unreliable grid systems and can power homes, businesses, and critical infrastructure."
3. Click "Complete Onboarding"
4. **Expected**: 
   - Trust score calculated (should be 60-80 for good answers)
   - Redirects to `/contributor/dashboard`
   - `onboarding_completed = true` in database

**Verification**:
- Check dashboard shows trust score badge
- Verify trust score in database (Table Editor > users)

#### Step 3: View Dashboard

1. On the contributor dashboard, verify:
   - Trust score badge displays correctly
   - "Answers Submitted" shows 0
   - "Total Rewards" shows 0
   - "Recent Answers" table is empty
2. Click "Browse Questions"
3. **Expected**: Navigate to `/contributor/questions`

**Verification**:
- Dashboard loads without errors
- All stats display correctly

#### Step 4: Answer Questions (if questions exist)

**Note**: You'll need to create questions as a company first (see Scenario 2).

1. Navigate to `/contributor/questions`
2. If questions exist:
   - Click "Answer" on a question
   - Enter a detailed answer (100+ characters)
   - Click "Submit Answer"
3. **Expected**:
   - Success message appears
   - Answer saved to database
   - Consensus calculated (if other answers exist)
   - Trust score updated (if consensus calculated)
   - Reward allocated (if answer is correct)

**Verification**:
- Check Table Editor > answers (new answer should appear)
- Check Table Editor > rewards (reward should appear if answer correct)
- Check Table Editor > users (trust_score should update)

### Scenario 2: Company Complete Flow

**Objective**: Test the complete company journey from signup to viewing analytics.

#### Step 1: Company Signup

1. Navigate to `http://localhost:3000/signup?role=company`
2. Fill in the form:
   - **Company Name**: "Tech Solutions Africa"
   - **Email**: `company@example.com` (use a unique email)
   - **Password**: `Company123!@#`
   - **Country**: Select "South Africa"
3. Click "Sign Up"
4. **Expected**: Redirects to `/company/dashboard`

**Verification**:
- Check Supabase Dashboard > Authentication > Users
- Check Table Editor > users (profile with `role = 'company'`)

#### Step 2: View Dashboard

1. On company dashboard, verify:
   - Stats cards show zeros:
     - Total Questions: 0
     - Answered Questions: 0
     - Avg Consensus Score: 0%
     - Avg Contributor Rating: 0
   - Questions table is empty
   - Answers table is empty
2. Click "Upload New Question"
3. **Expected**: Navigate to `/company/questions/new`

#### Step 3: Upload Questions

Create 3 questions:

**Question 1**:
- **Field**: Technology
- **Difficulty**: Easy
- **Content**: "What are the main challenges facing small-scale farmers in Africa today?"

**Question 2**:
- **Field**: Agriculture
- **Difficulty**: Medium
- **Content**: "Describe the impact of climate change on agricultural productivity in your region."

**Question 3**:
- **Field**: Healthcare
- **Difficulty**: Hard
- **Content**: "What strategies can be implemented to improve healthcare delivery in remote African regions?"

For each question:
1. Fill in the form
2. Click "Submit Question"
3. **Expected**: 
   - Question saved
   - Redirects to dashboard
   - Question appears in questions table

**Verification**:
- Check Table Editor > questions (3 new questions should appear)
- Check dashboard questions table shows all 3 questions

#### Step 4: View Answers and Analytics

1. As a company, view the dashboard
2. Have contributors answer your questions (use Scenario 1)
3. Verify:
   - Answers appear in "Answers" tab
   - Consensus scores are calculated
   - Charts update with data
   - Statistics update correctly
4. Test filters:
   - Filter by field (Technology, Agriculture, Healthcare)
   - Filter by difficulty (Easy, Medium, Hard)
5. **Expected**: Tables filter correctly

**Verification**:
- Answers appear in real-time
- Charts render correctly
- Filters work as expected

### Scenario 3: Integration Testing

**Objective**: Test consensus calculation, trust scores, and reward allocation.

#### Test 3.1: Consensus Calculation

1. As a company, create a question:
   - Field: Technology
   - Difficulty: Easy
   - Content: "What is the best mobile payment solution for Africa?"

2. As Contributor 1, answer:
   - "M-Pesa is the best solution because it's widely used in Kenya and Tanzania, has low transaction fees, and works on basic phones without internet."

3. As Contributor 2, answer with similar content:
   - "M-Pesa is excellent for mobile payments in Africa. It's popular in East Africa, has affordable fees, and works on feature phones."

4. As Contributor 3, answer with different content:
   - "Orange Money is better because it's available in more countries across West and Central Africa."

5. **Expected**:
   - Contributor 1: consensus_score = 100% (first answer, no comparison)
   - Contributor 2: consensus_score = ~80-90% (similar to Contributor 1)
   - Contributor 3: consensus_score = ~30-40% (different from others)
   - Contributors 1 & 2: correct = true
   - Contributor 3: correct = false

**Verification**:
- Check Table Editor > answers (consensus scores should be calculated)
- Check correct flags are set appropriately

#### Test 3.2: Trust Score Updates

1. Note a contributor's current trust score
2. Submit a correct answer (consensus >70%)
3. **Expected**: Trust score increases by +2 (or +3 if consensus >90%)
4. Submit an incorrect answer (consensus <70%)
5. **Expected**: Trust score decreases by -5

**Verification**:
- Check Table Editor > users (trust_score should update)
- Check Table Editor > ratings (rating changes should be logged)

#### Test 3.3: Reward Allocation

1. Submit a correct answer
2. **Expected**:
   - Reward record created in rewards table
   - reward_type = 'airtime'
   - value = 10 (or 15 if high consensus)
   - status = 'awarded'
3. Check contributor dashboard
4. **Expected**: Reward appears in reward history

**Verification**:
- Check Table Editor > rewards (new reward should appear)
- Check contributor dashboard shows reward

#### Test 3.4: Difficulty Level Access

1. Create a contributor with trust_score = 50
2. Navigate to `/contributor/questions`
3. **Expected**: Only 'easy' questions visible
4. Update trust_score to 65 (manually in database)
5. Refresh page
6. **Expected**: 'easy' and 'medium' questions visible
7. Update trust_score to 85
8. **Expected**: All difficulty levels visible

**Verification**:
- Questions filtered correctly based on trust score
- RLS policies enforce access restrictions

### Scenario 4: Edge Cases and Error Handling

#### Test 4.1: Authentication

1. **Without login**:
   - Try accessing `/contributor/dashboard`
   - **Expected**: Redirects to `/login`

2. **Wrong role**:
   - Login as contributor
   - Try accessing `/company/dashboard` (manually)
   - **Expected**: Error or redirect

#### Test 4.2: Data Validation

1. **Empty answer**:
   - Try submitting empty answer
   - **Expected**: Error message, form validation

2. **Invalid question**:
   - Try creating question without required fields
   - **Expected**: Validation errors

#### Test 4.3: Database Constraints

1. **Duplicate answer**:
   - Answer same question twice
   - **Expected**: Error (UNIQUE constraint)

2. **Invalid field_id**:
   - Try creating question with non-existent field_id
   - **Expected**: Foreign key constraint error

## Automated Testing Checklist

Use this checklist to verify all features:

- [ ] Landing page loads correctly
- [ ] Contributor signup works
- [ ] Company signup works
- [ ] Onboarding test completes
- [ ] Trust score calculated correctly
- [ ] Dashboard displays correctly
- [ ] Questions can be uploaded
- [ ] Questions can be answered
- [ ] Consensus calculation works
- [ ] Trust scores update correctly
- [ ] Rewards are allocated
- [ ] Charts render correctly
- [ ] Filters work
- [ ] Mobile responsiveness verified
- [ ] Error handling works
- [ ] Authentication works
- [ ] Authorization works

## Performance Testing

1. **Load Testing**:
   - Test with multiple concurrent users
   - Monitor response times
   - Check database performance

2. **Page Load Times**:
   - Landing page: < 2 seconds
   - Dashboard: < 3 seconds
   - Questions page: < 2 seconds

3. **API Response Times**:
   - Consensus calculation: < 1 second
   - Reward allocation: < 1 second
   - Database queries: < 500ms

## Browser Testing

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

## Mobile Testing

Test on:
- [ ] iPhone (Safari)
- [ ] Android (Chrome)
- [ ] Tablet (iPad, Android tablet)

Verify:
- [ ] Touch interactions work
- [ ] Forms are usable
- [ ] Charts render correctly
- [ ] Navigation works
- [ ] Text is readable

## Reporting Issues

When reporting issues, include:
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Browser/device information
5. Console errors (if any)
6. Screenshots (if applicable)

---

**Happy Testing!** 🧪

