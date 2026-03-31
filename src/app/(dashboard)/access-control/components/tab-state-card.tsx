import { LucideIcon } from "lucide-react"

interface TabStateCardProps {
  icon: LucideIcon
  title: string
  description: string
}

export function TabStateCard({
  icon: Icon,
  title,
  description,
}: TabStateCardProps) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/30 px-6 py-12 text-center">
      <Icon className="mb-4 h-14 w-14 text-muted-foreground/40" />
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
