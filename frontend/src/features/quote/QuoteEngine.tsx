"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Mic, Upload, DollarSign, AlertTriangle } from "lucide-react"
import { useState } from "react"

export function QuoteEngine() {
  const [isRecording, setIsRecording] = useState(false)
  const [quoteDescription, setQuoteDescription] = useState("")
  const [materials, setMaterials] = useState([{ name: "", quantity: "", unitPrice: "" }])
  const [laborCost, setLaborCost] = useState("")
  const [margin, setMargin] = useState("20")
  const [risks] = useState<string[]>([])


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement quote generation logic
    toast.success("Quote generated", {
      description: "Your intelligent quote has been created successfully.",
    })
  }

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
                  onChange={(e) => setQuoteDescription(e.target.value)}
                  placeholder="Describe the project..."
                />
              </div>

              <div className="space-y-2">
                <Label>Materials</Label>
                {materials.map((material, index) => (
                  <div key={index} className="flex space-x-2">
                    <Input
                      placeholder="Material name"
                      value={material.name}
                      onChange={(e) => {
                        const newMaterials = [...materials]
                        newMaterials[index].name = e.target.value
                        setMaterials(newMaterials)
                      }}
                    />
                    <Input
                      placeholder="Quantity"
                      type="number"
                      value={material.quantity}
                      onChange={(e) => {
                        const newMaterials = [...materials]
                        newMaterials[index].quantity = e.target.value
                        setMaterials(newMaterials)
                      }}
                    />
                    <Input
                      placeholder="Unit Price"
                      type="number"
                      value={material.unitPrice}
                      onChange={(e) => {
                        const newMaterials = [...materials]
                        newMaterials[index].unitPrice = e.target.value
                        setMaterials(newMaterials)
                      }}
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setMaterials([...materials, { name: "", quantity: "", unitPrice: "" }])}
                >
                  Add Material
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="labor">Labor Cost</Label>
                <Input
                  id="labor"
                  type="number"
                  value={laborCost}
                  onChange={(e) => setLaborCost(e.target.value)}
                  placeholder="Total labor cost"
                />
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

              <Button type="submit" className="w-full">
                <DollarSign className="mr-2 h-4 w-4" /> Generate Quote
              </Button>
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
                onClick={() => setIsRecording(!isRecording)}
              >
                <Mic className="mr-2 h-4 w-4" />
                {isRecording ? "Stop Recording" : "Start Voice Input"}
              </Button>
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