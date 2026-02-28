"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { DollarSign, AlertTriangle, TrendingUp, TrendingDown, Calendar, Minus } from "lucide-react"
import { useState, useMemo } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { calculateCashFlowProjection, calculateBurnRate, calculateLiquidityRunway, generateScenario, getUpcomingPayments } from "@/lib/finance-utils"
import { format } from "date-fns"

interface Invoice {
  id: string;
  amount: number;
  dueDate: Date;
  paymentTermsDays: number;
  status: 'pending' | 'paid' | 'overdue';
}

interface Expense {
  id: string;
  amount: number;
  dueDate: Date;
  category: string;
  status: 'pending' | 'paid';
}

interface Scenario {
  name: string;
  invoices: Invoice[];
  expenses: Expense[];
  startingBalance: number;
}

export function CashFlowRadar() {
  const [invoices] = useState<Invoice[]>([
    { id: "INV-001", amount: 5000, dueDate: new Date("2026-03-15"), paymentTermsDays: 30, status: "pending" },
    { id: "INV-002", amount: 3000, dueDate: new Date("2026-03-20"), paymentTermsDays: 15, status: "pending" },
  ])
  const [expenses] = useState<Expense[]>([
    { id: "EXP-001", amount: 2000, dueDate: new Date("2026-03-10"), category: "Operational", status: "paid" },
    { id: "EXP-002", amount: 1500, dueDate: new Date("2026-03-25"), category: "Payroll", status: "pending" },
  ])
  const [startingBalance] = useState(10000)
  const [projectionDays] = useState(90)
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [activeScenario, setActiveScenario] = useState<Scenario | null>(null)

  const projections = useMemo(() => {
    const data = activeScenario
      ? calculateCashFlowProjection(activeScenario.invoices, activeScenario.expenses, activeScenario.startingBalance, projectionDays)
      : calculateCashFlowProjection(invoices, expenses, startingBalance, projectionDays);
    return data;
  }, [invoices, expenses, startingBalance, projectionDays, activeScenario])

  const burnRate = useMemo(() => calculateBurnRate(projections), [projections])
  const liquidityRunway = useMemo(() => calculateLiquidityRunway(projections, burnRate), [projections, burnRate])
  const upcomingPayments = useMemo(() => getUpcomingPayments(invoices, expenses), [invoices, expenses])
  const netCashFlow = useMemo(() => {
    return projections.reduce((sum, day) => sum + day.net, 0);
  }, [projections])

  const handleUpdateCashFlow = () => {
    toast.success("Cash flow updated", {
      description: "Your cash flow projections have been updated.",
    });
  };

  const handleCreateScenario = () => {
    const newScenario = generateScenario(invoices, expenses, startingBalance, {
      invoiceAdjustment: 1.1,
      expenseAdjustment: 0.9,
    });
    setScenarios([...scenarios, newScenario]);
    setActiveScenario(newScenario);
    toast.success("Scenario created", {
      description: "A new cash flow scenario has been created.",
    });
  };

  const handleResetScenario = () => {
    setActiveScenario(null);
    toast.success("Scenario reset", {
      description: "Returned to base cash flow projections.",
    });
  };

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
            <div className={`text-2xl font-bold ${netCashFlow >= 0 ? 'text-success' : 'text-destructive'}`}>
              {netCashFlow >= 0 ? '+' : ''}${netCashFlow}
            </div>
            <p className="text-xs text-muted-foreground">
              Projected for next {projectionDays} days
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
                    <TableCell>{invoice.dueDate.toLocaleDateString()}</TableCell>
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
                    <TableCell>{expense.dueDate.toLocaleDateString()}</TableCell>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Cash Flow Projection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={projections}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => format(date, 'MMM dd')}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    labelFormatter={(label) => format(label, 'MMMM dd, yyyy')}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, ""]}
                  />
                  <Line
                    type="monotone"
                    dataKey="balance"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingPayments.map((payment, index) => (
                  <TableRow key={index}>
                    <TableCell>{'id' in payment ? payment.id : payment.id}</TableCell>
                    <TableCell>${payment.amount}</TableCell>
                    <TableCell>{format(payment.dueDate, 'MMM dd, yyyy')}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${'paymentTermsDays' in payment ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                        {'paymentTermsDays' in payment ? 'Invoice' : 'Expense'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button onClick={handleUpdateCashFlow} className="w-full">
          <DollarSign className="mr-2 h-4 w-4" /> Update Cash Flow Projections
        </Button>
        <Button onClick={handleCreateScenario} variant="outline" className="w-full">
          <Calendar className="mr-2 h-4 w-4" /> Create Scenario
        </Button>
      </div>

      {activeScenario && (
        <Button onClick={handleResetScenario} variant="destructive" className="w-full">
          <Minus className="mr-2 h-4 w-4" /> Reset Scenario
        </Button>
      )}
    </div>
  )
}