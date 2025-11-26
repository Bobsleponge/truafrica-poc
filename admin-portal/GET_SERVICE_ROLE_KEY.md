# How to Get Your Supabase Service Role Key

## Quick Steps

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Login to your account

2. **Select Your Project**
   - Project: `gcixmuhaybldhfaqnvaa`

3. **Navigate to API Settings**
   - Click **Settings** (gear icon) in the left sidebar
   - Click **API** in the settings menu

4. **Copy Service Role Key**
   - Scroll down to **Project API keys**
   - Find the **`service_role`** key (it's the secret one)
   - Click the **eye icon** to reveal it
   - Click **Copy** to copy the key

5. **Add to .env.local**
   - Open `/admin-portal/.env.local`
   - Replace `YOUR_SERVICE_ROLE_KEY_HERE` with the copied key
   - Save the file

## Security Note

⚠️ **Never commit the service role key to git!** It has full database access and bypasses all security rules.

## After Adding the Key

1. Fix admin role (if needed):
   ```bash
   cd admin-portal
   node scripts/final-setup.js
   ```

2. Start the server:
   ```bash
   npm run dev
   ```

3. Visit: http://localhost:3001/login-button
