"use client"

import type { CostItem, CostCategory, ProjectType, SuggestedItem, SimulationResult, Scenario } from "../types/quote";

// Material type unified with CostItem

export const DEFAULT_SCENARIOS: Scenario[] = [
  { name: "Optimistic", materialsCostFactor: 0.9, laborCostFactor: 0.95, overheadFactor: 0.9, externalRiskFactor: 0.5 },
  { name: "Most Likely", materialsCostFactor: 1.0, laborCostFactor: 1.0, overheadFactor: 1.0, externalRiskFactor: 1.0 },
  { name: "Pessimistic", materialsCostFactor: 1.1, laborCostFactor: 1.1, overheadFactor: 1.2, externalRiskFactor: 1.5 }
]

// Basic pricing database for common materials
const PRICING_DB: Record<string, { unitPrice: number; category: CostCategory }> = {
  concrete: { unitPrice: 120, category: "material" },
  rebar: { unitPrice: 1.5, category: "material" },
  lumber: { unitPrice: 5.5, category: "material" },
  drywall: { unitPrice: 15, category: "material" },
  paint: { unitPrice: 30, category: "material" },
  plumbing: { unitPrice: 0, category: "labor" },
  electrical: { unitPrice: 0, category: "labor" },
  excavation: { unitPrice: 0, category: "equipment" },
  crane: { unitPrice: 0, category: "equipment" },
};

// Common cost items by project type
const PROJECT_TYPE_ITEMS: Record<ProjectType, string[]> = {
  residential: ["concrete", "lumber", "drywall", "paint", "plumbing", "electrical"],
  commercial: ["concrete", "rebar", "drywall", "electrical", "excavation"],
  infrastructure: ["concrete", "rebar", "excavation", "crane"],
  renovation: ["lumber", "drywall", "paint", "plumbing", "electrical"],
};

// NLP keywords for cost categories
const CATEGORY_KEYWORDS: Record<CostCategory, string[]> = {
  material: ["concrete", "rebar", "lumber", "drywall", "paint", "brick", "steel", "wood", "tile"],
  labor: ["labor", "plumbing", "electrical", "installation", "welding", "carpentry"],
  equipment: ["excavation", "crane", "bulldozer", "forklift", "equipment"],
  other: ["permit", "inspection", "fee", "tax", "miscellaneous"],
};

/**
 * Analyzes quote description and identifies cost items
 */
export const detectCostItems = (description: string, _projectType: ProjectType): CostItem[] => {
  const items: CostItem[] = [];
  const lowerDesc = description.toLowerCase();

  // Detect items based on keywords
  Object.entries(CATEGORY_KEYWORDS).forEach(([category, keywords]) => {
    keywords.forEach(keyword => {
      if (lowerDesc.includes(keyword)) {
        const dbItem = Object.entries(PRICING_DB).find(([name]) => name === keyword);
        if (dbItem) {
          const [name, { unitPrice }] = dbItem;
          items.push({
            name,
            quantity: 1,
            unitPrice,
            category: category as CostCategory,
            detected: true,
          });
        } else {
          items.push({
            name: keyword,
            quantity: 1,
            unitPrice: 0,
            category: category as CostCategory,
            detected: true,
          });
        }
      }
    });
  });

  return items;
};

/**
 * Suggests missing cost items based on project type
 */
export const suggestMissingItems = (
  detectedItems: CostItem[],
  projectType: ProjectType
): SuggestedItem[] => {
  const detectedNames = detectedItems.map(item => item.name);
  const suggestions: SuggestedItem[] = [];

  PROJECT_TYPE_ITEMS[projectType].forEach(itemName => {
    if (!detectedNames.includes(itemName)) {
      const dbItem = PRICING_DB[itemName];
      suggestions.push({
        name: itemName,
        category: dbItem?.category || "other",
        unitPrice: dbItem?.unitPrice || 0,
        reason: `Common for ${projectType} projects`,
      });
    }
  });

  return suggestions;
};

/**
 * Gets unit price for a material from pricing database
 */
export const getUnitPrice = (itemName: string): number => {
  return PRICING_DB[itemName]?.unitPrice || 0;
};

/**
 * Formats cost items for display
 */
export const formatCostItems = (items: CostItem[]): CostItem[] => {
  return items.map(item => ({
    ...item,
    unitPrice: item.unitPrice || getUnitPrice(item.name),
  }));
};

/**
 * Calculates margin and risk assessment for a quote
 */
export function calculateMargin(
  materials: CostItem[],
  laborCost: number,
  desiredMarginPercentage: number,
  projectDuration: number = 1,
  complexity: number = 1,
  externalFactors: number = 1
): SimulationResult {
  const materialsCost = materials.reduce((sum, material) => sum + (material.quantity * material.unitPrice), 0)
  const overhead = materialsCost * 0.15 + laborCost * 0.2
  const baseCost = materialsCost + laborCost + overhead
  const totalCost = baseCost * (1 + (projectDuration - 1) * 0.05) * (1 + (complexity - 1) * 0.1) * externalFactors
  const revenue = totalCost / (1 - desiredMarginPercentage / 100)
  const margin = revenue - totalCost
  const marginPercentage = (margin / revenue) * 100

  const risks = []
  if (marginPercentage < 10) risks.push("Low margin detected (<10%)")
  if (projectDuration > 3) risks.push("Long project duration may increase risks")
  if (complexity > 2) risks.push("High complexity may lead to cost overruns")
  if (externalFactors > 1.2) risks.push("External factors may negatively impact profitability")

  const sensitivity = {
    materialsCost: { low: calculateSensitivity(baseCost, materialsCost, -0.1), high: calculateSensitivity(baseCost, materialsCost, 0.1) },
    laborCost: { low: calculateSensitivity(baseCost, laborCost, -0.1), high: calculateSensitivity(baseCost, laborCost, 0.1) },
    projectDuration: { low: calculateSensitivity(baseCost, projectDuration, -0.2, true), high: calculateSensitivity(baseCost, projectDuration, 0.2, true) },
    complexity: { low: calculateSensitivity(baseCost, complexity, -0.2, true), high: calculateSensitivity(baseCost, complexity, 0.2, true) }
  }

  return {
    baseCost,
    totalCost,
    revenue,
    margin,
    marginPercentage,
    risks,
    sensitivity
  }
}

function calculateSensitivity(baseCost: number, variable: number, change: number, isMultiplier: boolean = false): number {
  const originalValue = isMultiplier ? baseCost * variable : variable
  const newValue = isMultiplier ? variable * (1 + change) : variable * (1 + change)
  const newBaseCost = isMultiplier ? baseCost * newValue / variable : baseCost - originalValue + newValue
  const newTotalCost = newBaseCost * (1 + (isMultiplier ? (newValue / baseCost - 1) : 0))
  return newTotalCost
}

/**
 * Runs a scenario analysis for margin simulation
 */
export function runScenario(
  materials: CostItem[],
  laborCost: number,
  desiredMarginPercentage: number,
  scenario: Scenario,
  projectDuration: number = 1,
  complexity: number = 1,
  externalFactors: number = 1
): SimulationResult {
  const adjustedMaterials = materials.map(m => ({
    ...m,
    unitPrice: m.unitPrice * scenario.materialsCostFactor
  }))
  const adjustedLaborCost = laborCost * scenario.laborCostFactor
  const adjustedExternalFactors = externalFactors * scenario.externalRiskFactor

  return calculateMargin(
    adjustedMaterials,
    adjustedLaborCost,
    desiredMarginPercentage,
    projectDuration,
    complexity,
    adjustedExternalFactors
  )
}

/**
 * Exports simulation results to CSV or JSON
 */
export function exportSimulationResults(results: SimulationResult[], format: "csv" | "json" = "csv"): string {
  if (format === "csv") {
    const headers = ["Scenario", "Base Cost", "Total Cost", "Revenue", "Margin", "Margin %", "Risks"]
    const rows = results.map(result => [
      result.risks.join(" | "),
      result.baseCost.toFixed(2),
      result.totalCost.toFixed(2),
      result.revenue.toFixed(2),
      result.margin.toFixed(2),
      result.marginPercentage.toFixed(2),
      result.risks.join(" | ")
    ].map(val => typeof val === 'string' ? `"${val}"` : val))
    return [headers, ...rows].map(row => row.join(",")).join("\n")
  } else {
    return JSON.stringify(results, null, 2)
  }
}