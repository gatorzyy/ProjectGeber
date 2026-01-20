import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { ReactNode } from "react"

interface PageHeaderProps {
  title: string
  backHref?: string
  backLabel?: string
  actions?: ReactNode
}

export function PageHeader({ title, backHref, backLabel = "Back", actions }: PageHeaderProps) {
  return (
    <div className="mb-6">
      {backHref && (
        <Link href={backHref}>
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {backLabel}
          </Button>
        </Link>
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{title}</h1>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}
