"use client"

export type CostCategory = "material" | "labor" | "equipment" | "other";
export type ProjectType = "residential" | "commercial" | "infrastructure" | "renovation";

export interface CostItem {
  name: string;
  quantity: number;
  unitPrice: number;
  category: CostCategory;
  detected?: boolean;
  suggested?: boolean;
}

export interface SuggestedItem {
  name: string;
  category: CostCategory;
  unitPrice: number;
  reason: string;
}

export interface QuoteAnalysis {
  detectedItems: CostItem[];
  suggestedItems: SuggestedItem[];
}

export interface SimulationResult {
  baseCost: number;
  totalCost: number;
  revenue: number;
  margin: number;
  marginPercentage: number;
  risks: string[];
  sensitivity: Record<string, { low: number; high: number }>;
}

export interface Material {
  name: string;
  category: CostCategory;
  basePrice: number;
}

export interface Scenario {
  name: string;
  materialsCostFactor: number;
  laborCostFactor: number;
  overheadFactor: number;
  externalRiskFactor: number;
}