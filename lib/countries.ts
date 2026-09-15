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
