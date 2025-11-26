"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface ProgressProps extends React.ComponentProps<typeof ProgressPrimitive.Root> {
  variant?: 'default' | 'gradient' | 'success' | 'warning'
  glow?: boolean
}

function Progress({
  className,
  value,
  variant = 'default',
  glow = false,
  ...props
}: ProgressProps) {
  const variantClasses = {
    default: "bg-primary",
    gradient: "bg-gradient-to-r from-[#8E24AA] to-[#FF6D00]",
    success: "bg-[#00E676]",
    warning: "bg-[#FFC107]",
  }

  const glowStyle = glow
    ? {
        boxShadow: variant === 'gradient'
          ? '0 0 10px rgba(142, 36, 170, 0.5), 0 0 20px rgba(255, 109, 0, 0.3)'
          : '0 0 10px currentColor',
      }
    : {}

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "bg-primary/20 relative h-2 w-full overflow-hidden rounded-full",
        className
      )}
      {...props}
    >
      <motion.div
        className={cn(
          "h-full flex-1 transition-all rounded-full",
          variantClasses[variant]
        )}
        style={{
          width: `${value || 0}%`,
          ...glowStyle,
        }}
        initial={{ width: 0 }}
        animate={{ width: `${value || 0}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
