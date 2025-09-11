/**
 * Sample CSV data generator for postal code datasets
 * Generates realistic postal code data with proper geographic distribution
 */

export interface PostalCodeRecord {
  PostalCode: string;
  PlaceName: string;
  AdminName1: string;
  AdminName2: string;
  AdminName3: string;
  Latitude: number;
  Longitude: number;
  Timezone: string;
}

export interface CountryDataTemplate {
  countryCode: string;
  postalCodeFormat: RegExp;
  timezones: string[];
  regions: Array<{
    adminName1: string;
    adminName2?: string;
    adminName3?: string;
    latRange: [number, number];
    lngRange: [number, number];
    cities: string[];
    postalCodes: string[];
  }>;
}

// Country-specific data templates for realistic generation
const COUNTRY_TEMPLATES: Record<string, CountryDataTemplate> = {
  US: {
    countryCode: 'US',
    postalCodeFormat: /^\d{5}$/,
    timezones: ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Phoenix', 'America/Anchorage', 'Pacific/Honolulu'],
    regions: [
      {
        adminName1: 'California',
        adminName2: 'Los Angeles County',
        latRange: [33.7, 34.3],
        lngRange: [-118.7, -117.1],
        cities: ['Los Angeles', 'Beverly Hills', 'Santa Monica', 'Pasadena', 'Long Beach'],
        postalCodes: ['90210', '90211', '90212', '90401', '90402', '91101', '91102', '90802', '90803']
      },
      {
        adminName1: 'New York',
        adminName2: 'New York County',
        adminName3: 'Manhattan',
        latRange: [40.7, 40.8],
        lngRange: [-74.0, -73.9],
        cities: ['New York', 'Manhattan', 'Midtown', 'Upper East Side', 'Lower Manhattan'],
        postalCodes: ['10001', '10002', '10003', '10004', '10005', '10006', '10007', '10008', '10009']
      },
      {
        adminName1: 'Texas',
        adminName2: 'Harris County',
        latRange: [29.6, 29.9],
        lngRange: [-95.7, -95.0],
        cities: ['Houston', 'Pasadena', 'Baytown', 'Sugar Land', 'The Woodlands'],
        postalCodes: ['77001', '77002', '77003', '77004', '77005', '77006', '77007', '77008', '77009']
      }
    ]
  },
  DE: {
    countryCode: 'DE',
    postalCodeFormat: /^\d{5}$/,
    timezones: ['Europe/Berlin'],
    regions: [
      {
        adminName1: 'Bayern',
        adminName2: 'München',
        latRange: [48.0, 48.2],
        lngRange: [11.4, 11.7],
        cities: ['München', 'Schwabing', 'Maxvorstadt', 'Altstadt', 'Bogenhausen'],
        postalCodes: ['80331', '80333', '80335', '80337', '80339', '80469', '80538', '80539', '80636']
      },
      {
        adminName1: 'Berlin',
        adminName2: 'Berlin',
        latRange: [52.4, 52.6],
        lngRange: [13.2, 13.6],
        cities: ['Berlin', 'Mitte', 'Charlottenburg', 'Kreuzberg', 'Prenzlauer Berg'],
        postalCodes: ['10115', '10117', '10119', '10178', '10179', '10243', '10245', '10247', '10249']
      },
      {
        adminName1: 'Nordrhein-Westfalen',
        adminName2: 'Köln',
        latRange: [50.8, 51.0],
        lngRange: [6.8, 7.1],
        cities: ['Köln', 'Innenstadt', 'Deutz', 'Ehrenfeld', 'Nippes'],
        postalCodes: ['50667', '50668', '50670', '50672', '50674', '50676', '50677', '50678', '50679']
      }
    ]
  },
  JP: {
    countryCode: 'JP',
    postalCodeFormat: /^\d{3}-\d{4}$/,
    timezones: ['Asia/Tokyo'],
    regions: [
      {
        adminName1: 'Tokyo',
        adminName2: 'Chiyoda',
        latRange: [35.6, 35.7],
        lngRange: [139.7, 139.8],
        cities: ['Tokyo', 'Chiyoda', 'Marunouchi', 'Otemachi', 'Kasumigaseki'],
        postalCodes: ['100-0001', '100-0002', '100-0003', '100-0004', '100-0005', '100-0006', '100-0011', '100-0012', '100-0013']
      },
      {
        adminName1: 'Osaka',
        adminName2: 'Osaka',
        latRange: [34.6, 34.7],
        lngRange: [135.4, 135.6],
        cities: ['Osaka', 'Namba', 'Umeda', 'Tennoji', 'Sumiyoshi'],
        postalCodes: ['530-0001', '530-0002', '530-0003', '530-0004', '530-0005', '542-0081', '542-0082', '542-0083', '542-0084']
      },
      {
        adminName1: 'Kanagawa',
        adminName2: 'Yokohama',
        latRange: [35.4, 35.5],
        lngRange: [139.6, 139.7],
        cities: ['Yokohama', 'Minato Mirai', 'Chinatown', 'Kohoku', 'Kanazawa'],
        postalCodes: ['220-0001', '220-0002', '220-0003', '220-0004', '220-0005', '231-0001', '231-0002', '231-0003', '231-0004']
      }
    ]
  },
  GB: {
    countryCode: 'GB',
    postalCodeFormat: /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/,
    timezones: ['Europe/London'],
    regions: [
      {
        adminName1: 'England',
        adminName2: 'Greater London',
        adminName3: 'Westminster',
        latRange: [51.4, 51.6],
        lngRange: [-0.2, 0.0],
        cities: ['London', 'Westminster', 'Camden', 'Kensington', 'Chelsea'],
        postalCodes: ['SW1A 1AA', 'SW1A 2AA', 'W1A 0AX', 'WC1A 1AA', 'WC2A 1AA', 'EC1A 1AA', 'EC2A 1AA', 'EC3A 1AA', 'EC4A 1AA']
      },
      {
        adminName1: 'England',
        adminName2: 'Greater Manchester',
        latRange: [53.4, 53.5],
        lngRange: [-2.3, -2.1],
        cities: ['Manchester', 'Salford', 'Stockport', 'Oldham', 'Rochdale'],
        postalCodes: ['M1 1AA', 'M1 2AA', 'M1 3AA', 'M2 1AA', 'M2 2AA', 'M3 1AA', 'M3 2AA', 'M4 1AA', 'M4 2AA']
      },
      {
        adminName1: 'Scotland',
        adminName2: 'City of Edinburgh',
        latRange: [55.9, 56.0],
        lngRange: [-3.3, -3.1],
        cities: ['Edinburgh', 'Leith', 'Morningside', 'Stockbridge', 'Canongate'],
        postalCodes: ['EH1 1AA', 'EH1 2AA', 'EH1 3AA', 'EH2 1AA', 'EH2 2AA', 'EH3 1AA', 'EH3 2AA', 'EH4 1AA', 'EH4 2AA']
      }
    ]
  },
  FR: {
    countryCode: 'FR',
    postalCodeFormat: /^\d{5}$/,
    timezones: ['Europe/Paris'],
    regions: [
      {
        adminName1: 'Île-de-France',
        adminName2: 'Paris',
        latRange: [48.8, 48.9],
        lngRange: [2.2, 2.4],
        cities: ['Paris', 'Louvre', 'Marais', 'Montmartre', 'Saint-Germain'],
        postalCodes: ['75001', '75002', '75003', '75004', '75005', '75006', '75007', '75008', '75009']
      },
      {
        adminName1: 'Provence-Alpes-Côte d\'Azur',
        adminName2: 'Bouches-du-Rhône',
        latRange: [43.2, 43.4],
        lngRange: [5.3, 5.5],
        cities: ['Marseille', 'Aix-en-Provence', 'Cassis', 'La Ciotat', 'Aubagne'],
        postalCodes: ['13001', '13002', '13003', '13004', '13005', '13006', '13007', '13008', '13009']
      },
      {
        adminName1: 'Auvergne-Rhône-Alpes',
        adminName2: 'Rhône',
        latRange: [45.7, 45.8],
        lngRange: [4.8, 4.9],
        cities: ['Lyon', 'Villeurbanne', 'Vénissieux', 'Caluire-et-Cuire', 'Bron'],
        postalCodes: ['69001', '69002', '69003', '69004', '69005', '69006', '69007', '69008', '69009']
      }
    ]
  },
  CA: {
    countryCode: 'CA',
    postalCodeFormat: /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/,
    timezones: ['America/Toronto', 'America/Vancouver', 'America/Edmonton', 'America/Winnipeg', 'America/Halifax', 'America/St_Johns'],
    regions: [
      {
        adminName1: 'Ontario',
        adminName2: 'Toronto',
        latRange: [43.6, 43.8],
        lngRange: [-79.5, -79.2],
        cities: ['Toronto', 'North York', 'Scarborough', 'Etobicoke', 'York'],
        postalCodes: ['M5V 1A1', 'M5V 1A2', 'M5V 1A3', 'M5H 1A1', 'M5H 1A2', 'M5G 1A1', 'M5G 1A2', 'M5C 1A1', 'M5C 1A2']
      },
      {
        adminName1: 'British Columbia',
        adminName2: 'Vancouver',
        latRange: [49.2, 49.3],
        lngRange: [-123.2, -123.0],
        cities: ['Vancouver', 'Burnaby', 'Richmond', 'Surrey', 'Coquitlam'],
        postalCodes: ['V6B 1A1', 'V6B 1A2', 'V6B 1A3', 'V6C 1A1', 'V6C 1A2', 'V6E 1A1', 'V6E 1A2', 'V6G 1A1', 'V6G 1A2']
      },
      {
        adminName1: 'Quebec',
        adminName2: 'Montreal',
        latRange: [45.4, 45.6],
        lngRange: [-73.8, -73.5],
        cities: ['Montreal', 'Laval', 'Longueuil', 'Terrebonne', 'Brossard'],
        postalCodes: ['H1A 1A1', 'H1A 1A2', 'H1A 1A3', 'H1B 1A1', 'H1B 1A2', 'H1C 1A1', 'H1C 1A2', 'H1E 1A1', 'H1E 1A2']
      }
    ]
  }
};

/**
 * Generates a random number within a range
 */
function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Selects a random item from an array
 */
function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generates realistic latitude/longitude with some variation
 */
function generateCoordinates(latRange: [number, number], lngRange: [number, number]): [number, number] {
  const lat = randomInRange(latRange[0], latRange[1]);
  const lng = randomInRange(lngRange[0], lngRange[1]);
  return [Number(lat.toFixed(4)), Number(lng.toFixed(4))];
}

/**
 * Selects appropriate timezone based on coordinates and country
 */
function selectTimezone(countryCode: string, lng: number): string {
  const template = COUNTRY_TEMPLATES[countryCode];
  if (!template) return 'UTC';
  
  // For countries with multiple timezones, select based on longitude
  if (countryCode === 'US') {
    if (lng > -75) return 'America/New_York';
    if (lng > -90) return 'America/Chicago';
    if (lng > -105) return 'America/Denver';
    if (lng > -120) return 'America/Los_Angeles';
    return 'America/Los_Angeles';
  }
  
  if (countryCode === 'CA') {
    if (lng > -60) return 'America/Halifax';
    if (lng > -90) return 'America/Toronto';
    if (lng > -102) return 'America/Winnipeg';
    if (lng > -115) return 'America/Edmonton';
    return 'America/Vancouver';
  }
  
  return template.timezones[0];
}

/**
 * Generates sample postal code records for a specific country
 */
export function generateSampleData(countryCode: string, recordCount: number = 75): PostalCodeRecord[] {
  const template = COUNTRY_TEMPLATES[countryCode];
  if (!template) {
    throw new Error(`No template found for country code: ${countryCode}`);
  }

  const records: PostalCodeRecord[] = [];
  const recordsPerRegion = Math.ceil(recordCount / template.regions.length);

  for (const region of template.regions) {
    for (let i = 0; i < recordsPerRegion && records.length < recordCount; i++) {
      const [lat, lng] = generateCoordinates(region.latRange, region.lngRange);
      const timezone = selectTimezone(countryCode, lng);
      const postalCode = randomChoice(region.postalCodes);
      const placeName = randomChoice(region.cities);

      records.push({
        PostalCode: postalCode,
        PlaceName: placeName,
        AdminName1: region.adminName1,
        AdminName2: region.adminName2 || '',
        AdminName3: region.adminName3 || '',
        Latitude: lat,
        Longitude: lng,
        Timezone: timezone
      });
    }
  }

  return records.slice(0, recordCount);
}

/**
 * Converts postal code records to CSV format
 */
export function recordsToCSV(records: PostalCodeRecord[]): string {
  const headers = ['PostalCode', 'PlaceName', 'AdminName1', 'AdminName2', 'AdminName3', 'Latitude', 'Longitude', 'Timezone'];
  const csvRows = [headers.join(',')];

  for (const record of records) {
    const row = [
      record.PostalCode,
      record.PlaceName,
      record.AdminName1,
      record.AdminName2,
      record.AdminName3,
      record.Latitude.toString(),
      record.Longitude.toString(),
      record.Timezone
    ];
    csvRows.push(row.join(','));
  }

  return csvRows.join('\n');
}

/**
 * Generates and returns CSV content for a specific country
 */
export function generateCountryCSV(countryCode: string, recordCount: number = 75): string {
  const records = generateSampleData(countryCode, recordCount);
  return recordsToCSV(records);
}

/**
 * Gets all supported country codes
 */
export function getSupportedCountries(): string[] {
  return Object.keys(COUNTRY_TEMPLATES);
}