"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Camera, FileText, Image as ImageIcon, Check, X, AlertTriangle, Clock, MapPin, Share2 } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { photoAnalysisService } from "@/services/photo-analysis"

interface PhotoWithAnalysis {
  file: File
  preview: string
  analysis: {
    category: "before" | "after" | "progress" | "issue"
    timestampVerified: boolean
    locationTag: string
    issuesDetected?: string[]
  }
}

export function SiteProof() {
  const [photos, setPhotos] = useState<PhotoWithAnalysis[]>([])
  const [notes, setNotes] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [reportData, setReportData] = useState<{
    summary: {
      totalPhotos: number
      byCategory: {
        before: number
        after: number
        progress: number
        issue: number
      }
      timestampRange: {
        start: Date
        end: Date
      }
    }
    categorizedPhotos: any
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    photoAnalysisService.initialize()
    // Set project location (would normally come from project data)
    photoAnalysisService.setProjectLocation(37.7749, -122.4194, 1.0)
  }, [])

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      setIsAnalyzing(true)

      try {
        const newPhotos = await Promise.all(
          newFiles.map(async (file) => {
            const preview = URL.createObjectURL(file)
            const analysis = await photoAnalysisService.analyzePhoto(file, photos.map(p => p.file))
            return { file, preview, analysis }
          })
        )

        setPhotos([...photos, ...newPhotos])
        toast.success(`${newFiles.length} photo(s) added and analyzed`, {
          description: "Photos have been categorized and verified.",
        })
      } catch (error) {
        console.error("Analysis error:", error)
        toast.error("Photo analysis failed", {
          description: "Some photos couldn't be processed.",
        })
      } finally {
        setIsAnalyzing(false)
      }
    }
  }

  const handleGenerateReport = async () => {
    if (photos.length === 0) {
      toast.error("No photos available", {
        description: "Please upload photos before generating a report.",
      })
      return
    }

    try {
      const report = await photoAnalysisService.generateReport(photos.map(p => p.file))
      setReportData(report)
      toast.success("Site proof report generated", {
        description: "Your timestamped report is ready for sharing.",
      })
    } catch (error) {
      console.error("Report generation error:", error)
      toast.error("Report generation failed", {
        description: "Please try again.",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Site Photos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button
                className="w-full"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="mr-2 h-4 w-4" /> Take/Upload Photos
              </Button>
              <Input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                multiple
                className="hidden"
              />

              <div className="space-y-2">
                <Label>Photo Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about these photos..."
                />
              </div>

              <Button onClick={handleGenerateReport} className="w-full" disabled={isAnalyzing || photos.length === 0}>
                {isAnalyzing ? (
                  <>Analyzing photos...</>
                ) : (
                  <><FileText className="mr-2 h-4 w-4" /> Generate Report</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Photo Gallery</CardTitle>
          </CardHeader>
          <CardContent>
            {photos.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <ImageIcon className="h-12 w-12 mb-4" />
                <p>No photos uploaded yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative group border rounded-lg overflow-hidden">
                      <img
                        src={photo.preview}
                        alt={`Site photo ${index + 1}`}
                        className="w-full h-32 object-cover"
                      />
                      <div className="absolute top-1 left-1 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                        {photo.analysis.category === "before" && <Clock className="inline h-3 w-3 mr-1" />}
                        {photo.analysis.category === "after" && <Check className="inline h-3 w-3 mr-1" />}
                        {photo.analysis.category === "issue" && <AlertTriangle className="inline h-3 w-3 mr-1" />}
                        {photo.analysis.category}
                      </div>
                      <div className="absolute top-1 right-1 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                        {photo.analysis.timestampVerified ? <Check className="inline h-3 w-3" /> : <X className="inline h-3 w-3" />}
                      </div>
                      <div className="absolute bottom-1 left-1 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                        <MapPin className="inline h-3 w-3 mr-1" />{photo.analysis.locationTag.split(" ")[0]}
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                        onClick={() => {
                          const newPhotos = [...photos]
                          newPhotos.splice(index, 1)
                          setPhotos(newPhotos)
                        }}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
                {reportData && (
                  <div className="mt-6 p-4 bg-secondary rounded-lg">
                    <h3 className="font-semibold mb-2">Report Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Total Photos</p>
                        <p>{reportData.summary.totalPhotos}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Before</p>
                        <p>{reportData.summary.byCategory.before}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">After</p>
                        <p>{reportData.summary.byCategory.after}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Issues</p>
                        <p>{reportData.summary.byCategory.issue}</p>
                      </div>
                    </div>
                    <Button className="mt-4 w-full" variant="outline">
                      <Share2 className="mr-2 h-4 w-4" /> Share Report
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}