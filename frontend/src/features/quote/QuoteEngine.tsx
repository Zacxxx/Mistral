"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Mic, Upload, DollarSign, AlertTriangle, Check, X, FileDown, BarChart2, MapPin, RefreshCw, GitCompare } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { detectCostItems, suggestMissingItems, formatCostItems, calculateMargin, runScenario, exportSimulationResults, DEFAULT_SCENARIOS } from "@/lib/quote-utils"
import type { CostItem, ProjectType, SuggestedItem, SimulationResult, CostCategory } from "@/types/quote"
import { fetchMaterialPrices, compareMaterialPrices, getRegionalPreferences, setRegionalPreferences } from "@/services/material-pricing"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { debounce } from "lodash"

export function QuoteEngine() {
  const [isRecording, setIsRecording] = useState(false)
  const [voiceError, setVoiceError] = useState("")
  const [quoteDescription, setQuoteDescription] = useState("")
  const [projectType, setProjectType] = useState<ProjectType>("residential")
  const [costItems, setCostItems] = useState<CostItem[]>([{ name: "", quantity: 1, unitPrice: 0, category: "material" }])
  const [suggestedItems, setSuggestedItems] = useState<SuggestedItem[]>([])
  const [margin, setMargin] = useState("20")
  const [risks, setRisks] = useState<string[]>([])
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const [simulationResults, setSimulationResults] = useState<SimulationResult[]>([])
  const [showSimulation, setShowSimulation] = useState(false)
  const [projectDuration, setProjectDuration] = useState("1")
  const [complexity, setComplexity] = useState("1")
  const [externalFactors, setExternalFactors] = useState("1")
  const [region, setRegion] = useState("us-east")
  const [showPriceComparison, setShowPriceComparison] = useState(false)
  const [priceComparisonResults, setPriceComparisonResults] = useState<any[]>([])
  const queryClient = useQueryClient()

  const { data: regionalPreferences } = useQuery({
    queryKey: ['regionalPreferences'],
    queryFn: getRegionalPreferences,
    initialData: { region: 'us-east' }
  })

  useEffect(() => {
    if (regionalPreferences?.region) {
      setRegion(regionalPreferences.region)
    }
  }, [regionalPreferences])

  const updateRegionalPreferences = useMutation({
    mutationFn: setRegionalPreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regionalPreferences'] })
      queryClient.invalidateQueries({ queryKey: ['materialPrices', region] })
    }
  })

  const { data: materialPrices, isLoading: isLoadingPrices } = useQuery({
    queryKey: ['materialPrices', region],
    queryFn: () => fetchMaterialPrices(region),
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60 * 24
  })

  const debouncedFetchPrices = useCallback(
    debounce((items: CostItem[]) => {
      if (materialPrices) {
        const materials = items.filter(item => item.category === "material" && item.name)
        const results = compareMaterialPrices(materials, materialPrices, region)
        setPriceComparisonResults(results)
      }
    }, 500),
    [materialPrices, region]
  )

  useEffect(() => {
    if (quoteDescription.trim()) {
      const detectedItems = detectCostItems(quoteDescription, projectType);
      if (detectedItems.length > 0) {
        const suggestions = suggestMissingItems(detectedItems, projectType);
        setCostItems(formatCostItems(detectedItems));
        setSuggestedItems(suggestions);
        setAnalysisComplete(true);
        debouncedFetchPrices(formatCostItems(detectedItems))
      }
    }
  }, [quoteDescription, projectType, debouncedFetchPrices])

  const convertToMaterials = (items: CostItem[]): CostItem[] => {
    return items.map(item => ({
      ...item,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice)
    }))
  }

  const runMarginSimulation = () => {
    const materials = convertToMaterials(costItems.filter(item => item.name))
    const laborCost = costItems.reduce((sum, item) => item.category === "labor" ? sum + (item.quantity * item.unitPrice) : sum, 0)
    const results = DEFAULT_SCENARIOS.map(scenario =>
      runScenario(
        materials,
        laborCost,
        Number(margin),
        scenario,
        Number(projectDuration),
        Number(complexity),
        Number(externalFactors)
      )
    )
    setSimulationResults(results)
    const baseResult = calculateMargin(
      materials,
      laborCost,
      Number(margin),
      Number(projectDuration),
      Number(complexity),
      Number(externalFactors)
    )
    setRisks(baseResult.risks)
    setShowSimulation(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runMarginSimulation()
    toast.success("Quote generated", {
      description: "Your intelligent quote with margin simulation has been created successfully.",
    });
  };

  const exportResults = () => {
    const csv = exportSimulationResults(simulationResults, "csv")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "margin_simulation_results.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleAcceptSuggestion = (suggestion: SuggestedItem) => {
    setCostItems([
      ...costItems,
      {
        name: suggestion.name,
        quantity: 1,
        unitPrice: suggestion.unitPrice,
        category: suggestion.category,
        suggested: true,
      },
    ]);
    setSuggestedItems(suggestedItems.filter(item => item.name !== suggestion.name));
  };

  const handleRejectSuggestion = (suggestionName: string) => {
    setSuggestedItems(suggestedItems.filter(item => item.name !== suggestionName));
  };

  const handleAddManualItem = () => {
    setCostItems([...costItems, { name: "", quantity: 1, unitPrice: 0, category: "material" }]);
  };

  const handleItemChange = (index: number, field: keyof CostItem, value: string | number) => {
    const newItems = [...costItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setCostItems(newItems);
    debouncedFetchPrices(newItems)
  };

  const handleRegionChange = (newRegion: string) => {
    setRegion(newRegion)
    updateRegionalPreferences.mutate({ region: newRegion })
  };

  const refreshPrices = () => {
    queryClient.invalidateQueries({ queryKey: ['materialPrices', region] })
    toast.success("Material prices refreshed")
  };

  const applyRegionalPrices = () => {
    if (!materialPrices) return

    const updatedItems = costItems.map(item => {
      if (item.category === "material" && materialPrices[item.name]) {
        return { ...item, unitPrice: materialPrices[item.name] }
      }
      return item
    })
    setCostItems(updatedItems)
    toast.success("Regional prices applied")
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quote Input</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Project Description</Label>
                <Textarea
                  id="description"
                  value={quoteDescription}
                  onChange={(e) => {
                    setQuoteDescription(e.target.value);
                    setAnalysisComplete(false);
                  }}
                  placeholder="Describe the project..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="projectType">Project Type</Label>
                <select
                  id="projectType"
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value as ProjectType)}
                  className="w-full p-2 border rounded"
                >
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                  <option value="infrastructure">Infrastructure</option>
                  <option value="renovation">Renovation</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Cost Items</Label>
                {costItems.map((item, index) => (
                  <div key={index} className="flex space-x-2 mb-2">
                    <Input
                      placeholder="Item name"
                      value={item.name}
                      onChange={(e) => handleItemChange(index, "name", e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Quantity"
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, "quantity", Number(e.target.value))}
                      className="w-20"
                    />
                    <Input
                      placeholder="Unit Price"
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(index, "unitPrice", Number(e.target.value))}
                      className="w-24"
                    />
                    <select
                      value={item.category}
                      onChange={(e) => handleItemChange(index, "category", e.target.value as CostCategory)}
                      className="w-28 p-2 border rounded"
                    >
                      <option value="material">Material</option>
                      <option value="labor">Labor</option>
                      <option value="equipment">Equipment</option>
                      <option value="other">Other</option>
                    </select>
                    {item.detected && (
                      <div className="flex items-center text-blue-500">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="ml-1 text-xs">Detected</span>
                      </div>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddManualItem}
                >
                  Add Item
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="margin">Profit Margin (%)</Label>
                <Input
                  id="margin"
                  type="number"
                  value={margin}
                  onChange={(e) => setMargin(e.target.value)}
                  placeholder="20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="projectDuration">Project Duration (months)</Label>
                <Input
                  id="projectDuration"
                  type="number"
                  value={projectDuration}
                  onChange={(e) => setProjectDuration(e.target.value)}
                  placeholder="1"
                  min="1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="complexity">Project Complexity (1-5)</Label>
                <Input
                  id="complexity"
                  type="number"
                  value={complexity}
                  onChange={(e) => setComplexity(e.target.value)}
                  placeholder="1"
                  min="1"
                  max="5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="externalFactors">External Factors (1=normal, &gt;1=riskier)</Label>
                <Input
                  id="externalFactors"
                  type="number"
                  value={externalFactors}
                  onChange={(e) => setExternalFactors(e.target.value)}
                  placeholder="1"
                  min="0.5"
                  step="0.1"
                />
              </div>

              {analysisComplete && suggestedItems.length > 0 && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Suggested Cost Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {suggestedItems.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{item.name}</span>
                            <span className="text-xs text-gray-500">({item.category})</span>
                            <span className="text-xs text-gray-400">{item.reason}</span>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAcceptSuggestion(item)}
                            >
                              <Check className="h-4 w-4 text-green-500" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRejectSuggestion(item.name)}
                            >
                              <X className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2" /> Regional Pricing
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={refreshPrices}>
                        <RefreshCw className="h-3 w-3 mr-1" /> Refresh
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setShowPriceComparison(!showPriceComparison)}>
                        <GitCompare className="h-3 w-3 mr-1" /> Compare
                      </Button>
                      <Button size="sm" variant="default" onClick={applyRegionalPrices}>
                        Apply Prices
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="region">Region</Label>
                    <select
                      id="region"
                      value={region}
                      onChange={(e) => handleRegionChange(e.target.value)}
                      className="w-full p-2 border rounded"
                    >
                      <option value="us-east">US East</option>
                      <option value="us-west">US West</option>
                      <option value="eu-north">EU North</option>
                      <option value="eu-south">EU South</option>
                      <option value="asia-pacific">Asia Pacific</option>
                    </select>
                  </div>
                  {isLoadingPrices && <div className="text-sm text-gray-500 mt-2">Loading prices...</div>}
                </CardContent>
              </Card>

              {showPriceComparison && priceComparisonResults.length > 0 && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center">
                      <GitCompare className="h-4 w-4 mr-2" /> Price Comparison
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {priceComparisonResults.map((result, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{result.name}</span>
                            <span className="text-xs text-gray-500">Current: ${result.currentPrice.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm ${result.difference < 0 ? 'text-green-600' : 'text-red-600'}">
                              {result.difference > 0 ? '+' : ''}{result.difference.toFixed(2)}%
                              (${result.regionalPrice.toFixed(2)})
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleItemChange(
                                costItems.findIndex(item => item.name === result.name),
                                "unitPrice",
                                result.regionalPrice
                              )}
                            >
                              Apply
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex space-x-2">
                <Button type="submit" className="flex-1">
                  <DollarSign className="mr-2 h-4 w-4" /> Generate Quote
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowSimulation(!showSimulation)}
                  className="flex-1"
                >
                  <BarChart2 className="mr-2 h-4 w-4" />
                  {showSimulation ? "Hide" : "Show"} Simulation
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Voice Input</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                variant={isRecording ? "destructive" : "default"}
                onClick={() => {
                  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                  if (!SpeechRecognition) {
                    setVoiceError("Voice input is not supported in your browser.");
                    return;
                  }
                  setIsRecording(!isRecording);
                }}
              >
                <Mic className="mr-2 h-4 w-4" />
                {isRecording ? "Stop Recording" : "Start Voice Input"}
              </Button>
              {voiceError && <p className="text-xs text-destructive mt-2">{voiceError}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Document Upload</CardTitle>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                <Upload className="mr-2 h-4 w-4" /> Upload Project Documents
              </Button>
            </CardContent>
          </Card>

          {showSimulation && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <BarChart2 className="mr-2 h-4 w-4" /> Margin Simulation
                  </span>
                  <Button variant="outline" size="sm" onClick={exportResults}>
                    <FileDown className="mr-2 h-4 w-4" /> Export
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {DEFAULT_SCENARIOS.map((scenario, index) => {
                    const result = simulationResults[index]
                    return result ? (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium">{scenario.name} Scenario</h4>
                          <span className={`text-sm font-medium ${result.marginPercentage < 10 ? 'text-destructive' : 'text-green-600'}`}>
                            {result.marginPercentage.toFixed(1)}% Margin
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-500">Base Cost:</span>
                            <span className="ml-1">${result.baseCost.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Total Cost:</span>
                            <span className="ml-1">${result.totalCost.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Revenue:</span>
                            <span className="ml-1">${result.revenue.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Margin:</span>
                            <span className="ml-1">${result.margin.toFixed(2)}</span>
                          </div>
                        </div>
                        {result.risks.length > 0 && (
                          <div className="mt-2 pt-2 border-t">
                            <h5 className="text-sm font-medium text-destructive mb-1">Risks</h5>
                            <ul className="text-xs text-destructive space-y-1">
                              {result.risks.map((risk, riskIndex) => (
                                <li key={riskIndex}>• {risk}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : null
                  })}
                  <div className="mt-4 pt-4 border-t">
                    <h5 className="font-medium mb-2">Sensitivity Analysis</h5>
                    {simulationResults[1] && (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-500">Materials ±10%:</span>
                          <div className="ml-1">
                            <span>Low: ${simulationResults[1].sensitivity.materialsCost.low.toFixed(2)}</span><br />
                            <span>High: ${simulationResults[1].sensitivity.materialsCost.high.toFixed(2)}</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Labor ±10%:</span>
                          <div className="ml-1">
                            <span>Low: ${simulationResults[1].sensitivity.laborCost.low.toFixed(2)}</span><br />
                            <span>High: ${simulationResults[1].sensitivity.laborCost.high.toFixed(2)}</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Duration ±20%:</span>
                          <div className="ml-1">
                            <span>Low: ${simulationResults[1].sensitivity.projectDuration.low.toFixed(2)}</span><br />
                            <span>High: ${simulationResults[1].sensitivity.projectDuration.high.toFixed(2)}</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Complexity ±20%:</span>
                          <div className="ml-1">
                            <span>Low: ${simulationResults[1].sensitivity.complexity.low.toFixed(2)}</span><br />
                            <span>High: ${simulationResults[1].sensitivity.complexity.high.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {risks.length > 0 && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="flex items-center text-destructive">
                  <AlertTriangle className="mr-2 h-4 w-4" /> Risk Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {risks.map((risk, index) => (
                    <li key={index} className="text-sm text-destructive">
                      • {risk}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}