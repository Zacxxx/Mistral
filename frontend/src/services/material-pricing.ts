"use strict";

import type { CostItem } from "@/types/quote";

// Mock data for regional material prices
const MOCK_MATERIAL_PRICES = {
  "us-east": {
    "Concrete": 120.50,
    "Steel": 850.00,
    "Lumber": 5.25,
    "Drywall": 15.75,
    "Insulation": 0.85,
    "Roofing": 35.00,
    "Paint": 28.50,
    "Electrical Wiring": 0.75,
    "Plumbing": 2.50
  },
  "us-west": {
    "Concrete": 125.00,
    "Steel": 875.00,
    "Lumber": 6.00,
    "Drywall": 16.50,
    "Insulation": 0.90,
    "Roofing": 38.00,
    "Paint": 30.00,
    "Electrical Wiring": 0.80,
    "Plumbing": 2.75
  },
  "eu-north": {
    "Concrete": 110.00,
    "Steel": 800.00,
    "Lumber": 7.50,
    "Drywall": 14.00,
    "Insulation": 0.80,
    "Roofing": 32.00,
    "Paint": 25.00,
    "Electrical Wiring": 0.70,
    "Plumbing": 2.20
  },
  "eu-south": {
    "Concrete": 105.00,
    "Steel": 780.00,
    "Lumber": 7.00,
    "Drywall": 13.50,
    "Insulation": 0.75,
    "Roofing": 30.00,
    "Paint": 24.00,
    "Electrical Wiring": 0.65,
    "Plumbing": 2.10
  },
  "asia-pacific": {
    "Concrete": 115.00,
    "Steel": 820.00,
    "Lumber": 5.50,
    "Drywall": 14.50,
    "Insulation": 0.82,
    "Roofing": 33.00,
    "Paint": 26.00,
    "Electrical Wiring": 0.72,
    "Plumbing": 2.30
  }
};

// Cache for material prices
const priceCache = new Map<string, Record<string, number>>();

// Regional preferences
let regionalPreferences = {
  region: "us-east",
  lastUpdated: new Date().toISOString()
};

// Fetch material prices with caching
export const fetchMaterialPrices = async (region: string): Promise<Record<string, number>> => {
  // Check cache first
  if (priceCache.has(region)) {
    return priceCache.get(region)!;
  }

  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Use mock data if no API available
  const prices = MOCK_MATERIAL_PRICES[region as keyof typeof MOCK_MATERIAL_PRICES] || MOCK_MATERIAL_PRICES["us-east"];

  // Cache the prices
  priceCache.set(region, prices);

  return prices;
};

// Get cached prices
export const getCachedPrices = (region: string): Record<string, number> | null => {
  return priceCache.get(region) || null;
};

// Compare material prices with regional prices
export const compareMaterialPrices = (
  materials: CostItem[],
  regionalPrices: Record<string, number>,
  region: string
) => {
  return materials.map(material => {
    const regionalPrice = regionalPrices[material.name] || material.unitPrice;
    const difference = ((regionalPrice - material.unitPrice) / material.unitPrice) * 100;

    return {
      name: material.name,
      currentPrice: material.unitPrice,
      regionalPrice,
      difference,
      region
    };
  });
};

// Get regional preferences
export const getRegionalPreferences = (): { region: string } => {
  return regionalPreferences;
};

// Set regional preferences
export const setRegionalPreferences = async (preferences: { region: string }): Promise<void> => {
  regionalPreferences = {
    ...preferences,
    lastUpdated: new Date().toISOString()
  };
};

// Auto-update prices periodically
export const setupPriceAutoUpdate = (region: string, intervalHours: number = 24): NodeJS.Timeout => {
  return setInterval(async () => {
    await fetchMaterialPrices(region);
  }, intervalHours * 60 * 60 * 1000);
};

// Initialize price caching
export const initializePriceCache = async () => {
  const regions = Object.keys(MOCK_MATERIAL_PRICES);
  for (const region of regions) {
    await fetchMaterialPrices(region);
  }
};