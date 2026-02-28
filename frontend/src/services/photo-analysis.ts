"use client"

import * as tf from '@tensorflow/tfjs'
import * as mobilenet from '@tensorflow-models/mobilenet'
import { categorizePhoto, comparePhotos, extractMetadata, generateLocationTag, generateReportData, verifyTimestamp } from '@/lib/photo-utils'

interface AnalysisResult {
  metadata: ReturnType<typeof extractMetadata>
  category: "before" | "after" | "progress" | "issue"
  timestampVerified: boolean
  locationTag: string
  objectsDetected?: string[]
  issuesDetected?: string[]
}

class PhotoAnalysisService {
  private model: mobilenet.MobileNet | null = null
  private projectLocation: { lat: number; lng: number; radius: number } | null = null

  async initialize() {
    await tf.ready()
    this.model = await mobilenet.load()
  }

  setProjectLocation(lat: number, lng: number, radius: number = 0.5) {
    this.projectLocation = { lat, lng, radius }
  }

  async analyzePhoto(file: File, referencePhotos?: File[]): Promise<AnalysisResult> {
    if (!this.model) await this.initialize()

    const metadata = await extractMetadata(file)
    const category = (await categorizePhoto(file, referencePhotos)).category || "progress"
    const timestampVerified = verifyTimestamp(metadata.timestamp)
    const locationTag = generateLocationTag(
      metadata.geolocation?.lat || null,
      metadata.geolocation?.lng || null,
      this.projectLocation || undefined
    )

    // Object detection
    const objectsDetected = await this.detectObjects(file)
    const issuesDetected = objectsDetected.filter(obj =>
      ["crack", "damage", "leak", "rust", "mold"].some(issue => obj.includes(issue))
    )

    return {
      metadata,
      category,
      timestampVerified,
      locationTag,
      objectsDetected,
      issuesDetected: issuesDetected.length > 0 ? issuesDetected : undefined,
    }
  }

  async detectObjects(file: File): Promise<string[]> {
    if (!this.model) throw new Error("Model not initialized")

    const img = new Image()
    img.src = URL.createObjectURL(file)
    await new Promise(resolve => { img.onload = resolve })

    const tfImg = tf.browser.fromPixels(img).resizeNearestNeighbor([224, 224]).toFloat()
    const offset = tf.scalar(127.5)
    const normalized = tfImg.sub(offset).div(offset)
    const batched = normalized.expandDims(0)

    const predictions = await this.model.classify(batched)
    tf.dispose([tfImg, normalized, batched])

    return predictions.slice(0, 3).map(p => p.className)
  }

  async comparePhotos(photo1: File, photo2: File) {
    return comparePhotos(photo1, photo2)
  }

  async generateReport(photos: File[]) {
    const metadataPromises = photos.map(file => extractMetadata(file))
    const metadata = await Promise.all(metadataPromises)

    return generateReportData(photos, metadata)
  }
}

export const photoAnalysisService = new PhotoAnalysisService()