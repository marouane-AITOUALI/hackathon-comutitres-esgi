export function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 16)
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ')
}

export function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

export function formatCvv(value: string) {
  return value.replace(/\D/g, '').slice(0, 4)
}

export function buildCardToken(cardNumber: string) {
  const digits = cardNumber.replace(/\D/g, '')
  return `tok_proto_${digits.slice(-4)}`
}

export function validateCardFields(
  cardNumber: string,
  expiry: string,
  cvv: string,
  cardholderName: string,
): string | null {
  const digits = cardNumber.replace(/\D/g, '')
  if (digits.length < 13 || digits.length > 16) return 'Numéro de carte invalide.'
  if (!/^\d{2}\/\d{2}$/.test(expiry)) return 'Date d’expiration invalide (MM/AA).'
  const month = Number(expiry.split('/')[0])
  if (month < 1 || month > 12) return 'Mois d’expiration invalide.'
  if (cvv.length < 3) return 'CVV invalide.'
  if (cardholderName.trim().length < 2) return 'Nom du titulaire requis.'
  return null
}
