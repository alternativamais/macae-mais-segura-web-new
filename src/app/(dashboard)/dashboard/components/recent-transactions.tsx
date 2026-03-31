"use client"

import { Eye, MoreHorizontal } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DataTag, resolveDataTagDefinition } from "@/components/shared/data-tag"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const transactions = [
  {
    id: "TXN-001",
    customer: {
      name: "Olivia Martin",
      email: "olivia.martin@email.com",
      avatar: "https://notion-avatars.netlify.app/api/avatar/?preset=female-7",
    },
    amount: "$1,999.00",
    status: "completed",
    date: "2 hours ago",
  },
  {
    id: "TXN-002",
    customer: {
      name: "Jackson Lee",
      email: "jackson.lee@email.com",
      avatar: "https://notion-avatars.netlify.app/api/avatar/?preset=male-1",
    },
    amount: "$2,999.00",
    status: "pending",
    date: "5 hours ago",
  },
  {
    id: "TXN-003",
    customer: {
      name: "Isabella Nguyen",
      email: "isabella.nguyen@email.com",
      avatar: "https://notion-avatars.netlify.app/api/avatar/?preset=female-2",
    },
    amount: "$39.00",
    status: "completed",
    date: "1 day ago",
  },
  {
    id: "TXN-004",
    customer: {
      name: "William Kim",
      email: "will@email.com",
      avatar: "https://notion-avatars.netlify.app/api/avatar/?preset=male-5",
    },
    amount: "$299.00",
    status: "failed",
    date: "2 days ago",
  },
  {
    id: "TXN-005",
    customer: {
      name: "Sofia Davis",
      email: "sofia.davis@email.com",
      avatar: "https://notion-avatars.netlify.app/api/avatar/?preset=female-4",
    },
    amount: "$99.00",
    status: "completed",
    date: "3 days ago",
  },
]

const transactionStatusTagMap = {
  completed: { label: "completed", tone: "success" },
  pending: { label: "pending", tone: "warning" },
  failed: { label: "failed", tone: "danger" },
} as const

function getTransactionStatusTag(status: string) {
  return resolveDataTagDefinition(status, transactionStatusTagMap, {
    label: status,
    tone: "neutral",
  })
}

export function RecentTransactions() {
  return (
    <Card className="cursor-pointer">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Latest customer transactions</CardDescription>
        </div>
        <Button variant="outline" size="sm" className="cursor-pointer">
          <Eye className="h-4 w-4 mr-2" />
          View All
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {transactions.map((transaction) => {
          const statusTag = getTransactionStatusTag(transaction.status)

          return (
            <div key={transaction.id}>
              <div className="flex gap-2 rounded-lg border p-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={transaction.customer.avatar} alt={transaction.customer.name} />
                  <AvatarFallback>
                    {transaction.customer.name
                      .split(" ")
                      .map((name) => name[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-1 items-center justify-between gap-1 flex-wrap">
                  <div className="flex items-center space-x-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{transaction.customer.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {transaction.customer.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <DataTag tone={statusTag.tone} className="cursor-pointer">
                      {statusTag.label}
                    </DataTag>
                    <div className="text-right">
                      <p className="text-sm font-medium">{transaction.amount}</p>
                      <p className="text-xs text-muted-foreground">{transaction.date}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 cursor-pointer p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="cursor-pointer">View Details</DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer">Download Receipt</DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer">Contact Customer</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
