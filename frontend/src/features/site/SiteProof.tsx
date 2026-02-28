"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Camera, FileText, Image as ImageIcon } from "lucide-react"
import { useState, useRef } from "react"

export function SiteProof() {
  const [photos, setPhotos] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [notes, setNotes] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newPhotos = Array.from(e.target.files)
      setPhotos([...photos, ...newPhotos])

      // Create previews
      const newPreviews = newPhotos.map((file) => URL.createObjectURL(file))
      setPhotoPreviews([...photoPreviews, ...newPreviews])

      toast.success(`${newPhotos.length} photo(s) added`, {
        description: "Photos will be processed and categorized automatically.",
      })
    }
  }

  const handleGenerateReport = () => {
    // TODO: Implement report generation logic
    toast.success("Site proof report generated", {
      description: "Your timestamped PDF report is ready for download.",
    })
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

              <Button onClick={handleGenerateReport} className="w-full">
                <FileText className="mr-2 h-4 w-4" /> Generate Report
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Photo Gallery</CardTitle>
          </CardHeader>
          <CardContent>
            {photoPreviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <ImageIcon className="h-12 w-12 mb-4" />
                <p>No photos uploaded yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {photoPreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Site photo ${index + 1}`}
                      className="w-full h-32 object-cover rounded-md"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                      onClick={() => {
                        const newPhotos = [...photos]
                        const newPreviews = [...photoPreviews]
                        newPhotos.splice(index, 1)
                        newPreviews.splice(index, 1)
                        setPhotos(newPhotos)
                        setPhotoPreviews(newPreviews)
                      }}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}