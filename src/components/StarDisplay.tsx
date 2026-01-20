import { Star, Gem } from "lucide-react"

interface StarDisplayProps {
  points: number
  showGems?: boolean
  gemRatio?: number
  size?: "sm" | "md" | "lg"
}

export function StarDisplay({
  points,
  showGems = true,
  gemRatio = 10,
  size = "md",
}: StarDisplayProps) {
  const gems = Math.floor(points / gemRatio)
  const stars = points % gemRatio

  const sizes = {
    sm: { icon: "w-4 h-4", text: "text-sm" },
    md: { icon: "w-5 h-5", text: "text-base" },
    lg: { icon: "w-6 h-6", text: "text-lg" },
  }

  return (
    <div className="flex items-center gap-3">
      {showGems && gems > 0 && (
        <div className="flex items-center gap-1">
          <Gem className={`${sizes[size].icon} fill-purple-500 text-purple-600`} />
          <span className={`font-bold text-purple-600 ${sizes[size].text}`}>
            {gems}
          </span>
        </div>
      )}
      <div className="flex items-center gap-1">
        <Star className={`${sizes[size].icon} fill-amber-400 text-amber-500`} />
        <span className={`font-bold text-amber-600 ${sizes[size].text}`}>
          {showGems ? stars : points}
        </span>
      </div>
      <span className={`text-muted-foreground ${sizes[size].text}`}>
        ({points} pts)
      </span>
    </div>
  )
}

interface PointsBadgeProps {
  points: number
  size?: "sm" | "md" | "lg"
}

export function PointsBadge({ points, size = "md" }: PointsBadgeProps) {
  const sizes = {
    sm: { icon: "w-3 h-3", text: "text-xs" },
    md: { icon: "w-4 h-4", text: "text-sm" },
    lg: { icon: "w-5 h-5", text: "text-base" },
  }

  return (
    <div className="flex items-center gap-1 text-amber-500">
      <Star className={`${sizes[size].icon} fill-amber-400`} />
      <span className={`font-bold ${sizes[size].text}`}>+{points}</span>
    </div>
  )
}
