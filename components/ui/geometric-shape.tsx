'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface GeometricShapeProps {
  type: 'triangle' | 'hexagon' | 'circle' | 'diamond'
  size?: number
  color?: string
  opacity?: number
  className?: string
  animated?: boolean
  position?: 'absolute' | 'relative'
  top?: string | number
  left?: string | number
  right?: string | number
  bottom?: string | number
  rotation?: number
  zIndex?: number
}

export function GeometricShape({
  type,
  size = 100,
  color = 'rgba(142, 36, 170, 0.2)',
  opacity = 0.3,
  className,
  animated = true,
  position = 'absolute',
  top,
  left,
  right,
  bottom,
  rotation = 0,
  zIndex = 0,
}: GeometricShapeProps) {
  const style: React.CSSProperties = {
    position,
    width: size,
    height: size,
    top,
    left,
    right,
    bottom,
    zIndex,
    opacity,
  }

  const renderShape = () => {
    switch (type) {
      case 'triangle':
        return (
          <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
            <polygon
              points="50,10 90,90 10,90"
              fill={color}
              opacity={opacity}
            />
          </svg>
        )
      case 'hexagon':
        return (
          <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
            <polygon
              points="50,5 90,25 90,75 50,95 10,75 10,25"
              fill={color}
              opacity={opacity}
            />
          </svg>
        )
      case 'diamond':
        return (
          <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
            <polygon
              points="50,10 90,50 50,90 10,50"
              fill={color}
              opacity={opacity}
            />
          </svg>
        )
      case 'circle':
      default:
        return (
          <div
            className={cn('rounded-full', className)}
            style={{
              width: size,
              height: size,
              backgroundColor: color,
              opacity,
            }}
          />
        )
    }
  }

  const shape = renderShape()

  if (animated) {
    return (
      <motion.div
        style={style}
        animate={{
          rotate: rotation,
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {shape}
      </motion.div>
    )
  }

  return (
    <div style={style}>
      {shape}
    </div>
  )
}

interface GeometricOverlayProps {
  shapes?: Array<{
    type: 'triangle' | 'hexagon' | 'circle' | 'diamond'
    size?: number
    color?: string
    top?: string | number
    left?: string | number
    right?: string | number
    bottom?: string | number
    rotation?: number
  }>
  className?: string
}

export function GeometricOverlay({ shapes = [], className }: GeometricOverlayProps) {
  const defaultShapes = shapes.length > 0 ? shapes : [
    { type: 'circle' as const, size: 150, top: '-50px', right: '-50px', color: 'rgba(142, 36, 170, 0.1)' },
    { type: 'triangle' as const, size: 100, bottom: '-30px', left: '-30px', color: 'rgba(255, 109, 0, 0.1)' },
    { type: 'hexagon' as const, size: 80, top: '50%', right: '10%', color: 'rgba(142, 36, 170, 0.08)' },
  ]

  return (
    <div className={cn('pointer-events-none overflow-hidden', className)}>
      {defaultShapes.map((shape, index) => (
        <GeometricShape
          key={index}
          type={shape.type}
          size={shape.size}
          color={shape.color}
          top={shape.top}
          left={shape.left}
          right={shape.right}
          bottom={shape.bottom}
          rotation={shape.rotation}
          zIndex={-1}
        />
      ))}
    </div>
  )
}



