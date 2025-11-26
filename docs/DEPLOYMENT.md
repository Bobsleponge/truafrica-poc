# TruAfrica POC - Deployment Guide

This guide covers deploying the TruAfrica POC to production.

## Pre-Deployment Checklist

- [ ] All tests pass locally
- [ ] Database migrations run successfully
- [ ] Environment variables configured
- [ ] Production build succeeds (`npm run build`)
- [ ] Security review completed
- [ ] Performance optimization done

## Deployment Options

### Option 1: Vercel (Recommended)

Vercel is the easiest way to deploy Next.js applications.

#### Steps:

1. **Install Vercel CLI** (optional):
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```
   Or connect your GitHub repository at [vercel.com](https://vercel.com)

3. **Configure Environment Variables**:
   - Go to Project Settings > Environment Variables
   - Add:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - Any reward API keys (if integrated)

4. **Configure Supabase**:
   - Update Supabase Auth redirect URLs:
     - Add your Vercel domain: `https://your-app.vercel.app/**`
   - Update CORS settings if needed

5. **Deploy**:
   - Push to main branch (auto-deploys)
   - Or run `vercel --prod` for manual deployment

### Option 2: Other Platforms

#### Netlify

1. Connect GitHub repository
2. Build command: `npm run build`
3. Publish directory: `.next`
4. Add environment variables
5. Deploy

#### Railway

1. Connect GitHub repository
2. Set build command: `npm run build`
3. Set start command: `npm start`
4. Add environment variables
5. Deploy

#### Self-Hosted (VPS/Server)

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Set up environment variables**:
   ```bash
   export NEXT_PUBLIC_SUPABASE_URL=...
   export NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```

3. **Start production server**:
   ```bash
   npm start
   ```

4. **Set up reverse proxy** (Nginx example):
   ```nginx
   server {
     listen 80;
     server_name your-domain.com;
     
     location / {
       proxy_pass http://localhost:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }
   }
   ```

5. **Set up SSL** (Let's Encrypt):
   ```bash
   certbot --nginx -d your-domain.com
   ```

## Production Supabase Setup

### 1. Create Production Project

1. Create a new Supabase project for production
2. Run migrations in production database
3. Seed initial data

### 2. Configure Authentication

1. Go to Authentication > URL Configuration
2. Add production domain to:
   - Site URL
   - Redirect URLs
3. Configure email templates
4. Set up OAuth providers (if using)

### 3. Database Backups

1. Set up automated backups in Supabase
2. Configure backup schedule
3. Test restore process

### 4. Monitoring

1. Enable Supabase monitoring
2. Set up alerts for:
   - High error rates
   - Database performance issues
   - Authentication failures

## Environment Variables

### Required Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
```

### Optional Variables (for reward APIs)

```env
# M-Pesa
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_BUSINESS_SHORTCODE=
MPESA_CALLBACK_URL=

# MTN
MTN_API_KEY=
MTN_API_SECRET=

# Other providers...
```

## Security Hardening

### 1. Row Level Security

- Verify all RLS policies are enabled
- Test that users can only access their own data
- Review policies for any security gaps

### 2. API Routes

- Ensure all API routes require authentication
- Implement rate limiting
- Add request validation

### 3. Environment Variables

- Never commit `.env.local` to git
- Use secure storage for production secrets
- Rotate API keys regularly

### 4. HTTPS

- Always use HTTPS in production
- Set up SSL certificates
- Enable HSTS headers

## Performance Optimization

### 1. Database

- Review and optimize slow queries
- Add indexes where needed
- Monitor query performance

### 2. Caching

- Implement caching for:
  - Expertise fields (rarely change)
  - User profiles
  - Statistics
- Use Next.js caching strategies

### 3. Images and Assets

- Optimize images
- Use CDN for static assets
- Enable compression

### 4. Code Splitting

- Verify automatic code splitting works
- Check bundle sizes
- Optimize large dependencies

## Monitoring and Logging

### 1. Error Tracking

Set up error tracking (e.g., Sentry):

```bash
npm install @sentry/nextjs
```

Configure in `sentry.client.config.ts` and `sentry.server.config.ts`

### 2. Analytics

Optional: Add analytics (e.g., Google Analytics, Plausible)

### 3. Logging

- Set up structured logging
- Log important events:
  - User signups
  - Question submissions
  - Answer submissions
  - Reward redemptions
  - Errors

## Post-Deployment

### 1. Smoke Tests

Test critical paths:
- [ ] Landing page loads
- [ ] User signup works
- [ ] Login works
- [ ] Contributor onboarding works
- [ ] Question upload works
- [ ] Answer submission works
- [ ] Dashboard displays correctly

### 2. Performance Tests

- Test page load times
- Test API response times
- Test with multiple concurrent users

### 3. Security Tests

- Test authentication
- Test authorization
- Test input validation
- Test SQL injection prevention

## Rollback Plan

If deployment fails:

1. **Vercel**: Use deployment history to rollback
2. **Other platforms**: Keep previous deployment ready
3. **Database**: Keep migration rollback scripts

## Maintenance

### Regular Tasks

- Monitor error rates
- Review performance metrics
- Update dependencies
- Backup database regularly
- Review security logs

### Updates

1. Test updates in staging first
2. Deploy during low-traffic periods
3. Monitor after deployment
4. Have rollback plan ready

## Troubleshooting

### Common Issues

**Issue**: Build fails
- Check Node.js version compatibility
- Verify all dependencies installed
- Check for TypeScript errors

**Issue**: Environment variables not working
- Verify variable names match exactly
- Check for typos
- Restart deployment after adding variables

**Issue**: Database connection fails
- Verify Supabase URL and key
- Check Supabase project is active
- Verify network connectivity

**Issue**: Authentication not working
- Check redirect URLs in Supabase
- Verify CORS settings
- Check cookie settings

## Support

For deployment issues:
- Check platform-specific documentation
- Review error logs
- Contact platform support
- Check Supabase status page

---

**Ready to deploy?** Follow the steps above and you'll have TruAfrica running in production! 🚀

