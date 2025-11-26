'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface CardProps extends Omit<React.ComponentProps<"div">, 'floating' | 'gradient'> {
  gradient?: boolean
  floating?: boolean
}

function Card({ className, gradient = false, floating = false, ...props }: CardProps) {
  const cardClasses = cn(
    "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm transition-all duration-300",
    gradient && "border-transparent bg-gradient-to-br from-purple-900/20 to-orange-900/20 dark:from-purple-500/10 dark:to-orange-500/10",
    floating && "hover:shadow-xl hover:-translate-y-1 hover-lift",
    className
  )

  if (floating) {
    return (
      <motion.div
        data-slot="card"
        className={cardClasses}
        whileHover={{ 
          y: -4, 
          transition: { duration: 0.2 },
          boxShadow: "0 10px 25px rgba(142, 36, 170, 0.3), 0 0 20px rgba(255, 109, 0, 0.2)"
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        {...props}
      />
    )
  }

  return (
    <div
      data-slot="card"
      className={cardClasses}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  )
}

// Gradient header variant for Web3 theme
function CardHeaderGradient({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "gradient-primary rounded-t-xl -mx-6 -mt-6 mb-6 px-6 py-4",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardHeaderGradient,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
