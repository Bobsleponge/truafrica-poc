'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface AfricaMapProps {
  className?: string
  showNodes?: boolean
}

export function AfricaMap({ className = '', showNodes = true }: AfricaMapProps) {
  // Simplified but recognizable Africa continent shape
  // Features: Western bulge, Eastern horn, Southern tip
  // This creates the classic "upside-down triangle with bulge" shape of Africa
  const africaPath = "M 220 100 L 260 95 L 300 100 L 340 110 L 375 130 L 400 160 L 415 195 L 420 230 L 418 265 L 410 300 L 395 330 L 375 355 L 350 370 L 320 378 L 290 375 L 265 365 L 245 350 L 230 330 L 220 305 L 215 280 L 218 255 L 228 230 L 245 210 L 268 195 L 295 185 L 325 180 L 355 188 L 378 205 L 392 230 L 395 255 L 385 280 L 370 300 L 350 315 L 328 320 L 308 315 L 293 300 L 285 280 L 283 260 L 290 242 L 303 230 L 320 225 L 335 230 L 342 245 L 338 258 L 328 265 L 318 262 L 312 250 L 315 240 L 325 235 L 330 242 L 328 250 Z"

  // Data nodes across Africa (representing contributors) - positioned on actual continent
  const nodes = [
    { x: 280, y: 200, delay: 0 },      // West Africa (Nigeria/Ghana region)
    { x: 320, y: 250, delay: 0.2 },   // Central Africa (Congo region)
    { x: 390, y: 280, delay: 0.4 },   // East Africa (Kenya/Tanzania region - Horn of Africa)
    { x: 320, y: 340, delay: 0.6 },  // Southern Africa (South Africa region)
    { x: 340, y: 140, delay: 0.8 },  // North Africa (Egypt region)
  ]

  // Burst particles - flow from Africa center outward
  const [burstParticles, setBurstParticles] = useState<Array<{
    id: number
    startX: number
    startY: number
    endX: number
    endY: number
    delay: number
  }>>([])

  // Africa center point (approximate geographic center of continent)
  const africaCenter = { x: 310, y: 240 }

  useEffect(() => {
    // Generate burst particles flowing outward in multiple directions
    const particles: Array<{
      id: number
      startX: number
      startY: number
      endX: number
      endY: number
      delay: number
    }> = []

    // Create particles in 8 directions (representing global reach)
    const directions = [
      { angle: 0, distance: 200 },      // Right (East)
      { angle: 45, distance: 200 },     // Top-right (Northeast)
      { angle: 90, distance: 200 },     // Top (North)
      { angle: 135, distance: 200 },    // Top-left (Northwest)
      { angle: 180, distance: 200 },    // Left (West)
      { angle: 225, distance: 200 },     // Bottom-left (Southwest)
      { angle: 270, distance: 200 },    // Bottom (South)
      { angle: 315, distance: 200 },    // Bottom-right (Southeast)
    ]

    directions.forEach((dir, index) => {
      const angleRad = (dir.angle * Math.PI) / 180
      const endX = africaCenter.x + Math.cos(angleRad) * dir.distance
      const endY = africaCenter.y - Math.sin(angleRad) * dir.distance

      // Create multiple particles per direction for continuous flow
      for (let i = 0; i < 3; i++) {
        particles.push({
          id: index * 3 + i,
          startX: africaCenter.x,
          startY: africaCenter.y,
          endX,
          endY,
          delay: index * 0.3 + i * 0.5,
        })
      }
    })

    setBurstParticles(particles)
  }, [])

  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox="180 50 280 350"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Gradient definitions */}
        <defs>
          <linearGradient id="africaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8E24AA" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#FF6D00" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="burstGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8E24AA" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#5C6BC0" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#00BFA5" stopOpacity="0.3" />
          </linearGradient>
          <radialGradient id="africaFill" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#8E24AA" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#FF6D00" stopOpacity="0.05" />
          </radialGradient>
        </defs>

        {/* Subtle world context - outer circle representing global reach */}
        <motion.circle
          cx={africaCenter.x}
          cy={africaCenter.y}
          r="220"
          fill="none"
          stroke="url(#burstGradient)"
          strokeWidth="1"
          strokeDasharray="4 4"
          opacity="0.3"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ 
            scale: [0.8, 1.1, 0.8],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ 
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Burst particles - flowing from Africa outward */}
        {burstParticles.map((particle) => (
          <motion.g key={particle.id}>
            {/* Particle path */}
            <motion.circle
              r="4"
              fill="url(#burstGradient)"
              initial={{ 
                cx: particle.startX, 
                cy: particle.startY,
                opacity: 0,
                scale: 0
              }}
              animate={{ 
                cx: particle.endX,
                cy: particle.endY,
                opacity: [0, 1, 1, 0],
                scale: [0, 1.5, 1, 0]
              }}
              transition={{ 
                delay: particle.delay,
                duration: 3,
                repeat: Infinity,
                repeatDelay: 1,
                ease: "easeOut"
              }}
            />
            {/* Trail effect */}
            <motion.line
              x1={particle.startX}
              y1={particle.startY}
              x2={particle.endX}
              y2={particle.endY}
              stroke="url(#burstGradient)"
              strokeWidth="2"
              strokeDasharray="8 4"
              initial={{ 
                pathLength: 0,
                opacity: 0
              }}
              animate={{ 
                pathLength: [0, 1, 1, 0],
                opacity: [0, 0.6, 0.6, 0]
              }}
              transition={{ 
                delay: particle.delay,
                duration: 3,
                repeat: Infinity,
                repeatDelay: 1,
                ease: "easeOut"
              }}
            />
          </motion.g>
        ))}

        {/* Africa continent - filled with subtle gradient */}
        <motion.path
          d={africaPath}
          fill="url(#africaFill)"
          stroke="url(#africaGradient)"
          strokeWidth="4"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />
        
        {/* Africa continent outline - animated glow */}
        <motion.path
          d={africaPath}
          fill="none"
          stroke="url(#africaGradient)"
          strokeWidth="3"
          opacity="0.8"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, delay: 0.5, ease: "easeInOut" }}
        />

        {/* Data nodes across Africa (representing contributors) */}
        {showNodes && nodes.map((node, index) => (
          <motion.g key={index}>
            {/* Node core */}
            <motion.circle
              cx={node.x}
              cy={node.y}
              r="10"
              fill="#00BFA5"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [0, 1.3, 1],
                opacity: [0, 1, 1]
              }}
              transition={{ 
                delay: node.delay + 1,
                duration: 0.8,
                repeat: Infinity,
                repeatType: "reverse",
                repeatDelay: 2
              }}
            />
            {/* Pulsing ring */}
            <motion.circle
              cx={node.x}
              cy={node.y}
              r="15"
              fill="none"
              stroke="#00BFA5"
              strokeWidth="2"
              initial={{ scale: 0, opacity: 0.8 }}
              animate={{ 
                scale: [1, 2.5, 1],
                opacity: [0.8, 0, 0.8]
              }}
              transition={{ 
                delay: node.delay + 1,
                duration: 2.5,
                repeat: Infinity,
                ease: "easeOut"
              }}
            />
            {/* Connection to center - showing data flow */}
            <motion.line
              x1={node.x}
              y1={node.y}
              x2={africaCenter.x}
              y2={africaCenter.y}
              stroke="#5C6BC0"
              strokeWidth="1.5"
              strokeDasharray="6 3"
              opacity="0.3"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ 
                pathLength: [0, 1, 1],
                opacity: [0, 0.3, 0.3]
              }}
              transition={{ 
                delay: node.delay + 1.5,
                duration: 1.5,
                ease: "easeOut"
              }}
            />
          </motion.g>
        ))}

        {/* Central burst point - where data originates */}
        <motion.g>
          <motion.circle
            cx={africaCenter.x}
            cy={africaCenter.y}
            r="12"
            fill="url(#africaGradient)"
            initial={{ scale: 0 }}
            animate={{ 
              scale: [1, 1.2, 1],
            }}
            transition={{ 
              delay: 1,
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.circle
            cx={africaCenter.x}
            cy={africaCenter.y}
            r="20"
            fill="none"
            stroke="url(#africaGradient)"
            strokeWidth="3"
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ 
              scale: [1, 2, 1],
              opacity: [0.8, 0, 0.8]
            }}
            transition={{ 
              delay: 1,
              duration: 2,
              repeat: Infinity,
              ease: "easeOut"
            }}
          />
        </motion.g>
      </svg>
    </div>
  )
}

