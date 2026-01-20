import { Star, Gem } from "lucide-react"

interface PointsDisplayProps {
  points: number
  gemRatio?: number
  showTotal?: boolean
  size?: "sm" | "md" | "lg"
}

const sizeClasses = {
  sm: { icon: "w-3 h-3", text: "text-xs" },
  md: { icon: "w-4 h-4", text: "text-sm" },
  lg: { icon: "w-6 h-6", text: "text-xl" },
}

export function PointsDisplay({ points, gemRatio = 10, showTotal = false, size = "md" }: PointsDisplayProps) {
  const gems = Math.floor(points / gemRatio)
  const stars = points % gemRatio
  const { icon, text } = sizeClasses[size]

  return (
    <div className="flex items-center gap-3">
      {gems > 0 && (
        <div className="flex items-center gap-1">
          <Gem className={`${icon} fill-purple-500 text-purple-600`} />
          <span className={`font-bold text-purple-600 ${text}`}>{gems}</span>
        </div>
      )}
      <div className="flex items-center gap-1">
        <Star className={`${icon} fill-amber-400 text-amber-500`} />
        <span className={`font-bold text-amber-600 ${text}`}>{stars}</span>
      </div>
      {showTotal && (
        <span className={`text-muted-foreground ${text}`}>({points} pts)</span>
      )}
    </div>
  )
}

interface StarPointsProps {
  points: number
  size?: "sm" | "md" | "lg"
  className?: string
}

export function StarPoints({ points, size = "md", className = "" }: StarPointsProps) {
  const { icon, text } = sizeClasses[size]

  return (
    <div className={`flex items-center gap-1 text-amber-500 ${className}`}>
      <Star className={`${icon} fill-amber-400`} />
      <span className={`font-bold ${text}`}>{points}</span>
    </div>
  )
}
