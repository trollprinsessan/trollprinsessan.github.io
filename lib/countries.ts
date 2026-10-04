/* Three-letter country codes (ISO 3166-1 alpha-3), for the places that set a
   country short: the manifest caption and the index rows. Shared so the two
   never disagree. A country missing here falls back to its first three
   letters in caps - add it rather than live with the fallback. */
export const ISO3: Record<string, string> = {
  "United States": "USA", US: "USA", "United Kingdom": "GBR", UK: "GBR",
  Germany: "DEU", Sweden: "SWE", France: "FRA", Kenya: "KEN", Spain: "ESP",
  Nigeria: "NGA", India: "IND", Netherlands: "NLD", Denmark: "DNK",
  Singapore: "SGP", Switzerland: "CHE", Israel: "ISR", Canada: "CAN",
  Norway: "NOR", Argentina: "ARG", "South Africa": "ZAF", Australia: "AUS",
  Finland: "FIN", Ghana: "GHA", Latvia: "LVA", "Hong Kong": "HKG", Rwanda: "RWA",
  Estonia: "EST", Italy: "ITA", Turkey: "TUR", Indonesia: "IDN", Mexico: "MEX",
  Tanzania: "TZA", Austria: "AUT", Malaysia: "MYS", Belgium: "BEL", Egypt: "EGY",
  Portugal: "PRT", Vietnam: "VNM", Pakistan: "PAK", Lithuania: "LTU",
  Senegal: "SEN", Japan: "JPN", China: "CHN", "Côte d'Ivoire": "CIV",
  Luxembourg: "LUX", Oman: "OMN", Philippines: "PHL",
};

export const iso3 = (country: string) =>
  ISO3[country.trim()] ?? country.trim().slice(0, 3).toUpperCase();

/* a comma-separated place, or a list of them, as codes: "IND, USA" */
export const iso3List = (countries: string | string[]) =>
  (Array.isArray(countries) ? countries : countries.split(/\s*,\s*/))
    .filter(Boolean)
    .map(iso3)
    .join(", ");

/* Two-letter codes (ISO 3166-1 alpha-2), for the cards' corner. A country
   missing here falls back to its first two letters in caps. */
export const ISO2: Record<string, string> = {
  "United States": "US", US: "US", "United Kingdom": "UK", UK: "UK",
  Germany: "DE", Sweden: "SE", France: "FR", Kenya: "KE", Spain: "ES",
  Nigeria: "NG", India: "IN", Netherlands: "NL", Denmark: "DK",
  Singapore: "SG", Switzerland: "CH", Israel: "IL", Canada: "CA",
  Norway: "NO", Argentina: "AR", "South Africa": "ZA", Australia: "AU",
  Finland: "FI", Ghana: "GH", Latvia: "LV", "Hong Kong": "HK", Rwanda: "RW",
  Estonia: "EE", Italy: "IT", Turkey: "TR", Indonesia: "ID", Mexico: "MX",
  Tanzania: "TZ", Austria: "AT", Malaysia: "MY", Belgium: "BE", Egypt: "EG",
  Portugal: "PT", Vietnam: "VN", Pakistan: "PK", Lithuania: "LT",
  Senegal: "SN", Japan: "JP", China: "CN", "Côte d'Ivoire": "CI",
  Luxembourg: "LU", Oman: "OM", Philippines: "PH",
};

export const iso2List = (countries: string | string[]) =>
  (Array.isArray(countries) ? countries : countries.split(/\s*,\s*/))
    .filter(Boolean)
    .map((c) => ISO2[c.trim()] ?? c.trim().slice(0, 2).toUpperCase())
    .join(", ");

/* A country as the filter names it. The records carry "UK" and "US" for
   some editions and the full names for others; the Geography filter lists
   and matches both as "UK" and "US", so each country is one choice. */
const SHORT: Record<string, string> = { "United Kingdom": "UK", "United States": "US" };
export const countryName = (country: string) => SHORT[country.trim()] ?? country.trim();
