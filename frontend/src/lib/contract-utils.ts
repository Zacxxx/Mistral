"use client"

import nlp_ from "compromise"
const nlp: any = (nlp_ as any).default || nlp_

// Clause risk weights (0-1 scale)
const CLAUSE_RISK_WEIGHTS = {
  penalty: 0.9,
  termination: 0.7,
  liability: 0.8,
  confidentiality: 0.4,
  indemnification: 0.85,
  governingLaw: 0.3,
  forceMajeure: 0.5,
  disputeResolution: 0.6,
  paymentTerms: 0.75,
  deliveryTerms: 0.7,
  warranty: 0.65,
  intellectualProperty: 0.6,
  nonCompete: 0.55,
  dataProtection: 0.8,
  assignment: 0.5,
}

// Clause patterns for detection
const CLAUSE_PATTERNS = {
  penalty: [
    "penalty", "late fee", "liquidated damages", "fine", "forfeit", "default charge", "late payment fee"
  ],
  termination: [
    "termination", "cancel", "end agreement", "cease", "discontinue", "break contract"
  ],
  liability: [
    "liability", "responsib", "liable", "accountable", "obligated", "answerable"
  ],
  confidentiality: [
    "confidential", "non-disclosure", "proprietary", "secret", "private", "NDA"
  ],
  indemnification: [
    "indemnify", "hold harmless", "compensate", "reimburse", "make whole"
  ],
  governingLaw: [
    "governed by", "jurisdiction", "law of", "legal venue", "court of"
  ],
  forceMajeure: [
    "force majeure", "act of god", "unforeseen", "beyond control", "natural disaster"
  ],
  disputeResolution: [
    "arbitration", "mediation", "dispute resolution", "litigation", "legal proceedings"
  ],
  paymentTerms: [
    "payment", "invoice", "remit", "compensation", "fee", "charge", "reimbursement"
  ],
  deliveryTerms: [
    "delivery", "shipment", "fulfillment", "receipt", "transfer", "handover"
  ],
  warranty: [
    "warranty", "guarantee", "assurance", "promise", "pledge", "undertaking"
  ],
  intellectualProperty: [
    "intellectual property", "copyright", "trademark", "patent", "IP rights", "proprietary rights"
  ],
  nonCompete: [
    "non-compete", "non competition", "exclusivity", "restrictive covenant"
  ],
  dataProtection: [
    "data protection", "GDPR", "privacy", "personal data", "information security"
  ],
  assignment: [
    "assign", "transfer rights", "delegate", "subcontract", "novation"
  ],
}

// Risk thresholds
const RISK_THRESHOLDS = {
  LOW: 30,
  MEDIUM: 70,
  HIGH: 100,
}

interface ClauseAnalysis {
  type: string
  text: string
  riskScore: number
  explanation: string
  suggestions: string[]
  startIndex: number
  endIndex: number
}

interface ContractAnalysis {
  riskScore: number
  riskLevel: "Low" | "Medium" | "High"
  clauses: ClauseAnalysis[]
  summary: string
  suggestions: string[]
  penaltyClauses: ClauseAnalysis[]
}

export function analyzeContract(text: string): ContractAnalysis {
  if (!text || text.trim().length < 50) {
    return {
      riskScore: 0,
      riskLevel: "Low",
      clauses: [],
      summary: "Insufficient contract text for analysis",
      suggestions: ["Provide more complete contract text for accurate analysis"],
      penaltyClauses: [],
    }
  }

  const doc = nlp(text)
  const sentences = doc.sentences().out('array')
  const clauses: ClauseAnalysis[] = []
  const penaltyClauses: ClauseAnalysis[] = []

  // Detect clauses
  Object.entries(CLAUSE_PATTERNS).forEach(([clauseType, patterns]) => {
    patterns.forEach(pattern => {
      const matches = doc.match(pattern).out('array')
      if (matches.length > 0) {
        matches.forEach((match: string) => {
          const sentence = sentences.find((s: string) => s.includes(match))
          if (sentence) {
            const startIndex = text.indexOf(sentence)
            const endIndex = startIndex + sentence.length
            const existingClause = clauses.find(c => c.startIndex === startIndex)

            if (!existingClause) {
              const riskScore = calculateClauseRisk(clauseType, sentence)
              const { explanation, suggestions } = generateClauseAnalysis(clauseType, sentence, riskScore)

              const clause: ClauseAnalysis = {
                type: clauseType,
                text: sentence.trim(),
                riskScore,
                explanation,
                suggestions,
                startIndex,
                endIndex,
              }

              clauses.push(clause)
              if (clauseType === 'penalty') {
                penaltyClauses.push(clause)
              }
            }
          }
        })
      }
    })
  })

  // Calculate overall risk score
  const riskScore = calculateOverallRiskScore(clauses)
  const riskLevel = getRiskLevel(riskScore)
  const summary = generateSummary(riskScore, riskLevel, clauses)
  const suggestions = generateSuggestions(clauses)

  return {
    riskScore,
    riskLevel,
    clauses,
    summary,
    suggestions,
    penaltyClauses,
  }
}

function calculateClauseRisk(clauseType: string, text: string): number {
  const baseWeight = CLAUSE_RISK_WEIGHTS[clauseType as keyof typeof CLAUSE_RISK_WEIGHTS] || 0.5
  let riskScore = baseWeight * 100

  // Adjust risk based on text analysis
  const doc = nlp(text)

  // Check for high-risk modifiers
  const highRiskModifiers = [
    "excessive", "unreasonable", "disproportionate", "harsh", "severe",
    "punitive", "onerous", "burdensome", "unfair", "one-sided"
  ]

  // Check for low-risk modifiers
  const lowRiskModifiers = [
    "reasonable", "fair", "mutual", "balanced", "standard",
    "industry norm", "customary", "equitable"
  ]

  highRiskModifiers.forEach(modifier => {
    if (doc.has(modifier)) riskScore = Math.min(100, riskScore * 1.3)
  })

  lowRiskModifiers.forEach(modifier => {
    if (doc.has(modifier)) riskScore = Math.max(0, riskScore * 0.7)
  })

  // Check for specific high-risk patterns
  if (clauseType === 'penalty') {
    if (doc.has('#Money')) riskScore = Math.min(100, riskScore * 1.2)
    if (doc.has('exceed') || doc.has('more than')) riskScore = Math.min(100, riskScore * 1.1)
  }

  return Math.round(riskScore)
}

function generateClauseAnalysis(
  clauseType: string,
  _text: string,
  riskScore: number
): { explanation: string; suggestions: string[] } {
  const suggestions: string[] = []
  let explanation = ""

  switch (clauseType) {
    case 'penalty':
      explanation = `This penalty clause imposes financial consequences for contract breaches. `
      if (riskScore > 70) {
        explanation += "The penalty appears excessive and could create significant financial risk."
        suggestions.push(
          "Negotiate more reasonable penalty amounts proportional to actual damages",
          "Add caps to penalty amounts based on contract value",
          "Include mutual penalty clauses to ensure fairness"
        )
      } else {
        explanation += "The penalty appears reasonable but should be reviewed for fairness."
        suggestions.push(
          "Verify penalty amounts are proportional to potential damages",
          "Ensure penalty triggers are clearly defined and objective"
        )
      }
      break

    case 'termination':
      explanation = `This termination clause defines conditions for ending the contract. `
      if (riskScore > 70) {
        explanation += "The termination conditions appear one-sided or overly broad."
        suggestions.push(
          "Add mutual termination rights for both parties",
          "Define clear termination triggers with notice periods",
          "Include cure periods for minor breaches"
        )
      } else {
        explanation += "The termination conditions appear balanced."
        suggestions.push(
          "Review notice periods for adequacy",
          "Ensure termination doesn't create undue hardship"
        )
      }
      break

    case 'liability':
      explanation = `This liability clause defines responsibility for damages or losses. `
      if (riskScore > 70) {
        explanation += "The liability exposure appears excessive or one-sided."
        suggestions.push(
          "Negotiate mutual liability caps",
          "Exclude indirect damages like lost profits",
          "Add force majeure protection"
        )
      } else {
        explanation += "The liability terms appear reasonable."
        suggestions.push(
          "Verify liability caps are appropriate for contract value",
          "Ensure insurance requirements are adequate"
        )
      }
      break

    case 'indemnification':
      explanation = `This indemnification clause requires one party to compensate the other for losses. `
      if (riskScore > 70) {
        explanation += "The indemnification obligations appear overly broad."
        suggestions.push(
          "Limit indemnification to third-party claims only",
          "Add knowledge qualifiers for indemnification triggers",
          "Negotiate mutual indemnification obligations"
        )
      } else {
        explanation += "The indemnification terms appear balanced."
        suggestions.push(
          "Verify scope of indemnification is clearly defined",
          "Ensure indemnification procedures are practical"
        )
      }
      break

    case 'confidentiality':
      explanation = `This confidentiality clause protects sensitive information. `
      if (riskScore > 70) {
        explanation += "The confidentiality obligations may be overly restrictive."
        suggestions.push(
          "Define reasonable confidentiality periods",
          "Add standard exceptions (public knowledge, legal requirements)",
          "Ensure mutual confidentiality obligations"
        )
      } else {
        explanation += "The confidentiality terms appear reasonable."
        suggestions.push(
          "Verify confidentiality periods are appropriate",
          "Ensure information handling procedures are practical"
        )
      }
      break

    default:
      explanation = `This ${clauseType} clause defines important contract terms. `
      if (riskScore > 70) {
        explanation += "The terms may create significant risk exposure."
        suggestions.push(
          `Review ${clauseType} terms for fairness and balance`,
          `Negotiate more favorable ${clauseType} conditions`,
          `Add protections against ${clauseType} risks`
        )
      } else {
        explanation += "The terms appear generally reasonable."
        suggestions.push(
          `Verify ${clauseType} terms are clearly defined`,
          `Ensure ${clauseType} conditions are practical`
        )
      }
  }

  return { explanation, suggestions }
}

function calculateOverallRiskScore(clauses: ClauseAnalysis[]): number {
  if (clauses.length === 0) return 0

  // Weighted average based on clause risk scores and weights
  const weightedSum = clauses.reduce((sum, clause) => {
    const weight = CLAUSE_RISK_WEIGHTS[clause.type as keyof typeof CLAUSE_RISK_WEIGHTS] || 0.5
    return sum + (clause.riskScore * weight)
  }, 0)

  const totalWeight = clauses.reduce((sum, clause) => {
    return sum + (CLAUSE_RISK_WEIGHTS[clause.type as keyof typeof CLAUSE_RISK_WEIGHTS] || 0.5)
  }, 0)

  return Math.round(weightedSum / totalWeight)
}

function getRiskLevel(score: number): "Low" | "Medium" | "High" {
  if (score < RISK_THRESHOLDS.LOW) return "Low"
  if (score < RISK_THRESHOLDS.MEDIUM) return "Medium"
  return "High"
}

function generateSummary(
  riskScore: number,
  riskLevel: string,
  clauses: ClauseAnalysis[]
): string {
  const highRiskClauses = clauses.filter(c => c.riskScore > 70)
  const mediumRiskClauses = clauses.filter(c => c.riskScore > 40 && c.riskScore <= 70)

  let summary = `This contract has an overall risk score of ${riskScore}/100 (${riskLevel} Risk). `

  if (highRiskClauses.length > 0) {
    summary += `Key risk areas include: ${highRiskClauses.map(c => c.type).join(', ')}. `
  }

  if (mediumRiskClauses.length > 0) {
    summary += `Moderate risks were identified in: ${mediumRiskClauses.map(c => c.type).join(', ')}. `
  }

  if (highRiskClauses.length === 0 && mediumRiskClauses.length === 0) {
    summary += "No significant risks were identified in the major contract clauses."
  }

  return summary
}

function generateSuggestions(clauses: ClauseAnalysis[]): string[] {
  const highRiskClauses = clauses.filter(c => c.riskScore > 70)
  const suggestions: string[] = []

  if (highRiskClauses.length > 0) {
    suggestions.push(
      `Focus negotiations on the ${highRiskClauses.length} high-risk clauses identified`,
      "Prioritize amendments to penalty, liability, and indemnification terms"
    )
  }

  // Add top 3 suggestions from high-risk clauses
  highRiskClauses.slice(0, 3).forEach(clause => {
    suggestions.push(...clause.suggestions.slice(0, 2))
  })

  if (suggestions.length === 0) {
    return [
      "Review all contract terms for completeness and fairness",
      "Ensure all key business terms are clearly defined",
      "Consider legal review for complex or high-value contracts"
    ]
  }

  return [...new Set(suggestions)] // Remove duplicates
}

// Visualization data generator
export function getRiskDistributionData(clauses: ClauseAnalysis[]) {
  const distribution: Record<string, { count: number; avgRisk: number }> = {}

  Object.keys(CLAUSE_RISK_WEIGHTS).forEach(type => {
    distribution[type] = { count: 0, avgRisk: 0 }
  })

  clauses.forEach(clause => {
    distribution[clause.type].count++
    distribution[clause.type].avgRisk += clause.riskScore
  })

  return Object.entries(distribution).map(([type, data]) => ({
    type,
    count: data.count,
    avgRisk: data.count > 0 ? Math.round(data.avgRisk / data.count) : 0,
  }))
}

// Plain language converter
export function convertToPlainLanguage(text: string): string {
  const doc = nlp(text)

  // Replace legal jargon with plain language
  const replacements = {
    "hereinafter": "from now on",
    "whereas": "since",
    "hereto": "to this",
    "hereby": "by this",
    "notwithstanding": "despite",
    "pursuant to": "according to",
    "in witness whereof": "as evidence of this",
    "party of the first part": "first party",
    "party of the second part": "second party",
    "force majeure": "unforeseen events",
    "indemnify": "protect from loss",
    "hold harmless": "protect from legal claims",
    "warrant": "guarantee",
    "represent": "state",
    "covenant": "agree",
  }

  let plainText = text
  Object.entries(replacements).forEach(([legalTerm, plainTerm]) => {
    const regex = new RegExp(`\\b${legalTerm}\\b`, 'gi')
    plainText = plainText.replace(regex, plainTerm)
  })

  // Simplify complex sentences
  const sentences = doc.sentences().out('array')
  plainText = sentences.map((sentence: string) => {
    const sentenceDoc = nlp(sentence)
    if (sentence.length > 100) {
      return sentenceDoc.sentences().toSimple().out()
    }
    return sentence
  }).join(' ')

  return plainText
}