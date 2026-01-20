"use client"

import { useState } from "react"
import { CheckCircle2, Circle, Gift, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Task {
  id: string
  title: string
  description: string | null
  pointValue: number
  isCompleted: boolean
  isRecurring: boolean
  recurringType: string | null
}

interface TaskCardProps {
  task: Task
  onComplete: (id: string) => void
}

export function TaskCard({ task, onComplete }: TaskCardProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleComplete = async () => {
    if (task.isCompleted) return
    setIsLoading(true)
    await onComplete(task.id)
    setIsLoading(false)
  }

  return (
    <Card className={`transition-all ${task.isCompleted ? "opacity-60 bg-green-50" : "hover:shadow-md"}`}>
      <CardContent className="flex items-center gap-4 p-4">
        <button
          onClick={handleComplete}
          disabled={task.isCompleted || isLoading}
          className="flex-shrink-0 transition-transform hover:scale-110"
        >
          {task.isCompleted ? (
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          ) : (
            <Circle className="w-8 h-8 text-gray-300 hover:text-purple-500 transition-colors" />
          )}
        </button>
        <div className="flex-grow">
          <h3 className={`font-medium ${task.isCompleted ? "line-through text-gray-500" : ""}`}>
            {task.title}
          </h3>
          {task.description && (
            <p className="text-sm text-muted-foreground">{task.description}</p>
          )}
          {task.isRecurring && (
            <Badge variant="secondary" className="mt-1 text-xs">
              {task.recurringType}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-full">
          <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
          <span className="font-bold text-amber-600">+{task.pointValue}</span>
        </div>
      </CardContent>
    </Card>
  )
}

interface RewardCardProps {
  reward: {
    id: string
    name: string
    description: string | null
    pointCost: number
  }
  canAfford: boolean
  onRedeem: (id: string) => void
}

export function RewardCard({ reward, canAfford, onRedeem }: RewardCardProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleRedeem = async () => {
    setIsLoading(true)
    await onRedeem(reward.id)
    setIsLoading(false)
  }

  return (
    <Card className={`transition-all ${!canAfford ? "opacity-60" : "hover:shadow-md"}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Gift className="w-5 h-5 text-purple-500" />
            {reward.name}
          </CardTitle>
          <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-full">
            <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
            <span className="font-bold text-amber-600">{reward.pointCost}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {reward.description && (
          <p className="text-sm text-muted-foreground mb-3">{reward.description}</p>
        )}
        <Button
          onClick={handleRedeem}
          disabled={!canAfford || isLoading}
          className="w-full"
          variant={canAfford ? "default" : "secondary"}
        >
          {isLoading ? "Requesting..." : canAfford ? "Request Reward" : "Not enough stars"}
        </Button>
      </CardContent>
    </Card>
  )
}
