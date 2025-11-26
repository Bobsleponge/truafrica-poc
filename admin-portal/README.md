# TruAfrica Admin Portal

A completely standalone Next.js 14 App Router application for platform administrators. This admin portal is fully isolated from the main TruAfrica application with its own routing, authentication, and build pipeline.

## Features

- **Standalone Architecture**: Completely separate codebase, routing, and deployment
- **Admin-Only Access**: Only `platform_admin` role users can authenticate
- **RBAC Enforcement**: Server-side role-based access control with middleware guards
- **Modern UI**: Dark mode with neon cyan/blue accents, built with shadcn/ui
- **Comprehensive Dashboard**: KPI cards, charts, and analytics using Recharts
- **Entity Management**: Full CRUD for clients, campaigns, users, and settings
- **Secure API**: All admin APIs use service-role Supabase client (server-side only)

## Project Structure

```
admin-portal/
├── app/
│   ├── (admin)/          # Protected admin routes
│   │   ├── dashboard/
│   │   ├── clients/
│   │   ├── campaigns/
│   │   ├── users/
│   │   ├── analytics/
│   │   └── settings/
│   ├── (public)/          # Public routes (login)
│   │   └── login/
│   ├── admin/
│   │   └── api/          # Admin API endpoints
│   └── layout.tsx
├── components/
│   ├── auth/             # Authentication components
│   ├── layout/            # Sidebar, Navbar
│   ├── dashboard/        # Dashboard components
│   ├── analytics/        # Analytics components
│   ├── clients/          # Client management
│   ├── campaigns/        # Campaign management
│   ├── users/            # User management
│   ├── settings/         # Settings management
│   └── ui/               # shadcn/ui components
├── lib/
│   ├── supabase/         # Supabase clients (client & server)
│   ├── auth/             # Session & RBAC helpers
│   └── utils.ts
├── types/                # Shared TypeScript types
└── middleware.ts         # Route protection middleware
```

## Setup

### 1. Install Dependencies

From the `/admin-portal` directory:

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file in `/admin-portal` with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Optional
NODE_ENV=development
```

**Important Notes:**
- These environment variables are isolated from the main app
- The service-role key is **NEVER** exposed to the browser
- Use the same Supabase project as the main app (shared database)

### 3. Database Schema Requirements

The admin portal expects the following tables in your Supabase database:

- `users` - User table with `role` column (values: `platform_admin`, `client`, `team`, `contributor`)
- `clients` - Client organizations
- `campaigns` - Campaign data
- `platform_settings` - Global platform settings (optional, will be created on first use)

If your role is stored in a different table (e.g., `admin_profiles`), the code will check both locations.

### 4. Run Development Server

```bash
npm run dev
```

The admin portal runs on **port 3001** by default (separate from the main app on port 3000).

Access the portal at: `http://localhost:3001`

## Authentication & Access

### Login Flow

1. Navigate to `/login`
2. Enter email and password
3. System verifies user has `platform_admin` role
4. If valid, creates secure session cookie
5. Redirects to `/dashboard`

### Role Verification

The system checks for `platform_admin` role in:
1. `users.role` column (primary)
2. `admin_profiles.role` column (fallback)

All other roles (`client`, `team`, `contributor`) are blocked from accessing the portal.

### Session Management

- Sessions are stored in HTTP-only cookies
- Session duration: 7 days
- Server-side validation on every request
- Automatic redirect to `/login` if session invalid

## API Endpoints

All admin API endpoints are under `/admin/api/*` and require platform admin authentication:

### Authentication
- `POST /admin/api/auth/check-role` - Verify user is platform admin
- `POST /admin/api/auth/create-session` - Create admin session
- `POST /admin/api/auth/logout` - Destroy session

### Clients
- `GET /admin/api/clients/list` - List all clients (paginated)
- `GET /admin/api/clients/get?clientId=...` - Get client details
- `PUT /admin/api/clients/update` - Update client metadata

### Users
- `GET /admin/api/users/list` - List all users (paginated, filterable by role)
- `PUT /admin/api/users/update-role` - Update user role

### Campaigns
- `GET /admin/api/campaigns/list` - List all campaigns (filterable by status)
- `GET /admin/api/campaigns/get?campaignId=...` - Get campaign details

### Settings
- `PUT /admin/api/settings/update` - Update platform settings

### Analytics
- `GET /admin/api/analytics/metrics` - Get platform-wide analytics

## Pages & Routes

### Public Routes
- `/login` - Admin login page

### Protected Admin Routes
- `/dashboard` - Main dashboard with KPIs and charts
- `/clients` - List all clients
- `/clients/[clientId]` - Client detail page
- `/campaigns` - List all campaigns
- `/campaigns/[campaignId]` - Campaign detail page
- `/users` - List all users
- `/users/[userId]` - User detail and role management
- `/analytics` - Platform-wide analytics dashboard
- `/settings` - Global platform configuration

## Deployment

### Build

```bash
npm run build
```

### Production Deployment

The admin portal can be deployed independently from the main app:

#### Vercel

1. Create a new Vercel project for the admin portal
2. Set root directory to `/admin-portal`
3. Add environment variables in Vercel dashboard
4. Deploy

#### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

#### Environment Variables for Production

Ensure all environment variables are set in your deployment platform:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NODE_ENV=production`

### Separate Domain/Subdomain

Recommended deployment structure:
- Main app: `app.truafrica.com`
- Admin portal: `admin.truafrica.com`

This ensures complete isolation and allows independent scaling.

## Development

### Running Both Apps

To run both the main app and admin portal simultaneously:

**Terminal 1 (Main App):**
```bash
cd /path/to/truafrica-poc
npm run dev
# Runs on http://localhost:3000
```

**Terminal 2 (Admin Portal):**
```bash
cd /path/to/truafrica-poc/admin-portal
npm run dev
# Runs on http://localhost:3001
```

### Code Isolation

The admin portal does NOT import from:
- Main app's `app/` directory
- Main app's `components/` directory
- Main app's `lib/` directory (except shared Supabase connection)

All code is self-contained within `/admin-portal`.

## Security Considerations

1. **Service-Role Key**: Never exposed to browser, only used server-side
2. **Session Cookies**: HTTP-only, secure, same-site protection
3. **RBAC**: Server-side role verification on every request
4. **Middleware**: Route-level protection before page loads
5. **API Validation**: All API endpoints verify platform admin role

## Troubleshooting

### "Access denied" on login
- Verify user has `platform_admin` role in database
- Check `users.role` or `admin_profiles.role` column

### API endpoints return 401
- Check session cookie is set
- Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
- Ensure user role is `platform_admin`

### Build errors
- Ensure all dependencies are installed: `npm install`
- Check TypeScript errors: `npm run build`
- Verify environment variables are set

## Support

For issues or questions about the admin portal, refer to the main TruAfrica documentation or contact the development team.

