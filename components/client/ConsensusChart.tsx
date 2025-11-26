'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { Answer } from '@/types/database'

interface ConsensusChartProps {
  answers: Answer[]
}

export function ConsensusChart({ answers }: ConsensusChartProps) {
  // Group answers by consensus score ranges
  const consensusRanges = [
    { range: '0-20%', min: 0, max: 20 },
    { range: '21-40%', min: 21, max: 40 },
    { range: '41-60%', min: 41, max: 60 },
    { range: '61-80%', min: 61, max: 80 },
    { range: '81-100%', min: 81, max: 100 },
  ]

  const chartData = consensusRanges.map(range => {
    const count = answers.filter(a => {
      if (a.consensus_score === null) return false
      const score = Number(a.consensus_score)
      return score >= range.min && score <= range.max
    }).length
    return {
      range: range.range,
      count,
    }
  })

  // Calculate average consensus
  const validScores = answers
    .map(a => a.consensus_score)
    .filter((s): s is number => s !== null)
    .map(s => Number(s))
  
  const averageConsensus = validScores.length > 0
    ? validScores.reduce((a, b) => a + b, 0) / validScores.length
    : 0

  // Distribution by correctness
  const correctCount = answers.filter(a => a.correct === true).length
  const incorrectCount = answers.filter(a => a.correct === false).length
  const pendingCount = answers.filter(a => a.correct === null).length

  const correctnessData = [
    { name: 'Correct', value: correctCount, color: '#22c55e' },
    { name: 'Incorrect', value: incorrectCount, color: '#ef4444' },
    { name: 'Pending', value: pendingCount, color: '#6b7280' },
  ]

  return (
    <Card className="floating" floating>
      <CardHeader className="gradient-primary rounded-t-xl -mx-6 -mt-6 mb-6 px-6 py-4">
        <CardTitle className="text-white">Consensus Score Distribution</CardTitle>
        <CardDescription className="text-white/90">
          Average consensus: <span className="font-bold text-white">{averageConsensus.toFixed(1)}%</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Consensus Score Bar Chart */}
          <div>
            <h4 className="text-sm font-medium mb-4">Answers by Consensus Range</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Correctness Breakdown */}
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-4">Answer Correctness</h4>
            <div className="grid grid-cols-3 gap-4">
              {correctnessData.map(item => (
                <div key={item.name} className="text-center">
                  <div
                    className="w-full h-20 rounded-lg flex items-center justify-center mb-2"
                    style={{ backgroundColor: item.color + '20' }}
                  >
                    <span className="text-2xl font-bold" style={{ color: item.color }}>
                      {item.value}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.name}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="pt-4 border-t grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Total Answers</p>
              <p className="text-lg font-semibold">{answers.length}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">With Consensus Score</p>
              <p className="text-lg font-semibold">
                {answers.filter(a => a.consensus_score !== null).length}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

