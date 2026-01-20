import { Card, CardContent } from "@/components/ui/card"
import { ReactNode } from "react"
import { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon?: LucideIcon
  title?: string
  description: string
  action?: ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="py-8 text-center">
        {Icon && <Icon className="w-12 h-12 mx-auto mb-3 text-gray-300" />}
        {title && <h3 className="font-medium text-lg mb-1">{title}</h3>}
        <p className="text-muted-foreground mb-4">{description}</p>
        {action}
      </CardContent>
    </Card>
  )
}
