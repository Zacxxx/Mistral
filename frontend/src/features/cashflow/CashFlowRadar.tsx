"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { DollarSign, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react"
import { useState } from "react"

export function CashFlowRadar() {
  const [invoices] = useState([
    { id: "INV-001", amount: 5000, dueDate: "2026-03-15", status: "pending" },
    { id: "INV-002", amount: 3000, dueDate: "2026-03-20", status: "pending" },
  ])
  const [expenses] = useState([
    { id: "EXP-001", amount: 2000, dueDate: "2026-03-10", status: "paid" },
    { id: "EXP-002", amount: 1500, dueDate: "2026-03-25", status: "pending" },
  ])
  const [liquidityRunway] = useState(46)
  const [burnRate] = useState(1200)

  const handleUpdateCashFlow = () => {
    // TODO: Implement cash flow calculation logic
    toast.success("Cash flow updated", {
      description: "Your cash flow projections have been updated.",
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Liquidity Runway</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{liquidityRunway} days</div>
            <p className="text-xs text-muted-foreground">
              {liquidityRunway < 30 && (
                <span className="text-destructive flex items-center">
                  <AlertTriangle className="mr-1 h-3 w-3" /> Critical: Low liquidity
                </span>
              )}
              {liquidityRunway >= 30 && liquidityRunway < 60 && (
                <span className="text-warning flex items-center">
                  <AlertTriangle className="mr-1 h-3 w-3" /> Warning: Monitor closely
                </span>
              )}
              {liquidityRunway >= 60 && (
                <span className="text-success flex items-center">
                  <TrendingUp className="mr-1 h-3 w-3" /> Healthy liquidity
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Burn Rate</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${burnRate}</div>
            <p className="text-xs text-muted-foreground">
              Current monthly expenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Cash Flow</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">+$4,300</div>
            <p className="text-xs text-muted-foreground">
              Projected for next 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Incoming Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>{invoice.id}</TableCell>
                    <TableCell>${invoice.amount}</TableCell>
                    <TableCell>{invoice.dueDate}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${invoice.status === "paid" ? "bg-success text-success-foreground" :
                          invoice.status === "pending" ? "bg-warning text-warning-foreground" :
                            "bg-destructive text-destructive-foreground"
                        }`}>
                        {invoice.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Outgoing Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Expense</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{expense.id}</TableCell>
                    <TableCell>${expense.amount}</TableCell>
                    <TableCell>{expense.dueDate}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${expense.status === "paid" ? "bg-success text-success-foreground" :
                          expense.status === "pending" ? "bg-warning text-warning-foreground" :
                            "bg-destructive text-destructive-foreground"
                        }`}>
                        {expense.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Button onClick={handleUpdateCashFlow} className="w-full">
        <DollarSign className="mr-2 h-4 w-4" /> Update Cash Flow Projections
      </Button>
    </div>
  )
}