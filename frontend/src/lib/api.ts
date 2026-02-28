"use strict";

// API client configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api";

// Create a fetch wrapper with error handling
export const apiFetch = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<any> => {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};

// Material pricing API endpoints
export const materialPricingApi = {
  getMaterialPrices: (region: string) =>
    apiFetch(`/materials/prices?region=${encodeURIComponent(region)}`),
  
  getPriceComparison: (materials: string[], region: string) =>
    apiFetch(`/materials/compare`, {
      method: "POST",
      body: JSON.stringify({ materials, region }),
    }),
  
  updateRegionalPreferences: (preferences: { region: string }) =>
    apiFetch(`/user/preferences/region`, {
      method: "POST",
      body: JSON.stringify(preferences),
    }),
};