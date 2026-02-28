"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Upload, Scan, FileText, AlertTriangle } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export function ContractScanner() {
  const [contractText, setContractText] = useState("")
  const [riskScore, setRiskScore] = useState<number | null>(null)
  const [riskDetails, setRiskDetails] = useState<string[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])


  const handleScan = () => {
    // TODO: Implement contract scanning logic
    setRiskScore(72)
    setRiskDetails([
      "Late penalty clause disproportionate to project value",
      "Missing weather delay condition",
      "No supplier delay protection",
    ])
    setSuggestions([
      "Add weather and supplier delay conditions",
      "Negotiate penalty amounts to be proportional to project value",
      "Include force majeure clause",
    ])
    toast.success("Contract scanned", {
      description: "Risk assessment completed successfully.",
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Contract Input</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contract">Contract Text</Label>
                <Textarea
                  id="contract"
                  value={contractText}
                  onChange={(e) => setContractText(e.target.value)}
                  placeholder="Paste contract text here or upload a document..."
                  rows={15}
                />
              </div>

              <Button className="w-full" variant="outline">
                <Upload className="mr-2 h-4 w-4" /> Upload Contract Document
              </Button>

              <Button onClick={handleScan} className="w-full">
                <Scan className="mr-2 h-4 w-4" /> Scan for Risks
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {riskScore !== null && (
            <Card>
              <CardHeader>
                <CardTitle>Risk Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Risk Score</span>
                    <span className={`text-2xl font-bold ${riskScore > 70 ? "text-destructive" : riskScore > 40 ? "text-warning" : "text-success"}`}>
                      {riskScore}/100
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center">
                      <AlertTriangle className="mr-2 h-4 w-4" /> Risk Details
                    </h4>
                    <ul className="space-y-1 text-sm">
                      {riskDetails.map((risk, index) => (
                        <li key={index} className="flex">
                          <span className="mr-2">•</span>
                          <span>{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center">
                      <FileText className="mr-2 h-4 w-4" /> Suggested Amendments
                    </h4>
                    <ul className="space-y-1 text-sm">
                      {suggestions.map((suggestion, index) => (
                        <li key={index} className="flex">
                          <span className="mr-2">•</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}