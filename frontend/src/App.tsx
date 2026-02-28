import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QuoteEngine } from "@/features/quote/QuoteEngine"
import { ContractScanner } from "@/features/contract/ContractScanner"
import { CashFlowRadar } from "@/features/cashflow/CashFlowRadar"
import { SiteProof } from "@/features/site/SiteProof"

function App() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-primary">BuildShield AI</h1>
          <p className="text-muted-foreground">Your construction survival engine</p>
        </header>

        <Tabs defaultValue="quote" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="quote">Quote Intelligence</TabsTrigger>
            <TabsTrigger value="contract">Contract Protection</TabsTrigger>
            <TabsTrigger value="cashflow">Cash Flow Radar</TabsTrigger>
            <TabsTrigger value="site">Site Proof</TabsTrigger>
          </TabsList>

          <TabsContent value="quote">
            <Card>
              <CardHeader>
                <CardTitle>Intelligent Quote Engine</CardTitle>
              </CardHeader>
              <CardContent>
                <QuoteEngine />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contract">
            <Card>
              <CardHeader>
                <CardTitle>Contract Risk Scanner</CardTitle>
              </CardHeader>
              <CardContent>
                <ContractScanner />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cashflow">
            <Card>
              <CardHeader>
                <CardTitle>Cash Flow Radar</CardTitle>
              </CardHeader>
              <CardContent>
                <CashFlowRadar />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="site">
            <Card>
              <CardHeader>
                <CardTitle>Photo-Based Site Proof</CardTitle>
              </CardHeader>
              <CardContent>
                <SiteProof />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default App