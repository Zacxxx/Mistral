"use strict";

import { addDays, differenceInDays, format, isAfter, isBefore, parseISO } from 'date-fns';

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

interface CashFlowProjection {
  date: Date;
  inflow: number;
  outflow: number;
  net: number;
  balance: number;
}

interface Scenario {
  name: string;
  invoices: Invoice[];
  expenses: Expense[];
  startingBalance: number;
}

export const calculateCashFlowProjection = (
  invoices: Invoice[],
  expenses: Expense[],
  startingBalance: number,
  daysToProject: number = 90
): CashFlowProjection[] => {
  const projections: CashFlowProjection[] = [];
  const currentBalance = startingBalance;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Initialize projections for each day
  for (let i = 0; i <= daysToProject; i++) {
    const date = addDays(today, i);
    projections.push({
      date,
      inflow: 0,
      outflow: 0,
      net: 0,
      balance: currentBalance,
    });
  }

  // Process invoices
  invoices.forEach((invoice) => {
    const issueDate = addDays(invoice.dueDate, -invoice.paymentTermsDays);
    const daysUntilDue = differenceInDays(invoice.dueDate, today);
    
    if (daysUntilDue >= 0 && daysUntilDue <= daysToProject) {
      const projectionDay = projections[daysUntilDue];
      if (invoice.status === 'pending') {
        projectionDay.inflow += invoice.amount;
      }
    }
  });

  // Process expenses
  expenses.forEach((expense) => {
    const daysUntilDue = differenceInDays(expense.dueDate, today);
    
    if (daysUntilDue >= 0 && daysUntilDue <= daysToProject) {
      const projectionDay = projections[daysUntilDue];
      if (expense.status === 'pending') {
        projectionDay.outflow += expense.amount;
      }
    }
  });

  // Calculate net and balance
  for (let i = 0; i <= daysToProject; i++) {
    const projection = projections[i];
    projection.net = projection.inflow - projection.outflow;
    if (i > 0) {
      projection.balance = projections[i - 1].balance + projection.net;
    }
  }

  return projections;
};

export const calculateBurnRate = (
  projections: CashFlowProjection[]
): number => {
  if (projections.length < 30) return 0;
  
  const startBalance = projections[0].balance;
  const endBalance = projections[29].balance;
  const days = 30;
  
  return (startBalance - endBalance) / days;
};

export const calculateLiquidityRunway = (
  projections: CashFlowProjection[],
  monthlyBurnRate: number
): number => {
  if (monthlyBurnRate <= 0) return Infinity;
  
  const lastProjection = projections[projections.length - 1];
  const daysOfRunway = lastProjection.balance / (monthlyBurnRate / 30);
  
  return Math.max(0, Math.floor(daysOfRunway));
};

export const generateScenario = (
  baseInvoices: Invoice[],
  baseExpenses: Expense[],
  startingBalance: number,
  adjustments: {
    invoiceAdjustment?: number;
    expenseAdjustment?: number;
    delayDays?: number;
  } = {}
): Scenario => {
  const adjustedInvoices = baseInvoices.map((invoice) => ({
    ...invoice,
    amount: invoice.amount * (adjustments.invoiceAdjustment || 1),
    dueDate: adjustments.delayDays
      ? addDays(invoice.dueDate, adjustments.delayDays)
      : invoice.dueDate,
  }));

  const adjustedExpenses = baseExpenses.map((expense) => ({
    ...expense,
    amount: expense.amount * (adjustments.expenseAdjustment || 1),
    dueDate: adjustments.delayDays
      ? addDays(expense.dueDate, adjustments.delayDays)
      : expense.dueDate,
  }));

  return {
    name: `Scenario ${format(new Date(), 'yyyy-MM-dd')}`,
    invoices: adjustedInvoices,
    expenses: adjustedExpenses,
    startingBalance,
  };
};

export const getUpcomingPayments = (
  invoices: Invoice[],
  expenses: Expense[],
  daysAhead: number = 7
): Array<Invoice | Expense> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingInvoices = invoices.filter((invoice) => {
    const daysUntilDue = differenceInDays(invoice.dueDate, today);
    return (
      daysUntilDue >= 0 &&
      daysUntilDue <= daysAhead &&
      invoice.status === 'pending'
    );
  });

  const upcomingExpenses = expenses.filter((expense) => {
    const daysUntilDue = differenceInDays(expense.dueDate, today);
    return (
      daysUntilDue >= 0 &&
      daysUntilDue <= daysAhead &&
      expense.status === 'pending'
    );
  });

  return [...upcomingInvoices, ...upcomingExpenses].sort(
    (a, b) => differenceInDays(a.dueDate, b.dueDate)
  );
};