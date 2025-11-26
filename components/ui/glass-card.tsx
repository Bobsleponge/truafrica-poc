'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface GlassCardProps extends React.ComponentProps<'div'> {
  variant?: 'default' | 'gradient-border' | 'solid-border'
  blur?: 'sm' | 'md' | 'lg'
  opacity?: number
  hover?: boolean
  floating?: boolean
}

const blurMap = {
  sm: 'backdrop-blur-sm',
  md: 'backdrop-blur-md',
  lg: 'backdrop-blur-lg',
}

export function GlassCard({
  className,
  variant = 'default',
  blur = 'md',
  opacity = 0.1,
  hover = true,
  floating = false,
  children,
  ...props
}: GlassCardProps) {
  const baseClasses = cn(
    'relative rounded-xl border transition-all duration-300',
    'bg-white/5 dark:bg-black/20',
    blurMap[blur],
    variant === 'gradient-border' && 'border-transparent bg-gradient-to-br from-purple-500/10 to-orange-500/10',
    variant === 'solid-border' && 'border-white/20 dark:border-white/10',
    hover && 'hover:bg-white/10 dark:hover:bg-black/30 hover:shadow-2xl hover:shadow-purple-500/20',
    floating && 'hover:-translate-y-1',
    className
  )

  const content = (
    <div
      className={baseClasses}
      style={{
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
      }}
      {...props}
    >
      {variant === 'gradient-border' && (
        <div className="absolute inset-0 rounded-xl border-2 border-transparent bg-gradient-to-br from-purple-500/30 via-transparent to-orange-500/30 opacity-50 -z-10" />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  )

  if (floating) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={hover ? { y: -4, transition: { duration: 0.2 } } : undefined}
      >
        {content}
      </motion.div>
    )
  }

  return content
}

interface GlassCardHeaderProps extends React.ComponentProps<'div'> {
  gradient?: boolean
}

export function GlassCardHeader({ className, gradient = false, children, ...props }: GlassCardHeaderProps) {
  return (
    <div
      className={cn(
        'px-6 py-4',
        gradient && 'gradient-primary rounded-t-xl -mx-6 -mt-6 mb-6',
        !gradient && 'border-b border-white/10 dark:border-white/5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function GlassCardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('text-lg font-semibold leading-none', className)}
      {...props}
    />
  )
}

export function GlassCardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('text-sm text-muted-foreground mt-2', className)}
      {...props}
    />
  )
}

export function GlassCardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('px-6 py-4', className)}
      {...props}
    />
  )
}

export function GlassCardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('px-6 py-4 border-t border-white/10 dark:border-white/5 flex items-center', className)}
      {...props}
    />
  )
}



