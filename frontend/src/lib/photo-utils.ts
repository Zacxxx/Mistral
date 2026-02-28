"use client"

import { ExifParserFactory } from 'ts-exif-parser'
import * as turf from '@turf/turf'

interface PhotoMetadata {
  timestamp: Date | null
  geolocation: {
    lat: number | null
    lng: number | null
    accuracy: number | null
  } | null
  category?: "before" | "after" | "progress" | "issue"
  exifData?: Record<string, unknown>
}

interface ComparisonResult {
  similarity: number
  changesDetected: string[]
  visualDifferences: string[]
}

export const extractMetadata = async (file: File): Promise<PhotoMetadata> => {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const parser = ExifParserFactory.create(arrayBuffer)
    const result = parser.parse()

    const metadata: PhotoMetadata = {
      timestamp: result.tags?.DateTimeOriginal
        ? new Date(result.tags.DateTimeOriginal * 1000)
        : null,
      geolocation: result.tags?.GPSLatitude && result.tags?.GPSLongitude
        ? {
            lat: result.tags.GPSLatitude,
            lng: result.tags.GPSLongitude,
            accuracy: result.tags.GPSHPositioningError || null,
          }
        : null,
      exifData: result.tags,
    }

    return metadata
  } catch (error) {
    console.error("Error extracting metadata:", error)
    return {
      timestamp: null,
      geolocation: null,
    }
  }
}

export const verifyTimestamp = (timestamp: Date | null, expectedRange?: [Date, Date]): boolean => {
  if (!timestamp) return false

  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

  if (expectedRange) {
    return timestamp >= expectedRange[0] && timestamp <= expectedRange[1]
  }

  return timestamp >= oneHourAgo && timestamp <= now
}

export const categorizePhoto = async (
  file: File,
  referencePhotos?: File[]
): Promise<PhotoMetadata> => {
  const metadata = await extractMetadata(file)

  // Simple categorization based on filename patterns
  const filename = file.name.toLowerCase()
  if (filename.includes("before")) {
    metadata.category = "before"
  } else if (filename.includes("after")) {
    metadata.category = "after"
  } else if (filename.includes("progress")) {
    metadata.category = "progress"
  } else if (filename.includes("issue") || filename.includes("problem")) {
    metadata.category = "issue"
  } else if (referencePhotos && referencePhotos.length > 0) {
    // AI-based categorization would go here
    metadata.category = "progress"
  } else {
    metadata.category = "before"
  }

  return metadata
}

export const comparePhotos = async (
  photo1: File,
  photo2: File
): Promise<ComparisonResult> => {
  // In a real implementation, this would use AI/ML for comparison
  // For now, we'll return mock data
  return {
    similarity: Math.random() * 0.7 + 0.3, // Random similarity between 0.3-1.0
    changesDetected: ["lighting", "objects", "perspective"].filter(() => Math.random() > 0.5),
    visualDifferences: Array.from({ length: 3 }, (_, i) => `Difference ${i + 1}`),
  }
}

export const generateLocationTag = (
  lat: number | null,
  lng: number | null,
  projectLocation?: { lat: number; lng: number; radius: number }
): string => {
  if (!lat || !lng) return "Location not available"

  if (projectLocation) {
    const point = turf.point([lng, lat])
    const center = turf.point([projectLocation.lng, projectLocation.lat])
    const distance = turf.distance(point, center, { units: "kilometers" })

    if (distance <= projectLocation.radius) {
      return `On-site (${distance.toFixed(2)} km from project center)`
    } else {
      return `Off-site (${distance.toFixed(2)} km from project center)`
    }
  }

  return `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`
}

export const generateReportData = (
  photos: File[],
  metadata: PhotoMetadata[]
) => {
  const categorized = {
    before: [] as { file: File; metadata: PhotoMetadata }[],
    after: [] as { file: File; metadata: PhotoMetadata }[],
    progress: [] as { file: File; metadata: PhotoMetadata }[],
    issue: [] as { file: File; metadata: PhotoMetadata }[],
  }

  photos.forEach((file, index) => {
    const category = metadata[index]?.category || "progress"
    categorized[category].push({ file, metadata: metadata[index] })
  })

  return {
    summary: {
      totalPhotos: photos.length,
      byCategory: {
        before: categorized.before.length,
        after: categorized.after.length,
        progress: categorized.progress.length,
        issue: categorized.issue.length,
      },
      timestampRange: {
        start: new Date(Math.min(...metadata.map(m => m.timestamp?.getTime() || Date.now()))),
        end: new Date(Math.max(...metadata.map(m => m.timestamp?.getTime() || Date.now()))),
      },
    },
    categorizedPhotos: categorized,
  }
}