'use client'

import type { ReactNode } from 'react'

interface StepContainerProps {
  title: string
  subtitle: string
  children: ReactNode
}

export function StepContainer({ title, subtitle, children }: StepContainerProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 via-white/2 to-white/5 p-8 shadow-[0_0_45px_rgba(90,96,255,0.25)] backdrop-blur-xl transition-all duration-300 hover:border-purple-400/40">
      <div className="relative z-10 space-y-6">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-purple-300/80">Step</p>
          <h2 className="text-3xl font-semibold text-white">{title}</h2>
          <p className="text-base text-slate-300/80">{subtitle}</p>
        </div>
        {children}
      </div>
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -left-10 top-1/3 h-32 w-32 rounded-full bg-purple-500/30 blur-3xl" />
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-cyan-500/20 blur-3xl" />
      </div>
    </div>
  )
}

