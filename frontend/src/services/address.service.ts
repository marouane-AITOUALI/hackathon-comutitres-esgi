export interface AddressSuggestion {
  id: string
  label: string
  addressLine1: string
  postalCode: string
  city: string
}

interface GeoplatformFeature {
  properties?: {
    id?: string
    label?: string
    name?: string
    postcode?: string
    city?: string
  }
}

interface GeoplatformResponse {
  features?: GeoplatformFeature[]
}

export async function searchFrenchAddresses(query: string): Promise<AddressSuggestion[]> {
  const search = query.trim()
  if (search.length < 3) return []

  const params = new URLSearchParams({
    q: search,
    limit: '5',
    autocomplete: '1',
  })

  const response = await fetch(`https://data.geopf.fr/geocodage/search?${params.toString()}`)
  if (!response.ok) throw new Error('Recherche d’adresse indisponible.')

  const data = await response.json() as GeoplatformResponse
  return (data.features ?? []).flatMap((feature, index) => {
    const properties = feature.properties
    if (!properties?.label || !properties.postcode || !properties.city) return []
    return [{
      id: properties.id ?? `${properties.label}-${index}`,
      label: properties.label,
      addressLine1: properties.name ?? properties.label,
      postalCode: properties.postcode,
      city: properties.city,
    }]
  })
}
