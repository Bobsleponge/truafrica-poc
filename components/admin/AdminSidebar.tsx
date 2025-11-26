'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  HelpCircle,
  MessageSquare,
  Shield,
  Settings,
  DollarSign,
  CheckCircle2,
  FileText,
  ChevronRight,
  ChevronDown,
  Coins,
  TrendingUp,
  Globe,
  Languages,
  Award,
  Gauge,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  children?: NavItem[]
}

const navItems: NavItem[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/campaigns', label: 'Campaigns', icon: FolderKanban },
  { href: '/admin/questions', label: 'Questions', icon: HelpCircle },
  { href: '/admin/answers', label: 'Answers', icon: MessageSquare },
  { href: '/admin/validation', label: 'Validation', icon: CheckCircle2 },
  {
    href: '/admin/config',
    label: 'Configuration',
    icon: Settings,
    children: [
      { href: '/admin/config/pricing', label: 'Pricing', icon: DollarSign },
      { href: '/admin/config/rewards', label: 'Rewards', icon: Coins },
      { href: '/admin/config/complexity', label: 'Complexity', icon: TrendingUp },
      { href: '/admin/config/costOfLiving', label: 'Cost of Living', icon: Globe },
      { href: '/admin/config/taskType', label: 'Task Types', icon: Award },
      { href: '/admin/config/languages', label: 'Languages', icon: Languages },
      { href: '/admin/config/quality', label: 'Quality', icon: Gauge },
    ],
  },
  { href: '/admin/templates', label: 'Templates', icon: FileText },
  { href: '/admin/pricing', label: 'Pricing Rules', icon: DollarSign },
  { href: '/admin/security', label: 'Security', icon: Shield },
]

function NavItemComponent({ item, pathname }: { item: NavItem; pathname: string }) {
  const [isOpen, setIsOpen] = useState(
    item.children?.some(child => pathname === child.href || pathname?.startsWith(child.href + '/')) || false
  )
  const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
  const hasActiveChild = item.children?.some(child => pathname === child.href || pathname?.startsWith(child.href + '/'))

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
            (isActive || hasActiveChild)
              ? 'bg-primary/10 text-primary border border-primary/20'
              : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
          )}
        >
          <div className="flex items-center gap-3">
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </div>
          {isOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
        {isOpen && (
          <div className="ml-4 mt-1 space-y-1">
            {item.children.map((child) => {
              const isChildActive = pathname === child.href || pathname?.startsWith(child.href + '/')
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors',
                    isChildActive
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  )}
                >
                  <child.icon className="h-3.5 w-3.5" />
                  <span>{child.label}</span>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary/10 text-primary border border-primary/20'
          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
      )}
    >
      <item.icon className="h-4 w-4" />
      {item.label}
    </Link>
  )
}

export default function AdminSidebar() {
  const pathname = usePathname()
  const { user } = useAuth()

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a] border-r border-border/50 w-64">
      {/* Header */}
      <div className="p-6 border-b border-border/50">
        <h1 className="text-xl font-bold gradient-text">TruAfrica Admin</h1>
        {user && (
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {user.email}
          </p>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavItemComponent key={item.href} item={item} pathname={pathname} />
        ))}
      </nav>
    </div>
  )
}



