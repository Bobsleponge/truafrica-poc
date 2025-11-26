# Fixing Supabase Email Validation for Test Accounts

If you're getting "Email address is invalid" errors when trying to create test users, follow these steps in your Supabase dashboard:

## Step 1: Disable Email Confirmation (Recommended for Development)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Authentication** → **Settings**
4. Scroll to **Email Auth** section
5. **Disable** "Enable email confirmations" (toggle it OFF)
   - This allows users to sign up without email verification
   - Essential for testing with test email addresses

## Step 2: Check URL Configuration

1. Still in **Authentication** → **Settings**
2. Scroll to **URL Configuration**
3. Make sure these are set:
   - **Site URL**: `http://localhost:3000`
   - **Redirect URLs**: Add `http://localhost:3000/**` (if not already there)

## Step 3: Verify Email Domain Restrictions (If Still Having Issues)

Supabase may have built-in email validation. If `@example.com` still doesn't work:

### Option A: Use a Real Email Domain (Temporary)
- Use a Gmail account: `contributor.test@gmail.com`
- Or use a disposable email service

### Option B: Configure Custom SMTP (Advanced)
If you need to use custom domains:
1. Go to **Project Settings** → **Auth** → **SMTP Settings**
2. Configure a custom SMTP provider (SendGrid, AWS SES, etc.)
3. This allows more control over email validation

## Step 4: Alternative - Use Magic Link Instead

If email validation continues to be an issue, you can:
1. Use Supabase's magic link authentication
2. Or use OAuth providers (Google, GitHub) for testing

## Quick Test

After making these changes:
1. Refresh your browser
2. Try the "Create & Login New User" button again
3. The email should now be accepted

## Most Common Fix

**90% of the time, disabling email confirmation (Step 1) fixes the issue.**

Make sure to:
- Save the settings after changing them
- Wait a few seconds for changes to propagate
- Refresh your browser/app




