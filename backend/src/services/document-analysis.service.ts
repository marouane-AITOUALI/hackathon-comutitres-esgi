import type { DocumentAnalysisResult } from '../db/schema.js'

interface DocumentForAnalysis {
  type: string
  fileUrl: string
}

const expectedKeywords: Record<string, string[]> = {
  identity: ['identity', 'identite', 'cni', 'passeport', 'passport'],
  proof_of_address: ['domicile', 'address', 'adresse', 'facture', 'quittance'],
  eligibility: ['eligibilite', 'eligibility', 'solidarite', 'tst', 'caf'],
  school_certificate: ['scolarite', 'school', 'certificat', 'student', 'etudiant'],
  tax_notice: ['impot', 'tax', 'avis', 'fiscal'],
  other: [],
}

const riskyExtensions = ['.exe', '.bat', '.cmd', '.js', '.scr', '.zip', '.rar']
const acceptedExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.heic']

function filename(fileUrl: string) {
  return decodeURIComponent(fileUrl.split(/[/?#]/).filter(Boolean).at(-1) ?? fileUrl).toLowerCase()
}

function detectDocumentType(name: string) {
  const detected = Object.entries(expectedKeywords)
    .filter(([, keywords]) => keywords.some((keyword) => name.includes(keyword)))
    .sort((a, b) => b[1].length - a[1].length)[0]

  return detected?.[0] ?? 'other'
}

export function analyzeDocumentWithRules(document: DocumentForAnalysis): DocumentAnalysisResult {
  const name = filename(document.fileUrl)
  const extension = name.includes('.') ? `.${name.split('.').at(-1)}` : ''
  const detectedDocumentType = detectDocumentType(name)
  const reasons: string[] = []
  const warnings: string[] = []
  const fraudSignals: string[] = []
  let confidence = 52

  if (acceptedExtensions.includes(extension)) {
    confidence += 18
    reasons.push('Format de fichier compatible avec une verification documentaire.')
  } else {
    warnings.push('Le format du fichier devra etre confirme manuellement.')
  }

  if (riskyExtensions.includes(extension)) {
    confidence -= 45
    fraudSignals.push('Extension de fichier non autorisee pour une piece justificative.')
  }

  if (detectedDocumentType === document.type) {
    confidence += 22
    reasons.push('Le nom du fichier correspond au type de justificatif attendu.')
  } else if (detectedDocumentType !== 'other') {
    confidence -= 18
    warnings.push(`Le fichier semble etre de type ${detectedDocumentType}, different du type attendu ${document.type}.`)
  } else {
    warnings.push('Le type du justificatif ne peut pas etre confirme automatiquement.')
  }

  if (name.includes('copy') || name.includes('copie')) {
    confidence -= 5
    warnings.push('Le fichier semble etre une copie; une verification humaine peut etre utile.')
  }

  if (name.includes('modified') || name.includes('retouche') || name.includes('fake')) {
    confidence -= 35
    fraudSignals.push('Le nom du fichier contient un indice de modification ou de fraude potentielle.')
  }

  const boundedConfidence = Math.max(0, Math.min(100, confidence))
  const suggestedStatus = fraudSignals.length > 0
    ? 'rejected'
    : boundedConfidence >= 85
      ? 'validated'
      : 'needs_manual_review'

  return {
    provider: 'rules-prototype-free',
    detectedDocumentType,
    confidence: boundedConfidence,
    suggestedStatus,
    extractedFields: {},
    reasons,
    warnings,
    fraudSignals,
    analyzedAt: new Date().toISOString(),
  }
}

export function checkDocumentFraud(document: DocumentForAnalysis) {
  const analysis = analyzeDocumentWithRules(document)
  const riskScore = Math.max(0, Math.min(100, 100 - analysis.confidence + analysis.fraudSignals.length * 20))

  return {
    riskScore,
    fraudSignals: analysis.fraudSignals,
    warnings: analysis.warnings,
    needsManualReview: riskScore >= 35 || analysis.suggestedStatus !== 'validated',
  }
}
