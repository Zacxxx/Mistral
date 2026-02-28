"use client"

import { useState, useCallback } from "react"
import { useDropzone, FileWithPath } from "react-dropzone"
import { extractTextFromFile, validateFile, getFilePreview, ACCEPTED_FILE_TYPES, MAX_FILE_SIZE } from "@/utils/fileUtils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Upload, Scan, FileText, AlertTriangle, X, BarChart2, Lightbulb } from "lucide-react"
import { toast } from "sonner"
import { Progress } from "@/components/ui/progress"
import { analyzeContract, getRiskDistributionData, convertToPlainLanguage } from "@/lib/contract-utils"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export function ContractScanner() {
  const [contractText, setContractText] = useState("")
  const [riskScore, setRiskScore] = useState<number | null>(null)
  const [riskLevel, setRiskLevel] = useState<"Low" | "Medium" | "High" | null>(null)
  const [riskDetails, setRiskDetails] = useState<ClauseAnalysis[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [penaltyClauses, setPenaltyClauses] = useState<ClauseAnalysis[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<Record<string, string>>({})
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [activeTab, setActiveTab] = useState<"analysis" | "plainLanguage" | "visualization">("analysis")
  const [plainLanguageText, setPlainLanguageText] = useState("")
  const [riskDistribution, setRiskDistribution] = useState<{type: string; count: number; avgRisk: number}[]>([])

  interface ClauseAnalysis {
    type: string
    text: string
    riskScore: number
    explanation: string
    suggestions: string[]
    startIndex: number
    endIndex: number
  }

  const onDrop = useCallback(async (acceptedFiles: FileWithPath[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    const validation = await validateFile(file);

    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setUploadedFiles((prev) => [...prev, file]);
    const preview = getFilePreview(file);
    if (preview) {
      setPreviews((prev) => ({ ...prev, [file.name]: preview }));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE,
    disabled: isUploading,
  });

  const removeFile = (fileName: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.name !== fileName));
    if (previews[fileName]) {
      URL.revokeObjectURL(previews[fileName]);
      setPreviews((prev) => {
        const newPreviews = { ...prev };
        delete newPreviews[fileName];
        return newPreviews;
      });
    }
  };

  const handleUpload = async () => {
    if (uploadedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const file = uploadedFiles[0];
      const text = await extractTextFromFile(file);
      setContractText(text);

      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        setUploadProgress(i);
      }

      toast.success("File processed successfully");
    } catch {
      toast.error("Failed to process file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleScan = () => {
    const analysis = analyzeContract(contractText)
    setRiskScore(analysis.riskScore)
    setRiskLevel(analysis.riskLevel)
    setRiskDetails(analysis.clauses)
    setSuggestions(analysis.suggestions)
    setPenaltyClauses(analysis.penaltyClauses)
    setPlainLanguageText(convertToPlainLanguage(contractText))
    setRiskDistribution(getRiskDistributionData(analysis.clauses))
    
    toast.success("Contract scanned", {
      description: analysis.summary,
    })
  }

  const getRiskColor = (score: number) => {
    if (score > 70) return "text-destructive"
    if (score > 40) return "text-warning"
    return "text-success"
  }

  const getRiskBarColor = (score: number) => {
    if (score > 70) return "#ef4444"
    if (score > 40) return "#f59e0b"
    return "#10b981"
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

              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors $
                  isDragActive ? "border-primary bg-primary/10" : "border-muted-foreground/20 hover:border-primary/50"
                } ${isUploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <input {...getInputProps()} disabled={isUploading} />
                <Upload className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                <p className="text-sm font-medium">
                  {isDragActive ? "Drop the file here" : "Drag & drop a contract file here"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supports PDF, Word, and images (max 10MB)
                </p>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Uploaded Files</h4>
                  <div className="space-y-1">
                    {uploadedFiles.map((file) => (
                      <div
                        key={file.name}
                        className="flex items-center justify-between p-2 border rounded-md"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div className="text-sm">
                            <p>{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFile(file.name)}
                          disabled={isUploading}
                          className="h-6 w-6"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {previews[uploadedFiles[0].name] && (
                    <div className="mt-2">
                      <h4 className="font-medium text-sm mb-1">Preview</h4>
                      <div className="border rounded-md overflow-hidden">
                        <img
                          src={previews[uploadedFiles[0].name]}
                          alt="Preview"
                          className="w-full h-auto max-h-32 object-contain"
                        />
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleUpload}
                    disabled={isUploading || uploadedFiles.length === 0}
                    className="w-full mt-2"
                  >
                    {isUploading ? "Processing..." : "Extract Text from File"}
                  </Button>

                  {isUploading && (
                    <Progress value={uploadProgress} className="h-2 mt-2" />
                  )}
                </div>
              )}

              <Button onClick={handleScan} className="w-full" disabled={!contractText}>
                <Scan className="mr-2 h-4 w-4" /> Scan for Risks
              </Button>
            </div>
          </CardContent>
        </Card>

         <div className="space-y-6">
           {riskScore !== null && (
             <Card>
               <CardHeader>
                 <CardTitle>Contract Analysis</CardTitle>
                 <div className="flex space-x-2">
                   <Button
                     variant={activeTab === "analysis" ? "default" : "outline"}
                     size="sm"
                     onClick={() => setActiveTab("analysis")}
                   >
                     <AlertTriangle className="mr-2 h-4 w-4" /> Analysis
                   </Button>
                   <Button
                     variant={activeTab === "plainLanguage" ? "default" : "outline"}
                     size="sm"
                     onClick={() => setActiveTab("plainLanguage")}
                   >
                     <Lightbulb className="mr-2 h-4 w-4" /> Plain Language
                   </Button>
                   <Button
                     variant={activeTab === "visualization" ? "default" : "outline"}
                     size="sm"
                     onClick={() => setActiveTab("visualization")}
                   >
                     <BarChart2 className="mr-2 h-4 w-4" /> Visualization
                   </Button>
                 </div>
               </CardHeader>
               <CardContent>
                 {activeTab === "analysis" && (
                   <div className="space-y-6">
                     <div className="flex justify-between items-center">
                       <span className="text-sm font-medium">Risk Score</span>
                       <span className={`text-2xl font-bold ${getRiskColor(riskScore)}`}>
                         {riskScore}/100 ({riskLevel} Risk)
                       </span>
                     </div>

                     <div className="space-y-4">
                       <h4 className="font-medium flex items-center">
                         <AlertTriangle className="mr-2 h-4 w-4" /> Risk Details
                       </h4>
                       <div className="space-y-4">
                         {riskDetails.map((clause, index) => (
                           <div key={index} className="border rounded-lg p-4">
                             <div className="flex justify-between items-start mb-2">
                               <h5 className="font-medium capitalize">{clause.type} Clause</h5>
                               <span className={`text-sm font-medium ${getRiskColor(clause.riskScore)}`}>
                                 {clause.riskScore}/100
                               </span>
                             </div>
                             <p className="text-sm mb-3">{clause.text}</p>
                             <div className="space-y-2">
                               <h6 className="text-xs font-medium text-muted-foreground">Explanation</h6>
                               <p className="text-sm">{clause.explanation}</p>
                               <h6 className="text-xs font-medium text-muted-foreground mt-2">Suggestions</h6>
                               <ul className="space-y-1 text-sm">
                                 {clause.suggestions.map((suggestion, i) => (
                                   <li key={i} className="flex">
                                     <span className="mr-2">•</span>
                                     <span>{suggestion}</span>
                                   </li>
                                 ))}
                               </ul>
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>

                     {penaltyClauses.length > 0 && (
                       <div className="space-y-2">
                         <h4 className="font-medium flex items-center">
                           <AlertTriangle className="mr-2 h-4 w-4 text-destructive" /> Penalty Clauses
                         </h4>
                         <div className="space-y-3">
                           {penaltyClauses.map((clause, index) => (
                             <div key={index} className="border rounded-lg p-3 bg-destructive/5">
                               <p className="text-sm mb-2">{clause.text}</p>
                               <div className="flex justify-between items-center">
                                 <span className="text-xs font-medium">Risk: {clause.riskScore}/100</span>
                                 <span className="text-xs text-muted-foreground">Penalty Clause</span>
                               </div>
                             </div>
                           ))}
                         </div>
                       </div>
                     )}

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
                 )}

                 {activeTab === "plainLanguage" && (
                   <div className="space-y-4">
                     <h4 className="font-medium flex items-center">
                       <Lightbulb className="mr-2 h-4 w-4" /> Plain Language Version
                     </h4>
                     <p className="text-sm text-muted-foreground">
                       This is a simplified version of your contract that maintains the same legal meaning.
                     </p>
                     <Textarea
                       value={plainLanguageText}
                       readOnly
                       className="min-h-[300px] font-mono text-sm"
                     />
                   </div>
                 )}

                 {activeTab === "visualization" && (
                   <div className="space-y-4">
                     <h4 className="font-medium flex items-center">
                       <BarChart2 className="mr-2 h-4 w-4" /> Risk Distribution
                     </h4>
                     <p className="text-sm text-muted-foreground">
                       Visual representation of risk across different clause types.
                     </p>
                     <div className="h-[300px] w-full">
                       <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={riskDistribution} layout="vertical" margin={{ left: 20 }}>
                           <CartesianGrid strokeDasharray="3 3" />
                           <XAxis type="number" domain={[0, 100]} />
                           <YAxis dataKey="type" type="category" width={120} />
                           <Tooltip
                             formatter={(value: number) => [`${value}/100`, "Risk Score"]}
                             labelFormatter={(label: string) => label.charAt(0).toUpperCase() + label.slice(1)}
                           />
                           <Bar dataKey="avgRisk" fill="#8884d8" name="Risk Score">
                             {riskDistribution.map((entry, index) => (
                               <cell key={`cell-${index}`} fill={getRiskBarColor(entry.avgRisk)} />
                             ))}
                           </Bar>
                         </BarChart>
                       </ResponsiveContainer>
                     </div>
                     <div className="flex justify-center space-x-4 text-xs">
                       <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-[#10b981] mr-1"></div> Low Risk</div>
                       <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-[#f59e0b] mr-1"></div> Medium Risk</div>
                       <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-[#ef4444] mr-1"></div> High Risk</div>
                     </div>
                   </div>
                 )}
               </CardContent>
             </Card>
           )}
        </div>
      </div>
    </div>
  )
}