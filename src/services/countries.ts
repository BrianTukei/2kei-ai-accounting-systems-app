export interface CountryData {
  code: string;
  name: string;
  currency: string;
  currencyName: string;
  currencySymbol: string;
  timezone: string;
  phoneCode: string;
  flag: string;
  region: 'east_africa' | 'west_africa' | 'north_africa' | 'central_africa' | 'southern_africa' | 'europe' | 'asia' | 'americas' | 'oceania';
  dateFormat: string;
  numberFormat: {
    thousandSeparator: string;
    decimalSeparator: string;
    decimalPlaces: number;
  };
}

export const COUNTRIES: Record<string, CountryData> = {
  // East Africa
  uganda: {
    code: 'UG',
    name: 'Uganda',
    currency: 'UGX',
    currencyName: 'Uganda Shilling',
    currencySymbol: 'USh',
    timezone: 'Africa/Kampala',
    phoneCode: '+256',
    flag: '🇺🇬',
    region: 'east_africa',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: {
      thousandSeparator: ',',
      decimalSeparator: '.',
      decimalPlaces: 0
    }
  },
  kenya: {
    code: 'KE',
    name: 'Kenya',
    currency: 'KES',
    currencyName: 'Kenya Shilling',
    currencySymbol: 'KSh',
    timezone: 'Africa/Nairobi',
    phoneCode: '+254',
    flag: '🇰🇪',
    region: 'east_africa',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: {
      thousandSeparator: ',',
      decimalSeparator: '.',
      decimalPlaces: 2
    }
  },
  tanzania: {
    code: 'TZ',
    name: 'Tanzania',
    currency: 'TZS',
    currencyName: 'Tanzania Shilling',
    currencySymbol: 'TSh',
    timezone: 'Africa/Dar_es_Salaam',
    phoneCode: '+255',
    flag: '🇹🇿',
    region: 'east_africa',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: {
      thousandSeparator: ',',
      decimalSeparator: '.',
      decimalPlaces: 2
    }
  },
  rwanda: {
    code: 'RW',
    name: 'Rwanda',
    currency: 'RWF',
    currencyName: 'Rwanda Franc',
    currencySymbol: 'RF',
    timezone: 'Africa/Kigali',
    phoneCode: '+250',
    flag: '🇷🇼',
    region: 'east_africa',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: {
      thousandSeparator: ',',
      decimalSeparator: '.',
      decimalPlaces: 0
    }
  },
  burundi: {
    code: 'BI',
    name: 'Burundi',
    currency: 'BIF',
    currencyName: 'Burundi Franc',
    currencySymbol: 'FBu',
    timezone: 'Africa/Bujumbura',
    phoneCode: '+257',
    flag: '🇧🇮',
    region: 'east_africa',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: {
      thousandSeparator: ',',
      decimalSeparator: '.',
      decimalPlaces: 0
    }
  },
  ethiopia: {
    code: 'ET',
    name: 'Ethiopia',
    currency: 'ETB',
    currencyName: 'Ethiopian Birr',
    currencySymbol: 'Br',
    timezone: 'Africa/Addis_Ababa',
    phoneCode: '+251',
    flag: '🇪🇹',
    region: 'east_africa',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: {
      thousandSeparator: ',',
      decimalSeparator: '.',
      decimalPlaces: 2
    }
  },
  somalia: {
    code: 'SO',
    name: 'Somalia',
    currency: 'SOS',
    currencyName: 'Somali Shilling',
    currencySymbol: 'Sh',
    timezone: 'Africa/Mogadishu',
    phoneCode: '+252',
    flag: '🇸🇴',
    region: 'east_africa',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: {
      thousandSeparator: ',',
      decimalSeparator: '.',
      decimalPlaces: 2
    }
  },

  // West Africa
  nigeria: {
    code: 'NG',
    name: 'Nigeria',
    currency: 'NGN',
    currencyName: 'Nigeria Naira',
    currencySymbol: '₦',
    timezone: 'Africa/Lagos',
    phoneCode: '+234',
    flag: '🇳🇬',
    region: 'west_africa',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: {
      thousandSeparator: ',',
      decimalSeparator: '.',
      decimalPlaces: 2
    }
  },
  ghana: {
    code: 'GH',
    name: 'Ghana',
    currency: 'GHS',
    currencyName: 'Ghana Cedi',
    currencySymbol: '₵',
    timezone: 'Africa/Accra',
    phoneCode: '+233',
    flag: '🇬🇭',
    region: 'west_africa',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: {
      thousandSeparator: ',',
      decimalSeparator: '.',
      decimalPlaces: 2
    }
  },
  ivory_coast: {
    code: 'CI',
    name: 'Ivory Coast (Côte d\'Ivoire)',
    currency: 'XOF',
    currencyName: 'West African CFA Franc',
    currencySymbol: 'Fr',
    timezone: 'Africa/Abidjan',
    phoneCode: '+225',
    flag: '🇨🇮',
    region: 'west_africa',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: {
      thousandSeparator: ' ',
      decimalSeparator: ',',
      decimalPlaces: 0
    }
  },
  senegal: {
    code: 'SN',
    name: 'Senegal',
    currency: 'XOF',
    currencyName: 'West African CFA Franc',
    currencySymbol: 'Fr',
    timezone: 'Africa/Dakar',
    phoneCode: '+221',
    flag: '🇸🇳',
    region: 'west_africa',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: {
      thousandSeparator: ' ',
      decimalSeparator: ',',
      decimalPlaces: 0
    }
  },
  mali: {
    code: 'ML',
    name: 'Mali',
    currency: 'XOF',
    currencyName: 'West African CFA Franc',
    currencySymbol: 'Fr',
    timezone: 'Africa/Bamako',
    phoneCode: '+223',
    flag: '🇲🇱',
    region: 'west_africa',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: {
      thousandSeparator: ' ',
      decimalSeparator: ',',
      decimalPlaces: 0
    }
  },
  burkina_faso: {
    code: 'BF',
    name: 'Burkina Faso',
    currency: 'XOF',
    currencyName: 'West African CFA Franc',
    currencySymbol: 'Fr',
    timezone: 'Africa/Ouagadougou',
    phoneCode: '+226',
    flag: '🇧🇫',
    region: 'west_africa',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: {
      thousandSeparator: ' ',
      decimalSeparator: ',',
      decimalPlaces: 0
    }
  },
  niger: {
    code: 'NE',
    name: 'Niger',
    currency: 'XOF',
    currencyName: 'West African CFA Franc',
    currencySymbol: 'Fr',
    timezone: 'Africa/Niamey',
    phoneCode: '+227',
    flag: '🇳🇪',
    region: 'west_africa',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: {
      thousandSeparator: ' ',
      decimalSeparator: ',',
      decimalPlaces: 0
    }
  },
  benin: {
    code: 'BJ',
    name: 'Benin',
    currency: 'XOF',
    currencyName: 'West African CFA Franc',
    currencySymbol: 'Fr',
    timezone: 'Africa/Porto-Novo',
    phoneCode: '+229',
    flag: '🇧🇯',
    region: 'west_africa',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: {
      thousandSeparator: ' ',
      decimalSeparator: ',',
      decimalPlaces: 0
    }
  },
  togo: {
    code: 'TG',
    name: 'Togo',
    currency: 'XOF',
    currencyName: 'West African CFA Franc',
    currencySymbol: 'Fr',
    timezone: 'Africa/Lome',
    phoneCode: '+228',
    flag: '🇹🇬',
    region: 'west_africa',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: {
      thousandSeparator: ' ',
      decimalSeparator: ',',
      decimalPlaces: 0
    }
  },
  guinea: {
    code: 'GN',
    name: 'Guinea',
    currency: 'GNF',
    currencyName: 'Guinean Franc',
    currencySymbol: 'Fr',
    timezone: 'Africa/Conakry',
    phoneCode: '+224',
    flag: '🇬🇳',
    region: 'west_africa',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: {
      thousandSeparator: ',',
      decimalSeparator: '.',
      decimalPlaces: 0
    }
  },
  sierra_leone: {
    code: 'SL',
    name: 'Sierra Leone',
    currency: 'SLL',
    currencyName: 'Sierra Leonean Leone',
    currencySymbol: 'Le',
    timezone: 'Africa/Freetown',
    phoneCode: '+232',
    flag: '🇸🇱',
    region: 'west_africa',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: {
      thousandSeparator: ',',
      decimalSeparator: '.',
      decimalPlaces: 2
    }
  },
  liberia: {
    code: 'LR',
    name: 'Liberia',
    currency: 'LRD',
    currencyName: 'Liberian Dollar',
    currencySymbol: '$',
    timezone: 'Africa/Monrovia',
    phoneCode: '+231',
    flag: '🇱🇷',
    region: 'west_africa',
    dateFormat: 'MM/DD/YYYY',
    numberFormat: {
      thousandSeparator: ',',
      decimalSeparator: '.',
      decimalPlaces: 2
    }
  },
  gambia: {
    code: 'GM',
    name: 'Gambia',
    currency: 'GMD',
    currencyName: 'Gambian Dalasi',
    currencySymbol: 'D',
    timezone: 'Africa/Banjul',
    phoneCode: '+220',
    flag: '🇬🇲',
    region: 'west_africa',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: {
      thousandSeparator: ',',
      decimalSeparator: '.',
      decimalPlaces: 2
    }
  },
  cape_verde: {
    code: 'CV',
    name: 'Cape Verde',
    currency: 'CVE',
    currencyName: 'Cape Verdean Escudo',
    currencySymbol: '$',
    timezone: 'Atlantic/Cape_Verde',
    phoneCode: '+238',
    flag: '🇨🇻',
    region: 'west_africa',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: {
      thousandSeparator: ',',
      decimalSeparator: '.',
      decimalPlaces: 2
    }
  },

  // Southern Africa
  south_africa: {
    code: 'ZA',
    name: 'South Africa',
    currency: 'ZAR',
    currencyName: 'South African Rand',
    currencySymbol: 'R',
    timezone: 'Africa/Johannesburg',
    phoneCode: '+27',
    flag: '🇿🇦',
    region: 'southern_africa',
    dateFormat: 'YYYY/MM/DD',
    numberFormat: {
      thousandSeparator: ' ',
      decimalSeparator: ',',
      decimalPlaces: 2
    }
  },
  zambia: {
    code: 'ZM',
    name: 'Zambia',
    currency: 'ZMW',
    currencyName: 'Zambian Kwacha',
    currencySymbol: 'K',
    timezone: 'Africa/Lusaka',
    phoneCode: '+260',
    flag: '🇿🇲',
    region: 'southern_africa',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: {
      thousandSeparator: ',',
      decimalSeparator: '.',
      decimalPlaces: 2
    }
  },
  zimbabwe: {
    code: 'ZW',
    name: 'Zimbabwe',
    currency: 'ZWL',
    currencyName: 'Zimbabwean Dollar',
    currencySymbol: '$',
    timezone: 'Africa/Harare',
    phoneCode: '+263',
    flag: '🇿🇼',
    region: 'southern_africa',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: {
      thousandSeparator: ',',
      decimalSeparator: '.',
      decimalPlaces: 2
    }
  },
  botswana: {
    code: 'BW',
    name: 'Botswana',
    currency: 'BWP',
    currencyName: 'Botswana Pula',
    currencySymbol: 'P',
    timezone: 'Africa/Gaborone',
    phoneCode: '+267',
    flag: '🇧🇼',
    region: 'southern_africa',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: {
      thousandSeparator: ',',
      decimalSeparator: '.',
      decimalPlaces: 2
    }
  },
  namibia: {
    code: 'NA',
    name: 'Namibia',
    currency: 'NAD',
    currencyName: 'Namibian Dollar',
    currencySymbol: '$',
    timezone: 'Africa/Windhoek',
    phoneCode: '+264',
    flag: '🇳🇦',
    region: 'southern_africa',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: {
      thousandSeparator: ',',
      decimalSeparator: '.',
      decimalPlaces: 2
    }
  },
  mozambique: {
    code: 'MZ',
    name: 'Mozambique',
    currency: 'MZN',
    currencyName: 'Mozambican Metical',
    currencySymbol: 'MT',
    timezone: 'Africa/Maputo',
    phoneCode: '+258',
    flag: '🇲🇿',
    region: 'southern_africa',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: {
      thousandSeparator: ',',
      decimalSeparator: '.',
      decimalPlaces: 2
    }
  },
  angola: {
    code: 'AO',
    name: 'Angola',
    currency: 'AOA',
    currencyName: 'Angolan Kwanza',
    currencySymbol: 'Kz',
    timezone: 'Africa/Luanda',
    phoneCode: '+244',
    flag: '🇦🇴',
    region: 'southern_africa',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: {
      thousandSeparator: ',',
      decimalSeparator: '.',
      decimalPlaces: 2
    }
  },
  malawi: {
    code: 'MW',
    name: 'Malawi',
    currency: 'MWK',
    currencyName: 'Malawian Kwacha',
    currencySymbol: 'MK',
    timezone: 'Africa/Blantyre',
    phoneCode: '+265',
    flag: '🇲🇼',
    region: 'southern_africa',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: {
      thousandSeparator: ',',
      decimalSeparator: '.',
      decimalPlaces: 2
    }
  },

  // North Africa
  egypt: {
    code: 'EG',
    name: 'Egypt',
    currency: 'EGP',
    currencyName: 'Egyptian Pound',
    currencySymbol: '£',
    timezone: 'Africa/Cairo',
    phoneCode: '+20',
    flag: '🇪🇬',
    region: 'north_africa',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: {
      thousandSeparator: ',',
      decimalSeparator: '.',
      decimalPlaces: 2
    }
  },
  morocco: {
    code: 'MA',
    name: 'Morocco',
    currency: 'MAD',
    currencyName: 'Moroccan Dirham',
    currencySymbol: 'DH',
    timezone: 'Africa/Casablanca',
    phoneCode: '+212',
    flag: '🇲🇦',
    region: 'north_africa',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: {
      thousandSeparator: ',',
      decimalSeparator: '.',
      decimalPlaces: 2
    }
  },
  tunisia: {
    code: 'TN',
    name: 'Tunisia',
    currency: 'TND',
    currencyName: 'Tunisian Dinar',
    currencySymbol: 'DT',
    timezone: 'Africa/Tunis',
    phoneCode: '+216',
    flag: '🇹🇳',
    region: 'north_africa',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: {
      thousandSeparator: ',',
      decimalSeparator: '.',
      decimalPlaces: 3
    }
  },
  algeria: {
    code: 'DZ',
    name: 'Algeria',
    currency: 'DZD',
    currencyName: 'Algerian Dinar',
    currencySymbol: 'DA',
    timezone: 'Africa/Algiers',
    phoneCode: '+213',
    flag: '🇩🇿',
    region: 'north_africa',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: {
      thousandSeparator: ',',
      decimalSeparator: '.',
      decimalPlaces: 2
    }
  },
  libya: {
    code: 'LY',
    name: 'Libya',
    currency: 'LYD',
    currencyName: 'Libyan Dinar',
    currencySymbol: 'LD',
    timezone: 'Africa/Tripoli',
    phoneCode: '+218',
    flag: '🇱🇾',
    region: 'north_africa',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: {
      thousandSeparator: ',',
      decimalSeparator: '.',
      decimalPlaces: 3
    }
  },
  sudan: {
    code: 'SD',
    name: 'Sudan',
    currency: 'SDG',
    currencyName: 'Sudanese Pound',
    currencySymbol: '£',
    timezone: 'Africa/Khartoum',
    phoneCode: '+249',
    flag: '🇸🇩',
    region: 'north_africa',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: {
      thousandSeparator: ',',
      decimalSeparator: '.',
      decimalPlaces: 2
    }
  },

  // Central Africa
  cameroon: {
    code: 'CM',
    name: 'Cameroon',
    currency: 'XAF',
    currencyName: 'Central African CFA Franc',
    currencySymbol: 'Fr',
    timezone: 'Africa/Douala',
    phoneCode: '+237',
    flag: '🇨🇲',
    region: 'central_africa',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: {
      thousandSeparator: ',',
      decimalSeparator: '.',
      decimalPlaces: 0
    }
  },
  central_african_republic: {
    code: 'CF',
    name: 'Central African Republic',
    currency: 'XAF',
    currencyName: 'Central African CFA Franc',
    currencySymbol: 'Fr',
    timezone: 'Africa/Bangui',
    phoneCode: '+236',
    flag: '🇨🇫',
    region: 'central_africa',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: {
      thousandSeparator: ',',
      decimalSeparator: '.',
      decimalPlaces: 0
    }
  },
  chad: {
    code: 'TD',
    name: 'Chad',
    currency: 'XAF',
    currencyName: 'Central African CFA Franc',
    currencySymbol: 'Fr',
    timezone: 'Africa/Ndjamena',
    phoneCode: '+235',
    flag: '🇹🇩',
    region: 'central_africa',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: {
      thousandSeparator: ',',
      decimalSeparator: '.',
      decimalPlaces: 0
    }
  },
  congo: {
    code: 'CG',
    name: 'Congo',
    currency: 'XAF',
    currencyName: 'Central African CFA Franc',
    currencySymbol: 'Fr',
    timezone: 'Africa/Brazzaville',
    phoneCode: '+242',
    flag: '🇨🇬',
    region: 'central_africa',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: {
      thousandSeparator: ',',
      decimalSeparator: '.',
      decimalPlaces: 0
    }
  },
  gabon: {
    code: 'GA',
    name: 'Gabon',
    currency: 'XAF',
    currencyName: 'Central African CFA Franc',
    currencySymbol: 'Fr',
    timezone: 'Africa/Libreville',
    phoneCode: '+241',
    flag: '🇬🇦',
    region: 'central_africa',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: {
      thousandSeparator: ',',
      decimalSeparator: '.',
      decimalPlaces: 0
    }
  },
  equatorial_guinea: {
    code: 'GQ',
    name: 'Equatorial Guinea',
    currency: 'XAF',
    currencyName: 'Central African CFA Franc',
    currencySymbol: 'Fr',
    timezone: 'Africa/Malabo',
    phoneCode: '+240',
    flag: '🇬🇶',
    region: 'central_africa',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: {
      thousandSeparator: ',',
      decimalSeparator: '.',
      decimalPlaces: 0
    }
  },
  democratic_republic_congo: {
    code: 'CD',
    name: 'Democratic Republic of Congo',
    currency: 'CDF',
    currencyName: 'Congolese Franc',
    currencySymbol: 'Fr',
    timezone: 'Africa/Kinshasa',
    phoneCode: '+243',
    flag: '🇨🇩',
    region: 'central_africa',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: {
      thousandSeparator: ',',
      decimalSeparator: '.',
      decimalPlaces: 2
    }
  },

  // International
  united_states: {
    code: 'US',
    name: 'United States',
    currency: 'USD',
    currencyName: 'US Dollar',
    currencySymbol: '$',
    timezone: 'America/New_York',
    phoneCode: '+1',
    flag: '🇺🇸',
    region: 'americas',
    dateFormat: 'MM/DD/YYYY',
    numberFormat: {
      thousandSeparator: ',',
      decimalSeparator: '.',
      decimalPlaces: 2
    }
  },
  united_kingdom: {
    code: 'GB',
    name: 'United Kingdom',
    currency: 'GBP',
    currencyName: 'British Pound',
    currencySymbol: '£',
    timezone: 'Europe/London',
    phoneCode: '+44',
    flag: '🇬🇧',
    region: 'europe',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: {
      thousandSeparator: ',',
      decimalSeparator: '.',
      decimalPlaces: 2
    }
  },
  european_union: {
    code: 'EU',
    name: 'European Union',
    currency: 'EUR',
    currencyName: 'Euro',
    currencySymbol: '€',
    timezone: 'Europe/Brussels',
    phoneCode: '+32',
    flag: '🇪🇺',
    region: 'europe',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: {
      thousandSeparator: '.',
      decimalSeparator: ',',
      decimalPlaces: 2
    }
  },
  india: {
    code: 'IN',
    name: 'India',
    currency: 'INR',
    currencyName: 'Indian Rupee',
    currencySymbol: '₹',
    timezone: 'Asia/Kolkata',
    phoneCode: '+91',
    flag: '🇮🇳',
    region: 'asia',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: {
      thousandSeparator: ',',
      decimalSeparator: '.',
      decimalPlaces: 2
    }
  },
  china: {
    code: 'CN',
    name: 'China',
    currency: 'CNY',
    currencyName: 'Chinese Yuan',
    currencySymbol: '¥',
    timezone: 'Asia/Shanghai',
    phoneCode: '+86',
    flag: '🇨🇳',
    region: 'asia',
    dateFormat: 'YYYY/MM/DD',
    numberFormat: {
      thousandSeparator: ',',
      decimalSeparator: '.',
      decimalPlaces: 2
    }
  },
  canada: {
    code: 'CA',
    name: 'Canada',
    currency: 'CAD',
    currencyName: 'Canadian Dollar',
    currencySymbol: '$',
    timezone: 'America/Toronto',
    phoneCode: '+1',
    flag: '🇨🇦',
    region: 'americas',
    dateFormat: 'YYYY/MM/DD',
    numberFormat: {
      thousandSeparator: ',',
      decimalSeparator: '.',
      decimalPlaces: 2
    }
  },
  australia: {
    code: 'AU',
    name: 'Australia',
    currency: 'AUD',
    currencyName: 'Australian Dollar',
    currencySymbol: '$',
    timezone: 'Australia/Sydney',
    phoneCode: '+61',
    flag: '🇦🇺',
    region: 'oceania',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: {
      thousandSeparator: ',',
      decimalSeparator: '.',
      decimalPlaces: 2
    }
  }
};

export class CountryService {
  // Get all countries
  getAllCountries(): CountryData[] {
    return Object.values(COUNTRIES);
  }

  // Get countries by region
  getCountriesByRegion(region: CountryData['region']): CountryData[] {
    return Object.values(COUNTRIES).filter(country => country.region === region);
  }

  // Get country by code
  getCountryByCode(code: string): CountryData | undefined {
    return Object.values(COUNTRIES).find(country => 
      country.code.toLowerCase() === code.toLowerCase() ||
      country.name.toLowerCase() === code.toLowerCase()
    );
  }

  // Auto-fill company data when country is selected
  autoFillCompanyData(countryCode: string): Partial<CountryData> | null {
    const country = this.getCountryByCode(countryCode);
    if (!country) return null;

    return {
      currency: country.currency,
      timezone: country.timezone,
      phoneCode: country.phoneCode,
      dateFormat: country.dateFormat,
      numberFormat: country.numberFormat
    };
  }

  // Get currency info for a country
  getCurrencyInfo(countryCode: string): { code: string; name: string; symbol: string } | null {
    const country = this.getCountryByCode(countryCode);
    if (!country) return null;

    return {
      code: country.currency,
      name: country.currencyName,
      symbol: country.currencySymbol
    };
  }

  // Format number according to country's format
  formatNumber(value: number, countryCode: string): string {
    const country = this.getCountryByCode(countryCode);
    if (!country) return value.toString();

    const { thousandSeparator, decimalSeparator, decimalPlaces } = country.numberFormat;
    
    const parts = value.toFixed(decimalPlaces).split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);
    
    if (decimalPlaces === 0) {
      return integerPart;
    }
    
    return `${integerPart}${decimalSeparator}${parts[1]}`;
  }

  // Format currency according to country
  formatCurrency(amount: number, countryCode: string): string {
    const country = this.getCountryByCode(countryCode);
    if (!country) return `${amount}`;

    const formattedNumber = this.formatNumber(amount, countryCode);
    return `${country.currencySymbol} ${formattedNumber}`;
  }

  // Get African countries
  getAfricanCountries(): CountryData[] {
    const africanRegions: CountryData['region'][] = [
      'east_africa', 'west_africa', 'north_africa', 
      'central_africa', 'southern_africa'
    ];
    
    return Object.values(COUNTRIES).filter(country => 
      africanRegions.includes(country.region)
    );
  }

  // Search countries
  searchCountries(query: string): CountryData[] {
    const lowercaseQuery = query.toLowerCase();
    return Object.values(COUNTRIES).filter(country =>
      country.name.toLowerCase().includes(lowercaseQuery) ||
      country.currency.toLowerCase().includes(lowercaseQuery) ||
      country.currencyName.toLowerCase().includes(lowercaseQuery)
    );
  }
}

export const countryService = new CountryService();
export default countryService;
