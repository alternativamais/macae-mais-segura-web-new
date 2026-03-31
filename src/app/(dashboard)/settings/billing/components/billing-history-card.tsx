import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTag, resolveDataTagDefinition } from "@/components/shared/data-tag"
import { Separator } from "@/components/ui/separator"

interface BillingHistoryItem {
  id: number
  month: string
  plan: string
  amount: string
  status: string
}

interface BillingHistoryCardProps {
  history: BillingHistoryItem[]
}

const billingHistoryStatusTagMap = {
  paid: { label: "paid", tone: "success" },
  pending: { label: "pending", tone: "warning" },
  failed: { label: "failed", tone: "danger" },
  refunded: { label: "refunded", tone: "accent" },
} as const

function getBillingHistoryStatusTag(status: string) {
  return resolveDataTagDefinition(status, billingHistoryStatusTagMap, {
    label: status,
    tone: "neutral",
  })
}

export function BillingHistoryCard({ history }: BillingHistoryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing History</CardTitle>
        <CardDescription>
          View your past invoices and payments.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((item, index) => {
            const tag = getBillingHistoryStatusTag(item.status)

            return (
              <div key={item.id}>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <div className="font-medium">{item.month}</div>
                    <div className="text-sm text-muted-foreground">{item.plan}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{item.amount}</div>
                    <DataTag tone={tag.tone}>{tag.label}</DataTag>
                  </div>
                </div>
                {index < history.length - 1 && <Separator />}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
