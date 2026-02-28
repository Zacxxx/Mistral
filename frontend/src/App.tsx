"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QuoteEngine } from "@/features/quote/QuoteEngine"
import { ContractScanner } from "@/features/contract/ContractScanner"
import { CashFlowRadar } from "@/features/cashflow/CashFlowRadar"
import { SiteProof } from "@/features/site/SiteProof"
import { ProtectedRoute } from "@/features/auth/ProtectedRoute"
import { AuthLayout } from "@/features/auth/AuthLayout"
import { Button } from "@/components/ui/button"
import { useAuth, AuthProvider } from "@/features/auth/AuthProvider"

function AppContent() {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-primary">BuildShield AI</h1>
            <p className="text-muted-foreground">Your construction survival engine</p>
          </div>
          <Button variant="outline" onClick={signOut}>Sign Out</Button>
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

function App() {
  return (
    <AuthProvider>
      <AuthLayout>
        <ProtectedRoute>
          <AppContent />
        </ProtectedRoute>
      </AuthLayout>
    </AuthProvider>
  )
}

export default App