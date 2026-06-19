export function formatIban(value: string) {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 34)
    .replace(/(.{4})(?=.)/g, '$1 ')
}

export function formatBic(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11)
}

function ibanChecksumValid(value: string) {
  const compact = value.replace(/\s/g, '').toUpperCase()
  const rearranged = `${compact.slice(4)}${compact.slice(0, 4)}`
  const numeric = rearranged.replace(/[A-Z]/g, (character) => String(character.charCodeAt(0) - 55))
  let remainder = 0
  for (const character of numeric) remainder = (remainder * 10 + Number(character)) % 97
  return remainder === 1
}

export function validateSepaFields(holderName: string, iban: string, bic: string) {
  const compactIban = iban.replace(/\s/g, '').toUpperCase()
  if (holderName.trim().length < 2) return 'Nom du titulaire du compte requis.'
  if (!/^FR\d{12}[A-Z0-9]{11}\d{2}$/.test(compactIban) || !ibanChecksumValid(compactIban)) {
    return 'IBAN français invalide.'
  }
  if (!/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(bic)) return 'BIC invalide (8 ou 11 caractères).'
  return null
}
