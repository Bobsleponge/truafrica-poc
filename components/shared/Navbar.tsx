'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { TrustScoreBadge } from '@/components/contributor/TrustScoreBadge'
import { 
  Bell, 
  User, 
  Menu, 
  X, 
  LogOut,
  Sparkles,
  LayoutDashboard,
  MessageSquare,
  FolderKanban,
  Shield,
  Settings,
  HelpCircle,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { GlassCard } from '@/components/ui/glass-card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const contributorNavItems: NavItem[] = [
  { href: '/contributor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/contributor/questions', label: 'Questions', icon: HelpCircle },
  { href: '/contributor/rewards', label: 'Rewards', icon: Sparkles },
]

const clientNavItems: NavItem[] = [
  { href: '/client/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/client/campaigns', label: 'Campaigns', icon: FolderKanban },
  { href: '/client/questions', label: 'Questions', icon: HelpCircle },
]

const teamNavItems: NavItem[] = [
  { href: '/team/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/team/clients', label: 'Clients', icon: User },
  { href: '/team/campaigns', label: 'Campaigns', icon: FolderKanban },
]

const adminNavItems: NavItem[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: User },
  { href: '/admin/campaigns', label: 'Campaigns', icon: FolderKanban },
  { href: '/admin/questions', label: 'Questions', icon: HelpCircle },
  { href: '/admin/answers', label: 'Answers', icon: MessageSquare },
  { href: '/admin/security', label: 'Security', icon: Shield },
  { href: '/admin/config', label: 'Config', icon: Settings },
]

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading: authLoading } = useAuth()
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [navItems, setNavItems] = useState<NavItem[]>([])

  useEffect(() => {
    if (user && !authLoading) {
      loadProfile()
    }
  }, [user, authLoading])

  useEffect(() => {
    if (profile) {
      if (profile.role === 'contributor') {
        setNavItems(contributorNavItems)
      } else if (profile.role === 'client_owner' || profile.role === 'client_user') {
        setNavItems(clientNavItems)
      } else if (profile.role === 'team_account') {
        setNavItems(teamNavItems)
      } else if (profile.role === 'admin') {
        setNavItems(adminNavItems)
      }
      // platform_admin should not access main app - redirect handled in middleware
    }
  }, [profile])

  const loadProfile = async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (!error && data) {
        setProfile(data)
      }
    } catch (err) {
      console.error('Error loading profile:', err)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  // Don't show navbar on login/auth pages
  if (pathname?.startsWith('/auth/') || pathname === '/') {
    return null
  }

  // Don't show navbar if no user or still loading
  if (authLoading || !user || !profile) {
    return null
  }

  return (
    <nav className="navbar-gradient sticky top-0 z-50 border-b border-border/50 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo and Mobile Menu Button */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9 shrink-0"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-4 w-4 sm:h-5 sm:w-5" /> : <Menu className="h-4 w-4 sm:h-5 sm:w-5" />}
            </Button>
            <Link 
              href={
                profile.role === 'contributor' ? '/contributor/dashboard' 
                : profile.role === 'client_owner' || profile.role === 'client_user' ? '/client/dashboard'
                : profile.role === 'team_account' ? '/team/dashboard'
                : profile.role === 'admin' ? '/admin/dashboard'
                : '/'
              } 
              className="flex items-center gap-1.5 sm:gap-2 min-w-0"
            >
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 gradient-text shrink-0" />
              <span className="text-base sm:text-lg md:text-xl font-bold gradient-text truncate">TruAfrica</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-0.5 lg:gap-1 flex-shrink-0">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'gap-1.5 px-2 lg:px-3 text-xs lg:text-sm',
                      isActive
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 lg:h-4 lg:w-4 shrink-0" />
                    <span className="hidden lg:inline">{item.label}</span>
                  </Button>
                </Link>
              )
            })}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {profile.role === 'contributor' && profile.trust_score !== null && (
              <div className="hidden md:flex items-center gap-1.5 sm:gap-2">
                <div className="hidden lg:block">
                  <TrustScoreBadge trustScore={Number(profile.trust_score)} size="sm" showLabel={false} />
                </div>
                <div className="lg:hidden text-xs sm:text-sm font-mono font-bold gradient-text px-2 py-1 rounded border border-primary/20 bg-primary/10">
                  {Number(profile.trust_score).toFixed(1)}
                </div>
              </div>
            )}
            
            <Button variant="ghost" size="icon" className="relative h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10">
              <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
              <span className="absolute top-0.5 right-0.5 h-1.5 w-1.5 sm:h-2 sm:w-2 bg-[#00E676] rounded-full"></span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="hover-3d-lift h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10">
                  <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 glass-card-md">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium truncate">{profile.name || 'User'}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  {profile.role === 'contributor' && profile.trust_score !== null && (
                    <div className="mt-2">
                      <TrustScoreBadge trustScore={Number(profile.trust_score)} size="sm" />
                    </div>
                  )}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-border/50"
          >
            <GlassCard variant="solid-border" blur="md" className="m-2 mb-4">
              <div className="p-4 space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button
                        variant="ghost"
                        className={cn(
                          'w-full justify-start gap-2',
                          isActive
                            ? 'bg-primary/10 text-primary border border-primary/20'
                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Button>
                    </Link>
                  )
                })}
                {profile.role === 'contributor' && profile.trust_score !== null && (
                  <div className="pt-2 border-t border-border/50">
                    <TrustScoreBadge trustScore={Number(profile.trust_score)} size="sm" />
                  </div>
                )}
                <div className="pt-2 border-t border-border/50">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-destructive"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}

